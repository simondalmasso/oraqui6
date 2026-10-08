import test from "node:test";
import assert from "node:assert/strict";
import {parseYear} from "../src/worker.js";
test("extracts exactly four valid modalities by date",()=>{
 const html = '<tr><td><a href="/quini-6/resultados/07-10-2026">7 oct</a></td><td>' +
 ["Tradicional","La Segunda","Revancha","Siempre Sale"].map(t=>'<ul class="balls"><li>'+t+'</li>' + [0,1,2,3,4,45].map(n=>'<li class="ball">'+n+'</li>').join("") + '</ul>').join("") + '</td></tr>';
 const parsed = parseYear(html);
 assert.equal(parsed.length,1);assert.equal(parsed[0].date,"2026-10-07");
 assert.deepEqual(parsed[0].draws[0],[0,1,2,3,4,45]);
});
test("ignores duplicate and out of range numbers",()=>{
 const html='<tr><a href="/quini-6/resultados/07-10-2026">x</a>' +
 Array.from({length:4},()=>'<ul class="balls">'+[0,1,2,3,4,4].map(n=>'<li class="ball">'+n+'</li>').join("")+'</ul>').join("")+'</tr>';
 assert.equal(parseYear(html).length,0);
});
