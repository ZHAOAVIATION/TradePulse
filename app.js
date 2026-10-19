const markets={
  indices:{label:'Indices',icon:'◫',assets:[
    {name:'S&P 500',symbol:'SP:SPX',code:'SP:SPX',desc:'United States · Large-cap index',icon:'S',color:'violet'},
    {name:'Nasdaq 100',symbol:'NASDAQ:NDX',code:'NDX',desc:'United States · Technology index',icon:'N',color:'blue'},
    {name:'Dow Jones',symbol:'DJ:DJI',code:'DJI',desc:'United States · Blue-chip index',icon:'D',color:'cyan'},
    {name:'FTSE 100',symbol:'TVC:UKX',code:'UKX',desc:'United Kingdom · Large-cap index',icon:'F',color:'green'},
    {name:'Nikkei 225',symbol:'TVC:NI225',code:'NI225',desc:'Japan · Large-cap index',icon:'日',color:'pink'},
    {name:'DAX',symbol:'XETR:DAX',code:'DAX',desc:'Germany · Large-cap index',icon:'D',color:'amber'}]},
  forex:{label:'Forex',icon:'◎',assets:[
    {name:'EUR / USD',symbol:'FX:EURUSD',code:'EURUSD',desc:'Euro · US dollar',icon:'€',color:'blue'},
    {name:'GBP / USD',symbol:'FX:GBPUSD',code:'GBPUSD',desc:'British pound · US dollar',icon:'£',color:'violet'},
    {name:'USD / JPY',symbol:'FX:USDJPY',code:'USDJPY',desc:'US dollar · Japanese yen',icon:'¥',color:'red'},
    {name:'AUD / USD',symbol:'FX:AUDUSD',code:'AUDUSD',desc:'Australian dollar · US dollar',icon:'A',color:'green'},
    {name:'USD / CAD',symbol:'FX:USDCAD',code:'USDCAD',desc:'US dollar · Canadian dollar',icon:'C',color:'amber'},
    {name:'EUR / GBP',symbol:'FX:EURGBP',code:'EURGBP',desc:'Euro · British pound',icon:'€',color:'cyan'}]},
  commodities:{label:'Commodities',icon:'◇',assets:[
    {name:'Gold',symbol:'OANDA:XAUUSD',code:'XAUUSD',desc:'Spot gold · US dollar',icon:'Au',color:'amber'},
    {name:'Silver',symbol:'OANDA:XAGUSD',code:'XAGUSD',desc:'Spot silver · US dollar',icon:'Ag',color:'cyan'},
    {name:'Crude Oil',symbol:'TVC:USOIL',code:'USOIL',desc:'WTI crude oil',icon:'O',color:'red'},
    {name:'Brent Oil',symbol:'TVC:UKOIL',code:'UKOIL',desc:'Brent crude oil',icon:'B',color:'amber'},
    {name:'Natural Gas',symbol:'NYMEX:NG1!',code:'NG1!',desc:'Natural gas futures',icon:'G',color:'green'}]},
  stocks:{label:'Stocks',icon:'▥',assets:[
    {name:'Apple',symbol:'NASDAQ:AAPL',code:'AAPL',desc:'NASDAQ · Consumer electronics',icon:'A',color:'cyan'},
    {name:'NVIDIA',symbol:'NASDAQ:NVDA',code:'NVDA',desc:'NASDAQ · Semiconductors',icon:'N',color:'green'},
    {name:'Microsoft',symbol:'NASDAQ:MSFT',code:'MSFT',desc:'NASDAQ · Software & cloud',icon:'M',color:'blue'},
    {name:'Tesla',symbol:'NASDAQ:TSLA',code:'TSLA',desc:'NASDAQ · Automotive & energy',icon:'T',color:'red'},
    {name:'Amazon',symbol:'NASDAQ:AMZN',code:'AMZN',desc:'NASDAQ · Consumer & cloud',icon:'a',color:'amber'},
    {name:'Alphabet',symbol:'NASDAQ:GOOGL',code:'GOOGL',desc:'NASDAQ · Internet services',icon:'G',color:'violet'},
    {name:'Meta',symbol:'NASDAQ:META',code:'META',desc:'NASDAQ · Technology',icon:'M',color:'blue'},
    {name:'AMD',symbol:'NASDAQ:AMD',code:'AMD',desc:'NASDAQ · Semiconductors',icon:'A',color:'red'}]},
  crypto:{label:'Crypto',icon:'₿',assets:[
    {name:'Bitcoin',symbol:'BINANCE:BTCUSDT',code:'BTC / USDT',desc:'Crypto · Bitcoin / Tether',icon:'₿',color:'amber'},
    {name:'Ethereum',symbol:'BINANCE:ETHUSDT',code:'ETH / USDT',desc:'Crypto · Ethereum / Tether',icon:'◆',color:'violet'},
    {name:'Solana',symbol:'BINANCE:SOLUSDT',code:'SOL / USDT',desc:'Crypto · Solana / Tether',icon:'◎',color:'green'},
    {name:'BNB',symbol:'BINANCE:BNBUSDT',code:'BNB / USDT',desc:'Crypto · BNB / Tether',icon:'◆',color:'amber'},
    {name:'XRP',symbol:'BINANCE:XRPUSDT',code:'XRP / USDT',desc:'Crypto · XRP / Tether',icon:'✕',color:'blue'},
    {name:'Dogecoin',symbol:'BINANCE:DOGEUSDT',code:'DOGE / USDT',desc:'Crypto · Dogecoin / Tether',icon:'Ð',color:'amber'},
    {name:'Avalanche',symbol:'BINANCE:AVAXUSDT',code:'AVAX / USDT',desc:'Crypto · Avalanche / Tether',icon:'▲',color:'red'}]}
};
let category='indices';let selected=markets[category].assets[0];
const $=id=>document.getElementById(id);
function renderCategories(){const root=$('category-tabs');root.innerHTML='';Object.entries(markets).forEach(([key,value])=>{const b=document.createElement('button');b.className='category-tab'+(key===category?' active':'');b.setAttribute('role','tab');b.setAttribute('aria-selected',key===category);b.innerHTML=`<span>${value.icon}</span>${value.label}`;b.addEventListener('click',()=>{category=key;selected=markets[key].assets[0];render();});root.append(b);});}
function renderAssets(){const root=$('asset-row');root.innerHTML='';markets[category].assets.forEach(asset=>{const b=document.createElement('button');b.className='asset-chip'+(asset.symbol===selected.symbol?' selected':'');b.innerHTML=`<span class="mini-avatar ${asset.color}">${asset.icon}</span><span>${asset.name}</span>`;b.addEventListener('click',()=>{selected=asset;render();});root.append(b);});}
function mountWidget(host,src,config){host.replaceChildren();const container=document.createElement('div');container.className='tradingview-widget-container__widget';container.style.width='100%';container.style.height='100%';const script=document.createElement('script');script.src=src;script.type='text/javascript';script.async=true;script.text=JSON.stringify(config);host.append(container,script);}
function mountAnalysis(host,symbol){mountWidget(host,'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js',{interval:'1D',width:'100%',isTransparent:true,height:'100%',symbol,showIntervalTabs:true,displayMode:'single',locale:'en',colorTheme:currentTheme,disableInterval:false});}
function render(){renderCategories();renderAssets();$('selected-name').textContent=selected.name;$('selected-code').textContent=selected.code;$('selected-desc').textContent=selected.desc;$('asset-avatar').textContent=selected.icon;$('asset-avatar').className=`asset-avatar ${selected.color}`;mountWidget($('chart-widget'),'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',{autosize:true,symbol:selected.symbol,interval:'D',timezone:'Etc/UTC',theme:currentTheme,style:'1',locale:'en',backgroundColor:currentTheme==='light'?'#f6f7fb':'rgba(11, 13, 24, 1)',gridColor:currentTheme==='light'?'rgba(70,80,110,0.10)':'rgba(255,255,255,0.045)',hide_top_toolbar:false,hide_legend:false,hide_side_toolbar:true,allow_symbol_change:true,save_image:false,withdateranges:true,details:false,calendar:false,studies:[],support_host:'https://www.tradingview.com'});mountAnalysis($('analysis-widget'),selected.symbol);}
let currentTheme='dark';
try{currentTheme=localStorage.getItem('tradepulse-theme')==='light'?'light':'dark'}catch{}
function applyTheme(mode){
  currentTheme=mode==='light'?'light':'dark';
  document.documentElement.dataset.theme=currentTheme;
  document.querySelectorAll('.theme-choice').forEach(button=>{
    const active=button.dataset.themeChoice===currentTheme;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  const color=document.querySelector('meta[name="theme-color"]');
  if(color)color.content=currentTheme==='light'?'#e4e5eb':'#080a12';
  try{localStorage.setItem('tradepulse-theme',currentTheme)}catch{}
}
document.querySelectorAll('.theme-choice').forEach(button=>button.addEventListener('click',()=>{applyTheme(button.dataset.themeChoice);render()}));
applyTheme(currentTheme);render();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

// Place the blur lens over scrolling content and keep the brand above the lens.
(()=>{
const topbar=document.querySelector('.topbar');
if(!topbar)return;
const lens=document.createElement('div');
lens.className='glass-lens-overlay';
const brand=topbar.querySelector('.brand');
if(brand){
  const glassBrand=brand.cloneNode(true);
  glassBrand.classList.add('glass-lens-brand');
  lens.append(glassBrand);
  brand.style.visibility='hidden';
}
const facebook=topbar.querySelector('.top-facebook-link');
if(facebook){
  const glassFacebook=facebook.cloneNode(true);
  glassFacebook.classList.add('glass-lens-facebook');
  lens.append(glassFacebook);
  facebook.style.visibility='hidden';
}
document.body.append(lens);
let framePending=false;
function placeLens(){
  const box=topbar.getBoundingClientRect();
  lens.style.left=`${box.left}px`;
  lens.style.top=`${box.top}px`;
  lens.style.width=`${box.width}px`;
  lens.style.height=`${box.height}px`;
  lens.style.borderRadius=getComputedStyle(topbar).borderRadius;
}
function schedulePlace(){
  if(framePending)return;
  framePending=true;
  requestAnimationFrame(()=>{framePending=false;placeLens()});
}
window.addEventListener('scroll',schedulePlace,{passive:true});
window.addEventListener('resize',schedulePlace,{passive:true});
placeLens();
})();
