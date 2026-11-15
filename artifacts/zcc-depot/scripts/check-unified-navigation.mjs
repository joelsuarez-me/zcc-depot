import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.unified-nav-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import {DepotSidebar} from "./src/components/depot-shell";
import {NAV,navigationLabel,isNavItemActive} from "./src/data/navigation";
import {SEARCH_INDEX} from "./src/data/search";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.__navState={sidebarCollapsed:false,isPresenter:true,auth:{isAuthenticated:true},favorites:[],recents:[],setSidebarCollapsed(){},toggleFavorite(){},signOut(){}};
globalThis.__navLocation="/resources/compete/five9";
let checks=0,tree;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const text=n=>typeof n==="string"?n:Array.isArray(n)?n.map(text).join(""):n?.children?text(n.children):"";
const links=()=>tree.root.findAllByType("a");
const find=href=>links().find(n=>n.props.href===href);
act(()=>{tree=create(<DepotSidebar logo="/logo.png"/>);});
ok(text(tree.toJSON()).includes("Explore the Depot"),"unified heading");
for(const label of ["Intro","Library"])ok(!tree.root.findAll(n=>n.props.className==="depot-side-label"&&text(n.toJSON?.()??{children:n.children})===label).length,"old standalone heading removed: "+label);
for(const group of NAV){
 ok(links().some(link=>link.props.href===group.href&&link.props["aria-label"]===group.label),"group reachable: "+group.label);
 for(const child of group.children)ok(!!find(child.href),"expanded child visible: "+child.label);
}
ok(find("/resources/compete/five9").props["aria-label"]==="Five9","logo-only link has accessible label");
ok(text(find("/resources/compete/five9"))==="","competitor text label remains removed");
ok(find("/sales").props["aria-current"]==="page","moved competitor page highlights Sales Enablement");
ok(!find("/resources").props["aria-current"],"historic URL prefix doesn't activate Resources");
globalThis.__navState={...globalThis.__navState,isPresenter:false};
act(()=>tree.update(<DepotSidebar logo="/logo.png"/>));
for(const href of ["/resources#pitch-deck","/resources#roadmap","/resources#collaboration"])ok(!find(href),"internal fragment stays hidden in Customer Mode: "+href);
globalThis.__navState={...globalThis.__navState,sidebarCollapsed:true};
act(()=>tree.update(<DepotSidebar logo="/logo.png"/>));
for(const group of NAV)ok(links().some(link=>link.props.href===group.href&&link.props.title===group.label),"collapsed group remains reachable: "+group.label);
ok(!find("/demos/brief"),"collapsed sidebar hides submenu rather than crowding icons");
act(()=>tree.update(<DepotSidebar logo="/logo.png" mobile/>));
ok(!!find("/demos/brief"),"mobile drawer shows submenu despite desktop collapse preference");
for(const [href,label,old] of [["/demos/brief","Customer Research","Demo Researcher"],["/demos/nuggets","Feature Demos","Demo Nuggets"],["/sell-sheet","Solution Brief","Sell Sheet"]]){
 const entry=SEARCH_INDEX.find(e=>e.href===href);
 ok(entry.title===label,"search display label: "+label);
 ok(entry.keywords.includes(old),"previous term remains searchable: "+old);
 ok(navigationLabel(href)===label,"shared display label: "+label);
}
ok(isNavItemActive({...NAV[2]},"/resources/compete"),"active state doesn't rely on object identity");
act(()=>tree.unmount());
console.log(checks+" unified navigation, mobile, collapsed and visibility checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"), jsx: "automatic",
    external: ["react", "react/jsx-runtime", "react-test-renderer"], define: { "import.meta.env.BASE_URL": '"/"' },
    plugins: [{ name: "navigation-context", setup(b) {
      b.onResolve({ filter: /^(wouter|@\/lib\/depot-mode)$/ }, a => ({ path: a.path, namespace: "nav-stub" }));
      b.onLoad({ filter: /.*/, namespace: "nav-stub" }, a => ({
        loader: "js", contents: a.path === "wouter"
          ? 'import React from "react";export const useLocation=()=>[globalThis.__navLocation,()=>{}];export const Link=({children,...props})=>React.createElement("a",props,children);'
          : 'export const useDepot=()=>globalThis.__navState;'
      }));
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
    }}], logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit", timeout: 30000 }).status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
