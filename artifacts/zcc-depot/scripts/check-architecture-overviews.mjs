import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = await mkdtemp(resolve(root, "node_modules/.overview-check-"));
try {
  const outfile = resolve(dir, "check.cjs");
  await build({
    stdin: {
      resolveDir: root, sourcefile: "overview-check.tsx", loader: "tsx",
      contents: `
import assert from "node:assert/strict";
import React from "react";
import {create, act} from "react-test-renderer";
import {SystemOverviewDiagram} from "./src/components/system-overview-diagram";
import {ZendeskPodMap} from "./src/components/zendesk-pod-map";
import {SO_NODES,SO_EDGES} from "./src/data/system-overview";
import {POD_REGIONS} from "./src/data/zendesk-pods";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++;};
const find=(r,id)=>r.root.findByProps({"data-testid":id});
const flatten=(v)=>typeof v==="string"||typeof v==="number"?String(v):Array.isArray(v)?v.map(flatten).join(""):v?.children?flatten(v.children):"";
const text=(node)=>flatten(node.toJSON());
let system;
act(()=>{system=create(<SystemOverviewDiagram/>);});
ok(SO_NODES.length===find(system,"system-overview-diagram").findAllByProps({role:"button"}).length,"all diagram nodes accessible");
for(const n of SO_NODES) ok(SO_EDGES.some(e=>e.from===n.id||e.to===n.id),"node has a connector: "+n.id);
for(const e of SO_EDGES) ok(SO_NODES.some(n=>n.id===e.from)&&SO_NODES.some(n=>n.id===e.to),"valid endpoints");
act(()=>find(system,"node-sov-status").props.onKeyDown({key:"Enter",preventDefault(){}}));
ok(text(system).includes("Agent availability synchronization"),"keyboard selection opens status sync detail");
act(()=>find(system,"button-sov-journey-post").props.onClick());
ok(find(system,"button-sov-journey-post").props["aria-pressed"],"journey active");
act(()=>find(system,"button-sov-motion").props.onClick());
ok(find(system,"system-overview-diagram").props.className.includes("paused"),"diagram motion pauses");
act(()=>find(system,"button-sov-overview").props.onClick());
ok(find(system,"button-sov-overview").props["aria-pressed"],"overview resets selection");
act(()=>system.unmount());
let pods;
act(()=>{pods=create(<ZendeskPodMap/>);});
ok(POD_REGIONS.length===9,"nine reference locations");
act(()=>find(pods,"map-node-tokyo").props.onKeyDown({key:" ",preventDefault(){}}));
ok(find(pods,"button-region-tokyo").props["aria-pressed"],"keyboard map selection updates location button");
act(()=>find(pods,"button-toggle-incident").props.onClick());
ok(text(pods).includes("other 8 represented Pods"),"isolation simulation explains remaining pods");
ok(find(pods,"map-node-tokyo").props.className.includes("is-degraded"),"selected pod degraded");
ok(find(pods,"map-node-ohio").props.className.includes("is-operating"),"other pod remains operating");
act(()=>find(pods,"button-region-ireland").props.onClick());
ok(find(pods,"map-node-tokyo").props.className.includes("is-degraded"),"incident stays on original location when selection changes");
act(()=>find(pods,"button-reset-incident").props.onClick());
ok(find(pods,"map-node-tokyo").props.className.includes("is-operating"),"reset clears incident");
act(()=>find(pods,"button-pod-motion").props.onClick());
ok(find(pods,"zendesk-pod-map").props.className.includes("is-paused"),"map motion pauses");
ok(text(pods).includes("Not live or independently verified"),"reference metrics qualified");
act(()=>pods.unmount());
console.log(checks+" architecture overview checks passed");
`
    },
    outfile, bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/*", "react-test-renderer"], loader: { ".css": "empty" },
    plugins: [{
      name: "standalone-link",
      setup(b) {
        b.onResolve({ filter: /^@\/components\/kit$/ }, () => ({ path: "link", namespace: "stub" }));
        b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: 'import React from "react"; export const Ext=({children,href})=>React.createElement("a",{href},children);', loader: "js"
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
