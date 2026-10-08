import test from "node:test";
import assert from "node:assert/strict";
import {parseYear} from "../src/year-source.js";
test("year parser accepts only 4 unique six-number modes",()=>{
 const row="<tr><td><a href='/quini-6/resultados/07-10-2026'>07 oct.</a></td>"+
 ["Tradicional","La Segunda","Revancha","Siempre Sale"].map(n=>"<ul class='balls'><li>"+n+"</li>"+[0,4,13,29,36,45].map(x=>"<li class='ball'>"+x+"</li>").join("")+"</ul>").join("")+"</tr>";
 const v=parseYear(row);assert.equal(v.length,1);assert.equal(v[0].date,"2026-10-07");assert.equal(v[0].siempre.length,6);
});
test("reject incomplete annual row",()=>{
 const row="<tr><a href='/quini-6/resultados/07-10-2026'></a><ul class='balls'><li>Tradicional</li></ul></tr>";
 assert.equal(parseYear(row).length,0);
});
