import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "callback-edge-"));
try {
  const outfile = join(dir, "check.cjs");
  await build({
    stdin: {
      resolveDir: resolve("artifacts/zcc-depot"), loader: "ts",
      contents: `
import assert from "node:assert/strict";
import * as E from "./src/lib/callback-engine";
import {SCENARIOS, ARCH_VIEWS, DOCS} from "./src/data/callback-scenarios";
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const cfg=(id,over={})=>({...E.DEFAULT_CONFIG,...SCENARIOS.find(s=>s.id===id).defaults,...over});
const run=(id,over={})=>E.simulateCallback(id,cfg(id,over));
ok(SCENARIOS.length===12,"Twelve experiences");
ok(new Set(SCENARIOS.map(s=>s.id)).size===12,"Unique experience IDs");
ok(new Set(SCENARIOS.map(s=>JSON.stringify(s.edges))).size===12,"Twelve distinct routing topologies");
for(const s of SCENARIOS){
 const ids=new Set(s.nodes.map(n=>n.id));
 ok(ids.size===s.nodes.length,s.id+" unique node IDs");
 ok(s.edges.every(([a,b])=>ids.has(a)&&ids.has(b)),s.id+" edges reference existing nodes");
 ok(s.nodes.every(n=>n.role&&n.label),s.id+" accessible node explanations");
 for(const failure of s.failures){
  const c=cfg(s.id,{failure});
  const before=JSON.stringify(c), r=E.simulateCallback(s.id,c);
  ok(JSON.stringify(c)===before,s.id+"/"+failure+" input not mutated");
  ok(JSON.stringify(r)===JSON.stringify(E.simulateCallback(s.id,c)),s.id+"/"+failure+" deterministic");
  ok(r.events.length>0&&r.events.length<200,s.id+"/"+failure+" bounded lifecycle");
  ok(r.events.every((e,i)=>Number.isFinite(e.t)&&(!i||e.t>=r.events[i-1].t)),s.id+"/"+failure+" monotonic timestamps");
  ok(r.events.every(e=>ids.has(e.node)),s.id+"/"+failure+" synchronized architecture nodes");
  ok(r.attempts.every((a,i)=>a.n===i+1),s.id+"/"+failure+" coherent attempt numbering");
  ok(r.outcome.attempts===r.attempts.length,s.id+"/"+failure+" outcome matches attempt history");
 }
 const invalid=run(s.id,{phone:"not-a-phone",failure:"none"});
 ok(!invalid.events.some(e=>e.life==="Dialing"),s.id+" invalid phone never dialed");
 ok(invalid.outcome.attempts===0,s.id+" invalid phone consumes no dial attempt");
 const unstaffed=run(s.id,{agents:"none",failure:"none"});
 ok(!unstaffed.events.some(e=>e.life==="Connected"),s.id+" no staffed agent cannot connect");
 ok(unstaffed.outcome.agent==="None",s.id+" no phantom assigned agent");
}
const ag=run("agent-first",{failure:"none"});
ok(ag.events.findIndex(e=>/accepts/.test(e.label))<ag.events.findIndex(e=>e.life==="Dialing"),"Agent-first acceptance precedes dial");
const cf=run("customer-first",{failure:"none"});
ok(cf.events.findIndex(e=>e.life==="Dialing")<cf.events.findIndex(e=>e.life==="Connected"&&e.layer==="Agent"),"Customer-first dial precedes agent connection");
const blocked=run("customer-first",{eligibleInstance:false});
ok(blocked.outcome.final==="Blocked"&&!blocked.events.some(e=>e.life==="Dialing"),"Customer-first instance prerequisite enforced");
const rej=run("agent-first",{failure:"reject"});
ok(rej.attempts.length===1,"Rejected agent offer does not consume dial attempt");
const vm=run("agent-first",{failure:"voicemail"});
ok(vm.outcome.final==="Connected to voicemail"&&vm.attempts.length===1,"Agent-first voicemail connected with no automatic retry");
for(const n of [0,1,2,3]){
 const r=run("agent-first",{failure:"max-retries",maxRetries:n});
 ok(r.attempts.length===n+1&&r.outcome.final==="Failed","Initial + "+n+" native retries");
}
const noCustom=run("customer-first",{failure:"voicemail",customRecovery:false,maxRetries:5});
ok(noCustom.attempts.length===1,"Customer-first ignores agent-first retry settings");
const retry=run("customer-first",{failure:"voicemail",customRecovery:true,maxRetries:1});
ok(retry.attempts.length===2,"Customer-first explicit flow retry");
ok(retry.events.some(e=>e.custom&&e.life==="Retrying"),"Customer-first recreation labeled custom");
ok(run("web",{consent:false}).outcome.attempts===0,"Web consent required");
ok(run("ai",{aiConfirm:false}).outcome.final==="Canceled","AI requires customer confirmation");
for(const id of ["courtesy","after-hours"]){
 const r=run(id,{schedAction:"cancel"});
 ok(r.outcome.final==="Canceled"&&r.outcome.attempts===0,id+" cancellation never dials");
 const moved=run(id,{schedAction:"reschedule"});
 ok(moved.events.some(e=>e.life==="Rescheduled"),id+" reschedule visible");
}
ok(E.dayStatus("2026-11-26").status==="holiday","Holiday excluded");
ok(E.dayStatus("2026-11-28").status==="weekend","Weekend excluded");
const now={iso:"2026-11-24",min:600};
ok(E.slotStatus("2026-11-24",480,now).status==="past","Past slots rejected");
ok(E.slotStatus("2026-11-24",1080,now).status==="closed","After-hours slot rejected");
ok(E.slotStatus("2026-11-24",960,now).status==="blackout","Blackout rejected");
ok(E.localSlot("2026-11-24",900,"PT").min===720,"Eastern to Pacific conversion");
ok(E.localSlot("2026-11-24",900,"CET").min===1260,"Eastern to Berlin conversion");
ok(E.localSlot("2026-11-24",1200,"CET").iso==="2026-11-25","Timezone day rollover");
const next=E.nextOpen({iso:"2026-11-25",min:1180});
ok(next.iso==="2026-11-30","Next slot skips holidays and weekend");
const ext=run("external",{ext:"available",failure:"none"});
ok(run("courtesy").events.some(e=>e.label.startsWith("Simulated reminder:")&&e.custom),"Scheduled reminder preview explicitly simulated");
ok(ext.outcome.final==="Completed","Healthy dependency executes");
ok(run("external",{ext:"maintenance",extTimeout:1}).outcome.final==="Expired","Dependency timeout stops execution");
ok(run("external",{ext:"unavailable",extLimit:1,poll:30}).outcome.attempts===0,"Bounded dependency checks do not dial early");
ok(run("external",{ext:"unavailable",trigger:"event",extTimeout:30}).outcome.final==="Completed","Availability event resumes workflow");
for(const st of ["available","degraded","unavailable","maintenance","recovering"]){
 const r=run("external",{ext:st});
 ok(r.events.some(e=>e.json),st+" structured API evidence");
}
for(const field of ["type","status","queue","date","tier"]){
 const value=field==="type"?"external":field==="status"?"Scheduled":field==="queue"?"Billing":field==="date"?"2026-11-24":"VIP";
 const rows=E.filterCc({...E.CC_ALL,[field]:value});
 ok(rows.every(r=>r[field]===value),field+" dashboard filter");
 const m=E.ccMetrics(rows);
 ok(m.pending+m.scheduled+m.queued+m.progress+m.completed+m.failed===m.total,field+" coherent dashboard totals");
 ok(m.funnel.every((x,i)=>!i||x[1]<=m.funnel[i-1][1]),field+" coherent funnel");
}
ok(E.ccMetrics([]).success===0&&E.ccMetrics([]).avgDelay===0,"Empty dashboard safe");
const advanced=E.advanceCc(E.CC_DATA);
ok(advanced.length===E.CC_DATA.length&&advanced.filter((r,i)=>r.status!==E.CC_DATA[i].status).length===1,"Live dashboard advances exactly one coherent record");
ok(E.CC_DATA.every((r,i)=>r!==advanced[i]||r.status===advanced[i].status),"Live dashboard leaves source records immutable");
ok(ARCH_VIEWS.length===5&&new Set(ARCH_VIEWS.map(x=>x.id)).size===5,"Five architecture views");
for(const view of ARCH_VIEWS){
 const ids=new Set(view.nodes.map(n=>n.id));
 ok(view.edges.every(([a,b])=>ids.has(a)&&ids.has(b)),view.id+" valid architecture edges");
}
ok(Object.values(DOCS).every(d=>d.url.startsWith("https://docs.aws.amazon.com/")),"Official AWS references only");
const v=E.valueCalc({calls:1000,overThreshold:50,takeUp:50,holdMin:6,abandon:10});
ok(v.offered===500&&v.accepted===250&&v.holdHours===25,"Illustrative value math");
for(const n of [1,5,20]){
 let p={index:0,running:false};
 p=E.advancePlayback(p,"start",n);ok(p.running,"Start");
 p=E.advancePlayback(p,"pause",n);ok(!p.running,"Pause");
 p=E.advancePlayback(p,"resume",n);ok(n===1||p.running,"Resume");
 for(let i=0;i<n+3;i++)p=E.advancePlayback(p,"tick",n);
 ok(p.index===n-1&&!p.running,"Playback stops at end");
 p=E.advancePlayback(p,"next",n);ok(p.index===n-1,"Next bounded");
 for(let i=0;i<n+3;i++)p=E.advancePlayback(p,"previous",n);
 ok(p.index===0&&!p.running,"Previous bounded");
 ok(E.advancePlayback(p,"replay",n).running,"Replay");
 ok(E.advancePlayback(p,"reset",n).index===0,"Reset");
}
console.log(checks+" independent callback edge-case checks passed");
`,
    },
    bundle: true, platform: "node", format: "cjs", outfile,
    alias: { "@": resolve("artifacts/zcc-depot/src") },
  });
  const result = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
