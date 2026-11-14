import { build } from "esbuild";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.supervisor-ui-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import Page from "./src/pages/resource-supervisor-command-center";
import {SCENARIOS,QUEUES,ACTIONS} from "./src/lib/supervisor-types";
import {metrics,reportRows,serviceLevel} from "./src/lib/supervisor-metrics";
import {configureSupervisor,intervene,stepSupervisor} from "./src/lib/supervisor-engine";
import {NAV} from "./src/data/navigation";
import {SUPERVISOR_SOURCES} from "./src/data/supervisor-reference";
import {supervisorPresenterRooms} from "../api-server/src/lib/supervisor-presenter";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.__mode="customer";globalThis.__signedIn=false;globalThis.__privateCalls=0;
globalThis.__presenterData={rooms:supervisorPresenterRooms};
let timerId=0;const timers=new Map(),listeners={};
globalThis.setInterval=(fn,ms)=>{timers.set(++timerId,{fn,ms,repeat:true});return timerId};
globalThis.clearInterval=id=>timers.delete(id);
globalThis.setTimeout=(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId};
globalThis.clearTimeout=id=>timers.delete(id);
globalThis.window={setInterval,clearInterval,location:{hash:"",pathname:"/resources/supervisor-command-center"},
 matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),
 addEventListener:(e,f)=>listeners[e]=f,removeEventListener:e=>delete listeners[e]};
let downloaded="";globalThis.URL.createObjectURL=()=>"blob:fictional";globalThis.URL.revokeObjectURL=()=>{};
globalThis.document={title:"Original",body:{style:{overflow:""}},documentElement:{dataset:{}},
 querySelector:()=>null,getElementById:()=>({scrollIntoView(){}}),
 addEventListener:(e,f)=>listeners["doc:"+e]=f,removeEventListener:e=>delete listeners["doc:"+e],
 exitFullscreen:()=>Promise.resolve(),createElement:()=>({click(){downloaded=this.download},remove(){}})};
const error=console.error;
let unexpectedErrors=0;console.error=(...xs)=>{if(!String(xs[0]).includes("react-test-renderer is deprecated")){unexpectedErrors++;error(...xs)}};
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const text=x=>typeof x==="string"?x:typeof x==="number"?String(x):(x?.children||[]).map(text).join("");
let tree;act(()=>tree=create(<Page/>,{createNodeMock:()=>({focus(){},querySelectorAll:()=>[]})}));
const sup=()=>globalThis.__sup;
const all=id=>tree.root.findAllByProps({"data-testid":id});
const find=id=>{const n=all(id)[0];assert.ok(n,"Missing UI control "+id);return n};
const exists=id=>all(id).length>0;
const click=id=>act(()=>{const n=find(id);assert.ok(!n.props.disabled,"Disabled "+id);n.props.onClick()});
const change=(id,value)=>act(()=>find(id).props.onChange({target:{value}}));
const checked=(id,value)=>act(()=>find(id).props.onChange({target:{checked:value}}));
const slide=(id,value)=>{change("slider-"+id,value);act(()=>find("slider-"+id).props.onPointerUp())};
const next=()=>click("button-sim-next");
const reset=()=>click("button-sim-reset");
ok(document.title.includes("Supervisor Command Center"),"Dedicated page metadata");
const res=NAV.find(x=>x.label==="Resources").children;
ok(res.at(-1).href==="/resources/supervisor-command-center","Last resource item");
ok(res.findIndex(x=>x.href==="/resources/outbound-dialers")===res.findIndex(x=>x.href==="/resources/callback")+1,"Existing resource sequence preserved");
for(const id of ["command-center","queues","agents","simulator","interventions","capabilities","contact-flow","service-level","occupancy","alerts","analytics","architecture","zendesk","playbooks","documentation"])
 ok(tree.root.findAll(n=>typeof n.type==="string"&&n.props.id===id).length===1,id+" unique direct section");
