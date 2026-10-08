import {MODES, STRATEGIES, weights, sampleSix, secureRandom, validDraw, fmt} from "/math-browser.js";
const fallback={
archive:[],archiveMeta:null,backtest:null,history:[{id:3415,date:"2026-10-07",tradicional:[3,10,12,14,36,38],segunda:[5,12,13,23,24,35],revancha:[6,7,8,39,40,41],siempre:[4,7,19,32,34,42]}],
historicalCounts:[],sourceStatus:{draws:"snapshot",stats:"snapshot"},snapshotDate:"2026-10-08",sampleDraws:1,warnings:["No se pudo contactar con el servidor"]
};
const NAMES={tradicional:"TRADICIONAL",segunda:"LA SEGUNDA",revancha:"REVANCHA",siempre:"SIEMPRE SALE"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let dataset=fallback, strategy="equilibrado", mode="tradicional", serial=0, pick=[],siemprePick=[],selected=new Set(),toastTimer;
function balls(nums, hits=[]) {return nums.map(n=>'<span class="ball '+(hits.includes(n)?"hit":"")+'">'+fmt(n)+'</span>').join("");}
function toast(message){const t=$("#toast");t.textContent=message;t.style.display="block";clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.display="none",2400);}
function storage(){try{const x=JSON.parse(localStorage.getItem("oraqui6-saved")||"[]");return Array.isArray(x)?x.filter(a=>Array.isArray(a.nums)&&a.nums.length===6):[]}catch{return []}}
function store(x){try{localStorage.setItem("oraqui6-saved",JSON.stringify(x.slice(-30)))}catch{toast("El navegador impide guardar datos")}}
function renderResults(){
  const d=dataset.history?.[0];if(!validDraw(d))return;
  $("#drawId").textContent=d.id!=null?"#"+d.id:"—";$("#drawDate").textContent=d.date;
  const live=["live","cached-source"].includes(dataset.sourceStatus?.draws);
  $("#status").textContent=live?"● RESULTADOS ACTUALIZADOS":"● ARCHIVO LOCAL";
  $("#sourceLine").textContent=(d.id!=null?"CONCURSO "+d.id:"SORTEO")+" · "+d.date+" · "+(live?"DATOS PUBLICADOS":"COPIA GUARDADA");
  $("#metricArchive").textContent=(dataset.archive?.length||0).toLocaleString("es-AR");
  $("#feedCount").textContent=(dataset.archive?.length||0).toLocaleString("es-AR");
  $("#feedLatest").textContent=d.date;
  $("#results").innerHTML=MODES.map(k=>'<article class="result"><h3>'+NAMES[k]+'</h3><div class="ballline">'+balls(d[k])+'</div><small>'+(d.id!=null?'#'+d.id+' · ':'')+'SEIS NÚMEROS</small></article>').join("");
}
function renderRadar(){
  const a=dataset.historicalCounts||[];
  if(a.length!==46)return;
  const min=Math.min(...a),max=Math.max(...a);
  $("#statsState").textContent=["live","cached-source"].includes(dataset.sourceStatus?.stats)?"FUENTE CONSULTADA":"ÚLTIMA COPIA";
  $("#heatmap").innerHTML=a.map((count,n)=>{const t=(count-min)/(max-min||1),opacity=(.1+.7*t).toFixed(3);return '<div class="heat" title="Bolilla '+fmt(n)+': '+count+' salidas" style="background:rgba(52,248,170,'+opacity+')"><b>'+fmt(n)+'</b><small>'+count+'</small></div>'}).join("");
  const top=a.map((count,n)=>({count,n})).sort((x,y)=>y.count-x.count).slice(0,8);
  $("#leaderboard").innerHTML=top.map((x,i)=>'<div class="ranking"><span>'+(i+1)+'</span><b>'+fmt(x.n)+'</b><i><b style="width:'+Math.round(100*x.count/max)+'%"></b></i><span>'+x.count+'</span></div>').join("");
}
function renderArchive(){
  const entries=dataset.archive||[], bt=dataset.backtest;
  $("#archiveStatus").textContent=entries.length+" SORTEOS · "+(dataset.archiveMeta?.coverageStart||"FECHA SIN DETERMINAR")+" → "+(dataset.archiveMeta?.coverageEnd||"ACTUALIDAD");
  $("#archiveProvenance").textContent="Fuente: "+(dataset.archiveMeta?.source||"sin fuente")+" · Capturado: "+(dataset.archiveMeta?.retrievedAt||"sin fecha")+" · Se muestran los últimos 10, sin inventar números de concurso.";
  $("#archiveRows").innerHTML=entries.length?entries.slice(0,10).map(d=>'<div class="archive-row"><b>'+d.date+'</b><span>'+d.tradicional.map(fmt).join(" · ")+'</span></div>').join(""):'<p class="muted">No hay archivo verificado.</p>';
  $("#backtestBox").innerHTML=bt&&bt.tests?[
    ["EXTRACCIONES PROBADAS",String(bt.tests)],
    ["ACERTADOS POR JUGADA",bt.observedAverage.toFixed(3)],
    ["ESPERADO AZAR",bt.uniformExpectation.toFixed(3)],
    ["DIFERENCIA",((bt.observedAverage-bt.uniformExpectation)>=0?"+":"")+(bt.observedAverage-bt.uniformExpectation).toFixed(3)]
  ].map(([label,value])=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>').join(""):'<div><small>SIN MUESTRA SUFICIENTE</small></div>';
}
function suggestion(kind){
  const counts=dataset.historicalCounts?.length===46?dataset.historicalCounts:[];
  const history=dataset.archive?.length?dataset.archive.slice(0,100):dataset.history;
  return sampleSix(weights({history,counts,mode:kind==="siempre"?"siempre":mode,strategy}),secureRandom);
}
function generateSiempre(){
  siemprePick=suggestion("siempre");
  $("#pickSiempre").innerHTML=balls(siemprePick);
  $("#explainSiempre").textContent="SIEMPRE SALE / "+strategy.toUpperCase()+" · últimos "+Math.min(dataset.archive?.length||dataset.history.length,100)+" sorteos.";
}
function generate(){
  pick=suggestion("normal");serial++;
  $("#serial").textContent="#"+String(serial).padStart(3,"0");
  $("#pick").innerHTML=balls(pick);
  const label={equilibrado:"Frecuencias ponderadas",frecuentes:"Salidas más frecuentes",rezagados:"Salidas menos frecuentes",aleatorio:"Azar sin ponderación"}[strategy];
  $("#explain").textContent=label+" · "+mode.toUpperCase()+" · última ventana: "+Math.min(dataset.archive?.length||dataset.history.length,100)+" sorteos.";
  generateSiempre();
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
  $("#refresh").disabled=true;$("#refresh").textContent="↻ LEYENDO DATOS…";
  try {
    const response=await fetch("/api/data",{headers:{accept:"application/json"}});
    if(!response.ok)throw Error("HTTP "+response.status);
    const next=await response.json();
    if(!Array.isArray(next.history)||!validDraw(next.history[0]))throw Error("Datos inválidos");
    dataset=next;
  } catch (err){console.warn("ORAQUI6 source unavailable:",err.message);dataset=fallback}
  renderResults();renderRadar();renderArchive();generate();
  const st=dataset.sourceStatus||{};
  $("#sourceHealth").textContent="Sorteos: "+(["live","cached-source"].includes(st.draws)?"fuente consultada":"copia guardada")+
    " · Frecuencias: "+(["live","cached-source"].includes(st.stats)?"fuente consultada":"copia guardada")+
    " · Archivo disponible: "+(dataset.archive?.length||0)+
    " · Consultado: "+(dataset.checkedAt?new Date(dataset.checkedAt).toLocaleString("es-AR"):"sin consulta programada")+
    (dataset.warnings?.length?" · "+dataset.warnings.join("; "):"");
  $("#refresh").disabled=false;$("#refresh").textContent="↻ ACTUALIZAR PANTALLA";
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
$("#generate").addEventListener("click",()=>{pick=suggestion("normal");serial++;$("#serial").textContent="#"+String(serial).padStart(3,"0");$("#pick").innerHTML=balls(pick);toast("Nueva jugada normal");});
$("#generateSiempre").addEventListener("click",()=>{generateSiempre();toast("Nueva jugada Siempre Sale");});
$("#copySiempre").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(siemprePick.map(fmt).join(" - "));toast("Siempre Sale copiado")}catch{toast("No se pudo copiar")}});
$("#saveSiempre").addEventListener("click",()=>{const s=storage();s.push({nums:siemprePick.slice(),strategy,mode:"siempre",createdAt:new Date().toISOString()});store(s);savedUI();toast("Siempre Sale guardado")});
$("#copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(pick.map(fmt).join(" - "));toast("Combinación copiada")}catch{toast("No se pudo copiar automáticamente")}});
$("#save").addEventListener("click",()=>{const s=storage();s.push({nums:pick.slice(),strategy,mode,createdAt:new Date().toISOString()});store(s);savedUI();toast("Combinación guardada")});
$("#chooser").addEventListener("click",e=>{const b=e.target.closest("[data-num]");if(!b)return;const n=Number(b.dataset.num);if(selected.has(n))selected.delete(n);else if(selected.size<6)selected.add(n);else{toast("Elegí solamente seis números");return;}selectionUI();$("#comparison").textContent=""});
$("#check").addEventListener("click",compare);
$("#clear").addEventListener("click",()=>{selected.clear();selectionUI();$("#comparison").textContent=""});
$("#saved").addEventListener("click",e=>{const b=e.target.closest("[data-delete]");if(!b)return;const s=storage();s.splice(Number(b.dataset.delete),1);store(s);savedUI()});
$("#export").addEventListener("click",()=>{
  const s=storage();if(!s.length){toast("No hay combinaciones para exportar");return}
  const csv="fecha,estrategia,modalidad,n1,n2,n3,n4,n5,n6\n"+s.map(x=>[x.createdAt||"",x.strategy||"",x.mode||"",...x.nums.map(fmt)].join(",")).join("\n");
  const u=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=u;a.download="oraqui6-combinaciones.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
});
generate();// Dock activo según la sección, sin librerías ni solicitudes de red.
function activateDock(){
  const id=location.hash.slice(1)||"oraculo";
  $(".mobile-dock [data-nav]").forEach(link=>{
    if(link.dataset.nav===id)link.setAttribute("aria-current","location");
    else link.removeAttribute("aria-current");
  });
}
globalThis.addEventListener("hashchange",activateDock);
activateDock();
selectionUI();savedUI();load();
