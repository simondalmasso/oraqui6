import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("mascota vectorial SVG no está truncada",()=>{const s=readFileSync("public/mascota-topologica.svg","utf8");assert.ok(s.length>2500);assert.match(s,/^<svg\s/);assert.match(s,/<\/svg>\s*$/);assert.match(s,/viewBox="0 0 440 390"/);});

import {existsSync,statSync} from "node:fs";
test("mascota nueva: PNG RGBA compacto incluido en assets",()=>{const path="public/mascota-robot.png";assert.ok(existsSync(path));const s=statSync(path);assert.ok(s.size>12000&&s.size<200000);const b=readFileSync(path);assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a");assert.equal(b[25],6);});
