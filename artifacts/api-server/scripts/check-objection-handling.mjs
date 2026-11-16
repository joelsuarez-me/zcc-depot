import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/api-server");
const dir = await mkdtemp(resolve(root, "node_modules/.objection-check-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "ts", contents: `
import assert from "node:assert/strict";
import express from "express";
import { readFileSync } from "node:fs";
import router from "./src/routes/objection-handling";
import { objectionHandlingGuide as guide } from "./src/lib/objection-handling";
import { filterObjections, matchesQuery, objectionIdFromHash, objectionLink, formatResponseForCopy } from "../zcc-depot/src/components/objection-handling/filter";
import { SITE_MAP, siteAccess } from "../zcc-depot/src/data/site-map";
import { accessibleSearchEntries } from "../zcc-depot/src/data/search";
import { NAV, isNavItemActive } from "../zcc-depot/src/data/navigation";
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++};
ok(guide.objections.length===40,"40 substantive objections");
ok(guide.categories.length===9,"nine categories");
ok(guide.objections.filter(o=>o.origin==="foundation").length===6,"six foundation adaptations");
const cats=new Set(guide.categories.map(c=>c.id)), ids=new Set(), sources=new Set(guide.sources.map(s=>s.id));
for(const o of guide.objections){
 ok(!ids.has(o.id),"unique id "+o.id);ids.add(o.id);
 ok(cats.has(o.categoryId),"category exists");
 ok(!["library","playbook","sources"].includes(o.id),"no section anchor collision");
 for(const field of ["title","concern","question","response","proof","nextStep","avoid","escalation"])ok(o[field]?.trim().length>20,o.id+" "+field);
 ok(o.sourceIds.length>0,"evidence is attributed");
 for(const id of o.sourceIds)ok(sources.has(id),"valid source reference");
 const copy=formatResponseForCopy(o);
 ok(copy.includes(o.avoid)&&copy.includes(o.escalation),"copy retains guardrails and escalation");
 ok(matchesQuery(o,o.title.split(" ").slice(0,2).join(" ")),"own title searchable");
 ok(objectionIdFromHash("#"+encodeURIComponent(o.id),ids)===o.id,"direct hash resolves");
}
for(const c of guide.categories)ok(guide.objections.filter(o=>o.categoryId===c.id).length>=4,"broad category coverage");
ok(!guide.sources.find(s=>s.id==="foundation").url,"original upload not publicly exposed");
for(const s of guide.sources.filter(s=>s.url))ok(new URL(s.url).protocol==="https:","source is HTTPS");
ok(/not a measured statistic/.test(guide.coverageNote),"90 percent goal not falsely measured");
ok(filterObjections(guide.objections,guide.categories,{categoryId:"pricing",query:""}).length===5,"category selection");
ok(filterObjections(guide.objections,guide.categories,{categoryId:"all",query:"zzqxvnm123"}).length===0,"no results supported");
ok(matchesQuery(guide.objections[0],"LICÉNSES"),"accent/case-insensitive search");
ok(objectionIdFromHash("#unknown",ids)===null&&objectionIdFromHash("#library",ids)===null,"unknown/section hashes not objections");
ok(objectionLink("https://example.test","/depot/","too-expensive")==="https://example.test/depot/resources/objection-handling#too-expensive","base path honored");
const path="/resources/objection-handling";
ok(siteAccess(path)==="presenter"&&siteAccess(path+"#library")==="presenter","whole page access classified");
ok(NAV.find(g=>isNavItemActive(g,path))?.label==="Resources","Resources owns page");
ok(SITE_MAP.find(g=>g.title==="Resources").pages.some(p=>p.href===path&&p.sections.length===3),"site map route and three sections");
ok(!accessibleSearchEntries(false,false).some(e=>e.href===path),"public search excludes protected destination");
ok(!accessibleSearchEntries(true,false).some(e=>e.href===path),"signed-in Customer search excludes it");
ok(accessibleSearchEntries(true,true).some(e=>e.href===path),"presenter search includes it");
const ui=readFileSync("../zcc-depot/src/pages/objection-handling.tsx","utf8");
ok(!ui.includes("implementation-fees")&&!ui.includes("That is a fair concern"),"UI contains no protected response fixture");
const app=express();
// Isolated identity fixtures; no production login bypass is installed.
app.use((req,_res,next)=>{req.isAuthenticated=()=>req.get("X-Test-Authenticated")==="yes";next();});
app.use("/api",router);
const server=app.listen(0,"127.0.0.1");await new Promise(r=>server.once("listening",r));
const origin="http://127.0.0.1:"+server.address().port;
try {
 for(const headers of [{},{"X-Depot-Mode":"presenter"},{"X-Test-Authenticated":"yes"},{"X-Test-Authenticated":"yes","X-Depot-Mode":"presenter","Sec-Fetch-Site":"cross-site"}]){
  const r=await fetch(origin+"/api/objection-handling",{headers});
  ok(r.status===(headers["X-Test-Authenticated"]?403:401),"unauthorized or wrong-mode denied");
  ok(r.headers.get("cache-control")==="private, no-store","no private cache");
  ok(r.headers.get("vary").includes("X-Depot-Mode"),"mode varies");
  ok(!(await r.text()).includes(guide.objections[0].response),"no response bytes leaked");
 }
 const r=await fetch(origin+"/api/objection-handling",{headers:{"X-Test-Authenticated":"yes","X-Depot-Mode":"presenter"}});
 ok(r.status===200,"signed-in presenter allowed");
 const data=await r.json();ok(data.objections.length===40,"schema validated HTTP payload complete");
 ok(r.headers.get("cache-control")==="private, no-store","success not cached");
 console.log(n+" objection content, search, deep-link and HTTP access checks passed");
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
` },
    outfile: resolve(dir, "check.mjs"),
    bundle: true, platform: "node", format: "esm", packages: "external",
    define: { "import.meta.env.BASE_URL": '"/"' },
    alias: {
      "@workspace/api-zod": resolve("lib/api-zod/src/index.ts"),
      zod: resolve("lib/api-zod/node_modules/zod/index.js"),
    },
  });
  const r = spawnSync(process.execPath, [resolve(dir, "check.mjs")], { cwd: root, stdio: "inherit", timeout: 30000 });
  if (r.status !== 0) process.exitCode = r.status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
