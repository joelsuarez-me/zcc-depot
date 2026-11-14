import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
const dir = await mkdtemp(join(tmpdir(), "supervisor-access-"));
try {
  const outfile = join(dir, "check.cjs");
  await build({
    stdin: { resolveDir: resolve("artifacts/api-server"), loader: "ts", contents: `
import assert from "node:assert/strict";
import {supervisorPresenterRooms} from "./src/lib/supervisor-presenter";
import {presenterRooms} from "./src/lib/presenter-rooms";
import {presenterAccess} from "./src/middlewares/presenterAccess";
import {GetPresenterContentResponse} from "@workspace/api-zod";
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++};
ok(supervisorPresenterRooms.length===4,"Four protected supervisor topics");
ok(new Set(presenterRooms.map(r=>r.id)).size===presenterRooms.length,"Unique presenter IDs");
for(const r of supervisorPresenterRooms){
ok(presenterRooms.includes(r),"Room registered");
ok(r.speakerNotes.length>=3&&r.technicalPoints.length>=3,"Narration, business value, workflow and technical/configuration guidance");
ok(r.discoveryQuestions.length&&r.objections.length&&r.progression.length,"Complete presentation guidance");
}
ok(GetPresenterContentResponse.shape.rooms.safeParse(presenterRooms).success,"Existing API schema preserved");
function access(auth,mode,site){
let code=200,allowed=false;const headers={};
const req={isAuthenticated:()=>auth,get:n=>n==="X-Depot-Mode"?mode:n==="Sec-Fetch-Site"?site:undefined};
const res={setHeader:(k,v)=>headers[k]=v,status:c=>{code=c;return res},json:()=>res};
presenterAccess(req,res,()=>allowed=true);return{code,allowed,headers};
}
for(const mode of [undefined,"customer","presenter"])ok(access(false,mode,"same-origin").code===401,"Anonymous denied");
for(const mode of [undefined,"customer"])ok(access(true,mode,"same-origin").code===403,"Customer mode denied");
ok(access(true,"presenter","cross-site").code===403,"Cross-site denied");
const a=access(true,"presenter","same-origin");ok(a.allowed&&a.headers["Cache-Control"]==="private, no-store","Signed-in Presenter only, no shared cache");
console.log(n+" supervisor presenter access checks passed");
` },
    outfile, bundle: true, platform: "node", format: "cjs",
  });
  const r = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
  process.exitCode = r.status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
