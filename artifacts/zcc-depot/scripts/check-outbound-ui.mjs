import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.outbound-ui-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import Page from "./src/pages/resource-outbound-dialers";
import {DEFAULT_DIALER,MODE_DEFAULTS,simulateDialer} from "./src/lib/outbound-dialer";
import {dataset,filterRows,DEFAULT_DFILTERS,computeKpis,fmtKpi,agentProductivity} from "./src/lib/outbound-dashboard";
import {supStore} from "./src/lib/outbound-suppression";
import {NAV} from "./src/data/navigation";
import {INDUSTRY_CASES} from "./src/data/outbound-industry-cases";
import {US_ZONES} from "./src/lib/outbound-time";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.__mode="customer";
let timerId=0;const timers=new Map();
globalThis.setTimeout=(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId};
globalThis.clearTimeout=id=>timers.delete(id);
globalThis.setInterval=(fn,ms)=>{timers.set(++timerId,{fn,ms,repeat:true});return timerId};
globalThis.clearInterval=id=>timers.delete(id);
globalThis.MutationObserver=class{observe(){}disconnect(){}};
const listeners={};
const media={matches:false,addEventListener(){},removeEventListener(){}};
globalThis.window={location:{hash:""},matchMedia:()=>media,addEventListener:(e,fn)=>listeners[e]=fn,removeEventListener:e=>delete listeners[e]};
globalThis.history={replaceState:(_a,_b,h)=>window.location.hash=h};
let downloaded="",objectUrls=0;
globalThis.URL.createObjectURL=()=>{objectUrls++;return"blob:fictional"};
globalThis.URL.revokeObjectURL=()=>{objectUrls--};
globalThis.document={title:"Original",documentElement:{dataset:{}},querySelector:()=>null,
addEventListener:(e,fn)=>listeners["doc:"+e]=fn,removeEventListener:e=>delete listeners["doc:"+e],
getElementById:()=>({scrollIntoView(){},requestFullscreen(){document.fullscreenElement={};listeners["doc:fullscreenchange"]?.();return Promise.resolve()}}),
exitFullscreen(){document.fullscreenElement=null;listeners["doc:fullscreenchange"]?.();return Promise.resolve()},
createElement:()=>({click(){downloaded=this.download},remove(){}})};
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const text=x=>typeof x==="string"?x:typeof x==="number"?String(x):(x?.children||[]).map(text).join("");
let tree;act(()=>tree=create(<Page/>));
const find=id=>tree.root.findByProps({"data-testid":id});
const exists=id=>tree.root.findAllByProps({"data-testid":id}).length>0;
const click=id=>act(()=>find(id).props.onClick());
const change=(id,value)=>act(()=>find(id).props.onChange({target:{value}}));
const check=(id,checked)=>act(()=>find(id).props.onChange({target:{checked}}));
const res=NAV.find(x=>x.label==="Demo Rooms").children;
ok(res.findIndex(x=>x.href==="/resources/outbound-dialers")===res.findIndex(x=>x.href==="/resources/callback")+1,"Dialers follows Callbacks under Demo Rooms");
ok(document.title.includes("Outbound Dialers"),"Unique title");
for(const id of ["dialing-modes","compare","campaign-builder","segmentation","suppression","compliance","time-zones","command-center","multichannel","answer-detection","reporting","zendesk","industries"])ok(tree.root.findAllByProps({id}).length>0,id+" section has direct fragment");
ok(!exists("presenter-notes-outbound-predictive"),"Customer mode no private notes");
for(const mode of ["predictive","progressive","agentless"]){
 click("tab-mode-"+mode);
 ok(window.location.hash==="#dialer-"+mode,mode+" direct link");
 ok(exists("diagram-"+mode),mode+" distinct diagram");
 const ids=tree.root.findAll(x=>typeof x.props["data-testid"]==="string").map(x=>x.props["data-testid"]);
 const next=ids.find(x=>x===("button-"+mode+"-next"));
 ok(next,mode+" playback controls");
 click("button-"+mode+"-next");
 ok(text(find("text-"+mode+"-step")).includes("2 /"),mode+" next advances");
 click("button-"+mode+"-prev");ok(text(find("text-"+mode+"-step")).includes("1 /"),mode+" previous restores");
 click("button-"+mode+"-speed-2");ok(find("button-"+mode+"-speed-2").props["aria-pressed"],mode+" speed");
 click("button-"+mode+"-play");ok(text(find("button-"+mode+"-play")).includes("Pause"),mode+" starts");
 click("button-"+mode+"-play");ok(!text(find("button-"+mode+"-play")).includes("Pause"),mode+" pauses");
 click("button-"+mode+"-end");ok(text(find("text-"+mode+"-summary")).length>10,mode+" final summary");
 click("button-"+mode+"-reset");ok(text(find("text-"+mode+"-step")).includes("1 /"),mode+" reset");
}
click("tab-mode-preview");
ok(exists("diagram-preview"),"Preview visualization");
// The visible preview actions must remain real state transitions.
const previewIds=tree.root.findAll(x=>typeof x.props["data-testid"]==="string"&&x.props["data-testid"].includes("preview")).map(x=>x.props["data-testid"]);
ok(previewIds.some(x=>x.includes("review")),"Preview review configuration and actions");
ok(previewIds.some(x=>x==="button-preview-play"),"Preview full transport");
click("button-preview-review");
ok(find("button-preview-review").props.disabled,"Preview customer reviewed");
click("button-preview-next");ok(text(find("text-preview-step")).includes("3 /"),"Preview next snapshot");
click("button-preview-prev");ok(text(find("text-preview-step")).includes("2 /"),"Preview previous snapshot");
click("button-preview-dial");ok(!find("button-preview-answer").props.disabled,"Preview ringing");
ok(find("button-preview-next").props.disabled,"No empty future preview step while ringing");
click("button-preview-answer");ok(!find("button-preview-complete").props.disabled,"Preview answered");
click("button-preview-complete");
const previewName=text(find("text-preview-name"));
click("button-preview-next-contact");ok(text(find("text-preview-name"))!==previewName,"Preview next customer");
click("button-preview-reset");
const firstTotal=text(find("text-dashboard-rows"));
ok(agentProductivity(dataset(),14).every(a=>Math.abs(a.talkMin+a.acwMin+a.availMin-14*480)<1e-6),"Agent time budget uses full selected date range");
ok(agentProductivity(filterRows(dataset(),{...DEFAULT_DFILTERS,from:13,to:13}),1).every(a=>Math.abs(a.talkMin+a.acwMin+a.availMin-480)<1e-6),"Single-day agent time budget stays coherent");
change("select-df-channel","sms");
const f={...DEFAULT_DFILTERS,channel:"sms"};
const expected=computeKpis(filterRows(dataset(),f),14);
for(const k of expected)ok(text(find("kpi-"+k.id)).includes(fmtKpi(k)),"Filtered KPI "+k.id+" synchronized");
click("button-df-csv");ok(downloaded==="outbound-simulated-dashboard.csv"&&objectUrls===0,"CSV download and URL cleanup");
click("button-df-reset");ok(text(find("text-dashboard-rows"))===firstTotal,"Dashboard filter reset");
click("button-df-notify");ok(find("button-df-notify").props["aria-pressed"],"Inline-only notification preview");
click("button-contact-A");ok(text(find("text-compliance-verdict")).includes("Dial"),"Eligible fictional contact");
click("button-revoke-consent");ok(text(find("text-compliance-verdict")).includes("Suppress"),"Revocation updates visible decision");
click("button-sup-reset");
const initialCount=text(find("text-segment-count"));
check("toggle-filter-active",false);ok(text(find("text-segment-count"))!==initialCount,"Audience changes when active filter removed");
click("button-filters-reset");
const auditBefore=tree.root.findAll(x=>String(x.props["data-testid"]||"").startsWith("audit-")).length;
click("button-sup-import");ok(tree.root.findAll(x=>String(x.props["data-testid"]||"").startsWith("audit-")).length>auditBefore,"Fictional suppression import audited");
click("button-sup-reevaluate");ok(text(find("text-sup-evaluated")).length>0,"Eligibility reevaluation visible");
click("button-sup-reset");
for(let i=0;i<6;i++)click("button-wizard-next");
for(const s of ["validate","ready","launch","pause","resume","complete"])click("button-life-"+s);
ok(text(find("status-life-completed")).includes("Completed"),"Wizard reaches completed state");
click("button-life-reset");
click("button-service-pinpoint");ok(text(find("text-pinpoint-nuance")).includes("October 30, 2026"),"Retirement caveat and continuing APIs");
for(const outcome of ["human","machine-beep","voicemail-no-beep","no-answer","busy","failure","uncertain"]){click("button-amd-"+outcome);ok(exists("diagram-amd"),outcome+" answer-detection scenario renders");}
for(const id of ["fin","hc","ins","travel","util","tel","retail"]){
 click("tab-industry-"+id);
 ok(INDUSTRY_CASES[id].length===3,id+" three distinct use cases");
 for(let i=0;i<3;i++){
  click("button-use-case-"+id+"-"+i);
  const c=INDUSTRY_CASES[id][i];
  ok(text(find("industry-journey"))===c.journey.join(""),c.name+" distinct journey");
  click("button-industry-open-"+id);
  ok(window.location.hash==="#dialer-"+c.mode,c.name+" recommended mode opens");
 }
}
for(const id of ["all","native","custom"]){click("button-report-"+id);ok(find("button-report-"+id).props["aria-checked"],id+" reporting view");}
for(const z of US_ZONES){ok(exists("map-zone-"+z.id),z.label+" interactive map region");ok(find("map-zone-"+z.id).props["data-map-region"]===z.id,z.label+" correct map geography");}
change("input-tz-date","");ok(find("input-tz-date").props.value==="2026-11-17","Empty date cannot crash time-zone lab");
ok(text(find("row-tz-t2")).includes("12:00")&&text(find("row-tz-t2")).includes("5:00"),"Eastern and Pacific overlap shown");
check("toggle-tz-regional-restriction",true);ok(text(find("status-tz-t1"))==="deferred","Regional policy affects actual eligibility");
change("slider-tz-regional-end","1020");ok(text(find("status-tz-t1"))==="eligible","Regional window update reevaluates customer");
check("toggle-tz-regional-restriction",false);
change("slider-tz-exec","750");check("toggle-tz-blackout",true);ok(text(find("status-tz-t1"))==="deferred","Custom blackout affects actual eligibility");
check("toggle-tz-blackout",false);ok(text(find("status-tz-t1"))==="eligible","Removing blackout reevaluates");
change("slider-tz-campaign-end","720");ok(text(find("status-tz-t1"))==="deferred","Campaign operating hours apply");
change("slider-tz-campaign-end","1320");
check("toggle-tz-day-2",false);ok(text(find("status-tz-t1"))==="deferred","Local weekday restriction applies");
check("toggle-tz-day-2",true);
click("button-zd-step-5");
click("button-workspace-mute");ok(text(find("text-workspace-call-status")).includes("muted"),"Workspace mute simulation");
click("button-workspace-hold");ok(text(find("text-workspace-call-status")).includes("On hold"),"Workspace hold simulation");
click("button-workspace-end");ok(text(find("text-workspace-call-status")).includes("after-contact"),"Workspace ends call");
change("select-workspace-disposition","Question resolved");click("button-workspace-record");ok(text(find("text-workspace-disposition")).includes("Question resolved"),"Workspace disposition recorded locally");
check("toggle-workspace-followup",true);click("button-workspace-associate");ok(text(find("outbound-workspace")).includes("Nothing was written to Zendesk"),"Workspace conceptual writeback boundary");
ok(text(find("text-documentation-review")).includes("Documentation Verified")&&text(find("text-documentation-review")).includes("2026-11-13"),"Actual reviewed documentation date visible");
ok(exists("chart-outcome-donut"),"Required outcome donut rendered");
act(()=>tree.unmount());
ok(document.title==="Original","Metadata restored on route departure");
ok(timers.size===0,"Simulation timers cleaned up");
act(()=>supStore.dispatch({type:"reset"}));
console.log(checks+" independent outbound UI checks passed");
` },
    outfile: resolve(dir, "checks.cjs"), bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/*", "react-test-renderer"], loader: { ".css": "empty" },
    define: { "import.meta.env.BASE_URL": '"/"' },
    alias: { "@": resolve(root, "src") },
    plugins: [{ name: "stubs", setup(b) {
      b.onResolve({ filter: /^(framer-motion|@\/components\/(kit|room-kit|presenter)|@\/lib\/depot-mode|@\/hooks\/use-presenter-content)$/ }, a => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, a => ({
        contents: a.path === "framer-motion"
          ? 'import React from "react";export const motion=new Proxy({},{get:(_,tag)=>({children,...p})=>React.createElement(tag,p,children)});export const AnimatePresence=({children})=>children;export const useReducedMotion=()=>true;'
          : a.path === "@/lib/depot-mode"
            ? 'export const useDepot=()=>({isPresenter:globalThis.__mode==="presenter",setMode:m=>globalThis.__mode=m,auth:{isAuthenticated:false}});'
            : a.path === "@/hooks/use-presenter-content"
              ? 'export const usePresenterContent=()=>({data:undefined,isLoading:false,isError:false});'
              : 'import React from "react";export const PageHero=({title,lede,children})=>React.createElement("header",null,title,lede,children);export const RoomSection=({id,title,children})=>React.createElement("section",{id},title,children);export const SourceNote=({children})=>React.createElement("p",null,children);export const PresenterGate=()=>React.createElement("aside",null,"Sign in required");',
        loader: "js",
      }));
    } }], logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { stdio: "inherit", cwd: root });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
