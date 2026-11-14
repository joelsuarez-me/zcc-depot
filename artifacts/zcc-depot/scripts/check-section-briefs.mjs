import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.section-brief-check-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {parseHTML} from "linkedom";
import {act,create} from "react-test-renderer";
import {captureSectionBrief,assembleSectionBrief} from "./src/lib/section-brief-content";
import {createSectionBriefPdf,sectionBriefFilename} from "./src/lib/section-brief-pdf";
import {SectionBriefActions} from "./src/components/section-brief-actions";
async function run(){
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++};
const {document,window:domWindow}=parseHTML('<html><head><title>Routing | ZCC Depot</title></head><body><h1>Routing lab</h1><section id="first" data-brief-scope><h2>Queue-based routing</h2><p>A fictional demonstration of how a call reaches its configured queue.</p><h3>Key decisions</h3><ul><li>Collect the caller’s menu choice.</li><li>Native features depend on configuration and plan.</li></ul><table><thead><tr><th>Stage</th><th>Outcome</th></tr></thead><tbody><tr><td>Choose queue</td><td>Sales</td></tr><tr><td>Match agent</td><td>Eligible agent</td></tr></tbody></table><p>Read the <a href="https://docs.aws.amazon.com/connect/latest/adminguide/routing-profiles.html?token=SECRET">AWS routing guide</a>.</p><p hidden>SECRET-HIDDEN</p><div aria-hidden="true"><p>SECRET-ARIA</p></div><div style="display:none"><p>SECRET-CSS</p></div><div data-brief-exclude><p>SECRET-PRESENTER</p></div><form><p>SECRET-FORM</p><input value="SECRET-INPUT"/></form><p>Visible context <textarea>SECRET-TEXTAREA</textarea><span contenteditable="true">SECRET-EDITOR</span></p><nav><p>SECRET-NAV</p></nav><div role="dialog"><p>SECRET-DIALOG</p></div><button>Start call</button><div data-brief-exclude><button>Print brief</button><p>SECRET-EXPORT-STATUS</p></div><details><summary>Is every feature enabled?</summary><p>No. Confirm licensing and configuration.</p></details></section><section><h2>Second section</h2><p>SECRET-OTHER-SECTION</p></section></body></html>');
Object.defineProperty(document,"location",{value:{href:"https://example.test/resources/routing?customer=SECRET#old"}});
domWindow.getComputedStyle=el=>({display:el.style?.display||"block",visibility:el.style?.visibility||"visible"});
const scope=document.querySelector("#first");
const content=captureSectionBrief(scope,"first");
const serialized=JSON.stringify(content);
ok(content.title==="Queue-based routing","section title");
ok(content.page==="Routing lab","page context");
ok(content.sourceUrl==="https://example.test/resources/routing#first","source link is section-specific and has no query data");
ok(!serialized.includes("SECRET"),"hidden controls, notes, forms and other sections excluded");
ok(content.blocks.some(b=>b.kind==="table"&&b.headers[0]==="Stage"&&b.rows.length===2),"semantic table captured once");
ok(content.blocks.some(b=>"text" in b&&b.text==="No. Confirm licensing and configuration."),"public FAQ answer preserved");
ok(content.sources.length===1&&!content.sources[0].url.includes("?"),"official reference has no query token");
ok(content.interactive,"simulation snapshot labelled");
scope.insertAdjacentHTML("beforeend",'<div data-testid="presenter-notes-routing"><p>SECRET-PRIVATE-NOTES</p></div>');
ok(!JSON.stringify(captureSectionBrief(scope)).includes("SECRET"),"server-backed presenter note panels excluded");
scope.setAttribute("data-brief-case","test-case");scope.setAttribute("data-brief-industry","retail");
const caseUrl=new URL(captureSectionBrief(scope).sourceUrl);
ok(caseUrl.searchParams.get("case")==="test-case"&&caseUrl.searchParams.get("industry")==="retail"&&!caseUrl.searchParams.has("customer"),"curated use-case selection preserved without customer query data");
ok(!content.internal,"public content not marked internal");
const privateScope=document.createElement("section");privateScope.setAttribute("data-brief-internal","");privateScope.innerHTML="<h2>Internal guide</h2><p>Authorized team guidance.</p>";document.body.appendChild(privateScope);
ok(captureSectionBrief(privateScope).internal,"internal content labelled");
const forbidden=document.createElement("div");forbidden.setAttribute("data-brief-exclude","");forbidden.innerHTML="<section><h2>Presenter-only</h2><p>SECRET</p></section>";document.body.appendChild(forbidden);
assert.throws(()=>captureSectionBrief(forbidden.querySelector("section")));checks++;
const staticScope=document.createElement("section");staticScope.innerHTML="<h2>Static topic</h2><p>Useful overview.</p><div data-brief-exclude><button>Print brief</button></div>";document.body.appendChild(staticScope);
ok(!captureSectionBrief(staticScope).interactive,"export controls do not mark static content interactive");
const many=Array.from({length:35},(_,i)=>({kind:"paragraph",text:"Point "+i+": useful learning content."}));
many.push({kind:"paragraph",text:"This feature is optional and requires configuration."});
const long=assembleSectionBrief(many,{title:"Long topic",page:"Guide",sourceUrl:"https://example.test/guide#topic",internal:false,sources:[],interactive:false});
ok(long.abridged&&long.blocks.length<=14,"large sections explicitly abridged");
ok(long.qualifications.includes("This feature is optional and requires configuration."),"qualification outside summary retained");
const date=new Date(2026,10,14,12);
ok(sectionBriefFilename('Calls / Queues: "Test"',date)==="ZCC-Brief-Calls-Queues-Test-2026-11-14.pdf","safe dated filenames");
for(const sample of [content,long,captureSectionBrief(privateScope)]){
 const pdf=createSectionBriefPdf(sample,date),raw=pdf.output();
 ok(pdf.getNumberOfPages()<=4,"brief remains concise");
 ok(raw.includes("SECTION BRIEF")&&raw.includes("SOURCE NOTES"),"executive report structure");
 ok(!raw.includes("Continue exploring"),"exploration section removed");
 ok(raw.includes("CONCEPT ILLUSTRATION"),"topic illustration included");
 if(sample===content)ok(raw.includes("12 Tf"),"body and bullet text increased to twelve points");
 ok(raw.includes(sample.sourceUrl),"original section is linked");
 ok(!raw.includes("SECRET"),"PDF excludes private/hidden fixture data");
}
writeFileSync("/tmp/zcc-section-brief-sample.pdf",Buffer.from(createSectionBriefPdf(content,date).output("arraybuffer")));
for(const file of ["src/components/kit.tsx","src/components/room-kit.tsx","src/components/voice-compare/section-head.tsx","src/pages/pricing.tsx"]){
 ok(readFileSync(file,"utf8").includes("<SectionBriefActions"),"toolbar wired into "+file);
}
ok(readFileSync("src/components/presenter.tsx","utf8").includes('className="contents" data-brief-exclude'),"presenter-only material excluded at source");
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let tree,fail=false,saved=0,printed=0,closed=0;
let viewer={opener:{},closed:false,document:{title:""},location:{href:""},close(){closed++}};
globalThis.window={open:()=>viewer,setTimeout:()=>0};
globalThis.URL.createObjectURL=()=>"blob:section-brief";
globalThis.__briefCapture=()=>{if(fail)throw new Error("Section unavailable");return {title:"Queue routing"}};
globalThis.__briefDoc=()=>({setProperties(){},autoPrint(){printed++},output(){return new Blob(["pdf"])},async save(){saved++}});
act(()=>{tree=create(<SectionBriefActions sectionId="first"/>,{createNodeMock:el=>el.type==="div"?{closest:()=>scope}:null})});
const button=i=>tree.root.findAllByType("button")[i];
await act(async()=>{button(0).props.onClick()});
ok(printed===1&&viewer.location.href==="blob:section-brief","section print opens generated PDF");
await act(async()=>{button(1).props.onClick()});
ok(saved===1,"section PDF downloads directly");
viewer=null;await act(async()=>{button(0).props.onClick()});
ok(saved===2,"popup blocked falls back to download");
fail=true;await act(async()=>{button(1).props.onClick()});
ok(tree.root.findAll(n=>n.type==="p"&&n.props.role==="alert").length===1,"capture errors are visible");
ok(!button(0).props.disabled&&!button(1).props.disabled,"export recovers after failure");
act(()=>tree.unmount());
console.log(checks+" section brief capture, privacy, PDF and control checks passed");
}
run().catch(error=>{console.error(error);process.exitCode=1});
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"),
    jsx: "automatic", external: ["react", "react/jsx-runtime", "react-test-renderer", "linkedom"],
    plugins: [{ name: "brief-action-stubs", setup(b) {
      b.onResolve({ filter: /^@\/lib\/section-brief-(content|pdf)$/ }, a => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, a => ({ loader: "js", contents: a.path.endsWith("-content")
        ? "export const captureSectionBrief=(...args)=>globalThis.__briefCapture(...args);"
        : 'export const createSectionBriefPdf=()=>globalThis.__briefDoc();export const sectionBriefFilename=()=>"Section-Brief.pdf";'
      }));
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
    }}], logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
