import seed from "../data/seed.json";
import {archiveRecords,ARCHIVE_META} from "./archive.js";
import {validDraw,walkForward} from "./math.js";
import {parseHistoricalCounts,STATS_URL} from "./parser.js";
import {parseYear,YEAR_SITE} from "./year-source.js";
const baseline=archiveRecords();
const backtest=walkForward(baseline,{mode:"tradicional",window:60,maxTests:120});
const VERSION="0.4.0";
const HEADER={"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=120","x-content-type-options":"nosniff"};
const SYNC_KEY="snapshot.v1";
async function externalText(url){
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),6500);
 try{
  const r=await fetch(url,{signal:ctrl.signal,headers:{"accept":"text/html","user-agent":"ORAQUI6/0.4 (historical results viewer; public read-only access)"}});
  if(!r.ok)throw Error("Origen HTTP "+r.status);
  const len=r.headers.get("content-length");
  if(len&&Number(len)>2000000)throw Error("Fuente demasiado grande");
  const str=await r.text();if(str.length>2000000)throw Error("Fuente demasiado grande");
  return str;
 }finally{clearTimeout(timeout)}
}
function mergedArchive(recent=[]){
 const map=new Map();
 for(const x of [...baseline,...recent]) if(validDraw(x))map.set(x.date,x);
 return [...map.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
function validCountArray(x){return Array.isArray(x)&&x.length===46&&x.every(v=>Number.isSafeInteger(v)&&v>=0)}
async function pollSources(previous){
 const checks=[],warnings=[], fresh={...(previous||{}),checkedAt:new Date().toISOString()};
 const year=new Date().getUTCFullYear();
 const src=YEAR_SITE+year;
 const [annual,stats]=await Promise.allSettled([externalText(src),externalText(STATS_URL)]);
 if(annual.status==="fulfilled"){
  const data=parseYear(annual.value,200);
  if(data.length){
   fresh.draws=[...new Map([...(previous?.draws||[]),...data].map(x=>[x.date,x])).values()].filter(validDraw).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,1000);
   fresh.drawsCheckedAt=fresh.checkedAt;fresh.drawsSource=src;checks.push("year");
  }else warnings.push("No se reconocieron sorteos en "+year);
 }else warnings.push("Fuente anual no disponible");
 if(stats.status==="fulfilled"){
  const c=parseHistoricalCounts(stats.value);
  if(validCountArray(c)){fresh.counts=c;fresh.statsCheckedAt=fresh.checkedAt;checks.push("stats")}
  else warnings.push("Frecuencias no verificadas");
 }else warnings.push("Fuente de estadísticas no disponible");
 fresh.warnings=warnings;fresh.ok=checks;return fresh;
}
async function sync(env){
 const kv=env.ORAQUI6_SYNC;
 const previous=kv?await kv.get(SYNC_KEY,"json").catch(()=>null):null;
 const next=await pollSources(previous);
 if(kv)await kv.put(SYNC_KEY,JSON.stringify(next));
 return next;
}
function buildData(state){
 const archive=mergedArchive(state?.draws||[]);
 const original=seed.history.filter(validDraw);
 const byDate=new Map([...archive,...original].map(d=>[d.date,d]));
 // Evitar IDs inventados: usar IDs sólo para sorteos del seed ya corroborados.
 const recentByDate=[...byDate.values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
 const history=recentByDate.map(d=>({...d,id:d.id??null}));
 const goodCounts=validCountArray(state?.counts);
 const historicalCounts=goodCounts?state.counts:seed.historicalCounts;
 const now=Date.now(),checked=Date.parse(state?.checkedAt||"");
 const age=Number.isFinite(checked)?Math.round((now-checked)/60000):null;
 return {
  version:VERSION,history,archive,archiveMeta:{...ARCHIVE_META,coverageStart:archive.at(-1)?.date,coverageEnd:archive[0]?.date,records:archive.length},
  backtest,historicalCounts,statsSnapshotDate:goodCounts?state.statsCheckedAt:seed.statsSnapshotDate,
  checkedAt:state?.checkedAt??null,lastResultDate:archive[0]?.date??null,refreshAgeMinutes:age,
  refreshMethod:"scheduled-after-draw",snapshotDate:seed.snapshotDate,
  sourceStatus:{draws:state?.drawsCheckedAt?"cached-source":"snapshot",stats:state?.statsCheckedAt?"cached-source":"snapshot"},
  sources:{results:state?.drawsSource||YEAR_SITE+new Date().getUTCFullYear(),stats:STATS_URL,official:"https://www.loteriasantafe.gov.ar/quini-6-2/"},
  warnings:state?.warnings||["Fuentes todavía no verificadas; utilizando la instantánea"],sampleDraws:history.length
 };
}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==="/api/health"){
   return new Response(JSON.stringify({ok:true,service:"oraqui6",version:VERSION,timestamp:new Date().toISOString(),sync:"sun-wed-23:15-AR"}),{headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
  }
  if(url.pathname==="/api/data"){
   let state=null;
   if(env.ORAQUI6_SYNC)state=await env.ORAQUI6_SYNC.get(SYNC_KEY,"json").catch(()=>null);
   return new Response(JSON.stringify(buildData(state)),{headers:HEADER});
  }
  if(url.pathname.startsWith("/api/"))return new Response('{"error":"not_found"}',{status:404,headers:HEADER});
  return env.ASSETS.fetch(request);
 },
 async scheduled(event,env,ctx){ctx.waitUntil(sync(env))}
};
