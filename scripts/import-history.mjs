import {readFile,writeFile} from "node:fs/promises";
import {validNumbers} from "../src/math.js";
// Importar resultados anuales de una fuente pública independiente. Sin IDs inventados.
const from=Number(process.argv[2]??2009),to=Number(process.argv[3]??new Date().getFullYear());
if(from<1988||to>2100||from>to)throw Error("Rango inválido");
const file="public/data/history.json",existing=JSON.parse(await readFile(file,"utf8"));
const dates=new Map(existing.draws.map(x=>[x.date,x])), report=[];
const keys=["tradicional","segunda","revancha","siempre"];
function strip(s){return s.replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").trim()}
for(let year=from;year<=to;year++){
 const url="https://resultados-de-loteria.com/quini-6/resultados/"+year;
 let html;try{const r=await fetch(url,{headers:{"user-agent":"ORAQUI6 read-only historical statistics","accept":"text/html"}});if(!r.ok){report.push({year,http:r.status});continue}html=await r.text()}catch(e){report.push({year,error:String(e.message)});continue}
 let total=0,valid=0,added=0;
 for(const m of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const date=m[1].match(/\/quini-6\/resultados\/(\d{2})-(\d{2})-(\d{4})/i);
  if(!date)continue;total++;
  const day=date[3]+"-"+date[2]+"-"+date[1];
  if(!Number.isFinite(Date.parse(day+"T12:00:00Z")))continue;
  const nums={};
  for(const u of m[1].matchAll(/<ul\b[^>]*class=["'][^"']*\bballs\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi)){
   const label=strip(u[1].match(/<li\b[^>]*>([\s\S]*?)<\/li>/i)?.[1]||"").toLowerCase();
   const key=label.includes("tradicional")?"tradicional":label.includes("segunda")?"segunda":label.includes("revancha")?"revancha":label.includes("siempre")?"siempre":null;
   if(!key)continue;
   const a=[...u[1].matchAll(/<li\b[^>]*class=["'][^"']*\bball\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)].map(x=>Number(strip(x[1])));
   if(validNumbers(a))nums[key]=a.sort((x,y)=>x-y);
  }
  if(keys.some(k=>!nums[k]))continue;
  valid++;
  if(!dates.has(day)){dates.set(day,{date:day,draws:keys.map(k=>nums[k])});added++}
 }
 report.push({year,total,valid,added});console.log("YEAR",year,"VALID",valid,"ADDED",added);
 await new Promise(resolve=>setTimeout(resolve,350));
}
const draws=[...dates.values()].sort((a,b)=>b.date.localeCompare(a.date));
await writeFile(file,JSON.stringify({schema:1,source:"https://resultados-de-loteria.com/quini-6/resultados/{year}",retrievedAt:new Date().toISOString(),note:"Archivo parcial por año; no equivale a cobertura exhaustiva ni extracto oficial.",importedYears:report,draws}));
console.log("SAVED",draws.length,"DATE_RANGE",draws.at(-1)?.date,draws[0]?.date,"YEARS",JSON.stringify(report));
