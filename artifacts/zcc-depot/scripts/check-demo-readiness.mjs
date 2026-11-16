import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.readiness-check-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {FEATURE_REGISTRY,featureHref} from "./src/data/feature-registry";
import {evidenceIssues,evidenceReviewQueue,relatedFeatures} from "./src/data/feature-evidence";
import {SEARCH_INDEX,accessibleSearchEntries} from "./src/data/search";
import {destinationAccess} from "./src/data/access-policy";
import {SITE_MAP,siteMapCounts} from "./src/data/site-map";
import {isTypingTarget} from "./src/components/presentation-stage";
import {composeStory,AgendaStoryboard} from "./src/components/agenda-storyboard";
import {act,create} from "react-test-renderer";
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const now=new Date("2026-11-15T12:00:00Z");
ok(FEATURE_REGISTRY.length===33,"stable capability count");
for(const f of FEATURE_REGISTRY){
 ok(f.evidence.owner===null,"honest unassigned owner: "+f.id);
 ok(f.evidence.humanApproval===null,"no invented human approval: "+f.id);
 ok(f.evidence.reviewedAt===f.lastVerified,"historical review date preserved: "+f.id);
 ok(f.evidence.availabilityQualification===f.availability,"qualification preserved: "+f.id);
 ok(JSON.stringify(f.evidence.productBoundary)===JSON.stringify(f.classifications),"product boundary: "+f.id);
 ok(f.evidence.dependencies.length>0,"explicit dependencies: "+f.id);
 ok(f.sources.every(s=>/^https:\\/\\//.test(s.href)&&!!s.lastVerified),"source URLs and dates: "+f.id);
 ok(evidenceIssues(f,now).includes("Owner unassigned"),"review queue flags missing ownership: "+f.id);
 ok(evidenceIssues(f,new Date("2027-03-01")).includes("Review older than 90 days"),"review expires: "+f.id);
 ok(!relatedFeatures(f,FEATURE_REGISTRY).some(x=>x.id===f.id),"related links exclude self: "+f.id);
 const href=featureHref(f.id);
 ok(SITE_MAP.some(g=>g.pages.some(p=>p.sections.some(s=>s.href===href))),"site map preserves deep link: "+f.id);
}
ok(evidenceReviewQueue(FEATURE_REGISTRY,now).length===33,"all unassigned evidence appears in queue");
ok(evidenceReviewQueue(FEATURE_REGISTRY,now).filter(x=>x.feature.evidence.status==="requires-verification").length===6,"six availability-sensitive claims");
const missing={...FEATURE_REGISTRY[0],sources:[],evidence:{...FEATURE_REGISTRY[0].evidence,reviewedAt:null}};
ok(evidenceIssues(missing,now).includes("Missing source evidence"),"missing source detected");
ok(evidenceIssues(missing,now).includes("Missing review date"),"missing date detected");
const future={...FEATURE_REGISTRY[0],evidence:{...FEATURE_REGISTRY[0].evidence,reviewedAt:"2027-01-01"}};
ok(evidenceIssues(future,now).includes("Review date is in the future"),"future review not accepted");
for(const [auth,presenter] of [[false,false],[false,true],[true,false],[true,true]]){
 const entries=accessibleSearchEntries(auth,presenter);
 for(const entry of entries)ok((entry.access!=="presenter"&&destinationAccess(entry.href)==="public")||(auth&&presenter),"search state respects access");
 ok(entries.some(e=>e.id==="feature-customer-verification"),"public capability always discoverable");
 ok(entries.some(e=>e.href==="/agenda")===(auth&&presenter),"customer agenda destination visibility");
 ok(accessibleSearchEntries(auth,presenter,"presenter").length>0===(auth&&presenter),"private filter cannot elevate access");
}
ok(accessibleSearchEntries(true,true,"public").every(e=>e.access!=="presenter"&&destinationAccess(e.href)==="public"),"public scope stays public");
for(const href of ["/pricing?x=1#bundle","/agenda?agenda=abc","/resources?x=1#roadmap"])ok(destinationAccess(href)==="presenter","query cannot bypass classification");
for(const e of SEARCH_INDEX.filter(e=>destinationAccess(e.href)==="presenter"||e.access==="presenter"))ok(e.description==="Presenter Mode and sign-in required.","protected search metadata sanitized");
const searchSource=readFileSync("./src/data/search.ts","utf8");
ok(!searchSource.includes("The primary motion: Zendesk sells")&&!searchSource.includes("For greenfield and net-new"),"commercial summaries removed from public source");
for(const tag of ["INPUT","TEXTAREA","SELECT"])ok(isTypingTarget({target:{tagName:tag,getAttribute:()=>null}}),"typing target protected");
ok(isTypingTarget({ctrlKey:true,target:null}),"modifier shortcuts protected");
ok(isTypingTarget({target:{isContentEditable:true}}),"editable content protected");
ok(!isTypingTarget({target:{tagName:"DIV",getAttribute:()=>null}}),"plain simulation keys available");
const story={audience:"Solution team",challenges:"PRIVATE-CHALLENGE",duration:"30",privateNotes:"SECRET-PRESENTER",steps:[{key:"feature:callbacks",kind:"feature",id:"callbacks",title:"Callback Management",href:"/?feature=callbacks#features",talking:"Show configured queue behavior",caveat:"Configuration required"}]};
const safe=composeStory(story,{customerSafe:true,includeCustomer:false,company:"PRIVATE-CUSTOMER"});
ok(!safe.includes("SECRET-PRESENTER"),"safe export excludes presenter notes");
ok(!safe.includes("PRIVATE-CUSTOMER")&&!safe.includes("PRIVATE-CHALLENGE"),"safe export excludes customer context by default");
ok(safe.includes("Configuration required")&&safe.includes("30 minutes"),"safe export retains caveats and duration");
const withCustomer=composeStory(story,{customerSafe:true,includeCustomer:true,company:"PRIVATE-CUSTOMER"});
ok(withCustomer.includes("PRIVATE-CUSTOMER")&&withCustomer.includes("PRIVATE-CHALLENGE")&&!withCustomer.includes("SECRET-PRESENTER"),"explicit customer inclusion does not include private notes");
const source=readFileSync("./src/pages/agenda.tsx","utf8");
ok(source.includes("AgendaStoryboard")&&source.includes("storyDirty"),"storyboard uses agenda dirty-state integration");
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let tree,applied="",isDirty=false;
act(()=>{tree=create(<AgendaStoryboard company="PRIVATE-CUSTOMER" problems="PRIVATE-CHALLENGE" onApply={t=>{applied=t;return true}} onDirtyChange={d=>{isDirty=d}}/>);});
const find=id=>tree.root.findByProps({"data-testid":id});
const click=id=>act(()=>find(id).props.onClick());
const change=(id,value)=>act(()=>find(id).props.onChange({target:{value}}));
ok(find("button-storyboard-download").props.disabled,"export starts disabled");
change("select-storyboard-item","callbacks");click("button-storyboard-add");
ok(isDirty,"adding step marks unsaved");
ok(find("link-storyboard-step-feature:callbacks").props.href==="/?feature=callbacks#features","selected feature retains direct link");
change("input-storyboard-private","SECRET-PRESENTER");
click("button-storyboard-preview");
ok(!find("text-storyboard-preview").children.join("").includes("SECRET-PRESENTER"),"actual preview excludes private notes");
ok(find("button-storyboard-download").props.disabled,"preview alone is not export consent");
act(()=>find("checkbox-storyboard-reviewed").props.onChange({target:{checked:true}}));
ok(!find("button-storyboard-download").props.disabled,"reviewed preview enables export");
change("input-storyboard-audience","Changed audience");
ok(find("button-storyboard-download").props.disabled,"editing safe text invalidates prior review");
change("select-storyboard-kind","demo");
change("select-storyboard-item","voice-copilot");click("button-storyboard-add");
ok(find("link-storyboard-step-demo:voice-copilot").props.href==="/demos/nuggets#voice-copilot","nugget anchor preserved");
change("select-storyboard-kind","usecase");
const choices=find("select-storyboard-item").findAll(n=>n.type==="option"&&n.props.value);
ok(choices.length===45,"all 45 actual industry scenarios available");
change("select-storyboard-item",choices[0].props.value);click("button-storyboard-add");
click("button-storyboard-apply");
ok(applied.includes("PRIVATE-CHALLENGE")&&!applied.includes("SECRET-PRESENTER"),"compose prepares agenda context but omits private notes");
ok(applied.includes("/?feature=callbacks#features")&&applied.includes("/demos/nuggets#voice-copilot"),"composed agenda connects demos by URL");
ok(!isDirty,"explicit compose clears unapplied flag");
act(()=>tree.unmount());
const registeredRoutes=[...readFileSync("./src/App.tsx","utf8").matchAll(/<Route path="([^"]+)"/g)].map(m=>m[1]);
ok(siteMapCounts().pages===new Set(registeredRoutes).size&&siteMapCounts().groups===6,"routes and navigation groups preserved");
console.log(checks+" evidence, permission-aware search, storyboard privacy and shortcut checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"),
    jsx: "automatic", external: ["react", "react/jsx-runtime", "react-dom", "react-test-renderer"],
    define: { "import.meta.env.BASE_URL": '"/"' }, loader: { ".css": "empty" }, logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
