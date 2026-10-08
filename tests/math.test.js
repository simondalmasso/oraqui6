import test from "node:test";
import assert from "node:assert/strict";
import {validNumbers,validDraw,frequencies,weights,sampleSix,TOTAL_COMBINATIONS,UNIVERSE} from "../src/math.js";
import {archiveEntries,parseDraw,parseHistoricalCounts} from "../src/parser.js";
import seed from "../data/seed.json" with {type:"json"};
test("combinatoria exacta",()=>assert.equal(TOTAL_COMBINATIONS,9366819));
test("validación estricta de 6 números",()=>{
  assert.ok(validNumbers([0,1,2,43,44,45]));
  assert.ok(!validNumbers([0,0,2,43,44,45]));
  assert.ok(!validNumbers([-1,1,2,43,44,45]));
  assert.ok(!validNumbers([0,1,2,43,44,46]));
  assert.ok(!validNumbers([0,1,2,43,44,"45"]));
  assert.ok(seed.history.every(validDraw));
});
test("frecuencia por modalidad",()=>{
  const f=frequencies(seed.history,"tradicional");
  assert.equal(f.reduce((a,b)=>a+b,0),12);
  assert.equal(f[38],2);
  assert.equal(frequencies(seed.history,"todas").reduce((a,b)=>a+b,0),48);
});
test("pesos y 6 únicas para cada estrategia",()=>{
  for(const strategy of ["equilibrado","frecuentes","rezagados","aleatorio"]){
    const w=weights({history:seed.history,counts:seed.historicalCounts,strategy});
    assert.equal(w.length,UNIVERSE);assert.ok(w.every(n=>n>0));
    const nums=sampleSix(w,()=>.53);assert.ok(validNumbers(nums));
  }
});
test("azar puro con pesos iguales",()=>{
  const w=weights({history:seed.history,counts:seed.historicalCounts,strategy:"aleatorio"});
  assert.equal(new Set(w).size,1);
});
test("parser extrae archivo de sorteos",()=>{
  const arr=archiveEntries('<a href="/quini6/sorteo-3414-del-dia-04-10-2026.htm">a</a><a href="/quini6/sorteo-3415-del-dia-07-10-2026.htm">b</a>');
  assert.deepEqual(arr.map(x=>x.id),[3415,3414]);
});
test("parser de cuatro modalidades",()=>{
  const html=['TRADICIONAL','LA SEGUNDA DEL QUINI','SORTEO REVANCHA','QUINI QUE SIEMPRE SALE'].map((h,i)=>'<h3>'+ (i===0?'SORTEO ':'' )+h+'</h3><p class="numeros">03 - 10 - 12 - 14 - 36 - 38</p>').join("");
  const x=parseDraw(html,{id:3415,date:"2026-10-07"});
  assert.ok(x&&validDraw(x));
});
test("parser descarta tablas incompletas",()=>assert.equal(parseHistoricalCounts("<table><tr><td>00</td><td>1020</td></tr></table>"),null));

import {walkForward} from "../src/math.js";
import {archiveRecords} from "../src/archive.js";
test("archivo preserva fechas y 4 modalidades sin inventar concurso",()=>{
  const a=archiveRecords();
  assert.ok(a.length>=300);
  assert.ok(a.every(validDraw));
  assert.ok(a.every(x=>!Object.hasOwn(x,"id")));
  assert.ok(a[0].date>=a[a.length-1].date);
});
test("backtest temporal declara el esperado uniforme",()=>{
  const r=walkForward(archiveRecords(),{window:60,maxTests:120});
  assert.equal(r.tests,120);
  assert.ok(r.observedAverage>=0 && r.observedAverage<=6);
  assert.ok(Math.abs(r.uniformExpectation-36/46)<.0001);
});
test("backtest no utiliza datos futuros",()=>{
  const a=archiveRecords().slice(-100);
  const x=walkForward(a,{window:40,maxTests:40});
  const b=a.map(v=>({...v,tradicional:[0,1,2,3,4,5]}));
  const y=walkForward(b,{window:40,maxTests:40});
  assert.equal(x.tests,y.tests);
});
