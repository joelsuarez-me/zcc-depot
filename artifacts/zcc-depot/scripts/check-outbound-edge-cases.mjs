import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "outbound-independent-"));
try {
  const outfile = join(dir, "verify.cjs");
  await build({
    stdin: {
      resolveDir: resolve("artifacts/zcc-depot"),
      loader: "ts",
      contents: `
import assert from "node:assert/strict";
import * as T from "./src/lib/outbound-time";
import * as S from "./src/lib/outbound-suppression";
import * as C from "./src/lib/outbound-compliance";
import * as W from "./src/lib/outbound-campaign";
import * as D from "./src/lib/outbound-dashboard";
import * as G from "./src/lib/outbound-segment";
import * as E from "./src/lib/outbound-dialer";
import * as J from "./src/lib/outbound-journey";
let checks=0;
const failures=[];
const ok=(v,m)=>{checks++;if(!v)failures.push(m)};
const eq=(a,b,m)=>{checks++;try{assert.deepEqual(a,b,m)}catch{failures.push(m+" (actual "+JSON.stringify(a)+", expected "+JSON.stringify(b)+")")}};
const winter=Date.parse("2026-01-15T18:00:00Z"),summer=Date.parse("2026-07-15T18:00:00Z");
for(const [id,win,sum] of [["et",-300,-240],["ct",-360,-300],["mt",-420,-360],["pt",-480,-420],["ak",-540,-480],["hi",-600,-600]]){
 const z=T.zoneById(id).iana;
 eq(T.tzOffsetMin(z,winter),win,id+" winter offset");
 eq(T.tzOffsetMin(z,summer),sum,id+" summer offset");
 for(const date of ["2026-03-07","2026-03-08","2026-03-09","2026-11-01","2026-11-02"]){
  const ms=T.localToUtc(date,9*60,z);
  eq(T.localDate(ms,z),date,id+" date roundtrip "+date);
  eq(T.localMinutes(ms,z),540,id+" time roundtrip "+date);
 }
}
eq(T.tzOffsetMin("America/New_York",Date.parse("2026-03-08T06:59:00Z")),-300,"Before spring transition");
eq(T.tzOffsetMin("America/New_York",Date.parse("2026-03-08T07:00:00Z")),-240,"After spring transition");
eq(T.tzOffsetMin("America/New_York",Date.parse("2026-11-01T05:59:00Z")),-240,"Before fall transition");
eq(T.tzOffsetMin("America/New_York",Date.parse("2026-11-01T06:00:00Z")),-300,"After fall transition");
const gap=T.localToUtc("2026-03-08",150,"America/New_York");
ok(!Number.isFinite(gap)||T.localMinutes(gap,"America/New_York")>=150,"Nonexistent DST wall time never shifts earlier");
const basePolicy={dateISO:"2026-11-13",execUtc:Date.parse("2026-11-13T18:00:00Z"),windowStart:540,windowEnd:1020,strategy:"all",campaignStart:0,campaignEnd:1440,campaignIana:"America/New_York",days:[0,1,2,3,4,5,6],holidays:[],blackouts:[],regionRestrict:{}};
const multi=T.TZ_CUSTOMERS.find(c=>c.id==="t2");
let tz=T.evaluateTz(multi,basePolicy);
eq(tz.status,"eligible","ET/PT contact inside overlap");
eq(tz.overlap,[Date.parse("2026-11-13T17:00:00Z"),Date.parse("2026-11-13T22:00:00Z")],"9–17 ET/PT overlap is12–17ET");
eq(T.evaluateTz(multi,{...basePolicy,execUtc:Date.parse("2026-11-13T16:59:00Z")}).status,"deferred","Before shared window");
eq(T.evaluateTz(multi,{...basePolicy,execUtc:Date.parse("2026-11-13T22:00:00Z")}).status,"deferred","End is exclusive");
eq(T.evaluateTz(T.TZ_CUSTOMERS.find(c=>c.id==="t8"),basePolicy).status,"excluded","Unresolved zones fail closed");
eq(T.evaluateTz(T.TZ_CUSTOMERS.find(c=>c.id==="t7"),basePolicy).status,"excluded","ET/Tokyo has no 9–17 overlap");
eq(T.evaluateTz(multi,{...basePolicy,holidays:["2026-11-13"]}).status,"deferred","Holiday exclusion");
eq(T.evaluateTz(multi,{...basePolicy,days:[1,2]}).status,"deferred","Weekday policy");
eq(T.evaluateTz(multi,{...basePolicy,blackouts:[{start:basePolicy.execUtc-1,end:basePolicy.execUtc+1,label:"test"}]}).status,"deferred","Blackout exclusion");
eq(T.evaluateTz(multi,{...basePolicy,regionRestrict:{"America/Los_Angeles":{start:1020,end:1080}}}).status,"excluded","Regional restriction removes overlap");
eq(T.evaluateTz(multi,{...basePolicy,windowStart:1020,windowEnd:540}).status,"excluded","Invalid local window fails closed");
const base=S.initialSup(),before=JSON.stringify(base);
const p=G.generateProfiles();
eq(p.length,10000,"Ten thousand fictional profiles");
eq(new Set(p.map(x=>x.id)).size,10000,"Unique profile identifiers");
eq(G.generateProfiles(10),p.slice(0,10),"Deterministic audience prefix");
const phone=p[0].phone;
const changed=S.supReduce(base,{type:"add",phone,source:"consent-revocation",reason:"Fictional revocation",channels:["voice"]});
eq(JSON.stringify(base),before,"Suppression reducer immutable");
for(const channel of S.CHANNELS)ok(S.suppressionFor(changed,phone,channel),"Revocation prevents "+channel);
const rev=changed.entries.find(x=>x.phone===phone);
eq(S.supReduce(changed,{type:"remove",id:rev.id}).entries.length,changed.entries.length,"Revocation not casually removable");
eq(S.supReduce(base,{type:"remove",id:"s1"}).audit.at(-1).action,"blocked-removal","Registry deletion guarded");
const temporary=S.supReduce(base,{type:"add",phone,source:"internal-dnc",reason:"test",channels:["voice"]});
eq(S.supReduce(temporary,{type:"remove",id:temporary.entries.at(-1).id}).entries.length,base.entries.length,"Permitted internal suppression removal");
const scoped=S.supReduce(base,{type:"add",phone,source:"campaign",reason:"test",channels:["voice"],campaign:"A"});
ok(S.suppressionFor(scoped,phone,"voice","A"),"Scoped campaign suppression applies");
ok(!S.suppressionFor(scoped,phone,"voice","B"),"Scoped suppression does not affect other campaign");
ok(!S.suppressionFor(scoped,phone,"sms","A"),"Channel-specific suppression remains scoped");
ok(!S.suppressionFor(scoped,phone,"voice"),"Unspecified campaign does not turn a scoped exclusion global");
eq(S.supReduce(base,{type:"reevaluate"}).evaluations,base.evaluations+1,"Reevaluation tracked");
const onlySupp=[{id:"suppression",on:true}];
const initialSegment=G.runSegment(p,onlySupp,base);
const revokedSegment=G.runSegment(p,onlySupp,changed);
ok(!revokedSegment.result.some(x=>x.phone===phone),"Revocation propagates to segmentation");
ok(revokedSegment.result.length<=initialSegment.result.length,"Suppression never increases eligible audience");
const funnel=G.runSegment(p,G.DEFAULT_FILTERS,changed).steps;
for(let i=1;i<funnel.length;i++)ok(funnel[i].count<=funnel[i-1].count,"Segment funnel monotonic");
ok(G.validateSort(G.SORT_KEYS.map(key=>({key,dir:"asc"})),"voice")===null,"Ten voice sort fields allowed");
ok(G.validateSort([...G.SORT_KEYS,"id"].map(key=>({key,dir:"asc"})),"voice"),"Eleven fields rejected");
ok(G.validateSort([{key:"id",dir:"asc"}],"sms"),"Digital segment order not falsely guaranteed");
const sample=p.slice(0,20),sorted=G.sortProfiles(sample,[{key:"value",dir:"desc"}]);
for(let i=1;i<sorted.length;i++)ok(sorted[i].value<=sorted[i-1].value,"Profile sorting");
eq(sample.map(x=>x.id),p.slice(0,20).map(x=>x.id),"Sort does not mutate original");
const ca=C.COMPLIANCE_CONTACTS[0];
eq(C.evaluateCompliance(ca,C.DEFAULT_CPOLICY,base).final,"Dial","Baseline policy-eligible contact");
eq(C.evaluateCompliance({...ca,consent:"none"},C.DEFAULT_CPOLICY,base).final,"Suppress","Missing consent blocked");
const revoked=S.supReduce(base,{type:"add",phone:ca.phone,source:"consent-revocation",reason:"test",channels:["voice"]});
eq(C.evaluateCompliance(ca,C.DEFAULT_CPOLICY,revoked).final,"Suppress","Revoked consent blocks dialing");
eq(C.evaluateCompliance({...ca,localHour:5},C.DEFAULT_CPOLICY,base).final,"Defer","Outside window defers");
eq(C.evaluateCompliance({...ca,attempts7d:99},C.DEFAULT_CPOLICY,base).final,"Defer","Frequency limit defers");
eq(C.evaluateCompliance({...ca,attempts7d:99},{...C.DEFAULT_CPOLICY,frequencyAction:"exclude"},base).final,"Suppress","Configured frequency exclusion");
for(const channel of S.CHANNELS)eq(C.evaluateCompliance({...ca,channel},C.DEFAULT_CPOLICY,revoked).final,"Suppress","Cross-channel revocation "+channel);
eq(W.validateAll(W.DEFAULT_DRAFT),{},"Default campaign valid");
ok(Object.keys(W.validateAll({...W.DEFAULT_DRAFT,name:"",start:"",queue:"",flow:"",callerId:""})).length>=5,"Required configuration validated");
ok(W.validateStep(0,{...W.DEFAULT_DRAFT,start:"2026-11-20",end:"2026-11-01"}).end,"Campaign end ordering");
ok(W.validateStep(2,{...W.DEFAULT_DRAFT,mode:"preview",classification:true}).classification,"Preview classification rejected");
ok(!W.modeSettings("preview","voice").includes("classification"),"Preview excludes unsupported classifier setting");
eq(W.modeSettings("predictive","sms"),[],"Digital mode has no voice pacing controls");
ok(!W.needsAgents({...W.DEFAULT_DRAFT,type:"automated",mode:"agentless"}),"Automated interaction needs no agent");
eq(W.lifeNext("Draft","validate",false),"Draft","Invalid launch remains draft");
let life="Draft";
for(const a of ["validate","ready","launch","pause","resume","complete"])life=W.lifeNext(life,a,true);
eq(life,"Completed","Complete demo lifecycle");
eq(W.lifeNext("Draft","launch",true),"Draft","Cannot skip validation");
const dataset=D.dataset(),immutable=JSON.stringify(dataset);
eq(D.dataset(),dataset,"Dashboard dataset deterministic");
for(const channel of ["voice","sms","email","whatsapp","web"])ok(dataset.some(x=>x.channel===channel),"Dataset covers "+channel);
const fields=["campaign","mode","channel","queue","agent","segment","region","outcome"];
const choices=D.options(dataset);
for(const field of fields)for(const value of choices[field]){
 const f={...D.DEFAULT_DFILTERS,[field]:value};
 const rows=D.filterRows(dataset,f);
 ok(rows.length>0&&rows.every(x=>x[field]===value),"Filter "+field+"="+value);
 const k=D.computeKpis(rows,f.to-f.from+1);
 eq(k.length,13,"All13KPIs remain synchronized");
 eq(k.find(x=>x.id==="total").value,rows.length,"KPI matches cohort");
 for(const metric of k)ok(metric.value===null||Number.isFinite(metric.value),"Finite metric "+metric.id);
 eq(D.outcomes(rows).reduce((n,x)=>n+x.count,0),rows.length,"Outcome chart same cohort");
 eq(D.geography(rows).reduce((n,x)=>n+x.contacts,0),rows.length,"Geography same cohort");
}
const empty=D.computeKpis([],14);
for(const k of empty)ok(k.value===null||k.value===0,"Empty dashboard safe "+k.id);
const digitalRows=dataset.filter(x=>x.channel!=="voice");
eq(D.computeKpis(digitalRows,14).find(x=>x.id==="connected").value,0,"Digital delivered not counted as agent-connected");
const automatedRows=dataset.filter(x=>x.mode==="agentless");
eq(D.computeKpis(automatedRows,14).find(x=>x.id==="connected").value,0,"Automated completion not counted as agent-connected");
eq(JSON.stringify(dataset),immutable,"Dashboard aggregations immutable");
const csv=D.toCsv(dataset.slice(0,3),D.DEFAULT_DFILTERS);
ok(csv.includes("fictional")&&csv.includes("outcome,attempts"),"CSV identifies simulation and exports detail");
for(const mode of ["predictive","progressive","agentless"]){
 const cfg={...E.DEFAULT_DIALER,...E.MODE_DEFAULTS[mode]};
 eq(E.simulateDialer(mode,cfg),E.simulateDialer(mode,cfg),"Deterministic "+mode);
 const result=E.simulateDialer(mode,cfg);
 ok(result.events.length>3,mode+" has simulation steps");
 for(let i=1;i<result.events.length;i++)ok(result.events[i].t>=result.events[i-1].t,mode+" event time monotonic");
 ok(result.final.dialed<=cfg.volume,mode+" no extra invented contacts");
 for(const e of result.events)for(const v of Object.values(e.c))ok(Number.isFinite(v)&&v>=0,mode+" valid counters");
 eq(E.simulateDialer(mode,cfg,cfg.volume).final.dialed,0,mode+" fully suppressed audience never dials");
 const none=E.simulateDialer(mode,{...cfg,availability:0,answerRate:100,voicemailRate:0});
 if(mode!=="agentless")eq(none.final.connected,0,mode+" no agent connections while unstaffed");
}
for(const outcome of E.AMD_OUTCOMES){
 for(const mode of E.DIAL_MODES){
  const r=E.evaluateCallProgress(outcome.id,{mode,classification:true,agentWhisper:true,customerWhisper:true,queueFlowSec:2,uncertainAs:"not-detected"});
  if(["busy","no-answer","failure"].includes(outcome.id))eq(r.phase,"dial-outcome","Pre-media failure never classifier");
  else if(mode==="preview")eq(r.phase,"unsupported","Preview never claims supported AMD");
  else eq(r.phase,"classifier","Answered supported mode uses classifier");
  ok(r.totalMs>=0,"Latency nonnegative");
 }
}
let ps=E.initialPreview(5);
ps=E.previewReduce(ps,{type:"review"});ok(ps.reviewed,"Agent review");
ps=E.previewReduce(ps,{type:"dial"});eq(ps.phase,"ringing","Explicit preview dial");
eq(E.previewReduce(ps,{type:"next",total:5}).idx,ps.idx,"Cannot discard active call via Next");
ps=E.previewReduce(ps,{type:"answer"});eq(ps.phase,"talk","Human conversation");
ps=E.previewReduce(ps,{type:"complete",disposition:"Confirmed"});eq(ps.tally.completed,1,"Disposition completion counted");
const removed=E.previewReduce(E.initialPreview(),{type:"remove"});eq(removed.tally.removed,1,"Preview removal tracked");
const next=E.previewReduce(removed,{type:"next",total:5,isSuppressed:i=>i===1});eq(next.idx,2,"Preview skips suppressed contacts");
let pb={index:0,running:false};
for(let i=0;i<50;i++)pb=E.advance(pb,"next",5);
eq(pb.index,4,"Playback upper bound");pb=E.advance(pb,"play",5);eq(pb.index,0,"Replay from end");
pb=E.advance(pb,"pause",5);ok(!pb.running,"Pause stops playback");
eq(E.advance(pb,"prev",5).index,0,"Playback lower bound");
eq(J.validateJourney(J.DEFAULT_JOURNEY),[],"Default journey validates");
const invalidTimePolicy={dateISO:"2026-11-17",execUtc:Date.UTC(2026,10,17,18),windowStart:540,windowEnd:1020,strategy:"all",campaignStart:480,campaignEnd:1320,campaignIana:"America/New_York",days:[1,2,3,4,5],holidays:[],blackouts:[],regionRestrict:{}};
eq(T.evaluateTz(T.TZ_CUSTOMERS[0],{...invalidTimePolicy,execUtc:NaN}).status,"excluded","Invalid execution time fails closed");
eq(T.evaluateTz(T.TZ_CUSTOMERS[0],{...invalidTimePolicy,blackouts:[{start:20,end:10,label:"Invalid"}]}).status,"excluded","Invalid blackout fails closed");
ok(J.validateJourney([{id:"one",type:"start"},{id:"two",type:"end"}]).length>0,"Journey without communication rejected");
eq(J.moveNode(J.DEFAULT_JOURNEY,0,2),J.DEFAULT_JOURNEY,"Journey start anchored");
eq(J.moveNode(J.DEFAULT_JOURNEY,3,0),J.DEFAULT_JOURNEY,"No node before start");
for(const smsDelivered of [false,true])for(const emailEligible of [false,true])for(const responded of [false,true])for(const consentVoice of [false,true])for(const inWindow of [false,true]){
 const s={...J.DEFAULT_JSCENARIO,smsDelivered,emailEligible,responded,consentVoice,inWindow};
 const steps=J.runJourney(J.DEFAULT_JOURNEY,s);
 const voice=steps.filter(x=>x.label==="Voice outreach"&&x.tone==="go");
 if(!consentVoice||!inWindow||responded)eq(voice.length,0,"No voice when consent/window disallows or customer resolved digitally");
 eq(J.runJourney(J.DEFAULT_JOURNEY,s),steps,"Journey deterministic");
}
const reordered=J.moveNode(J.DEFAULT_JOURNEY,6,1);
for(const s of [{consentVoice:false,inWindow:true},{consentVoice:true,inWindow:false}]){
 const steps=J.runJourney(reordered,{...J.DEFAULT_JSCENARIO,...s});
 ok(!steps.some(x=>x.label==="Voice outreach"&&x.tone==="go"),"Canvas reordering cannot bypass final voice gate");
}
const fallback=J.DEFAULT_JOURNEY.map(x=>x.type==="branch-delivery"?{...x,fallback:"send-voice"}:x);
const failedFallback=J.runJourney(fallback,{...J.DEFAULT_JSCENARIO,smsDelivered:false,consentVoice:false});
ok(!failedFallback.some(x=>x.label.includes("Voice outreach")&&x.tone==="go"),"Voice fallback cannot bypass consent");
ok(J.validateJourney(J.DEFAULT_JOURNEY.map(x=>x.type==="branch-delivery"?{...x,fallback:"unsupported"}:x)).length>0,"Unsupported journey fallback rejected");
if(failures.length){console.error(failures.join("\\n"));throw new Error(failures.length+" of "+checks+" independent outbound checks failed");}
console.log(checks+" independent outbound edge-case checks passed");
`,
    },
    bundle: true, platform: "node", format: "cjs", outfile, external: ["react"],
  });
  // Resolve React from the workspace rather than a temporary directory.
  const result = spawnSync(process.execPath, [outfile], { stdio: "inherit", env: { ...process.env, NODE_PATH: resolve("artifacts/zcc-depot/node_modules") } });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
