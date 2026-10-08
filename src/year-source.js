import {validNumbers} from "./math.js";
export const YEAR_SITE="https://resultados-de-loteria.com/quini-6/resultados/";
const KEYS=["tradicional","segunda","revancha","siempre"];
function strip(s){return s.replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").trim()}
export function parseYear(html,limit=200){
 if(typeof html!=="string"||html.length>2000000)return [];
 const found=new Map();
 for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const date=row[1].match(/\/quini-6\/resultados\/(\d{2})-(\d{2})-(\d{4})/i);
  if(!date)continue;
  const d=date[3]+"-"+date[2]+"-"+date[1];
  if(new Date(d+"T12:00:00Z").toISOString().slice(0,10)!==d)continue;
  const nums={};
  for(const block of row[1].matchAll(/<ul\b[^>]*class=["'][^"']*\bballs\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi)){
   const label=strip(block[1].match(/<li\b[^>]*>([\s\S]*?)<\/li>/i)?.[1]||"").toLowerCase();
   const key=label.includes("tradicional")?"tradicional":label.includes("segunda")?"segunda":label.includes("revancha")?"revancha":label.includes("siempre")?"siempre":null;
   if(!key)continue;
   const values=[...block[1].matchAll(/<li\b[^>]*class=["'][^"']*\bball\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)].map(m=>Number(strip(m[1])));
   if(validNumbers(values))nums[key]=values.sort((a,b)=>a-b);
  }
  if(KEYS.some(k=>!nums[k]))continue;
  found.set(d,{date:d,...nums});
 }
 return [...found.values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
}
