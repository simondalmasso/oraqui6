import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("mascota vectorial SVG no está truncada",()=>{const s=readFileSync("public/mascota-topologica.svg","utf8");assert.ok(s.length>2500);assert.match(s,/^<svg\s/);assert.match(s,/<\/svg>\s*$/);assert.match(s,/viewBox="0 0 440 390"/);});
