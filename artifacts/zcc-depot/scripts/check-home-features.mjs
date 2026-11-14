import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.home-features-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import {Router} from "wouter";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import Home from "./src/pages/home";
import {FEATURES} from "./src/data/content";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++};
const text=node=>typeof node==="string"?node:typeof node==="number"?String(node):(node?.children??[]).map(text).join("");
let tree;act(()=>{tree=create(<Router hook={()=>["/",()=>{}]}><Home/></Router>);});
const tab=i=>tree.root.findByProps({"data-testid":"tab-feature-"+i});
const panel=()=>tree.root.findByProps({id:"feature-panel"});
ok(FEATURES.length===14,"nine original features plus five additions");
const expected=["Omnichannel routing","IVR and intelligent call routing","Customer callbacks","AI-powered after-call work","Real-time sentiment analysis"];
expected.forEach((name,i)=>ok(FEATURES[i+9].t===name,"new capability order "+name));
for(let i=0;i<FEATURES.length;i++){
  act(()=>tab(i).props.onClick());
  ok(tab(i).props["aria-selected"]===true,"selected tab "+i);
  ok(tree.root.findAllByProps({role:"tab"}).filter(n=>n.props["aria-selected"]).length===1,"one selected tab "+i);
  ok(text(tab(i)).endsWith(String(i+1).padStart(2,"0")),"continuous numbering "+i);
  ok(text(panel()).includes(FEATURES[i].t)&&text(panel()).includes(FEATURES[i].d),"selected detail "+i);
  ok(panel().props["aria-labelledby"]==="feature-tab-"+i,"labelled detail "+i);
  ok(tab(i).props.tabIndex===0,"active tab keyboard stop "+i);
  for(const source of FEATURES[i].sources??[]){
    ok(panel().findAllByType("a").some(a=>a.props.href===source.href),"source visible "+source.label);
    ok(["zendesk.com","aws.amazon.com"].some(host=>new URL(source.href).hostname===host||new URL(source.href).hostname.endsWith("."+host)),"official Zendesk or AWS source");
  }
}
let focused=-1,prevented=false;
const key=(i,key)=>act(()=>tab(i).props.onKeyDown({key,preventDefault(){prevented=true},currentTarget:{parentElement:{querySelectorAll(){return FEATURES.map((_,n)=>({focus(){focused=n}}))}}}}));
key(13,"ArrowDown");ok(tab(0).props["aria-selected"]&&focused===0&&prevented,"keyboard wraps forward");
key(0,"ArrowUp");ok(tab(13).props["aria-selected"]&&focused===13,"keyboard wraps backward");
key(13,"Home");ok(tab(0).props["aria-selected"],"Home selects first");
key(0,"End");ok(tab(13).props["aria-selected"],"End selects last");
for(const feature of FEATURES.slice(9))ok(/depend|configured|configuration|enabled/i.test(feature.d),"qualified availability "+feature.t);
act(()=>tree.unmount());
console.log(checks+" home feature checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"),
    jsx: "automatic", external: ["react", "react/jsx-runtime", "react-test-renderer"],
    plugins: [{ name: "home-feature-stubs", setup(b) {
      b.onResolve({ filter: /^(@\/components\/(kit|art|home-hero|call-journey)|framer-motion)$/ }, a => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, a => ({
        loader: "js",
        contents: a.path === "framer-motion"
          ? 'import React from "react";export const useReducedMotion=()=>true;export const AnimatePresence=({children})=>children;export const motion={div:({children,initial,animate,exit,transition,...p})=>React.createElement("div",p,children)};'
          : a.path.endsWith("/kit")
            ? 'import React from "react";export const Ext=({href,children,...p})=>React.createElement("a",{href,...p},children);export const Note=({children})=>React.createElement("p",null,children);export const Reveal=({children,...p})=>React.createElement("div",p,children);export const Section=({children})=>React.createElement("section",null,children);export const SectionHead=()=>null;'
            : 'export const PillarArt=()=>null;export const HomeHero=()=>null;export const RoomStrip=()=>null;export const CallJourney=()=>null;',
      }));
    }}], logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
