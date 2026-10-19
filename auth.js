const cfg = window.TRADEPULSE_BACKEND || {};
const configured = /^https:\/\/.+\.supabase\.co$/.test(cfg.supabaseUrl || '') &&
  typeof cfg.publishableKey === 'string' && cfg.publishableKey.startsWith('sb_publishable_');
const gate = document.getElementById('access-gate');
const workspace = document.querySelector('.workspace');
const form = document.getElementById('developer-form');
const choices = document.getElementById('access-choices');
const status = document.getElementById('access-status');
const appNotice = document.getElementById('app-notice');
let noticeTimer = null;
const adminPanel = document.getElementById('admin-panel');
const exitButton = document.getElementById('session-exit');
let client = null;
let backendLoadError = false;
let presenceChannel = null;
let adminRefreshTimer = null;
let visitorPeople = [];
const adminStatsData = { total:0, today:0, week:0, month:0, average:0, daily:[] };
const localDateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const adminConnection = document.getElementById('admin-connection');
const adminUpdated = document.getElementById('admin-updated');
const refreshButton = document.getElementById('admin-refresh');
const exportButton = document.getElementById('admin-export');
const visitorSearch = document.getElementById('visitor-search');
let visitId = null;
let heartbeat = null;
let isOwner = false;

function say(message, error = false) {
  status.textContent = message;
  status.classList.toggle('is-error', error);
  if (document.body.classList.contains('app-authorized') && appNotice) {
    appNotice.textContent = message;
    appNotice.hidden = !message;
    appNotice.classList.toggle('is-error', error);
    clearTimeout(noticeTimer);
    if (message) noticeTimer = setTimeout(() => { appNotice.hidden = true; }, 6500);
  }
}
async function enterApp(role) {
  exitButton.hidden = false;
  exitButton.disabled = false;
  exitButton.classList.remove('is-loading');
  exitButton.setAttribute('aria-busy', 'false');
  exitButton.textContent = role === 'owner' ? '↪ Sign out' : '↪ Exit visitor';
  adminPanel.hidden = role !== 'owner';
  isOwner = role === 'owner';
  if (workspace) workspace.setAttribute('aria-label', role === 'owner' ? 'TradePulse dashboard and developer tools' : 'TradePulse market dashboard');
  if (!gate.hidden) {
    gate.classList.remove('is-entering');
    gate.classList.add('is-leaving');
    await new Promise(resolve => setTimeout(resolve, 460));
    gate.hidden = true;
    gate.classList.remove('is-leaving');
  }
  document.body.classList.add('app-authorized');
}
function returnToGate(message = '') {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  if (presenceChannel && client) client.removeChannel(presenceChannel);
  presenceChannel = null;
  document.body.classList.remove('app-authorized');
  adminPanel.hidden = true;
  exitButton.hidden = true;
  gate.classList.remove('is-leaving', 'is-entering');
  gate.hidden = false;
  gate.classList.remove('is-returning');
  void gate.offsetWidth;
  gate.classList.add('is-returning');
  gate.addEventListener('animationend', event => {
    if (event.target === gate) gate.classList.remove('is-returning');
  }, {once:true});
  choices.hidden = false;
  form.hidden = true;
  isOwner = false;
  if (message) say(message);
}
function visitorLabel(id) {
  return `Visitor · ${id.slice(0, 4).toUpperCase()}`;
}
function setAdminConnection(message, connected = false) {
  if (!adminConnection) return;
  const label = adminConnection.querySelector('span');
  if (label) label.textContent = message;
  adminConnection.classList.toggle('is-connected', connected);
  adminConnection.classList.toggle('is-error', !connected);
}
function renderVisitorList() {
  const list = document.getElementById('visitor-list');
  const filter = (visitorSearch?.value || '').trim().toLowerCase();
  const people = visitorPeople.filter(person => (person.label || 'Visitor').toLowerCase().includes(filter));
  list.replaceChildren();
  if (!people.length) {
    const empty = document.createElement('li');
    empty.className = 'visitor-empty';
    empty.textContent = visitorPeople.length ? 'No visitor IDs match that filter.' : 'No visitors online right now.';
    list.append(empty);
    return;
  }
  people.forEach(person => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = person.label || 'Visitor';
    const since = document.createElement('small');
    since.textContent = person.onlineAt ? `Online since ${new Date(person.onlineAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` : 'Online now';
    item.append(label, since);
    list.append(item);
  });
}
function renderPresence(channel) {
  const state = channel.presenceState();
  visitorPeople = Object.values(state).flat().filter(item => item && item.visitor === true);
  document.getElementById('online-count').textContent = String(visitorPeople.length);
  renderVisitorList();
}
function startOfLocalDay(date, offset = 0) {
  const day = new Date(date);
  day.setHours(0,0,0,0);
  day.setDate(day.getDate() + offset);
  return day;
}
async function countSessions(start = null, end = null) {
  let query = client.from('visitor_sessions').select('id', {count:'exact', head:true});
  if (start) query = query.gte('started_at', start.toISOString());
  if (end) query = query.lt('started_at', end.toISOString());
  const {count, error} = await query;
  if (error) throw error;
  return count || 0;
}
function renderVisitTrend(daily) {
  const chart = document.getElementById('visit-trend');
  chart.replaceChildren();
  const maximum = Math.max(1, ...daily.map(item => item.count));
  daily.forEach(item => {
    const column = document.createElement('div');
    column.className = 'visit-day';
    const count = document.createElement('small');
    count.className = 'visit-day-count';
    count.textContent = String(item.count);
    const track = document.createElement('div');
    track.className = 'visit-bar-track';
    const bar = document.createElement('span');
    bar.className = 'visit-bar';
    bar.style.height = `${Math.max(item.count ? 8 : 2, Math.round(item.count / maximum * 100))}%`;
    track.append(bar);
    const label = document.createElement('small');
    label.className = 'visit-day-label';
    label.textContent = item.date.toLocaleDateString([], {weekday:'short'});
    column.append(count, track, label);
    chart.append(column);
  });
  chart.setAttribute('aria-label', `Daily visits over seven days: ${daily.map(item => `${item.date.toLocaleDateString([], {weekday:'short'})} ${item.count}`).join(', ')}`);
}
async function refreshAdminData() {
  if (!client || !isOwner) return;
  if (refreshButton) refreshButton.disabled = true;
  try {
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const days = Array.from({length:7}, (_, index) => {
      const date = startOfLocalDay(now, index - 6);
      return {date, start:date, end:startOfLocalDay(now, index - 5)};
    });
    const dailyCounts = await Promise.all(days.map(day => countSessions(day.start, day.end)));
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [total, today, month] = await Promise.all([
      countSessions(), countSessions(todayStart), countSessions(monthStart)
    ]);
    const week = dailyCounts.reduce((sum, value) => sum + value, 0);
    adminStatsData.total = total;
    adminStatsData.today = today;
    adminStatsData.week = week;
    adminStatsData.month = month;
    adminStatsData.average = week / 7;
    adminStatsData.daily = days.map((day, index) => ({date:day.date, count:dailyCounts[index]}));
    document.getElementById('visit-count').textContent = String(total);
    document.getElementById('today-count').textContent = String(today);
    document.getElementById('week-count').textContent = String(week);
    document.getElementById('month-count').textContent = String(month);
    document.getElementById('average-count').textContent = (week / 7).toFixed(1);
    renderVisitTrend(adminStatsData.daily);
    if (adminUpdated) adminUpdated.textContent = `Updated ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    setAdminConnection('Live · connected', true);
  } catch (error) {
    setAdminConnection('Data unavailable', false);
    if (adminUpdated) adminUpdated.textContent = 'Refresh failed';
  } finally {
    if (refreshButton) refreshButton.disabled = false;
  }
}
function scheduleAdminRefresh() {
  clearTimeout(adminRefreshTimer);
  adminRefreshTimer = setTimeout(refreshAdminData, 1800);
}
function startPresence(user, visitor) {
  const topic = 'tradepulse:visitors';
  presenceChannel = client.channel(topic, {config:{private:true, presence:{key:user.id}}});
  presenceChannel.on('presence', {event:'sync'}, () => { if (isOwner) renderPresence(presenceChannel); });
  if (isOwner) {
    presenceChannel.on('postgres_changes', {event:'*', schema:'public', table:'visitor_sessions'}, scheduleAdminRefresh);
  }
  presenceChannel.subscribe(async channelStatus => {
    if (isOwner) {
      if (channelStatus === 'SUBSCRIBED') {
        setAdminConnection('Live · connected', true);
        await refreshAdminData();
        renderPresence(presenceChannel);
      } else if (['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(channelStatus)) {
        setAdminConnection('Live connection lost', false);
      }
    }
    if (channelStatus !== 'SUBSCRIBED') return;
    if (visitor) {
      await presenceChannel.track({visitor:true, label:visitorLabel(user.id), onlineAt:new Date().toISOString()});
    }
  });
}
async function startVisitor(user, animate = true) {
  if (animate && window.playTradePulseIntro) await window.playTradePulseIntro();
  await enterApp('visitor');
  visitId = crypto.randomUUID();
  const {error} = await client.from('visitor_sessions').insert({id:visitId, user_id:user.id});
  if (error) {
    say('Dashboard opened, but visitor counting is not set up yet. Ask the developer to finish backend setup.', true);
    return;
  }
  await startPresence(user, true);
  heartbeat = setInterval(() => {
    if (visitId && document.visibilityState === 'visible') {
      client.from('visitor_sessions').update({last_seen:new Date().toISOString()}).eq('id', visitId).then(()=>{});
    }
  }, 60000);
}
async function startOwner(user, animate = true) {
  const {data, error} = await client.from('app_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error || !data) {
    await client.auth.signOut();
    throw new Error('This account is not enabled as the app owner. Add its user ID to app_admins in Supabase first.');
  }
  if (animate && window.playTradePulseIntro) await window.playTradePulseIntro();
  await enterApp('owner');
  await startPresence(user, false);
}

try {
  if (configured) {
    const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2');
    client = createClient(cfg.supabaseUrl, cfg.publishableKey, {auth:{persistSession:true, autoRefreshToken:true}});
  }
} catch (error) {
  backendLoadError = true;
  say('Could not connect to the login service. Visitors can still use the public dashboard.', true);
}

visitorSearch?.addEventListener('input', renderVisitorList);
refreshButton?.addEventListener('click', refreshAdminData);
exportButton?.addEventListener('click', () => {
  const rows = [
    ['Metric','Value'],
    ['Online now', document.getElementById('online-count').textContent],
    ['All recorded visits', adminStatsData.total],
    ['Today', adminStatsData.today],
    ['Last 7 days', adminStatsData.week],
    ['Last 30 days', adminStatsData.month],
    ['Daily average over 7 days', adminStatsData.average.toFixed(1)],
    [], ['Date','Visits'],
    ...adminStatsData.daily.map(item => [localDateKey(item.date), item.count])
  ];
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = `tradepulse-analytics-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('visitor-entry').addEventListener('click', async () => {
  const intro = window.playTradePulseIntro?.() || Promise.resolve();
  if (!client) {
    await intro;
    await enterApp('visitor');
    say('Visitor mode opened. Live counts need the Supabase project setup first.');
    return;
  }
  const button = document.getElementById('visitor-entry');
  button.disabled = true;
  say('Opening visitor dashboard…');
  const {data, error} = await client.auth.signInAnonymously();
  await intro;
  button.disabled = false;
  if (error) return say(`Could not start visitor session: ${error.message}`, true);
  await startVisitor(data.user, false);
});

document.getElementById('developer-entry').addEventListener('click', () => {
  choices.hidden = true;
  form.hidden = false;
  say(client ? '' : (backendLoadError ? 'Could not load Supabase. Check your internet connection, then reload the page.' : 'Owner login requires Supabase setup. Add the project URL and publishable key first.'), !client);
  document.getElementById('developer-username').focus();
});
document.getElementById('access-back').addEventListener('click', () => {
  form.hidden = true;
  choices.hidden = false;
  say('');
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) return say('Owner login is unavailable until Supabase is configured.', true);
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  say('Checking owner account…');
  const username = document.getElementById('developer-username').value.trim().toLowerCase();
  if (!cfg.ownerUsername || username !== cfg.ownerUsername.toLowerCase()) {
    submit.disabled = false;
    return say('That developer username is not recognized.', true);
  }
  const intro = window.playTradePulseIntro?.() || Promise.resolve();
  const {data, error} = await client.auth.signInWithPassword({
    email:cfg.ownerAuthEmail,
    password:document.getElementById('developer-password').value
  });
  await intro;
  submit.disabled = false;
  if (error) return say(`Sign-in failed: ${error.message}`, true);
  try { await startOwner(data.user, false); }
  catch (ownerError) { say(ownerError.message, true); }
});
exitButton.addEventListener('click', async () => {
  if (exitButton.disabled) return;
  const role = isOwner ? 'owner' : 'visitor';
  exitButton.disabled = true;
  exitButton.classList.add('is-loading');
  exitButton.setAttribute('aria-busy', 'true');
  exitButton.textContent = 'Signing out…';
  const intro = window.playTradePulseIntro?.() || Promise.resolve();
  if (heartbeat) clearInterval(heartbeat);
  clearTimeout(adminRefreshTimer);
  heartbeat = null;
  try {
    if (presenceChannel && client) await client.removeChannel(presenceChannel);
    presenceChannel = null;
    visitId = null;
    if (client) {
      const {error} = await client.auth.signOut();
      if (error) throw error;
    }
    await intro;
    returnToGate('You are signed out. Choose how to enter again.');
  } catch (error) {
    exitButton.disabled = false;
    exitButton.classList.remove('is-loading');
    exitButton.setAttribute('aria-busy', 'false');
    exitButton.textContent = role === 'owner' ? '↪ Sign out' : '↪ Exit visitor';
    say(`Sign out failed: ${error.message || 'Please try again.'}`, true);
  }
});

if (client) {
  const {data:{session}} = await client.auth.getSession();
  if (session?.user?.is_anonymous) await startVisitor(session.user, false);
  else if (session?.user) {
    try { await startOwner(session.user, false); }
    catch { returnToGate('Sign in with the owner account to open developer tools.'); }
  }
}
