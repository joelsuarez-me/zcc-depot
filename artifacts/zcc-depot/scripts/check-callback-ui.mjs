import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.callback-ui-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import Page from "./src/pages/resource-callback";
import {SCENARIOS,CONTROLS,ARCH_VIEWS} from "./src/data/callback-scenarios";
import {DEFAULT_CONFIG,simulateCallback} from "./src/lib/callback-engine";
import {NAV} from "./src/data/navigation";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.__mode="customer";
let timerId=0;const timers=new Map();
globalThis.setTimeout=(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId};
globalThis.clearTimeout=id=>timers.delete(id);
const listeners={};
globalThis.window={location:{hash:""},addEventListener:(e,fn)=>listeners[e]=fn,removeEventListener:e=>delete listeners[e]};
globalThis.history={replaceState:(_a,_b,h)=>window.location.hash=h};
globalThis.document={title:"Original",querySelector:()=>null,getElementById:()=>({scrollIntoView(){}})};
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const text=x=>typeof x==="string"?x:(x?.children||[]).map(text).join("");
let tree;act(()=>tree=create(<Page/>));
const find=id=>tree.root.findByProps({"data-testid":id});
const exists=id=>tree.root.findAllByProps({"data-testid":id}).length>0;
const click=id=>act(()=>find(id).props.onClick());
const change=(id,value)=>act(()=>find(id).props.onChange({target:{value}}));
const res=NAV.find(x=>x.label==="Resources").children;
ok(res.at(-1).href==="/resources/callback"&&res.at(-2).href==="/resources/routing","Callback immediately follows Routing");
ok(!exists("presenter-notes"),"Customer mode excludes private notes");
click("button-presenter");ok(globalThis.__mode==="presenter","Presenter control uses global mode");
globalThis.__mode="customer";act(()=>tree.update(<Page/>));
click("button-start");ok(exists("button-pause"),"Start");
click("button-pause");ok(exists("button-start"),"Pause at first step");
click("button-start");click("button-next");ok(text(find("text-step")).includes("2 /"),"Next synchronized");
click("button-previous");ok(text(find("text-step")).includes("1 /"),"Previous synchronized");
click("button-speed-2");ok(find("button-speed-2").props["aria-pressed"],"Speed selection");
click("button-still");ok(find("button-still").props["aria-pressed"],"Motion pause");
for(const s of SCENARIOS){
 click("card-scenario-"+s.id);
 ok(window.location.hash==="#experience-"+s.id,s.id+" direct link");
 const config={...DEFAULT_CONFIG,...s.defaults};
 const r=simulateCallback(s.id,config);
 ok(text(find("panel-outcome")).includes("appears"),s.id+" no future outcome");
 ok(text(find("text-agent-name"))==="Unassigned",s.id+" no future assignment");
 ok(text(find("text-what-happened")).includes(r.events[0].label),s.id+" explanation synchronized");
 for(const key of s.controls){
  if(key==="date"||key==="slot")continue;
  const spec=CONTROLS[key];if(!spec)continue;
  ok(exists((spec.type==="range"?"range-":spec.type==="toggle"?"toggle-":spec.type==="select"?"select-":"input-")+key),s.id+" control "+key);
 }
 const d=find("callback-diagram");
 const svg=d.findAll(x=>x.type==="svg"&&x.props.viewBox&&x.props.role==="group")[0];
 const [, , width,height]=svg.props.viewBox.split(" ").map(Number);
 const boxes=d.findAll(x=>x.type==="rect"&&x.props.className==="rt-node-card");
 ok(boxes.length===s.nodes.length,s.id+" Architecture-style nodes");
 ok(boxes.every(b=>b.props.x>=0&&b.props.y>=0&&b.props.x+b.props.width<=width&&b.props.y+b.props.height<=height),s.id+" no clipped nodes");
 ok(boxes.every((a,i)=>boxes.every((b,j)=>i===j||a.props.x+a.props.width<=b.props.x||b.props.x+b.props.width<=a.props.x||a.props.y+a.props.height<=b.props.y||b.props.y+b.props.height<=a.props.y)),s.id+" no node collisions");
 click("node-"+s.nodes[0].id);
 ok(text(d).includes(s.nodes[0].role),s.id+" interactive node explanation");
 for(let i=1;i<r.events.length;i++)click("button-next");
 ok(text(find("text-final"))===r.outcome.final,s.id+" final outcome");
 ok(Number(text(find("text-attempts")))===r.attempts.length,s.id+" attempts synchronized");
 ok(find("button-next").props.disabled,s.id+" next bounded");
 ok(text(find("text-customer-view")).includes(r.events.at(-1).customer),s.id+" customer panel synchronized");
 ok(text(find("text-agent-state"))===r.events.at(-1).agent,s.id+" agent panel synchronized");
 click("button-replay");ok(exists("button-pause")&&text(find("panel-outcome")).includes("appears"),s.id+" Replay");
 click("button-reset");ok(exists("button-start")&&text(find("text-step")).includes("1 /"),s.id+" Reset");
 ok(exists("guide-selected-"+s.id)&&exists("guide-"+s.id),s.id+" configuration guide accessible");
}
change("select-scenario","courtesy");
ok(exists("callback-scheduler"),"Calendar for courtesy");
for(const view of ["week","day","month"]){click("button-view-"+view);ok(find("button-view-"+view).props["aria-pressed"],view+" view");}
click("button-cal-next");ok(!text(find("text-cal-range")).includes("November"),"Calendar navigation");
click("button-cal-today");click("button-next-available");
ok(text(find("text-slot-validation")).includes("valid"),"Next available slot selected");
change("select-schedAction","cancel");
let cancel=simulateCallback("courtesy",{...DEFAULT_CONFIG,...SCENARIOS.find(s=>s.id==="courtesy").defaults,schedAction:"cancel"});
for(let i=1;i<cancel.events.length;i++)click("button-next");
ok(text(find("text-final"))==="Canceled","Calendar cancel wired");
change("select-scenario","web");
change("input-web-phone","bad");
act(()=>find("form-web-callback").props.onSubmit({preventDefault(){}}));
ok(tree.root.findAllByProps({role:"alert"}).length===1,"Web form rejects invalid input");
change("input-web-phone","+13125550147");
act(()=>find("checkbox-web-consent").props.onChange({target:{checked:false}}));
act(()=>find("form-web-callback").props.onSubmit({preventDefault(){}}));
ok(text(tree.root).includes("Consent is required"),"Web consent validated");
act(()=>find("checkbox-web-consent").props.onChange({target:{checked:true}}));
act(()=>find("form-web-callback").props.onSubmit({preventDefault(){}}));
ok(exists("button-pause"),"Valid web submit starts playback");
change("input-phone","+14155550199");
ok(find("input-web-phone").props.value==="+14155550199","Form stays aligned with scenario config");
change("select-webTiming","scheduled");ok(exists("callback-scheduler"),"Scheduled web request exposes calendar");
for(const view of ARCH_VIEWS){
 click("tab-arch-"+view.id);ok(find("tab-arch-"+view.id).props["aria-selected"],view.id+" architecture tab");
 click("arch-node-"+view.nodes[0].id);ok(text(find("text-arch-detail")).includes(view.nodes[0].detail),view.id+" node detail");
}
for(const field of ["type","status","queue","date","tier"]){
 const f=find("filter-"+field);const options=f.findAllByType("option");
 change("filter-"+field,options.at(-1).props.value);
 ok(find("filter-"+field).props.value===options.at(-1).props.value,field+" filter controlled");
 click("button-cc-clear");ok(find("filter-"+field).props.value==="all",field+" filter cleared");
}
const before=text(find("text-value-accepted"));change("range-value-takeUp",0);
click("button-cc-advance");ok(text(find("text-cc-updates")).startsWith("1 "),"Dashboard activity advances");
click("button-cc-reset");ok(text(find("text-cc-updates")).startsWith("0 "),"Dashboard activity resets");
click("button-cc-live");ok(find("button-cc-live").props["aria-pressed"],"Live activity starts");
click("button-cc-live");ok(!find("button-cc-live").props["aria-pressed"],"Live activity pauses");
ok(text(find("text-value-accepted"))==="0"&&before!=="0","Value calculator updates");
click("card-value-1");ok(find("card-value-1").props["aria-expanded"],"Value detail opens");
act(()=>tree.unmount());ok(document.title==="Original","Metadata restored");
ok(timers.size===0,"Playback timers cleaned");
console.log(checks+" callback UI checks passed");
` },
    outfile: resolve(dir, "checks.cjs"), bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/*", "react-test-renderer"], loader: { ".css": "empty" },
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
