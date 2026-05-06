// Bootstrap Converter: Responsive, History, AdSense (Earnings), always show step-by-step output

// === Config/Unit definitions and icons ===
const CATEGORIES = {
  Length: { icon:'rulers', units:{
      m:  ['Meter (m)',1],
      km: ['Kilometer (km)',1000],
      cm: ['Centimeter (cm)',0.01],
      mm: ['Millimeter (mm)',0.001],
      in: ['Inch (in)',0.0254],
      ft: ['Foot (ft)',0.3048],
      yd: ['Yard (yd)',0.9144],
      mi: ['Mile (mi)',1609.344],
      nmi:['Nautical mile (nmi)',1852]
    }
  },
  Mass: { icon:'box-seam', units:{
      kg:['Kilogram (kg)',1],g:['Gram (g)',0.001],mg:['Milligram (mg)',1e-6],lb:['Pound (lb)',0.45359237],oz:['Ounce (oz)',0.028349523125],ton:['Metric ton (t)',1000]
    }
  },
  Volume: { icon:'cup-straw', units:{
      l:['Liter (L)',1],ml:['Milliliter (mL)',0.001],m3:['Cubic meter (m³)',1000],cup:['Cup (US)',0.2365882365],pt:['Pint (US)',0.473176473],gal:['Gallon (US)',3.785411784],floz:['Fluid ounce (US)',0.0295735295625]
    }
  },
  Area: { icon:'square', units:{
      m2:['Square meter (m²)',1],km2:['Square kilometer (km²)',1e6],ha:['Hectare (ha)',10000],acre:['Acre',4046.8564224],ft2:['Square foot (ft²)',0.09290304]
    }
  },
  Speed:{icon:'speedometer2',units:{
      'm/s':['Meters per second (m/s)',1],'km/h':['Kilometers per hour (km/h)',1000/3600],'mph':['Miles per hour (mph)',1609.344/3600],'kn':['Knot (kn)',1852/3600]
    }
  },
  Time: {icon:'watch',units:{s:['Second (s)',1],min:['Minute (min)',60],h:['Hour (h)',3600],day:['Day',86400],week:['Week',604800]}},
  Data: {icon:'hdd',units:{B:['Byte (B)',1],KB:['Kilobyte (KB)',1024],MB:['Megabyte (MB)',1024**2],GB:['Gigabyte (GB)',1024**3],TB:['Terabyte (TB)',1024**4],bit:['Bit',1/8]}},
  Angle: {icon:'diagram-3',units:{rad:['Radian (rad)',1],deg:['Degree (°)',Math.PI/180],grad:['Gradian (gon)',Math.PI/200]}},
  Temperature: {icon:'thermometer-half',units:{C:['Celsius (°C)'],F:['Fahrenheit (°F)'],K:['Kelvin (K)'],R:['Rankine (°R)']}},
  Currency: {icon:'currency-exchange',units:{USD:['US Dollar (USD)'],EUR:['Euro (EUR)'],GBP:['British Pound (GBP)'],JPY:['Japanese Yen (JPY)'],AUD:['Australian Dollar (AUD)'],CAD:['Canadian Dollar (CAD)'],CNY:['Chinese Yuan (CNY)'],INR:['Indian Rupee (INR)']}}
};
const CURRENCY_FALLBACK = {
  timestamp: Date.now(), base: 'USD',
  rates: {USD:1,EUR:0.92,GBP:0.78,JPY:144.0,AUD:1.45,CAD:1.33,CNY:7.2,INR:82.0}
};
const STORAGE_KEYS = { HISTORY: 'conv_history_bt', THEME: 'conv_theme_bt', CURRENCY_CACHE:'conv_cur_bt' };
// === DOM ===
const el = {
  category:document.getElementById('category'),
  fromUnit:document.getElementById('fromUnit'),
  toUnit:document.getElementById('toUnit'),
  value:document.getElementById('value'),
  convForm:document.getElementById('convForm'),
  swap:document.getElementById('swap'),
  resultValue:document.getElementById('resultValue'),
  resultSub:document.getElementById('resultSub'),
  steps:document.getElementById('steps'),
  copyResult:document.getElementById('copyResult'),
  history:document.getElementById('history'),
  clearHistory:document.getElementById('clearHistory'),
  catIco:document.getElementById('cat-ico'),
  catIcoHead:document.getElementById('cat-ico-head'),
  themeBtn:document.getElementById('theme-btn')
};
let historyArr = [];
// === Bootstrap Dark/Light Theme ===
function loadTheme(){
  let t = localStorage.getItem(STORAGE_KEYS.THEME);
  let init = t||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-bs-theme',init);
  el.themeBtn.innerHTML = (init === 'dark') ? '<i class="bi bi-moon"></i>' : '<i class="bi bi-brightness-high"></i>';
}
function toggleTheme(){
  let now = document.documentElement.getAttribute('data-bs-theme');
  let next = now==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-bs-theme',next);
  localStorage.setItem(STORAGE_KEYS.THEME,next);
  el.themeBtn.innerHTML = (next === 'dark') ? '<i class="bi bi-moon"></i>' : '<i class="bi bi-brightness-high"></i>';
}
// === Populate Categories/Units ===
function populateCategories(){
  el.category.innerHTML = '';
  let idx=0;
  for(const k of Object.keys(CATEGORIES)){
    let opt = new Option(k,k);
    if(idx++===0) opt.selected=true;
    el.category.appendChild(opt);
  }
}
function populateUnits(category){
  const units = CATEGORIES[category].units;
  el.fromUnit.innerHTML = el.toUnit.innerHTML = '';
  let n = Object.keys(units), f = n[0], t = n[1]||n[0];
  for(const k of n){
    let opt = new Option(units[k][0],k);
    el.fromUnit.appendChild(opt.cloneNode(true));
    el.toUnit.appendChild(opt.cloneNode(true));
  }
  el.fromUnit.value=f; el.toUnit.value=t;
}
function updateCatIcon(){
  let cat = el.category.value, ic = CATEGORIES[cat].icon||'rulers';
  el.catIco.innerHTML = el.catIcoHead.innerHTML = `<i class="bi bi-${ic}"></i>`;
}
// === Conversion Logic (with full steps) ===
function toBase(val,factor){return val*factor;}
function fromBase(val, factor){return val/factor;}
function stripUnits(unit,cat){
  let nm = CATEGORIES[cat].units[unit][0];
  let m = nm.match(/\(([^)]+)\)/); return m?m[1]:nm;
}
function formatNum(n){ return Number(n.toPrecision(12)).toLocaleString(undefined,{maximumFractionDigits:8}); }
function convertWithFactors(value,cat,from,to){
  const u = CATEGORIES[cat].units, f = u[from], t = u[to];
  let toBaseVal = value * f[1], final = toBaseVal / t[1];
  // Steps: show each multiplication/division with number and label.
  let steps = `1. Convert to base (${cat}):\n   ${value} × ${f[1]} = ${toBaseVal}\n2. Base to target unit:\n   ${toBaseVal} ÷ ${t[1]} = ${final}\n3. Rounded result: ${formatNum(final)}`;
  return { result: formatNum(final), steps };
}
function convertTemperature(value,from,to){
  let steps = [`Conversion: ${value} ${from} → ${to}`], c;
  if(from === to) return {result:value,steps:steps.join('\n')};
  if(from==='C'){c=value;steps.push('Already Celsius');}
  else if(from==='F'){c=(value-32)*5/9;steps.push(`(F-32)×5/9 = (${value}-32)×5/9 = ${c}`);}
  else if(from==='K'){c=value-273.15;steps.push(`K-273.15 = ${value}-273.15 = ${c}`);}
  else if(from==='R'){c=(value-491.67)*5/9;steps.push(`(R-491.67)×5/9 = (${value}-491.67)×5/9 = ${c}`);}
  else throw new Error('Bad unit');
  let out;
  if(to === 'C'){out=c;steps.push('No further conversion');}
  else if(to==='F'){out=c*9/5+32;steps.push(`(C×9/5)+32 = (${c}×9/5)+32 = ${out}`);}
  else if(to==='K'){out=c+273.15;steps.push(`C+273.15 = ${c}+273.15 = ${out}`);}
  else if(to==='R'){out=(c+273.15)*9/5;steps.push(`(C+273.15)×9/5 = (${c}+273.15)×9/5 = ${out}`);}
  else throw new Error('Bad unit');
  steps.push(`Rounded result: ${formatNum(out)}`);
  return {result: formatNum(out),steps:steps.join('\n')};
}
async function fetchRates(base='USD'){
  try{
    let raw = localStorage.getItem(STORAGE_KEYS.CURRENCY_CACHE);
    if(raw){let dat=JSON.parse(raw);if(Date.now()-dat.timestamp<3600e3)return dat;}
    const resp = await fetch(`https://api.exchangerate.host/latest?base=${base}`), j = await resp.json();
    const store = { timestamp: Date.now(), base: j.base, rates: j.rates };
    localStorage.setItem(STORAGE_KEYS.CURRENCY_CACHE,JSON.stringify(store)); return store;
  } catch{ return CURRENCY_FALLBACK; }
}
async function convertCurrency(value, from, to){
  const cache = await fetchRates('USD'), rates = cache.rates;
  if(!rates[from]||!rates[to]) throw new Error('Bad currency');
  const rate = rates[to]/rates[from];
  const result = value * rate, steps=[
    `1. Get live rates from exchangerate.host`,
    `2. Compute conversion rate: rates[${to}]/rates[${from}] = ${rates[to]} / ${rates[from]} = ${rate}`,
    `3. Calculation: ${value} × ${rate} = ${result}`,
    `4. Rounded result: ${formatNum(result)}`
  ].join('\n');
  return { result: formatNum(result), steps };
}
// === Show result, steps, manage history (steps ALWAYS shown) ===
function showResult(val,desc,steps){
  el.resultValue.textContent = val; el.resultSub.textContent = desc||'';
  el.steps.textContent = steps||''; el.steps.classList.remove('d-none');
}
function saveHistory(){
  try{localStorage.setItem(STORAGE_KEYS.HISTORY,JSON.stringify(historyArr));}catch{}
}
function loadHistory(){
  let raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
  historyArr = raw?JSON.parse(raw):[];
  renderHistory();
}
function renderHistory(){
  el.history.innerHTML='';
  if(!historyArr.length){ el.history.innerHTML='<div class="text-muted small">No history yet.</div>'; return; }
  historyArr.forEach((h,idx)=>{
    let div = document.createElement('div'); div.className='history-item d-flex align-items-center py-1 px-2 mb-1 bg-light-subtle';
    div.innerHTML=`<span class="cat-ico me-2"><i class="bi bi-${CATEGORIES[h.category].icon||'rulers'}"></i></span>
      <div class="me-auto small"><div><b>${h.display}</b></div>
      <div class="text-secondary">${h.category}&nbsp;·&nbsp;${new Date(h.timestamp).toLocaleString()}</div></div>
      <button class="btn btn-sm btn-outline-primary me-1" title="Restore" tabindex="0"><i class="bi bi-download"></i></button>
      <button class="btn btn-sm btn-outline-secondary me-1" title="Copy" tabindex="0"><i class="bi bi-clipboard"></i></button>
      <button class="btn btn-sm btn-outline-info me-1" title="Steps" tabindex="0"><i class="bi bi-list-ol"></i></button>
      <button class="btn btn-sm btn-outline-danger" title="Delete" tabindex="0"><i class="bi bi-x"></i></button>`;
    let [restoreBtn,copyBtn,stepBtn,delBtn] = div.querySelectorAll('button');
    restoreBtn.onclick=()=>{el.category.value=h.category;fillUnits();el.fromUnit.value=h.from;el.toUnit.value=h.to;el.value.value=h.input;};
    copyBtn.onclick=()=>{navigator.clipboard.writeText(h.display);copyBtn.innerHTML='<i class="bi bi-clipboard-check"></i>';setTimeout(()=>copyBtn.innerHTML='<i class="bi bi-clipboard"></i>',1200);};
    stepBtn.onclick=()=>{el.steps.textContent=h.steps||'';el.steps.classList.remove('d-none');window.scrollTo({top:0,behavior:'smooth'});};
    delBtn.onclick=()=>{historyArr.splice(idx,1);saveHistory();renderHistory();};
    el.history.appendChild(div);
  });
}
function addHistory(entry){
  historyArr.unshift(entry);
  if(historyArr.length>60)historyArr.length=60;
  saveHistory(); renderHistory();
}
// === Main event handlers ===
function fillUnits(){populateUnits(el.category.value);}
el.category.onchange=()=>{fillUnits();updateCatIcon();};
el.swap.onclick = ()=>{let t=el.fromUnit.value;el.fromUnit.value=el.toUnit.value;el.toUnit.value=t;};
el.convForm.onsubmit = async e=>{
  e.preventDefault();
  let cat=el.category.value,v=Number(el.value.value),from=el.fromUnit.value,to=el.toUnit.value;
  if(isNaN(v)){showResult('Invalid input','','');return;}
  try{
    let result,steps;
    if(cat==='Temperature'){({result,steps}=convertTemperature(v,from,to));}
    else if(cat==='Currency'){({result,steps}=await convertCurrency(v,from,to));}
    else{({result,steps}=convertWithFactors(v,cat,from,to));}
    showResult(result,`${stripUnits(from,cat)} → ${stripUnits(to,cat)}`,steps);
    addHistory({
      timestamp:Date.now(),category:cat,from:from,to:to,input:v,
      result:result,display:`${v} ${stripUnits(from,cat)} = ${result} ${stripUnits(to,cat)}`,steps
    });
  }catch(err){showResult('Error','','');}
};
el.copyResult.onclick=()=>{
  let txt=`${el.resultValue.textContent||''} ${el.resultSub.textContent||''}`.trim();
  if(txt)navigator.clipboard.writeText(txt);
  el.copyResult.innerHTML='<i class="bi bi-clipboard-check"></i> Copied';
  setTimeout(()=>el.copyResult.innerHTML='<i class="bi bi-clipboard"></i> Copy Result',1200);
};
el.themeBtn.onclick = toggleTheme;
el.clearHistory.onclick=()=>{if(confirm('Clear all history?')){historyArr=[];saveHistory();renderHistory();}};
window.addEventListener('DOMContentLoaded',()=>{
  populateCategories(); fillUnits(); updateCatIcon(); loadTheme(); loadHistory();
});