import { validDraw, validNumbers } from "./math.js";
const HOST = "https://www.quini-6-resultados.com.ar";
export const ARCHIVE_URL = HOST+"/quini6/sorteos-anteriores.aspx";
export const STATS_URL = HOST+"/quini6/quini6estadisticas.aspx";
function textOnly(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"")
    .replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
}
export function archiveEntries(html) {
  const found = new Map();
  const re = /sorteo-(\d+)-del-dia-(\d{2})-(\d{2})-(\d{4})\.htm/gi;
  let m;
  while ((m=re.exec(html)) !== null) {
    const id=Number(m[1]); const date=m[4]+"-"+m[3]+"-"+m[2];
    if (id>0 && Number.isFinite(Date.parse(date+"T12:00:00Z"))) {
      found.set(id,{id,date,url:HOST+"/quini6/sorteo-"+id+"-del-dia-"+m[2]+"-"+m[3]+"-"+m[4]+".htm"});
    }
  }
  return [...found.values()].sort((a,b)=>b.id-a.id).slice(0,20);
}
const HEADERS={tradicional:/^SORTEO TRADICIONAL$/i,segunda:/^LA SEGUNDA DEL QUINI(?: 6)?$/i,revancha:/^SORTEO REVANCHA$/i,siempre:/^QUINI QUE SIEMPRE SALE$/i};
function parseSix(input) {
  const match = input.match(/(?:\b\d{1,2}\b\s*[-–]\s*){5}\b\d{1,2}\b/);
  if (!match) return null;
  const nums = match[0].split(/\s*[-–]\s*/).map(Number);
  return validNumbers(nums) ? nums.sort((a,b)=>a-b) : null;
}
export function parseDraw(html, meta) {
  const blocks = [...html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]{0,1200}?)(?=<h3\b|$)/gi)];
  const out = {id:meta.id,date:meta.date};
  for (const block of blocks) {
    const label = textOnly(block[1]);
    for(const [key, pattern] of Object.entries(HEADERS)) if(pattern.test(label)){
      // Solo el primer bloque de números; evita leer premios más adelante.
      const p = block[2].match(/<p\b[^>]*class=["'][^"']*numeros[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
      const nums = parseSix(textOnly(p ? p[1] : block[2].split(/<\/(?:p|div)>/i)[0]));
      if (nums) out[key]=nums;
    }
  }
  // Fallback para variantes que usen texto plano con encabezados.
  if (!validDraw(out)) {
    const plain = html.replace(/<\/(?:h3|p|div)>/gi,"\n").replace(/<[^>]*>/g," ").replace(/&nbsp;/gi," ");
    const lines=plain.split(/\n/).map(s=>s.replace(/\s+/g," ").trim()).filter(Boolean);
    for(let i=0;i<lines.length-1;i++)
      for(const [key,pattern] of Object.entries(HEADERS)) if(pattern.test(lines[i]) && !out[key]) out[key]=parseSix(lines[i+1]);
  }
  return validDraw(out) ? out : null;
}
export function parseHistoricalCounts(html) {
  const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const results = new Map();
  for(const row of rows){
    const cols=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>textOnly(m[1]));
    if(cols.length<2)continue;
    if(!/^\d{1,2}$/.test(cols[0])||!/^\d{1,6}$/.test(cols[1]))continue;
    const n=Number(cols[0]), count=Number(cols[1]);
    if(n>=0&&n<46&&count>=0) results.set(n,count);
  }
  return results.size===46?Array.from({length:46},(_,i)=>results.get(i)):null;
}
