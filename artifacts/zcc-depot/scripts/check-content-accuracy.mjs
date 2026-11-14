// Regression checks for reviewed editorial boundaries, not a substitute for
// re-reading current official documentation when a product release changes.
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { resolve } from "node:path";

const root = resolve("artifacts/zcc-depot");
const result = await build({
  stdin: {
    resolveDir: root,
    loader: "ts",
    contents: `
      import * as content from "./src/data/content";
      import * as architecture from "./src/data/arch-model";
      import * as system from "./src/data/system-overview";
      import * as flow from "./src/data/system-flow";
      import * as comparison from "./src/data/voice-comparison";
      import * as routing from "./src/data/routing-scenarios";
      import * as outbound from "./src/data/outbound-content";
      import * as callbacks from "./src/data/callback-scenarios";
      import * as supervisor from "./src/data/supervisor-reference";
      export {content, architecture, system, flow, comparison, routing, outbound, callbacks, supervisor};
    `,
  },
  bundle: true, write: false, platform: "node", format: "esm",
  logLevel: "silent",
});
const data = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks++; };
const { content, architecture, system, comparison } = data;
const official = url => /^https:\/\/(?:support\.zendesk\.com|(?:www\.)?zendesk\.com|docs\.aws\.amazon\.com|aws\.amazon\.com)\//.test(url);
ok(content.FEATURES.length === 14, "preserve the fourteen selectable features");
for (const feature of content.FEATURES) {
  ok(feature.sources?.length > 0, `${feature.t}: visible source data`);
  for (const source of feature.sources) ok(official(source.href), `${feature.t}: official source`);
}
ok(/future release/.test(content.FEATURES[0].d), "Voice AI cannot imply native ZCC availability");
ok(/early access/i.test(content.FEATURES[2].d), "translation remains explicitly EAP");
ok(/request/.test(content.FEATURES[1].d) && /Copilot/.test(content.FEATURES[1].d), "knowledge suggestions require an agent request and Copilot");
ok(/does not redact attached call audio/.test(content.FEATURES[4].d), "QA redaction does not imply audio redaction");
ok(/BAA/.test(content.FEATURES[5].d), "HIPAA depends on contractual and service scope");
ok(!content.RESOURCES.some(r => /\(all \d+ articles\)/.test(r.title)), "no stale hard-coded article counts");
ok(/Zendesk-managed/.test(content.ACCURACY_NOTES.awsOwnership) && /BYOA/.test(content.ACCURACY_NOTES.awsOwnership), "both AWS ownership models are documented");
ok(system.SO_EDGES.some(e => e.from === "zcc" && e.to === "connect"), "separate Zendesk-to-Connect sign-in relationship");
ok(!system.SO_EDGES.some(e => e.from === "cognito" && e.to === "connect"), "Cognito must not be a mandatory Connect sign-in broker");
ok(architecture.ARCH_EDGES.some(e => e.from === "zcc" && e.to === "cognito"), "separate app user-pool identity relationship");
ok(/TranscriptIngestLambda/.test(JSON.stringify(system.SO_NODES)), "writeback distinguishes transcript ingestion");
ok(/CTRIngestLambda/.test(JSON.stringify(system.SO_NODES)), "CTR analytics is a distinct ingest path");
for (const edge of system.SO_EDGES) {
  ok(system.SO_NODES.some(n => n.id === edge.from) && system.SO_NODES.some(n => n.id === edge.to), `valid system edge ${edge.id}`);
}
const comparisonRows = Object.values(comparison).find(v => Array.isArray(v) && v.some(r => r?.id === "ai"));
ok(comparisonRows?.find(r => r.id === "ai").sources.includes("voice-ai-availability"), "comparison AI claims cite the availability announcement");
const read = file => readFile(resolve(root, "src", file), "utf8");
const components = await read("pages/architecture-components.tsx");
ok(!components.includes("not on Zendesk servers"), "no absolute AWS-only data claim");
ok(components.includes("LINKS.writeback") && components.includes("LINKS.residency"), "data boundaries cite writeback and regional hosting");
const nuggets = await read("pages/demo-nuggets.tsx");
ok(nuggets.includes("ACCURACY_NOTES.voiceAi") && nuggets.includes("LINKS.voiceAiAvailability"), "playable AI example includes availability warning and link");
const proof = await read("pages/rooms/executive-overview.tsx");
for (const slug of ["the-good-meal-co", "support-zebra", "telus"]) {
  ok(proof.includes(`https://www.zendesk.com/customer/${slug}/`), `${slug}: public customer-story source`);
}
ok(/channel mix/.test(proof) && /asynchronous messaging/.test(proof), "customer metrics preserve the correct comparison");
const brief = await read("lib/comparison-brief-pdf.ts");
ok(brief.includes('"voice-ai-availability"') && /support as planned/.test(brief), "downloadable comparison stays aligned with the page");
const sales = await readFile(resolve(root, "../api-server/src/lib/sellSheet.ts"), "utf8");
ok(!sales.includes('"AI-powered Auto Assist helps complete after-call work for every interaction."'), "internal sales guidance cannot promise universal Auto Assist");
ok(sales.includes("TELUS reports") && sales.includes("asynchronous messaging compared with voice"), "internal TELUS metric retains its denominator");
ok(sales.includes("SupportZebra reports less than 5 minutes") && sales.includes("The Good Meal Co reports a five-week"), "internal customer outcomes retain their attribution");
ok(sales.includes("Contact Center support as planned"), "internal AI positioning agrees with the public comparison");
const pricing = await readFile(resolve(root, "../api-server/src/lib/pricingGuide.ts"), "utf8");
ok(pricing.includes("not independently verified public list prices") && pricing.includes("not independently verified as a currently available Suite-free offer"), "internal pricing and packaging are not silently promoted to public entitlements");

const urls = new Set();
function collect(value) {
  if (typeof value === "string" && official(value)) {
    try { const url = new URL(value); url.hash = ""; urls.add(url.href); } catch {}
  } else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === "object") Object.values(value).forEach(collect);
}
collect(data);
const out = resolve("generated-artifacts/content-audit");
await mkdir(out, { recursive: true });
await writeFile(resolve(out, "official-source-urls.json"), JSON.stringify([...urls].sort(), null, 2));
console.log(`PASS: ${checks} content-accuracy consistency checks. ${urls.size} official reference URLs inventoried (not a live verification).`);
