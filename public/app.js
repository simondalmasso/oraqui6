import {MODES, STRATEGIES, weights, sampleSix, secureRandom, validDraw, fmt} from "/math-browser.js";
const fallback={
history:[{id:3415,date:"2026-10-07",tradicional:[3,10,12,14,36,38],segunda:[5,12,13,23,24,35],revancha:[6,7,8,39,40,41],siempre:[4,7,19,32,34,42]}],
historicalCounts:[],sourceStatus:{draws:"snapshot",stats:"snapshot"},snapshotDate:"2026-10-08",sampleDraws:1,warnings:["No se pudo contactar con el servidor"]
};
const NAMES={tradicional:"TRADICIONAL",segunda:"LA SEGUNDA",revancha:"REVANCHA",siempre:"SIEMPRE SALE"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let dataset=fallback, strategy="equilibrado", mode="todas", serial=0, pick=[],selected=new Set(),toastTimer;
function balls(nums, hits=[]) {return nums.map(n=>'<span class="ball '+(hits.includes(n)?"hit":"")+'">'+fmt(n)+'</span>').join("");}
function toast(message){const t=$("#toast");t.textContent=message;t.style.display="block";clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.display="none",2400);}
function storage(){try{const x=JSON.parse(localStorage.getItem("oraqui6-saved")||"[]");return Array.isArray(x)?x.filter(a=>Array.isArray(a.nums)&&a.nums.length===6):[]}catch{return []}}
function store(x){try{localStorage.setItem("oraqui6-saved",JSON.stringify(x.slice(-30)))}catch{toast("El navegador impide guardar datos")}}
function renderResults(){
  const d=dataset.history?.[0];if(!validDraw(d))return;
  $("#drawId").textContent="#"+d.id;$("#drawDate").textContent=d.date;
  const live=dataset.sourceStatus?.draws==="live";
  $("#status").textContent=live?"● FUENTE ONLINE":"● INSTANTÁNEA";
  $("#sourceLine").textContent="CONCURSO "+d.id+" · "+d.date+" · "+(live?"ARCHIVO CONSULTADO":"ÚLTIMA COPIA VERIFICADA");
  $("#results").innerHTML=MODES.map(k=>'<article class="result"><h3>'+NAMES[k]+'</h3><div class="ballline">'+balls(d[k])+'</div><small>CONCURSO #'+d.id+' · SEIS BOLILLAS</small></article>').join("");
}
function renderRadar(){
  const a=dataset.historicalCounts||[];
  if(a.length!==46)return;
  const min=Math.min(...a),max=Math.max(...a);
  $("#statsState").textContent=dataset.sourceStatus?.stats==="live"?"ESTADÍSTICAS EN LÍNEA":"ÚLTIMA INSTANTÁNEA";
  $("#heatmap").innerHTML=a.map((count,n)=>{const t=(count-min)/(max-min||1),opacity=(.1+.7*t).toFixed(3);return '<div class="heat" title="Bolilla '+fmt(n)+': '+count+' salidas" style="background:rgba(52,248,170,'+opacity+')"><b>'+fmt(n)+'</b><small>'+count+'</small></div>'}).join("");
  const top=a.map((count,n)=>({count,n})).sort((x,y)=>y.count-x.count).slice(0,8);
  $("#leaderboard").innerHTML=top.map((x,i)=>'<div class="ranking"><span>'+(i+1)+'</span><b>'+fmt(x.n)+'</b><i><b style="width:'+Math.round(100*x.count/max)+'%"></b></i><span>'+x.count+'</span></div>').join("");
}
function generate(){
  const counts=dataset.historicalCounts?.length===46?dataset.historicalCounts:[];
  pick=sampleSix(weights({history:dataset.history,counts,mode,strategy}),secureRandom);
  $("#pick").innerHTML=balls(pick);serial++;
  $("#serial").textContent="#"+String(serial).padStart(3,"0");
  const meaning={equilibrado:"Mezcla suavizada de frecuencias históricas y recientes",frecuentes:"Peso mayor a bolillas más frecuentes en los datos",rezagados:"Peso mayor a bolillas menos frecuentes en los datos",aleatorio:"Todas las bolillas con el mismo peso"}[strategy];
  $("#explain").textContent=meaning+". Muestra reciente validada: "+dataset.history.length+" concursos. No constituye un pronóstico estadísticamente validado.";
}
function selectionUI(){
  $("#selectedCount").textContent=selected.size+"/6";
  $("#selected").innerHTML=selected.size?balls([...selected].sort((a,b)=>a-b)):'<span class="muted">Seleccioná seis bolillas.</span>';
  $("#check").disabled=selected.size!==6;
  $("#chooser").innerHTML=Array.from({length:46},(_,n)=>'<button class="num" type="button" data-num="'+n+'" aria-label="Seleccionar '+fmt(n)+'" aria-pressed="'+selected.has(n)+'">'+fmt(n)+'</button>').join("");
}
function savedUI(){
  const s=storage();
  $("#saved").innerHTML=s.length?s.slice().reverse().map((x,i)=>'<div class="saved-row"><span>'+x.nums.map(fmt).join(" · ")+'</span><button class="btn" data-delete="'+(s.length-1-i)+'" aria-label="Eliminar combinación">×</button></div>').join(""):'<p>Aún no guardaste combinaciones.</p>';
}
function compare(){
  const d=dataset.history[0];
  $("#comparison").innerHTML=MODES.map(k=>{
    const hits=d[k].filter(n=>selected.has(n));
    return '<div>'+NAMES[k]+': <b>'+hits.length+'/6</b> '+(hits.length?'· '+hits.map(fmt).join(", "):'· sin coincidencias')+'</div>';
  }).join("");
}
async function load(){
  $("#refresh").disabled=true;$("#refresh").textContent="↻ CONSULTANDO…";
  try {
    const response=await fetch("/api/data",{headers:{accept:"application/json"}});
    if(!response.ok)throw Error("HTTP "+response.status);
    const next=await response.json();
    if(!Array.isArray(next.history)||!validDraw(next.history[0]))throw Error("Datos inválidos");
    dataset=next;
  } catch (err){console.warn("ORAQUI6 source unavailable:",err.message);dataset=fallback}
  renderResults();renderRadar();generate();
  const st=dataset.sourceStatus||{};
  $("#sourceHealth").textContent="Sorteos: "+(st.draws==="live"?"online":"instantánea")+
    " · Frecuencias: "+(st.stats==="live"?"online":"instantánea")+
    " · Concursos validados: "+dataset.history.length+
    " · Consultado: "+(dataset.checkedAt?new Date(dataset.checkedAt).toLocaleString("es-AR"):"sin conexión")+
    (dataset.warnings?.length?" · "+dataset.warnings.join("; "):"");
  $("#refresh").disabled=false;$("#refresh").textContent="↻ SINCRONIZAR";
}
$$("[data-strategy]").forEach(b=>b.addEventListener("click",()=>{
  strategy=b.dataset.strategy;
  $$("[data-strategy]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  generate();
}));
$$("[data-mode]").forEach(b=>b.addEventListener("click",()=>{
  mode=b.dataset.mode;
  $$("[data-mode]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  generate();
}));
$("#refresh").addEventListener("click",load);
$("#generate").addEventListener("click",generate);
$("#copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(pick.map(fmt).join(" - "));toast("Combinación copiada")}catch{toast("No se pudo copiar automáticamente")}});
$("#save").addEventListener("click",()=>{const s=storage();s.push({nums:pick.slice(),strategy,createdAt:new Date().toISOString()});store(s);savedUI();toast("Combinación guardada")});
$("#chooser").addEventListener("click",e=>{const b=e.target.closest("[data-num]");if(!b)return;const n=Number(b.dataset.num);if(selected.has(n))selected.delete(n);else if(selected.size<6)selected.add(n);else{toast("Elegí solamente seis números");return;}selectionUI();$("#comparison").textContent=""});
$("#check").addEventListener("click",compare);
$("#clear").addEventListener("click",()=>{selected.clear();selectionUI();$("#comparison").textContent=""});
$("#saved").addEventListener("click",e=>{const b=e.target.closest("[data-delete]");if(!b)return;const s=storage();s.splice(Number(b.dataset.delete),1);store(s);savedUI()});
$("#export").addEventListener("click",()=>{
  const s=storage();if(!s.length){toast("No hay combinaciones para exportar");return}
  const csv="fecha,estrategia,n1,n2,n3,n4,n5,n6\n"+s.map(x=>[x.createdAt||"",x.strategy||"",...x.nums.map(fmt)].join(",")).join("\n");
  const u=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=u;a.download="oraqui6-combinaciones.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
});
selectionUI();savedUI();load();
