import seed from "../data/seed.json";
import { archiveRecords, ARCHIVE_META } from "./archive.js";
import { validDraw, walkForward } from "./math.js";
import { archiveEntries, parseDraw, parseHistoricalCounts, ARCHIVE_URL, STATS_URL } from "./parser.js";

const archived = archiveRecords();
const backtest = walkForward(archived, {mode:"tradicional",window:60,maxTests:120});
const headers = { "content-type":"application/json; charset=utf-8", "cache-control":"public, max-age=900", "x-content-type-options":"nosniff" };
async function externalText(url) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  try {
    const r=await fetch(url,{signal:controller.signal,headers:{"accept":"text/html","user-agent":"ORAQUI6/0.1 (+independent statistical viewer)"}});
    if(!r.ok)throw Error("Origen HTTP "+r.status);
    const body=await r.text();
    if(body.length>1200000)throw Error("Documento demasiado grande");
    return body;
  } finally { clearTimeout(timer); }
}
async function getDataset() {
  let history=seed.history.filter(validDraw), historicalCounts=seed.historicalCounts;
  let drawsStatus="snapshot", statsStatus="snapshot", drawError=null, statsError=null;
  const [archive, stats]=await Promise.allSettled([externalText(ARCHIVE_URL),externalText(STATS_URL)]);
  if (stats.status==="fulfilled") {
    const parsed=parseHistoricalCounts(stats.value);
    if(parsed){historicalCounts=parsed;statsStatus="live";}
    else statsError="Estructura estadística no reconocida";
  } else statsError="Origen de frecuencias no disponible";
  if(archive.status==="fulfilled"){
    const entries=archiveEntries(archive.value);
    if(entries.length){
      const fetched=await Promise.allSettled(entries.slice(0,12).map(async e=>parseDraw(await externalText(e.url),e)));
      const valid=fetched.filter(x=>x.status==="fulfilled"&&x.value&&validDraw(x.value)).map(x=>x.value);
      if(valid.length){
        const unique=new Map([...valid,...history].map(x=>[x.id,x]));
        history=[...unique.values()].sort((a,b)=>b.id-a.id).slice(0,20);
        drawsStatus="live";
      } else drawError="No se pudieron validar detalles de sorteos";
    } else drawError="Archivo sin enlaces reconocibles";
  } else drawError="Origen de sorteos no disponible";
  return {history,archive:archived,archiveMeta:ARCHIVE_META,backtest,historicalCounts,statsSnapshotDate:seed.statsSnapshotDate,sourceStatus:{draws:drawsStatus,stats:statsStatus},checkedAt:new Date().toISOString(),snapshotDate:seed.snapshotDate,historyFrom:"2008",sources:{results:ARCHIVE_URL,stats:STATS_URL,official:"https://www.loteriasantafe.gov.ar/quini-6-2/"},warnings:[drawError,statsError].filter(Boolean),sampleDraws:history.length};
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    if(url.pathname==="/api/health")
      return new Response(JSON.stringify({ok:true,service:"oraqui6",version:"0.2.0",timestamp:new Date().toISOString()}),{headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
    if(url.pathname==="/api/data"){
      const cacheKey=new Request(url.origin+"/api/data");
      const cache=typeof caches!=="undefined"?caches.default:null;
      const cached=cache?await cache.match(cacheKey):null;
      if(cached)return cached;
      const dataset=await getDataset().catch(()=>({history:seed.history,archive:archived,archiveMeta:ARCHIVE_META,backtest,historicalCounts:seed.historicalCounts,statsSnapshotDate:seed.statsSnapshotDate,sourceStatus:{draws:"snapshot",stats:"snapshot"},checkedAt:new Date().toISOString(),snapshotDate:seed.snapshotDate,historyFrom:"2008",warnings:["Fuentes inaccesibles; mostrando instantánea verificada."],sampleDraws:seed.history.length}));
      const response=new Response(JSON.stringify(dataset),{headers});
      if(cache&&ctx?.waitUntil)ctx.waitUntil(cache.put(cacheKey,response.clone()));
      return response;
    }
    if(url.pathname.startsWith("/api/"))return new Response(JSON.stringify({error:"Not found"}),{status:404,headers});
    return env.ASSETS.fetch(request);
  }
};
