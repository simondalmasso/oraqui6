// Criterios exploratorios: NO estiman probabilidades futuras superiores.
export const UNIVERSE = 46;
export const TOTAL_COMBINATIONS = 9366819;
export const MODES = ["tradicional", "segunda", "revancha", "siempre"];
export const STRATEGIES = ["equilibrado", "frecuentes", "rezagados", "aleatorio"];

export function validNumbers(nums) {
  return Array.isArray(nums) && nums.length === 6 &&
    nums.every(n => Number.isInteger(n) && n >= 0 && n < UNIVERSE) &&
    new Set(nums).size === 6;
}
export function validDraw(d) {
  if (!d || (d.id != null && (!Number.isSafeInteger(d.id) || d.id < 1)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isFinite(Date.parse(d.date+"T12:00:00Z"))) return false;
  return MODES.every(key => validNumbers(d[key]));
}
export function frequencies(history, mode = "todas") {
  const out = Array(UNIVERSE).fill(0);
  const modes = mode === "todas" ? MODES : MODES.includes(mode) ? [mode] : [];
  for (const draw of history) if (validDraw(draw)) {
    for (const key of modes) for (const num of draw[key]) out[num]++;
  }
  return out;
}
export function weights({history = [], counts = [], mode = "todas", strategy = "equilibrado"}) {
  if (!STRATEGIES.includes(strategy)) throw Error("Estrategia inválida");
  const recent = frequencies(history, mode);
  const slots = history.filter(validDraw).length * (mode === "todas" ? 4 : 1) * 6;
  const h = counts.length === UNIVERSE && counts.every(n=>Number.isFinite(n)&&n>=0) ? counts : Array(UNIVERSE).fill(1);
  const avg = h.reduce((a,b)=>a+b,0) / UNIVERSE || 1;
  const exp = slots / UNIVERSE;
  return h.map((count, i) => {
    if (strategy === "aleatorio") return 1;
    // Limitar influencia de muestras pequeñas para no sobreajustar.
    const hz = Math.max(-1, Math.min(1, (count-avg)/avg));
    const rz = slots >= 60 ? Math.max(-1, Math.min(1, (recent[i]-exp)/Math.sqrt(Math.max(1, exp)))) : 0;
    const signal = hz * 1.8 + rz * .10;
    if (strategy === "frecuentes") return Math.max(.25, 1 + signal);
    if (strategy === "rezagados") return Math.max(.25, 1 - signal);
    return Math.max(.6, 1 + hz*.28 + rz*.05);
  });
}
export function sampleSix(w, random = Math.random) {
  if (!Array.isArray(w) || w.length !== UNIVERSE || w.some(x=>!Number.isFinite(x)||x<=0)) throw Error("Pesos inválidos");
  const pool = w.map((weight,n)=>({n,weight})), result=[];
  for (let j=0;j<6;j++) {
    let cutoff = Math.min(.999999999999, Math.max(0, random())) * pool.reduce((s,x)=>s+x.weight,0);
    let idx = pool.length-1;
    for (let i=0;i<pool.length;i++) {cutoff -= pool[i].weight;if(cutoff < 0){idx=i;break;}}
    result.push(pool.splice(idx,1)[0].n);
  }
  return result.sort((a,b)=>a-b);
}
export function secureRandom() {
  const bytes = new Uint32Array(1);
  globalThis.crypto.getRandomValues(bytes);
  return bytes[0] / 4294967296;
}
export const fmt = n => String(n).padStart(2,"0");


/**
 * Prueba retrospectiva sin fuga temporal: pesos construidos SOLO con sorteos anteriores.
 * No utiliza los recuentos históricos agregados (que contendrían información futura).
 * Las estrategias no tienen garantía de superar al azar uniforme.
 */
export function walkForward(draws, {mode="tradicional", window=60, maxTests=100} = {}) {
  if (!MODES.includes(mode)) throw Error("Modalidad inválida");
  const sorted=draws.filter(validDraw).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const w=Math.max(20,Math.min(150,Math.floor(window)));
  let matches=0, tests=0;
  for(let i=w;i<sorted.length && tests<maxTests;i++) {
    const previous=sorted.slice(i-w,i);
    const freq=frequencies(previous,mode);
    const ranked=freq.map((count,n)=>({count,n})).sort((a,b)=>b.count-a.count || a.n-b.n);
    const selection=new Set(ranked.slice(0,6).map(x=>x.n));
    matches+=sorted[i][mode].filter(n=>selection.has(n)).length;
    tests++;
  }
  const expected=6*6/46;
  return {
    methodology:"rolling-top6-frequencies",
    mode, window:w, tests,
    observedAverage:tests?Number((matches/tests).toFixed(4)):null,
    uniformExpectation:Number(expected.toFixed(4)),
    observedTotal:matches,
    expectedTotal:Number((tests*expected).toFixed(4)),
    note:"Backtest descriptivo, sin optimización de parámetros ni significación predictiva; no avala apuestas."
  };
}
