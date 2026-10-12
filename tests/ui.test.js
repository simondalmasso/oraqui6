import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("public/index.html","utf8"),js=readFileSync("public/app.js","utf8");
test("oracle-first and dual suggestions",()=>{assert.ok(html.indexOf('id="oraculo"')<html.indexOf('id="resultados"'));for(const k of ["pickSiempre","pick","generateSiempre","generate"])assert.ok(html.includes('id="'+k+'"'));});
test("robot mascot and no AI marketing claims",()=>{assert.match(html,/mascota-robot\.png/);assert.doesNotMatch(html,/generad[oa] por (?:la )?IA|predicci[oó]n con IA|inteligencia artificial/i);});
test("two generators and local storage",()=>{assert.ok(js.includes('generateSiempre()'));assert.ok(js.includes('localStorage'));});

test("terminal: mobile dock and feed counters are usable",()=>{
  for(const anchor of ["oraculo","resultados","radar","archivo","control"])assert.ok(html.includes('data-nav="'+anchor+'"'));
  assert.ok(html.includes('id="feedLatest"'));
  assert.ok(html.includes('id="feedCount"'));
  assert.ok(js.includes('function activateDock()'));
});

test("dock recorre varios enlaces sin detener la inicialización",()=>{assert.ok(js.includes('$$(".mobile-dock [data-nav]").forEach'));assert.ok(!js.includes('$(".mobile-dock [data-nav]").forEach'));assert.ok(js.includes("selectionUI();savedUI();load();"));});
test("copia de respaldo incorpora concurso 3416 contrastado oficialmente",()=>{const seed=JSON.parse(readFileSync("data/seed.json","utf8"));assert.equal(seed.history[0].id,3416);assert.equal(seed.history[0].date,"2026-10-11");assert.deepEqual(seed.history[0].segunda,[0,4,5,6,8,26]);assert.ok(js.includes('id:3416,date:"2026-10-11"'));});
