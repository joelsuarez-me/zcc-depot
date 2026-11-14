import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "outbound-access-"));
try {
  const outfile = join(dir, "check.cjs");
  await build({
    stdin: {
      resolveDir: resolve("artifacts/api-server"),
      loader: "ts",
      contents: `
import assert from "node:assert/strict";
import {outboundPresenterRooms} from "./src/lib/outbound-presenter";
import {presenterRooms} from "./src/lib/presenter-rooms";
import {presenterAccess} from "./src/middlewares/presenterAccess";
import {GetPresenterContentResponse} from "@workspace/api-zod";
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const ids=["predictive","progressive","preview","agentless","campaigns","compliance","multichannel","analytics"];
ok(outboundPresenterRooms.length===8,"Eight server-only topics");
ok(new Set(presenterRooms.map(r=>r.id)).size===presenterRooms.length,"No duplicate presenter IDs");
for(const id of ids){
 const room=outboundPresenterRooms.find(r=>r.id==="outbound-"+id);
 ok(room,id+" notes exist");
 ok(presenterRooms.includes(room),id+" in protected response");
 ok(room.speakerNotes.length>=3,id+" talk track, value and expected outcome");
 ok(room.technicalPoints.length>=5,id+" configuration, architecture and compliance");
 ok(room.discoveryQuestions.length&&room.objections.length&&room.progression.length>=4,id+" complete presentation guidance");
}
const parsed=GetPresenterContentResponse.shape.rooms.safeParse(presenterRooms);
ok(parsed.success,"All presenter rooms satisfy the existing API contract");
function invoke(auth,mode,site){
 const headers={};let code=200, next=false;
 const req={isAuthenticated:()=>auth,get:n=>n==="X-Depot-Mode"?mode:n==="Sec-Fetch-Site"?site:undefined};
 const res={setHeader:(k,v)=>headers[k]=v,status:c=>{code=c;return res},json:()=>res};
 presenterAccess(req,res,()=>{next=true});return{headers,code,next};
}
for(const mode of ["customer","presenter",undefined])ok(invoke(false,mode,"same-origin").code===401,"No unauthenticated presenter data");
ok(invoke(true,"customer","same-origin").code===403,"Customer mode denied");
ok(invoke(true,undefined,"same-origin").code===403,"No implicit mode");
ok(invoke(true,"presenter","cross-site").code===403,"Cross-site denied");
const allowed=invoke(true,"presenter","same-origin");
ok(allowed.next&&allowed.code===200,"Signed-in Presenter allowed");
ok(allowed.headers["Cache-Control"]==="private, no-store","No shared cache");
ok(allowed.headers.Vary.includes("X-Depot-Mode"),"Cache varies by mode");
ok(allowed.headers["X-Robots-Tag"].includes("noindex"),"No indexing");
ok(outboundPresenterRooms.find(r=>r.id==="outbound-preview").technicalPoints.join(" ").includes("unsupported for preview"),"Preview classification distinction");
ok(outboundPresenterRooms.find(r=>r.id==="outbound-compliance").technicalPoints.join(" ").includes("independently relevant"),"Independent legal regimes");
console.log(checks+" outbound presenter access checks passed");
`,
    },
    bundle: true, platform: "node", format: "cjs", outfile,
  });
  const result = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
