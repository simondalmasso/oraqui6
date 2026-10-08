import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync("public/style.css","utf8");
const html=readFileSync("public/index.html","utf8");

test("responsive breakpoints and six-column picks for narrow screens",()=>{
  for(const width of [340,420,760])assert.ok(css.includes("max-width:"+width+"px"),"Missing "+width+"px breakpoint");
  assert.ok(css.includes(".selection-card .ballline.big{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))"));
  assert.ok(css.includes(".chooser{grid-template-columns:repeat(6,minmax(0,1fr))"));
});
test("mobile dock, 5 destinations, safe-area insets",()=>{
  assert.ok(css.includes(".mobile-dock{display:grid"));
  assert.ok(css.includes("safe-area-inset-bottom"));
  assert.ok(html.includes('aria-label="Navegación móvil"'));
  assert.equal(html.split('data-nav="').length-1,5);
});
test("touch targets and mobile mascot are visible",()=>{
  assert.ok(css.includes("@media (pointer:coarse)"));
  assert.ok(css.includes(".tabs button,.num,.btn{min-height:44px}"));
  assert.ok(css.includes(".mascot-shell{display:grid"));
  assert.ok(!css.includes(".mascot-shell{display:none"));
});
test("no third-party font or CSS requests",()=>{
  assert.ok(!css.includes("@import"));
  assert.ok(!css.includes("https://")&&!css.includes("http://"));
});
