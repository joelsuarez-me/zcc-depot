import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const dir=await mkdtemp(join(tmpdir(),"callback-check-"));
try {
  await build({stdin:{resolveDir:resolve("artifacts/zcc-depot"),loader:"ts",contents:`
import assert from "node:assert/strict";
import * as E from "./src/lib/callback-engine";
import {SCENARIOS} from "./src/data/callback-scenarios";
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const cfg=(id,o={})=>({...E.DEFAULT_CONFIG,...SCENARIOS.find(s=>s.id===id).defaults,...o});
const run=(id,o={})=>E.simulateCallback(id,cfg(id,o));
ok(SCENARIOS.map(s=>s.id).join()===E.SCENARIO_IDS.join(),"scenario order");
for(const s of SCENARIOS){const r=run(s.id,{failure:"none"});ok(["Completed","Served live"].includes(r.outcome.final),s.id+" success path completes: "+r.outcome.final);ok(r.events.some(e=>e.life==="Connected"),s.id+" connects");}
const q=run("queued");ok(q.events.some(e=>/C1 inbound · ended/.test(e.contact||""))&&q.events.some(e=>/C2/.test(e.contact||"")),"separate C1 and C2");
ok(run("queued",{wait:120}).outcome.final==="Served live","below threshold no offer");
const busy=run("agent-first",{failure:"busy"});ok(busy.outcome.final==="Failed"&&busy.attempts.length===1,"busy not native retry");
ok(run("agent-first",{failure:"busy",customRecovery:true}).events.some(e=>e.custom),"custom recovery labeled");
const cf=run("customer-first",{failure:"no-answer",customRecovery:true,failAttempts:1});
ok(cf.events.some(e=>/C4/.test(e.label))&&cf.events.some(e=>/^C4 /.test(e.contact||"")),"C3 then C4 chain");
ok(!run("customer-first",{failure:"busy"}).events.some(e=>/Check call progress/.test(e.label)),"pre-media busy not CCP");
ok(!run("web",{failure:"voicemail"}).events.some(e=>/Check call progress/.test(e.label)),"no CCP on outbound API");
const ws=run("web",{webTiming:"scheduled",date:"2026-11-24",slot:930});ok(ws.events.some(e=>e.life==="Scheduled"&&/3:30 PM/.test(e.label)),"web uses chosen slot");
const hol=run("after-hours",{date:"2026-11-26",slot:600});ok(hol.events.some(e=>e.life==="Rescheduled"&&/Holiday|Thanksgiving/.test(e.label)),"holiday slot rejected");
ok(run("external",{ext:"available"}).events.findIndex(e=>e.life==="Dialing")>0,"available dials");
const un=run("external",{ext:"unavailable"});ok(un.events.findIndex(e=>/Poll/.test(e.label))<un.events.findIndex(e=>e.life==="Dialing"),"pending gates dialing");
ok(run("availability",{freeAgent:"jonah"}).events.some(e=>/Fallback/.test(e.label)),"ineligible agent triggers fallback");
ok(run("availability",{freeAgent:"mara"}).outcome.agent==="Mara Okafor","eligible freed agent used");
ok(run("vip",{preferredAgent:"sunita"}).outcome.agent==="Sunita Rao","preferred agent");
ok(run("vip",{preferredAgent:"theo"}).outcome.agent!=="Theo Lindqvist","preferred agent outside team not used");
ok(run("vip",{tier:"Standard",severity:"Low"}).outcome.queue==="Billing","standard tier queue");
ok(run("recovery",{mode:"customer-first",failure:"no-answer",maxRetries:4}).attempts.length===1,"CF ignores native retries");
console.log(checks+" callback engine checks passed");
`},bundle:true,platform:"node",outfile:join(dir,"c.cjs"),alias:{"@":resolve("artifacts/zcc-depot/src")}});
  const r=spawnSync(process.execPath,[join(dir,"c.cjs")],{stdio:"inherit"});if(r.status)process.exitCode=r.status;
} finally { await rm(dir,{recursive:true,force:true}); }