ok(globalThis.__privateCalls===0,"Customer view never fetches private presenter guidance");
ok(!sup().playing&&!sup().animate,"No auto-play; reduced-motion default respected");
ok(sup().snap.agents.length>=24,"At least24 fictional agents");
ok(tree.root.findAll(n=>typeof n.props["data-testid"]==="string"&&n.props["data-testid"].startsWith("kpi-")).length===13,"All13 KPI tiles");
ok(exists("text-queue-coverage-note"),"Shared agent coverage not misrepresented as additive");
for(const s of SCENARIOS){
 change("select-scenario",s.id);ok(sup().snap.scenario===s.id,s.name+" scenario state");
 const t=sup().snap.clock;next();ok(sup().snap.clock===t+10,s.name+" shared clock");
 click("button-sim-prev");ok(sup().snap.clock===t,s.name+" previous restores snapshot");
 next();ok(sup().snap.clock===t+10,s.name+" next replays same history");
 reset();ok(sup().snap.clock===1200&&sup().index===0,s.name+" reset deterministic baseline");
}
change("select-scenario","spike");
click("button-sim-start");ok(sup().playing&&[...timers.values()].filter(t=>t.repeat).length===1,"Start one playback clock");
act(()=>[...timers.values()].find(t=>t.repeat).fn());ok(sup().snap.clock===1210,"Timer advances same engine");
click("button-sim-pause");ok(!sup().playing&&![...timers.values()].some(t=>t.repeat),"Pause clears timer");
click("button-sim-replay");ok(sup().snap.clock===1200&&sup().playing,"Replay selected scenario");
click("button-sim-pause");
for(const v of [0.5,1,2]){
 click("button-speed-"+v);ok(sup().speed===v,"Playback speed "+v);
 click("button-sim-resume");ok([...timers.values()].find(t=>t.repeat).ms===1000/v,"Single clock interval for "+v+"x");click("button-sim-pause");
}
checked("toggle-animations",true);ok(sup().animate,"Animation on");
checked("toggle-animations",false);ok(find("wrapper-supervisor-animation").props.className==="sc-noanim","Animation off wrapper");
for(const r of ["15","30","60","today","custom"]){click("button-range-"+r);ok(find("button-range-"+r).props["aria-pressed"],r+" KPI range")}
change("input-range-from","1");change("input-range-to","19");
ok(text(find("text-kpi-handled"))===String(metrics(sup().snap,{from:60,to:1140}).handled),"Custom reporting cohort reconciles with KPI");
click("button-range-30");
for(const q of QUEUES){click("button-queue-"+q.toLowerCase().replace(/ /g,"-"));ok(text(find("panel-queue-detail")).includes(q),q+" details");click("button-close-queue-detail")}
change("input-agent-search","no-such-agent");ok(exists("empty-agents"),"Agent empty filter state");click("button-clear-agent-filters");
let idle=sup().snap.agents.find(a=>a.state==="Available");
click("button-agent-"+idle.id);change("select-agent-status","Break");click("button-apply-agent-status");
ok(sup().snap.agents.find(a=>a.id===idle.id).state==="Break","Drawer changes shared agent state");
ok(text(find("text-agent-status-note")).includes("Next activity"),"Native status capability explained");click("button-close-agent");
const busy=sup().snap.agents.find(a=>a.state==="On Contact");
click("button-agent-"+busy.id);ok(find("select-agent-status").props.disabled,"Active handling cannot be overwritten");click("button-close-agent");
for(const a of ACTIONS){click("tab-action-"+a.id);ok(text(find("panel-interventions")).includes(a.name),a.name+" intervention UI")}
click("tab-action-staffing");change("select-action-queue","Billing");const count=sup().snap.agents.length;click("button-run-action");
ok(sup().snap.agents.length===count+3&&exists("panel-impact"),"Staffing adds agents to shared state and impact");
click("tab-action-announcement");change("select-action-queue","Billing");click("button-run-action");ok(sup().snap.announcement&&sup().snap.announcementQueue==="Billing","Announcement queue scoped");
click("button-run-action");ok(!sup().snap.announcement,"Announcement can turn off");
slide("sl-threshold","45");ok(sup().snap.config.slThreshold===45,"Threshold slider shared config");
change("select-sl-queue","Billing");change("select-sl-interval","15");
const sl=serviceLevel(reportRows(sup().snap,{queue:"Billing",from:sup().snap.clock-900,to:sup().snap.clock}),45);
ok(text(find("text-sl-calc")).startsWith(sl.numerator+" / "+sl.denominator),"Visible native formula equals independent calculation");
ok(text(find("text-sl-answered")).includes("/"),"Separate custom answered metric");
ok(exists("text-sl-sampling")&&exists("text-sl-duration"),"Sampling and preset/custom duration disclosed");
slide("occ-concurrency","4");ok(sup().snap.config.concurrency===4,"Concurrency control shared engine");
slide("occ-acw","60");ok(sup().snap.config.acw===60,"ACW control shared engine");
ok(exists("chart-capacity-heatmap"),"Per-agent capacity history");
for(const [k,v] of [["queue","Billing"],["channel","Chat"],["agent",sup().snap.agents[0].id],["team",sup().snap.agents[0].team],["profile",sup().snap.agents[0].profile]]){
 change("select-report-"+k,v);ok(find("select-report-"+k).props.value===v,k+" historical filter controlled");change("select-report-"+k,"");
}
change("select-report-range","today");click("button-export-csv");ok(downloaded==="supervisor-simulated-report.csv","Filtered simulated CSV downloads");
for(const k of ["native","realtime","custom","bi"]){click("tab-arch-"+k);ok(find("tab-arch-"+k).props["aria-selected"],k+" architecture");}
click("tab-arch-realtime");click("node-arch-cw");ok(text(find("panel-architecture")).includes("CloudWatch"),"CloudWatch distinct clickable source");
change("select-scenario","normal");
for(let i=1;i<=9;i++){
 click("button-escalation-next");
 if(sup().snap.escalation.step!==i){
  ok(exists("text-escalation-blocked"),"Unavailable destination produces visible feedback, not false progress");
  const c=sup().snap.contacts.find(c=>c.id===sup().snap.escalation.contactId);
  click("tab-action-staffing");change("select-action-queue",c.queue);click("button-run-action");click("button-escalation-next");
 }
 ok(sup().snap.escalation.step===i,"Escalation stage"+i+" shared contact state");
}
ok(sup().snap.contacts.find(c=>c.id===sup().snap.escalation.contactId).status==="Completed","Escalation completes actual shared contact");
change("input-disposition","Issue resolved");click("button-record-disposition");click("button-follow-up");
ok(sup().snap.contacts.find(c=>c.id===sup().snap.escalation.contactId).disposition==="Issue resolved","Disposition persisted in local contact");
ok(!!sup().snap.contacts.find(c=>c.id===sup().snap.escalation.contactId).followUp,"Local conceptual follow-up recorded");
for(const p of ["sl","short","vip","surge","int","abn","aht","imb"]){click("tab-playbook-"+p);ok(exists("panel-playbook-indicators"),p+" playbook indicators");}
click("tab-playbook-int");if(exists("button-load-playbook-scenario"))click("button-load-playbook-scenario");
click("button-playbook-choice-int-0");ok(!sup().snap.integrationHealthy,"Playbook injects shared integration failure");
click("button-playbook-choice-int-1");ok(sup().snap.integrationHealthy,"Playbook recovery shared");
click("tab-playbook-aht");click("button-load-playbook-scenario");click("button-playbook-choice-aht-0");
ok(sup().snap.config.acw===10,"Extended ACW recommendation reduces rather than worsens future wrap-up");
click("button-open-wallboard");ok(exists("panel-wallboard")&&sup().playing,"Fullscreen wallboard runs same simulation");
ok(exists("chart-wallboard-waiting")&&exists("chart-wallboard-volume"),"Waiting AND call-volume trends");
change("select-wallboard-queue","Billing");ok(text(find("panel-wallboard")).includes("Billing"),"Wallboard filter");
click("button-wallboard-theme");ok(!find("panel-wallboard").props.className.includes("is-dark"),"Wallboard light theme");
act(()=>listeners["keydown"]({key:"Escape"}));ok(!exists("panel-wallboard")&&document.body.style.overflow==="","Escape exits and restores page scrolling");
click("button-sim-pause");reset();
ok(text(find("text-documentation-review")).includes("2026-11-13"),"Actual documentation review date");
for(const s of SUPERVISOR_SOURCES)ok(s.url.startsWith("https://docs.aws.amazon.com/")||s.url.startsWith("https://developer.zendesk.com/"),s.id+" official source");
globalThis.__mode="presenter";act(()=>tree.update(<Page/>));
ok(globalThis.__privateCalls===0,"Unsigned Presenter mode still cannot request notes through the gate");
globalThis.__signedIn=true;act(()=>tree.update(<Page/>));
for(const r of supervisorPresenterRooms)ok(text(find("presenter-notes-"+r.id)).includes(r.speakerNotes[0]),r.id+" renders actual protected guidance");
const privateCalls=globalThis.__privateCalls;globalThis.__mode="customer";act(()=>tree.update(<Page/>));
ok(globalThis.__privateCalls===privateCalls&&!exists("presenter-notes-supervisor-operations"),"Switching back to Customer removes notes and stops private hooks");
ok(unexpectedErrors===0,"No unexpected React render errors");
act(()=>tree.unmount());ok(document.title==="Original","Route metadata restored");ok(![...timers.values()].some(t=>t.repeat),"Playback timer cleaned on unmount");
console.error=error;console.log(checks+" independent supervisor UI checks passed");
` },
    outfile: resolve(dir, "checks.cjs"), bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/*", "react-test-renderer"], loader: { ".css": "empty" },
    define: { "import.meta.env.BASE_URL": '"/"' }, alias: { "@": resolve(root, "src") },
    plugins: [{ name: "ui-boundary-stubs", setup(b) {
      b.onResolve({ filter: /^(react-dom|recharts|wouter|framer-motion|@\/components\/(kit|room-kit|presenter)|@\/lib\/depot-mode|@\/hooks\/use-presenter-content)$/ }, a => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, a => {
        let contents;
        if (a.path === "react-dom") contents = 'export const createPortal=c=>c;';
        else if (a.path === "recharts") contents = 'import React from "react";' + ["ResponsiveContainer", "BarChart", "Bar", "LineChart", "Line", "PieChart", "Pie", "Cell", "XAxis", "YAxis", "CartesianGrid", "Tooltip", "Legend", "AreaChart", "Area"].map(n => `export const ${n}=({children,...p})=>React.createElement("div",{"data-chart":"${n}","data-rows":p.data},children);`).join("");
        else if (a.path === "wouter") contents = 'import React from "react";export const Link=({href,children,...p})=>React.createElement("a",{href,...p},children);';
        else if (a.path === "framer-motion") contents = 'import React from "react";export const motion=new Proxy({},{get:(_,tag)=>({children,...p})=>React.createElement(tag,p,children)});export const MotionConfig=({children})=>children;export const AnimatePresence=({children})=>children;export const useReducedMotion=()=>true;export const animate=(_a,b,o)=>{o.onUpdate?.(b);return{stop(){}}};';
        else if (a.path === "@/lib/depot-mode") contents = 'export const useDepot=()=>({isPresenter:globalThis.__mode==="presenter",auth:{isAuthenticated:globalThis.__signedIn}});';
        else if (a.path === "@/hooks/use-presenter-content") contents = 'export const usePresenterContent=()=>{globalThis.__privateCalls++;return{data:globalThis.__presenterData,isLoading:false,isError:false}};';
        else contents = `import React from "react";import {useSupervisor} from "${resolve(root, "src/components/supervisor/supervisor-session")}";export const PageHero=({title,lede,children})=>{globalThis.__sup=useSupervisor();return React.createElement("header",null,title,lede,children)};export const RoomSection=({id,title,children})=>React.createElement("section",{id},title,children);export const SourceNote=({children})=>React.createElement("p",null,children);export const PresenterGate=({children})=>globalThis.__signedIn?children:React.createElement("aside",null,"Sign in required");`;
        return { contents, loader: "jsx", resolveDir: root };
      });
    } }], logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { stdio: "inherit", cwd: root });
  process.exitCode = result.status ?? 1;
  const app = await readFile(resolve(root, "src/App.tsx"), "utf8");
  if (!app.includes("/resources/supervisor-command-center")) throw new Error("Route missing from App");
} finally {
  await rm(dir, { recursive: true, force: true });
}
