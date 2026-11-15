import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.compete-ui-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import Hub from "./src/pages/compete";
import Detail from "./src/pages/compete-five9";
import {competeFive9} from "../api-server/src/lib/competeFive9";
import {COMPETITORS} from "./src/data/competitors";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.document={title:"Previous title",querySelector:()=>null,getElementById:()=>({scrollIntoView(){}})};
globalThis.IntersectionObserver=class {observe(){} disconnect(){}};
globalThis.__competeFixture=competeFive9;
globalThis.__competeEnabled=true;
globalThis.__competeState="ready";
globalThis.__competeRefetch=0;
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const text=node=>typeof node==="string"?node:Array.isArray(node)?node.map(text).join(" "):node?.children?text(node.children):"";
const find=(tree,id)=>tree.root.findByProps({"data-testid":id});
let tree;
act(()=>{tree=create(<Hub/>)});
ok(COMPETITORS.length===1,"only real competitor listed");
ok(find(tree,"link-compete-five9").props.href==="/resources/compete/five9","hub links to detail");
ok(tree.root.findAllByType("img").some(x=>x.props.src==="/brands/five9.svg"),"local logo used");
act(()=>tree.unmount());
act(()=>{tree=create(<Detail/>)});
ok(find(tree,"text-headline").children.includes(competeFive9.headline),"server headline rendered");
ok(globalThis.__competeQueryEnabled===true,"signed-in presenter enables query");
ok(text(find(tree,"button-compete-print")).includes("Print to PDF"),"visible print control");
ok(text(find(tree,"button-compete-download")).includes("Download PDF"),"visible download control");
for(const theme of competeFive9.themes){
  act(()=>find(tree,"tab-theme-"+theme.id).props.onClick());
  ok(text(find(tree,"text-theme-title"))===theme.title,"theme selection: "+theme.id);
  ok(text(find(tree,"text-theme-zendesk")).includes(theme.zendesk),"Zendesk brief: "+theme.id);
  ok(text(find(tree,"text-theme-five9")).includes(theme.five9),"competitor context: "+theme.id);
}
for(const objection of competeFive9.objections){
  const button=tree.root.findAllByType("button").find(n=>text(n).includes(objection.question));
  ok(!!button,"objection visible: "+objection.id);
  act(()=>button.props.onClick());
  ok(text(tree.toJSON()).includes(objection.response),"objection expands: "+objection.id);
}
const search=tree.root.findByType("input");
act(()=>search.props.onChange({target:{value:"knowledge"}}));
ok(text(tree.toJSON()).includes("Govern knowledge"),"quick search finds matching theme");
act(()=>search.props.onChange({target:{value:"unfindable-test-string"}}));
ok(text(tree.toJSON()).includes("No match"),"empty search is explicit");
for(const source of competeFive9.sources)ok(tree.root.findAllByType("a").some(a=>a.props.href===source.url),"source linked: "+source.id);
for(const guardrail of competeFive9.guardrails)ok(text(tree.toJSON()).includes(guardrail),"guardrail not clipped");
globalThis.__competeState="error";
act(()=>tree.update(<Detail/>));
ok(tree.root.findAllByType("button").some(n=>text(n).includes("Retry")),"failure offers retry");
const retry=tree.root.findAllByType("button").find(n=>text(n).includes("Retry"));
act(()=>retry.props.onClick());
ok(globalThis.__competeRefetch===1,"retry performs refetch");
globalThis.__competeState="ready";
globalThis.__competeEnabled=false;
act(()=>tree.update(<Detail/>));
ok(globalThis.__competeQueryEnabled===false,"query disabled outside signed-in presenter");
ok(!text(tree.toJSON()).includes(competeFive9.pitch),"cached restricted content withheld");
act(()=>tree.unmount());
ok(document.title==="Previous title","metadata restored on leave");
console.log(checks+" Compete UI, navigation and content checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "check.cjs"),
    jsx: "automatic", external: ["react", "react/jsx-runtime", "react-test-renderer"],
    plugins: [{
      name: "compete-test-context", setup(b) {
        b.onResolve({ filter: /^(@\/lib\/depot-mode|@workspace\/api-client-react|wouter|framer-motion)$/ }, a => ({ path: a.path, namespace: "test-stub" }));
        b.onLoad({ filter: /.*/, namespace: "test-stub" }, a => ({ loader: "js", contents:
          a.path === "framer-motion"
            ? 'import React from "react";const tags=new Map();export const motion=new Proxy({},{get:(_,tag)=>{if(!tags.has(tag))tags.set(tag,React.forwardRef(({initial,animate,exit,transition,whileHover,whileTap,...props},ref)=>React.createElement(tag,{...props,ref})));return tags.get(tag)}});export const AnimatePresence=({children})=>children;export const useReducedMotion=()=>true;'
            : a.path === "wouter"
            ? 'import React from "react";export const Link=({children,href,...props})=>React.createElement("a",{href,...props},children);'
            : a.path === "@/lib/depot-mode"
              ? 'export const useDepot=()=>({isPresenter:globalThis.__competeEnabled,auth:{isAuthenticated:globalThis.__competeEnabled,login(){}}});'
              : 'export const getGetCompeteBattlecardQueryKey=()=>["compete"]; export const useGetCompeteBattlecard=(_id,options)=>{globalThis.__competeQueryEnabled=options.query.enabled;return {data:globalThis.__competeFixture,isError:globalThis.__competeState==="error",error:globalThis.__competeState==="error"?{status:500}:null,refetch(){globalThis.__competeRefetch++}}};',
        }));
        b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
      },
    }],
    define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [resolve(dir, "check.cjs")], { stdio: "inherit", timeout: 30000 });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
