import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const dir=await mkdtemp(join(tmpdir(),"outbound-check-"));
try {
  await build({stdin:{resolveDir:resolve("artifacts/zcc-depot"),loader:"ts",contents:`
import assert from "node:assert/strict";
import * as D from "./src/lib/outbound-dialer";
import * as T from "./src/lib/outbound-time";
import * as S from "./src/lib/outbound-suppression";
import * as G from "./src/lib/outbound-segment";
import * as C from "./src/lib/outbound-compliance";
import * as B from "./src/lib/outbound-dashboard";
import * as W from "./src/lib/outbound-campaign";
import * as J from "./src/lib/outbound-journey";
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++};
for(const m of ["predictive","progressive","agentless"]){const r=D.simulateDialer(m,{...D.DEFAULT_DIALER,...D.MODE_DEFAULTS[m]});ok(r.events.length>3,m+" events");ok(r.events.every((e,i)=>!i||e.t>=r.events[i-1].t),m+" monotonic");}
ok(D.simulateDialer("predictive",D.DEFAULT_DIALER,D.DEFAULT_DIALER.volume).summary.includes("No eligible"),"all suppressed");
ok(D.simulateDialer("agentless",D.DEFAULT_DIALER).events.every(e=>e.agents.length===0),"agentless no agents");
let p=D.initialPreview(10);p=D.previewReduce(p,{type:"tick"});for(let i=0;i<10;i++)p=D.previewReduce(p,{type:"tick"});ok(p.phase==="ringing","preview timeout dials");
p=D.previewReduce(D.initialPreview(10),{type:"next",total:4,isSuppressed:i=>i===1});ok(p.idx===2&&p.tally.skipped===1,"next skips suppressed");
ok(D.evaluateCallProgress("busy",{mode:"predictive",classification:true,agentWhisper:false,customerWhisper:false,queueFlowSec:0,uncertainAs:"error"}).phase==="dial-outcome","busy pre-classifier");
ok(D.evaluateCallProgress("human",{mode:"preview",classification:true,agentWhisper:false,customerWhisper:false,queueFlowSec:0,uncertainAs:"error"}).phase==="unsupported","preview unsupported");
const g=T.localToUtcChecked("2026-03-08",150,"America/New_York");ok(g.shifted,"DST gap shift");
const sup=S.initialSup();ok(S.suppressionFor(sup,"+1 (312) 555-0164","email"),"revocation all channels");
const s2=S.supReduce(sup,{type:"add",phone:"+1 (999) 555-0100",source:"campaign",reason:"x",channels:["voice"],campaign:"A"});ok(!S.suppressionFor(s2,"+1 (999) 555-0100","voice"),"campaign scope not global");ok(S.suppressionFor(s2,"+1 (999) 555-0100","voice","A"),"campaign scope matches");
const pr=G.generateProfiles();ok(pr.length===10000,"10k profiles");ok(G.validateSort(new Array(11).fill({key:"id",dir:"asc"}),"voice"),"sort max");
const d=C.COMPLIANCE_CONTACTS.find(c=>c.letter==="D");ok(C.evaluateCompliance(d,C.DEFAULT_CPOLICY,sup).final==="Suppress","D revoked");
const rows=B.dataset();ok(B.computeKpis(rows,14).length===13,"13 kpis");
ok(Object.keys(W.validateAll({...W.DEFAULT_DRAFT,name:""})).length>0,"campaign validation");
const bad=[{id:"a",type:"start"},{id:"v",type:"send-voice"},{id:"c",type:"custom-consent"},{id:"e",type:"end"}];
ok(J.runJourney(bad,{...J.DEFAULT_JSCENARIO,consentVoice:false}).find(x=>x.nodeId==="v").tone!=="go","voice guarded regardless of order");
ok(J.validateJourney([{id:"a",type:"start"},{id:"s",type:"send-sms"},{id:"b",type:"branch-delivery",fallback:"send-voice"},{id:"e",type:"end"}]).length>0,"unsupported fallback");
console.log(n+" outbound engine checks passed");
`},bundle:true,platform:"node",outfile:join(dir,"c.cjs"),alias:{"@":resolve("artifacts/zcc-depot/src")}});
  const r=spawnSync(process.execPath,[join(dir,"c.cjs")],{stdio:"inherit"});if(r.status)process.exitCode=r.status;
} finally { await rm(dir,{recursive:true,force:true}); }
