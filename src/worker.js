// ORAQUI6 — Cloudflare Workers API. Read-only allowlisted result ingestion.
const SOURCE = "https://resultados-de-loteria.com/quini-6/resultados/";
const MODES = ["Tradicional", "La Segunda", "Revancha", "Siempre Sale"];
const good = a => Array.isArray(a) && a.length === 6 && new Set(a).size === 6 && a.every(n => Number.isInteger(n) && n >= 0 && n <= 45);

export function parseYear(html) {
  const rows = [];
  for (const tr of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const body = tr[1];
    const date = body.match(/\/quini-6\/resultados\/(\d{2})-(\d{2})-(\d{4})/i);
    if (!date) continue;
    const draws = [];
    for (const ul of body.matchAll(/<ul\b[^>]*class=["']balls["'][^>]*>([\s\S]*?)<\/ul>/gi)) {
      const numbers = Array.from(ul[1].matchAll(/<li\b[^>]*class=["']ball["'][^>]*>\s*(\d{1,2})\s*<\/li>/gi), m => Number(m[1])).sort((a,b) => a-b);
      if (good(numbers)) draws.push(numbers);
    }
    if (draws.length === MODES.length) {
      rows.push({date: date[3] + "-" + date[2] + "-" + date[1], draws});
    }
  }
  return rows;
}

function uniqueSort(draws) {
  return [...new Map(draws.filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Array.isArray(r.draws) && r.draws.length === 4 && r.draws.every(good)).map(r => [r.date, r])).values()].sort((a,b) => b.date.localeCompare(a.date));
}

async function loadHistory(env, origin) {
  const request = new Request(new URL("/data/history.json", origin).href);
  const response = await env.ASSETS.fetch(request);
  if (!response.ok) throw new Error("history asset unavailable");
  const data = await response.json();
  if (!Array.isArray(data.draws)) throw new Error("history schema invalid");
  return data;
}
async function getLatest() {
  const year = new Date().getUTCFullYear();
  const endpoint = SOURCE + year;
  const response = await fetch(endpoint, {
    headers: {"Accept":"text/html","User-Agent":"ORAQUI6/1.0 historical-data research"},
    signal: AbortSignal.timeout(6500),
    cf: {cacheEverything:true,cacheTtl:900}
  });
  if (!response.ok) throw new Error("source status " + response.status);
  const html = await response.text();
  if (html.length > 1500000) throw new Error("source too large");
  const parsed = parseYear(html);
  if (!parsed.length) throw new Error("no validated rows");
  return {parsed,endpoint};
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return Response.json({ok:true,service:"oraqui6",version:"1.0.0"},{headers:{"Cache-Control":"no-store"}});
    }
    if (url.pathname !== "/api/history") {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "GET") return new Response("Method Not Allowed",{status:405,headers:{Allow:"GET"}});
    const cache = caches.default;
    const key = new Request(url.origin + "/api/history");
    const hit = await cache.match(key);
    if (hit) return hit;
    let history;
    try { history = await loadHistory(env,url.origin); }
    catch (e) { return Response.json({error:"Historical data unavailable"},{status:503}); }
    const baseline = uniqueSort(history.draws);
    let updated = [];
    let status = "archivo";
    let source = history.source;
    try {
      const live = await getLatest();
      if (live.parsed[0].date >= (baseline[0]?.date || "")) {
        updated = live.parsed;
        status = "actualizado";
        source = live.endpoint;
      }
    } catch (_) { /* validated local snapshot, explicitly marked as archive */ }
    const merged = uniqueSort([...updated,...baseline]);
    const body = {
      schema:1, mode:status, source, archiveSource:history.source,
      archiveRetrievedAt:history.retrievedAt, checkedAt:new Date().toISOString(),
      total:merged.length, draws:merged
    };
    const response = Response.json(body,{headers: {
      "Cache-Control":"public, max-age=300, s-maxage=600",
      "X-Content-Type-Options":"nosniff"
    }});
    ctx.waitUntil(cache.put(key,response.clone()));
    return response;
  }
};
