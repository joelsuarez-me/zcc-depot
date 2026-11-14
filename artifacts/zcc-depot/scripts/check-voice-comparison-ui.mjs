import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.voice-comparison-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import VoiceComparison from "./src/pages/voice-comparison";
import {COMPARISON_ROWS,COMPARISON_CATEGORIES,FIT_SIGNALS,DISCOVERY_TOPICS,getFitGuidance} from "./src/data/voice-comparison";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.document={title:"Previous title",querySelector:()=>null};
let tree,checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++};
const text=n=>typeof n==="string"?n:typeof n==="number"?String(n):(n?.children??[]).map(text).join("");
const find=id=>tree.root.findByProps({"data-testid":id});
act(()=>{tree=create(<VoiceComparison/>);});
ok(document.title.startsWith("Zendesk Contact Center versus Zendesk Voice"),"page metadata");
for(const id of ["summary","capabilities","fit","discovery","migration","faq","sources"]){
 const section=tree.root.find(n=>n.type==="section"&&n.props.id===id);
 ok(section.type==="section"&&section.props["data-section-nav"]===true,"section navigation "+id);
 ok(section.props["aria-labelledby"]===id+"-title","labelled section "+id);
 ok(find("head-"+id).findAllByType("svg").length>0,"animated illustration "+id);
 ok(find("link-jump-"+id).props.href==="#"+id,"working section jump "+id);
}
const rows=()=>tree.root.findAll(n=>n.type==="article"&&String(n.props["data-testid"]).startsWith("row-compare-"));
ok(rows().length===10,"initial full comparison");
for(const cat of COMPARISON_CATEGORIES){
 act(()=>find("button-filter-"+cat.toLowerCase()).props.onClick());
 ok(find("button-filter-"+cat.toLowerCase()).props["aria-pressed"],"filter state "+cat);
 const expected=COMPARISON_ROWS.filter(r=>r.category===cat);
 ok(rows().length===expected.length,"filtered row count "+cat);
 for(const row of expected)ok(find("row-compare-"+row.id),"matching topic "+row.id);
}
act(()=>find("button-filter-all").props.onClick());ok(rows().length===10,"restore all topics");
ok(find("button-fit-reset").props.disabled===true,"empty reset disabled");
const selected=[];
for(const signal of FIT_SIGNALS){
 act(()=>find("toggle-fit-"+signal.id).props.onClick());
 selected.push(signal.id);
 ok(find("toggle-fit-"+signal.id).props["aria-pressed"],"selected fit signal "+signal.id);
 ok(text(find("text-fit-title"))===getFitGuidance(selected).title,"live guidance "+signal.id);
}
act(()=>find("toggle-fit-fast-launch").props.onClick());
ok(!find("toggle-fit-fast-launch").props["aria-pressed"],"deselect signal");
ok(text(find("text-fit-summary")).includes("technical ownership"),"delivery caveat visible");
act(()=>find("button-fit-reset").props.onClick());
ok(FIT_SIGNALS.every(s=>!find("toggle-fit-"+s.id).props["aria-pressed"]),"reset clears all signals");
ok(text(find("text-fit-title"))===getFitGuidance([]).title,"reset restores introductory guidance");
for(let i=0;i<DISCOVERY_TOPICS.length;i++){
 act(()=>find("button-discovery-"+i).props.onClick());
 ok(find("button-discovery-"+i).props["aria-pressed"],"discovery selected "+i);
 ok(text(find("panel-discovery")).includes(DISCOVERY_TOPICS[i].question),"discovery question "+i);
 for(const prompt of DISCOVERY_TOPICS[i].prompts)ok(text(find("panel-discovery")).includes(prompt),"discovery prompt");
}
ok(tree.root.findAllByType("details").length===6,"six usable native FAQs");
ok(tree.root.findAll(n=>n.type==="li"&&String(n.props["data-testid"]).startsWith("step-migration-")).length===5,"five migration steps");
ok(tree.root.findAll(n=>n.type==="li"&&String(n.props["data-testid"]).startsWith("item-source-")).length===8,"eight official sources");
act(()=>tree.unmount());ok(document.title==="Previous title","metadata restored");
console.log(checks+" comparison UI checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"),
    jsx: "automatic", external: ["react", "react/jsx-runtime", "react-test-renderer"],
    plugins: [{ name: "comparison-context-stubs", setup(b) {
      b.onResolve({ filter: /^@\/components\/(kit|section-link)$/ }, a => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, a => ({ loader: "js", contents:
        a.path.endsWith("/kit")
          ? 'import React from "react";export const PageHero=({children,title,lede})=>React.createElement("header",null,React.createElement("h1",null,title),lede,children);export const Ext=({href,children,testId,...p})=>React.createElement("a",{href,"data-testid":testId,...p},children);'
          : 'import React from "react";export const SectionLink=({id,label})=>React.createElement("a",{href:"#"+id},label);'
      }));
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
    }}], logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
