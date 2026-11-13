import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = await mkdtemp(resolve(root, "node_modules/.how-it-works-check-"));
try {
  const outfile = resolve(dir, "check.cjs");
  await build({
    stdin: { resolveDir: root, sourcefile: "guide-check.tsx", loader: "tsx", contents: `
import assert from "node:assert/strict";
import React from "react";
import {create,act} from "react-test-renderer";
import Guide from "./src/pages/resource-how-it-works";
import {SLIDES,CHAPTERS,ROUTING_CMP,QUEUE_CMP} from "./src/data/how-it-works";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let scrollId="", historyId="";
globalThis.document={title:"Original",querySelector:()=>null,getElementById:(id)=>({id,scrollIntoView:()=>scrollId=id})};
globalThis.history={replaceState:(_a,_b,url)=>historyId=url};
globalThis.IntersectionObserver=class{observe(){}disconnect(){}};
let count=0;
const ok=(value,message)=>{assert.ok(value,message);count++;};
const text=n=>typeof n==="string"?n:(n?.children||[]).map(text).join("");
let tree;act(()=>tree=create(<Guide/>));
const find=id=>tree.root.findByProps({"data-testid":id});
ok(SLIDES.length===22,"all 22 slides indexed");
ok(new Set(SLIDES.map(s=>s.id)).size===22,"unique stable IDs");
ok(CHAPTERS.flatMap(c=>c.slides).join()===SLIDES.map(s=>s.id).join(),"every slide in chapter navigation in source order");
for(const slide of SLIDES){
 ok(tree.root.findAllByType("section").some(s=>s.props.id===slide.id),"rendered section "+slide.id);
 ok(find("link-toc-"+slide.id).props.href==="#"+slide.id,"topic permalink "+slide.id);
}
ok(tree.root.findAll(n=>n.props["data-slide"]).length===22,"22 source-slide wrappers");
act(()=>find("button-toggle-motion").props.onClick());
ok(find("button-toggle-motion").props["aria-pressed"],"pause control reflects state");
ok(tree.root.findAll(n=>typeof n.props.className==="string"&&n.props.className.includes("hiw-paused")).length>0,"pause class applied");
act(()=>find("button-layer-aws").props.onClick());
ok(find("button-layer-aws").props["aria-pressed"],"layer focus");
act(()=>find("button-layer-all").props.onClick());
ok(find("button-layer-all").props["aria-pressed"],"layer reset");
act(()=>find("button-sys-redaction").props.onClick());
ok(text(find("text-sys-detail")).includes("must be enabled"),"system detail updates");
ok(text(find("button-sys-lambda").parent.parent).includes("CUSTOMER AWS CLOUD"),"integration helpers stay in customer AWS boundary");
act(()=>find("button-sys-records").props.onClick());
ok(text(find("text-sys-detail")).includes("asynchronously"),"reporting path is separate and asynchronous");
act(()=>find("button-route-next").props.onClick());
ok(text(find("text-route-detail")).includes("key-value"),"routing advances");
act(()=>find("button-route-prev").props.onClick());
ok(text(find("text-route-detail")).includes("greetings"),"routing goes back");
act(()=>find("button-copilot-after").props.onClick());
ok(find("button-copilot-after").props["aria-pressed"],"Copilot after-call view");
ok(text(tree.toJSON()).includes("asynchronous"),"post-call timing qualified");
const shipment=tree.root.findAllByType("button").find(n=>text(n)==="Shipment status tracking");
act(()=>shipment.props.onClick());
ok(text(find("text-app-prompt")).includes("shipment status"),"app example updates");
act(()=>find("select-jump-section").props.onChange({target:{value:"voice-qa"}}));
ok(scrollId==="voice-qa"&&historyId==="#voice-qa","jump updates scroll and URL");
ok(find("text-current-slide").children.join("").includes("21"),"source slide indicator updates");
ok(ROUTING_CMP.map(r=>r.connect+":"+r.zendesk).join()==="yes:blank,yes:blank,yes:yes,yes:yes,yes:blank","routing table matches source");
ok(QUEUE_CMP.map(r=>r.connect+":"+r.zendesk).join()==="yes:blank,yes:blank,yes:blank,yes:yes,blank:yes,blank:yes,yes:blank","queue table matches source");
ok(QUEUE_CMP[2].note.includes("contacts"),"queue capacity correction");
act(()=>tree.unmount());
ok(document.title==="Original","page title cleanup");
console.log(count+" How It Works checks passed");
` },
    outfile, bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/*", "react-test-renderer"], loader: { ".css": "empty" },
    plugins: [{
      name: "guide-shell-stubs",
      setup(b) {
        b.onResolve({ filter: /^(@\/components\/(kit|room-kit)|wouter)$/ }, args => ({ path: args.path, namespace: "guide-stub" }));
        b.onLoad({ filter: /.*/, namespace: "guide-stub" }, () => ({
          contents: 'import React from "react"; export const Link=({children,href,...p})=>React.createElement("a",{href,...p},children);export const Ext=Link;export const PageHero=({title,lede,children})=>React.createElement("header",null,title,lede,children);export const RoomSection=({id,title,children})=>React.createElement("section",{id},title,children);export const SourceNote=({children})=>React.createElement("p",null,children);export const StatusTag=SourceNote;',
          loader: "js"
        }));
      }
    }],
    logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [outfile], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
