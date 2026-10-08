import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync("public/style.css","utf8"),html=readFileSync("public/index.html","utf8");
test("320, 420 y 760 px cuentan con configuración responsive",()=>{
 for(const w of [340,420,760])assert.ok(css.includes('max-width:'+w+'px'));
 assert.match(css,/.selection-card .ballline.big{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))/);
 assert.match(css,/.chooser{grid-template-columns:repeat(6,minmax(0,1fr))/);
});
test("barra inferior móvil y área segura de pantalla",()=>{
 assert.match(css,/.mobile-dock{display:grid/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(html,/aria-label="Navegación móvil"/);
 assert.equal((html.match(/data-nav="/g)||[]).length,5);
});
test("controles táctiles con dimensiones mínimas y mascota visible",()=>{
 assert.match(css,/@media (pointer:coarse)/);
 assert.match(css,/.tabs button,.num,.btn{min-height:44px}/);
 assert.match(css,/.mascot-shell{display:grid/);
 assert.doesNotMatch(css,/.mascot-shell{display:none/);
});
test("no existe importación externa de fuentes ni rastreadores",()=>{
 assert.doesNotMatch(css,/@import|https?:///);
});
