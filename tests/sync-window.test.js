import test from "node:test";
import assert from "node:assert/strict";
import {latestResultWindow} from "../src/sync-window.js";
test("2 post-draw windows each week, no 15-minute cron",()=>{
 assert.equal(latestResultWindow(Date.parse("2026-10-08T01:00:00Z")),"2026-10-05T02:15:00.000Z");
 assert.equal(latestResultWindow(Date.parse("2026-10-08T03:00:00Z")),"2026-10-08T02:15:00.000Z");
 assert.equal(latestResultWindow(Date.parse("2026-10-09T10:00:00Z")),"2026-10-08T02:15:00.000Z");
});
test("wrangler contains no Cloudflare cron triggers",async()=>{
 const {readFileSync}=await import("node:fs");
 const conf=JSON.parse(readFileSync("wrangler.jsonc","utf8"));
 assert.equal(conf.triggers,undefined);
 assert.ok(Array.isArray(conf.kv_namespaces));
});
