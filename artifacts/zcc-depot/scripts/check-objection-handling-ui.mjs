import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.objection-ui-"));
const stubs = {
  "@workspace/api-client-react": `export const getGetObjectionHandlingQueryKey=()=>["/api/objection-handling"]; export const useGetObjectionHandling=opts=>{globalThis.queryEnabled=opts.query.enabled;return globalThis.testQuery;};`,
  "@/lib/depot-mode": `export const useDepot=()=>globalThis.testDepot;`,
  "@/components/compete/compete-kit": `export const useCompeteMeta=()=>{};`,
  "wouter": `import React from "react";export const Link=props=>React.createElement("a",props,props.children);`,
  "framer-motion": `import React from "react";export const useReducedMotion=()=>true;const cache=new Map();export const motion=new Proxy({}, {get:(_,tag)=>{if(!cache.has(tag))cache.set(tag,React.forwardRef(({children,initial,animate,transition,...props},ref)=>React.createElement(tag,{...props,ref},children)));return cache.get(tag);}});`,
};
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import Page from "./src/pages/objection-handling";
import {objectionHandlingGuide as guide} from "../api-server/src/lib/objection-handling";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const listeners=new Map();
globalThis.window={
 location:{origin:"https://example.test",pathname:"/resources/objection-handling",search:"",hash:""},
 history:{pushState:(_,__,url)=>{window.location.hash=url.includes("#")?"#"+url.split("#")[1]:"";}},
 addEventListener:(e,fn)=>{if(!listeners.has(e))listeners.set(e,new Set());listeners.get(e).add(fn);},
 removeEventListener:(e,fn)=>listeners.get(e)?.delete(fn),
 matchMedia:()=>({matches:false}),
};
globalThis.document={getElementById:()=>null};
globalThis.requestAnimationFrame=fn=>{fn();return 1;};
let copied="",failCopy=false,retries=0,tree,n=0;
Object.defineProperty(globalThis,"navigator",{configurable:true,value:{clipboard:{writeText:async text=>{if(failCopy)throw Error("denied");copied=text;}}}});
globalThis.testDepot={isPresenter:true,auth:{isAuthenticated:true,login:()=>{}}};
globalThis.testQuery={data:guide,isError:false,isLoading:false,isFetching:false,error:null,refetch:()=>{retries++;}};
const ok=(v,m)=>{assert.ok(v,m);n++;};
const find=id=>tree.root.findByProps({"data-testid":id});
const exists=id=>tree.root.findAllByProps({"data-testid":id}).length>0;
const click=async id=>await act(async()=>{await find(id).props.onClick();});
const change=async (id,value)=>await act(async()=>find(id).props.onChange({target:{value}}));
const render=async()=>await act(async()=>{if(tree)tree.update(<Page/>);else tree=create(<Page/>);});
const visibleButtons=()=>tree.root.findAll(x=>x.type==="button"&&x.props["data-testid"]?.startsWith("button-objection-")&&!["button-objection-signin","button-objection-retry"].includes(x.props["data-testid"]));
const hash=async value=>await act(async()=>{window.location.hash=value;for(const fn of listeners.get("hashchange")??[])fn();});
await render();
ok(queryEnabled,"query enabled only for signed-in Presenter");
ok(visibleButtons().length===40,"all forty cards rendered");
ok(tree.root.findAll(x=>x.type==="button"&&x.props["data-testid"]?.startsWith("button-category-")).length===10,"all and nine categories");
await click("button-category-pricing");ok(visibleButtons().length===5,"category filters real cards");
await click("button-objection-implementation-fees");ok(exists("detail-objection-implementation-fees"),"select reveals detail");
for(const [id,value] of [["text-question","question"],["text-response","response"],["text-proof","proof"],["text-avoid","avoid"],["text-next","nextStep"],["text-escalation","escalation"]])ok(find(id).children.join("")===guide.objections.find(o=>o.id==="implementation-fees")[value],"actual field "+value);
await click("button-copy-response");ok(copied.includes("Do not promise:")&&copied.includes("Escalation:"),"copy retains boundaries");
await click("button-copy-link");ok(copied==="https://example.test/resources/objection-handling#implementation-fees","copy direct link");
ok(tree.root.findAll(x=>x.type==="a"&&x.props["data-testid"]==="link-source-foundation").length===0,"internal upload not linked");
await click("button-category-ai");ok(exists("state-selected-hidden"),"selected answer retained outside filter");
await click("button-show-in-list");ok(visibleButtons().length===40,"show in list clears filters");
await change("input-objection-search","zzqxvnm123");ok(exists("state-no-results"),"empty results have reset");
await click("button-reset-filters");ok(visibleButtons().length===40,"reset restores library");
await click("button-category-pricing");await hash("#voice-ai-story");
ok(exists("detail-objection-voice-ai-story"),"deep hash selects real objection");
ok(visibleButtons().length===40,"hidden external hash clears category");
ok(find("text-avoid").children.join("").includes("planned"),"voice AI product boundary visible");
await hash("#too-expensive");ok(exists("detail-objection-too-expensive"),"history hash changes selection");
failCopy=true;await click("button-copy-response");ok(find("button-copy-response").children.includes("Copy failed"),"clipboard failure visible");failCopy=false;
await hash("#unknown");ok(!exists("detail-objection-too-expensive"),"unknown hash clears old selection");
testDepot={isPresenter:false,auth:{isAuthenticated:true}};await render();
ok(!queryEnabled&&!exists("button-category-all"),"switch to Customer hides cached protected guide");
testDepot={isPresenter:true,auth:{isAuthenticated:false}};await render();
ok(!queryEnabled&&!exists("button-category-all"),"sign-out hides cached protected guide");
testDepot={isPresenter:true,auth:{isAuthenticated:true}};testQuery={...testQuery,isError:true,error:{status:401}};await render();
ok(exists("button-objection-signin")&&!exists("button-category-all"),"401 offers signin without cached guide");
await click("button-objection-retry");ok(retries===1,"retry invokes query");
testQuery={...testQuery,isError:false,isLoading:true,data:undefined,error:null};await render();
ok(tree.root.findAllByProps({"aria-label":"Loading objection library"}).length===1,"loading state");
await act(async()=>tree.unmount());
ok([...listeners.values()].every(set=>set.size===0),"navigation listeners cleaned up");
console.log(n+" objection page interaction and protected-state component checks passed");
` },
    bundle: true, platform: "node", format: "esm", outfile: resolve(dir, "check.mjs"), jsx: "automatic",
    external: ["react", "react/jsx-runtime", "react-dom", "react-test-renderer", "lucide-react"],
    define: { "import.meta.env.BASE_URL": '"/"' }, loader: { ".css": "empty" }, logLevel: "warning",
    plugins: [{ name: "isolated-page-dependencies", setup(b) {
      b.onResolve({ filter: /.*/ }, args => stubs[args.path] ? { path: args.path, namespace: "stub" } : undefined);
      b.onLoad({ filter: /.*/, namespace: "stub" }, args => ({ contents: stubs[args.path], loader: "tsx", resolveDir: root }));
    } }],
  });
  const r = spawnSync(process.execPath, [resolve(dir, "check.mjs")], { cwd: root, stdio: "inherit", timeout: 30000 });
  process.exitCode = r.status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
