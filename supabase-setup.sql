-- Run this in Supabase SQL Editor. Then add the owner account to app_admins.
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;
grant select on public.app_admins to authenticated;
drop policy if exists "Owners can read their own admin role" on public.app_admins;
create policy "Owners can read their own admin role" on public.app_admins
  for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists visitor_sessions_started_at_idx on public.visitor_sessions(started_at desc);
alter table public.visitor_sessions enable row level security;
revoke all on public.visitor_sessions from anon, authenticated;
-- Visitors can create their own anonymous visit and update only its heartbeat.
-- Only app owners can read analytics; client roles cannot edit visit totals.
grant insert (id, user_id) on public.visitor_sessions to authenticated;
grant update (last_seen) on public.visitor_sessions to authenticated;
grant select on public.visitor_sessions to authenticated;
drop policy if exists "Visitors can create their own session" on public.visitor_sessions;
create policy "Visitors can create their own session" on public.visitor_sessions
  for insert to authenticated with check (
    user_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') = 'true'
  );
drop policy if exists "Visitors can update their own session" on public.visitor_sessions;
create policy "Visitors can update their own session" on public.visitor_sessions
  for update to authenticated using (
    user_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') = 'true'
  ) with check (
    user_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') = 'true'
  );
drop policy if exists "Owners can read visitor sessions" on public.visitor_sessions;
create policy "Owners can read visitor sessions" on public.visitor_sessions
  for select to authenticated using (
    exists (select 1 from public.app_admins where user_id = (select auth.uid()))
  );

grant usage on schema realtime to authenticated;
drop policy if exists "Owners can read visitor presence" on realtime.messages;
drop policy if exists "Authenticated clients can read anonymous visitor presence" on realtime.messages;
create policy "Owners can read visitor presence" on realtime.messages
  for select to authenticated using (
    extension = 'presence' and realtime.topic() = 'tradepulse:visitors'
    and exists (select 1 from public.app_admins where user_id = (select auth.uid()))
  );
drop policy if exists "Signed-in clients can publish visitor presence" on realtime.messages;
drop policy if exists "Anonymous visitors can publish presence" on realtime.messages;
create policy "Anonymous visitors can publish presence" on realtime.messages
  for insert to authenticated with check (
    extension = 'presence' and realtime.topic() = 'tradepulse:visitors'
    and (select auth.jwt()->>'is_anonymous') = 'true'
  );

-- Enable live visit-count refresh. Ignore the duplicate error if already enabled.
do $$ begin
  alter publication supabase_realtime add table public.visitor_sessions;
exception when duplicate_object then null;
end $$;
