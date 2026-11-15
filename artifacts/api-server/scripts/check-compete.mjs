import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/api-server");
const dir = await mkdtemp(resolve(root, "node_modules/.compete-check-"));
try {
  await build({
    stdin: {
      resolveDir: root, loader: "ts", contents: `
import assert from "node:assert/strict";
import express from "express";
import router from "./src/routes/compete";
import {competeFive9} from "./src/lib/competeFive9";
const app=express();
// Local test harness only: production authentication remains untouched.
app.use((req,_res,next)=>{req.isAuthenticated=()=>req.get("X-Test-Authenticated")==="yes"; next();});
app.use("/api",router);
const server=app.listen(0,"127.0.0.1");
await new Promise(resolve=>server.once("listening",resolve));
const origin="http://127.0.0.1:"+server.address().port;
let count=0;
const ok=(value,message)=>{assert.ok(value,message);count++;};
try {
  for(const path of ["/api/compete/five9","/api/compete/unknown"]){
    const response=await fetch(origin+path);
    ok(response.status===401,"anonymous access denied");
    ok((response.headers.get("cache-control")??"").includes("no-store"),"restricted data not cached");
    ok(!(await response.text()).includes(competeFive9.headline),"no content leaked");
  }
  let response=await fetch(origin+"/api/compete/five9",{headers:{"X-Test-Authenticated":"yes"}});
  ok(response.status===403,"customer mode denied for signed-in users");
  response=await fetch(origin+"/api/compete/five9",{headers:{"X-Test-Authenticated":"yes","X-Depot-Mode":"presenter","Sec-Fetch-Site":"cross-site"}});
  ok(response.status===403,"cross-site access denied");
  const headers={"X-Test-Authenticated":"yes","X-Depot-Mode":"presenter"};
  response=await fetch(origin+"/api/compete/five9",{headers});
  ok(response.status===200,"signed-in presenter can load battle card");
  const data=await response.json();
  ok(data.id==="five9","correct competitor");
  ok(data.themes.length===5,"five complete comparison themes");
  ok(data.objections.length===3,"three objection responses");
  ok(/2025/.test(data.sourceDates)&&/2026/.test(data.sourceDates),"source dates distinguished");
  const sourceIds=new Set(data.sources.map(s=>s.id));
  for(const theme of data.themes){
    for(const field of ["title","zendesk","five9","question","proof","sourcePages"])ok(!!theme[field],theme.id+" "+field);
    for(const sourceId of theme.sourceIds)ok(sourceIds.has(sourceId),"source resolves: "+sourceId);
  }
  for(const source of data.sources)ok(new URL(source.url).protocol==="https:","secure public source");
  ok(data.guardrails.some(x=>x.includes("native and partner WEM")),"outdated WEM claim corrected");
  ok(data.guardrails.some(x=>x.includes("planned")),"Voice AI availability qualified");
  ok(!JSON.stringify(data).includes("$119"),"historical competitor quote not presented as current");
  response=await fetch(origin+"/api/compete/unknown",{headers});
  ok(response.status===404,"unknown competitor returns 404");
  console.log(count+" Compete content, schema and access checks passed");
} finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
`,
    },
    outfile: resolve(dir, "check.mjs"),
    bundle: true, platform: "node", format: "esm", packages: "external",
    alias: {
      "@workspace/api-zod": resolve("lib/api-zod/src/index.ts"),
      zod: resolve("lib/api-zod/node_modules/zod/index.js"),
    },
  });
  const result = spawnSync(process.execPath, [resolve(dir, "check.mjs")], { stdio: "inherit", timeout: 30000 });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
