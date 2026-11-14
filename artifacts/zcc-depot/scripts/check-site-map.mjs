import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.site-map-check-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {act,create} from "react-test-renderer";
import SiteMap from "./src/pages/site-map";
import {SITE_MAP,SITE_MAP_SECTIONS,ROUTING_MAP_METHODS,filterSiteMap,normalizeSiteQuery,siteMapCounts,siteAccess} from "./src/data/site-map";
import {NAV,HOW_IT_WORKS_GUIDE,isNavItemActive} from "./src/data/navigation";
import {INTRO_ROOMS,ROOMS} from "./src/data/depot-rooms";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.document={title:"Previous title",querySelector:()=>null};
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const app=readFileSync("./src/App.tsx","utf8");
const routes=[...app.matchAll(/<Route path="([^"]+)"/g)].map(m=>m[1]).sort();
const paths=[...new Set(SITE_MAP.flatMap(g=>g.pages.filter(p=>!p.external).map(p=>p.href)))].sort();
ok(JSON.stringify(routes)===JSON.stringify(paths),"every route represented exactly once in unique counts");
ok(!paths.includes("/rooms/technical-resources"),"deleted route stays absent");
const resources=NAV.find(n=>n.label==="Resources");
const demoRooms=NAV.find(n=>n.label==="Demo Rooms");
ok(INTRO_ROOMS.map(r=>r.n).join(",")==="01,02,05","Intro excludes 03 and 04 without renumbering other rooms");
const intro=SITE_MAP.find(g=>g.id==="intro");
for(const id of ["ai-automation","agent-experience"]){
  const room=ROOMS.find(r=>r.id===id);
  ok(!!room,"room remains registered: "+id);
  ok(!intro.pages.some(p=>p.href===room.href),"not listed under Intro: "+id);
  ok(demoRooms.children.some(p=>p.href===room.href),"still reachable under Demo Rooms: "+id);
}
ok(readFileSync("./src/components/depot-shell.tsx","utf8").includes("INTRO_ROOMS.map"),"desktop and mobile sidebar use the Intro-specific list");
for(const href of ["/resources/routing","/resources/callback","/resources/outbound-dialers"]){
 ok(!resources.children.some(c=>c.href===href),"removed from Resources menu: "+href);
 ok(demoRooms.children.some(c=>c.href===href),"retained under Demo Rooms: "+href);
}
ok(!resources.children.some(c=>c.href===HOW_IT_WORKS_GUIDE.href),"detailed guide removed from Resources menu");
ok(SITE_MAP.find(g=>g.title==="Overview").pages.some(p=>p.href===HOW_IT_WORKS_GUIDE.href),"detailed guide belongs to Overview in site map");
ok(!SITE_MAP.find(g=>g.title==="Resources").pages.some(p=>p.href===HOW_IT_WORKS_GUIDE.href),"detailed guide no longer mapped under Resources");
ok(isNavItemActive(NAV.find(n=>n.label==="Overview"),HOW_IT_WORKS_GUIDE.href),"Overview stays active on detailed guide");
ok(!isNavItemActive(resources,HOW_IT_WORKS_GUIDE.href),"Resources no longer active on detailed guide");
const homeSource=readFileSync("./src/pages/home.tsx","utf8");
ok(homeSource.includes('href={HOW_IT_WORKS_GUIDE.href}')&&homeSource.includes('data-testid="link-how-it-works-detailed"'),"Overview content has direct guide link");
ok(siteMapCounts().pages===routes.length,"unique page counts");
ok(filterSiteMap("")===SITE_MAP,"empty query preserves full map");
ok(filterSiteMap("qzxwnoresults999").length===0,"no results");
ok(normalizeSiteQuery("  CAFÉ  ")==="cafe","case and accent normalization");
for(const query of ["routing","skills proficiency","callback","predictive","SAML","voice copilot","sentiment","screen sharing","Contact Center versus Voice"]){
 ok(filterSiteMap(query).length>0,"indexed content found: "+query);
}
ok(JSON.stringify(filterSiteMap("  ROUTING "))===JSON.stringify(filterSiteMap("routing")),"case-insensitive results");
ok(filterSiteMap("skills proficiency").some(g=>g.pages.some(p=>p.href==="/resources/routing")),"deep routing method discoverable");
ok(ROUTING_MAP_METHODS.length===12,"all routing methods");
const methodSource=readFileSync("./src/data/routing-scenarios.ts","utf8");
for(const [id,label] of ROUTING_MAP_METHODS)ok(methodSource.includes('id: "'+id+'"')&&methodSource.includes(label),"routing link matches source "+id);
for(const group of SITE_MAP)for(const page of group.pages){
 ok(page.external||routes.includes(page.href),"registered page link");
 ok(new Set(page.sections.map(s=>s.href)).size===page.sections.length,"no duplicate section destinations per page");
 if(page.external)ok(new URL(page.href).protocol==="https:","safe external page");
 for(const section of page.sections){
  if(section.external)ok(new URL(section.href).protocol==="https:","safe external reference");
  else ok(routes.includes(section.href.split("#")[0]),"section route exists");
 }
}
for(const path of ["/pricing","/agenda","/sell-sheet","/demos/brief"]){
 ok(siteAccess(path)==="presenter","restricted page labelled");
 const page=SITE_MAP.flatMap(g=>g.pages).find(p=>p.href===path);
 ok(page.description.includes("sign-in")&&!/\\$\\d/.test(JSON.stringify(page)),"no private pricing or customer content");
}
for(const href of ["/resources#roadmap","/resources#pitch-deck","/resources#collaboration"])ok(siteAccess(href)==="presenter","restricted section labelled");
let tree;
const text=n=>typeof n==="string"?n:typeof n==="number"?String(n):(n?.children??[]).map(text).join("");
const find=id=>tree.root.find(n=>typeof n.type==="string"&&n.props["data-testid"]===id);
act(()=>{tree=create(<SiteMap/>);});
ok(document.title==="Site map | ZCC Depot","unique page title");
ok(text(find("text-match-count")).includes(String(routes.length)),"initial counts visible");
ok(tree.root.findAll(n=>n.type==="section"&&String(n.props["data-testid"]).startsWith("group-")).length===SITE_MAP.length,"visual group coverage");
ok(tree.root.findAll(n=>n.type==="ul"&&String(n.props.className).includes("sm-secs")).length===0,"sections initially collapsed");
act(()=>find("button-expand-all").props.onClick());
const controls=tree.root.findAll(n=>n.type==="button"&&n.props["aria-controls"]).map(n=>n.props["aria-controls"]);
ok(new Set(controls).size===controls.length,"unique controls across shared pages");
for(const id of controls)ok(tree.root.findAll(n=>typeof n.type==="string"&&n.props.id===id).length===1,"expansion controls unique content");
ok(text(find("button-expand-all")).includes("Collapse"),"expand-all control changes");
act(()=>find("button-expand-all").props.onClick());
ok(tree.root.findAll(n=>n.type==="ul"&&String(n.props.className).includes("sm-secs")).length===0,"collapse all works");
act(()=>find("input-site-map-search").props.onChange({target:{value:"skills proficiency"}}));
ok(find("input-site-map-search").props.value==="skills proficiency","search stays inline");
ok(tree.root.findAll(n=>n.type==="a"&&n.props.href==="/resources/routing#method-skills").length>0,"matching routing method opened and linked");
const toggle=tree.root.findAll(n=>n.type==="button"&&n.props["aria-expanded"]===true)[0];
act(()=>toggle.props.onClick());ok(toggle.props["aria-expanded"]===false,"search result can collapse");
act(()=>find("input-site-map-search").props.onChange({target:{value:"qzxwnoresults999"}}));
ok(find("status-no-results"),"empty state");
act(()=>find("button-suggest-callback").props.onClick());
ok(find("input-site-map-search").props.value==="callback","suggested search works");
act(()=>find("button-clear-search").props.onClick());
ok(find("input-site-map-search").props.value==="","clear search restores map");
act(()=>find("input-site-map-search").props.onChange({target:{value:"routing"}}));
let prevented=false;
act(()=>find("input-site-map-search").props.onKeyDown({key:"Escape",preventDefault(){prevented=true}}));
ok(prevented&&find("input-site-map-search").props.value==="","Escape clears query");
act(()=>tree.unmount());ok(document.title==="Previous title","metadata restored");
console.log(checks+" site map route, search, access-label and UI checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"),
    jsx: "automatic", external: ["react", "react/jsx-runtime", "react-test-renderer"],
    plugins: [{ name: "map-context-stubs", setup(b) {
      b.onResolve({ filter: /^(@\/components\/kit|wouter)$/ }, a => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, a => ({ loader: "js", contents: a.path === "wouter"
        ? 'import React from "react";export const Link=({children,href,...p})=>React.createElement("a",{href,...p},children);'
        : 'import React from "react";export const PageHero=({children,title,lede})=>React.createElement("header",null,React.createElement("h1",null,title),lede,children);'
      }));
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
    }}], define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
