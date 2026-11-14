import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = "artifacts/zcc-depot";
let checks = 0;
const ok = (v, message) => { assert.ok(v, message); checks++; };
const read = path => readFile(join(root, path), "utf8");
const nav = await read("src/data/navigation.ts");
const app = await read("src/App.tsx");
const crumbs = await read("src/data/depot-rooms.ts");
ok(nav.includes('label: "Routing"') && nav.includes('label: "Callback"'), "Existing labs preserved in navigation");
ok(nav.indexOf('label: "Outbound Dialers"') > nav.indexOf('label: "Callback"'), "Outbound follows Callback");
const resourceBlock = nav.slice(nav.indexOf('label: "Resources"'), nav.indexOf("export function"));
ok(/Outbound Dialers[^]*\/resources\/outbound-dialers[^]*\}\s*,?\s*\]\s*\}/.test(resourceBlock), "Outbound is last Resources navigation item");
for (const path of ["/resources/routing", "/resources/callback", "/resources/outbound-dialers"]) {
  ok(app.includes(`path="${path}"`), `${path} route remains registered`);
  ok(crumbs.includes(`"${path}"`), `${path} has breadcrumbs`);
}
async function walk(dir) {
  const entries = await readdir(join(root, dir), { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))).flat();
}
const components = await walk("src/components/outbound");
const library = (await readdir(join(root, "src/lib"))).filter(n => n.startsWith("outbound")).map(n => "src/lib/" + n);
const data = (await readdir(join(root, "src/data"))).filter(n => n.startsWith("outbound")).map(n => "src/data/" + n);
const files = [...components, ...library, ...data, "src/pages/resource-outbound-dialers.tsx"];
ok(components.filter(p => p.endsWith(".tsx")).length >= 8, "Feature surface split into modular components");
const all = (await Promise.all(files.map(read))).join("\n");
for (const path of files.filter(p => /\.[jt]sx?$/.test(p))) {
  const text = await read(path);
  ok(!/from\s+["'](?:@aws-sdk|aws-sdk)/.test(text), `${path} contains no AWS mutation client`);
  ok(!/\bfetch\s*\(|\baxios\s*[.(]|navigator\.sendBeacon\s*\(/.test(text), `${path} cannot initiate real outreach requests`);
  ok(!/Notification\.requestPermission|new\s+Notification\b/.test(text), `${path} cannot send real browser notifications`);
  ok(!text.includes("from \"@/data/depot-private"), `${path} does not import private guidance`);
}
for (const path of library) {
  const text = await read(path);
  ok(!/Math\.random\s*\(|Date\.now\s*\(/.test(text), `${path} deterministic rather than random/current-time simulation`);
}
for (const secretPhrase of [
  "Ask which constraint matters most",
  "Let the agent review the fictional profile and reason",
  "What is the source of truth for revocation",
]) ok(!all.includes(secretPhrase), "Private speaker guidance absent from client source");
ok(/Educational simulation only\.\s*AWS configuration controls do not independently establish TCPA/.test(all), "Required legal disclaimer visible in client");
ok(all.includes("qualified legal counsel"), "Counsel review disclaimer preserved");
ok(/prefers-reduced-motion/.test(all), "Reduced-motion preference supported");
ok(/2026-11-13|November 13, 2026|Nov 13, 2026/.test(all), "Actual reviewed date recorded");
ok(!/Documentation Verified[^]*new Date\(\)/.test(all.slice(-1000)), "Verification date not generated as current date");
ok(/usePresenterContent/.test(all) && /PresenterGate/.test(all), "Existing protected Presenter integration reused");
ok(/outbound-(predictive|progressive|preview|agentless)|outbound-\$/.test(all), "Protected notes IDs connected");
ok(/Intl\.DateTimeFormat/.test(all), "Time zones use IANA-aware Intl formatting");
ok(!all.includes("OPENAI_API_KEY"), "No unrelated AI credential requirement");
console.log(`${checks} outbound route, privacy and simulation-boundary checks passed`);
