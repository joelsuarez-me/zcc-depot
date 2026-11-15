import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/api-server");
const dir = await mkdtemp(resolve(root, "node_modules/.feature-presenter-check-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "ts", contents: `
import assert from "node:assert/strict";
import express from "express";
import router from "./src/routes/presenter";
import {featurePresenterGuidance} from "./src/lib/feature-presenter";
const app=express();
// Local HTTP harness only. Production authentication is not modified.
app.use((req,_res,next)=>{req.isAuthenticated=()=>req.get("X-Test-Authenticated")==="yes";next();});
app.use("/api",router);
const server=app.listen(0,"127.0.0.1");
await new Promise(resolve=>server.once("listening",resolve));
const origin="http://127.0.0.1:"+server.address().port;
let count=0;
function ok(value,message){assert.ok(value,message);count++;}
try {
  for (const headers of [{},{"X-Depot-Mode":"presenter"}]){
    const r=await fetch(origin+"/api/presenter/content",{headers});
    ok(r.status===401,"anonymous access denied");
    ok(r.headers.get("cache-control")==="private, no-store","private response never cached");
    ok(!(await r.text()).includes(featurePresenterGuidance[0].technical[0]),"no private notes in denied response");
  }
  for(const extra of [{},{"X-Depot-Mode":"customer"},{"X-Depot-Mode":"presenter","Sec-Fetch-Site":"cross-site"}]){
    const r=await fetch(origin+"/api/presenter/content",{headers:{"X-Test-Authenticated":"yes",...extra}});
    ok(r.status===403,"signed-in request requires explicit same-site Presenter Mode");
    ok(!(await r.text()).includes(featurePresenterGuidance[0].technical[0]),"no guidance in forbidden response");
  }
  const r=await fetch(origin+"/api/presenter/content",{headers:{"X-Test-Authenticated":"yes","X-Depot-Mode":"presenter","Sec-Fetch-Site":"same-origin"}});
  ok(r.status===200,"authenticated Presenter response succeeds");
  ok(r.headers.get("cache-control")==="private, no-store","successful notes are not cached");
  ok((r.headers.get("vary")??"").includes("X-Depot-Mode"),"cache varies with mode");
  const data=await r.json();
  ok(data.features.length===33,"actual HTTP response contains all33 feature guides");
  ok(data.legacy && data.rooms.length>0,"legacy protected materials preserved");
  ok(JSON.stringify(data.features)===JSON.stringify(featurePresenterGuidance),"response survives generated schema parsing without field loss");
  console.log(count+" feature presenter HTTP checks passed");
} finally {await new Promise(resolve=>server.close(resolve));}
` },
    bundle: true, platform: "node", format: "esm", outfile: resolve(dir, "check.mjs"),
    external: ["express"], logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [resolve(dir, "check.mjs")], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
