import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { transform } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const baseline = "depot-before-modernization-20261113";
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 8_000_000 });
const files = git("ls-tree", "-r", "--name-only", baseline, "artifacts/zcc-depot/src", "artifacts/zcc-depot/public")
  .trim().split("\n").filter(Boolean);
const records = [];
for (const path of files) {
  if (/\.(?:tsx?|css|html|json|svg)$/.test(path)) {
    const source = git("show", `${baseline}:${path}`);
    records.push({
      path, sha256: createHash("sha256").update(source).digest("hex"),
      sectionIds: [...source.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]),
      routes: [...source.matchAll(/<Route\s+path=["']([^"']+)["']/g)].map(match => match[1]),
      links: [...new Set([...source.matchAll(/https:\/\/[^\s"'<>`)]+/g)].map(match => match[0]))],
      interactions: {
        buttons: [...source.matchAll(/<button\b/g)].length,
        inputs: [...source.matchAll(/<(?:input|textarea|select)\b/g)].length,
        disclosures: [...source.matchAll(/<(?:details|Dialog|Select)\b/g)].length,
      },
    });
  }
}
async function dataModule(source) {
  const { code } = await transform(source, { loader: "ts", format: "esm" });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}
const source = git("show", `${baseline}:artifacts/zcc-depot/src/data/content.ts`);
const data = await dataModule(source);
const claims = [];
function walk(value, location) {
  if (typeof value === "string" && value.length >= 80 && !/^https:/.test(value)) {
    claims.push({ originalClaim: value, location, status: "Needs Verification", source: null,
      reviewedAt: null, recommendedWording: "Retain provenance and qualify configuration/availability; consult the curated technical claim registry before external use." });
  } else if (Array.isArray(value)) value.forEach((item, i) => walk(item, `${location}[${i}]`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => walk(item, `${location}.${key}`));
}
Object.entries(data).forEach(([key, value]) => walk(value, key));
const current = await dataModule(await readFile(resolve(root, "artifacts/zcc-depot/src/data/content.ts"), "utf8"));
const privateModule = await dataModule(await readFile(resolve(root, "artifacts/api-server/src/lib/depot-private-content.ts"), "utf8"));
const legacy = privateModule.depotPrivateContent;
const preservation = {
  roadmap: JSON.stringify(data.ROADMAP) === JSON.stringify(legacy.roadmap),
  gtm: JSON.stringify(data.GTM) === JSON.stringify(legacy.gtm),
  resourceUrls: data.RESOURCES.every(resource => [...current.RESOURCES, ...legacy.resources].some(item => item.url === resource.url)),
  internalSource: legacy.resources.some(resource => resource.url === data.LINKS.gtmDoc),
};
const output = resolve(root, "generated-artifacts/depot-audit");
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "inventory.json"), JSON.stringify({
  baseline, commit: git("rev-parse", baseline).trim(), generatedAt: new Date().toISOString(),
  routes: records.flatMap(record => record.routes), files: records,
  sourceAssets: files.filter(path => path.includes("/public/")), preservation,
}, null, 2));
await writeFile(resolve(output, "claim-candidates.json"), JSON.stringify(claims, null, 2));
console.log(JSON.stringify({ baseline, sourceFiles: records.length, assets: files.filter(path => path.includes("/public/")).length,
  routes: records.flatMap(record => record.routes), candidateClaims: claims.length, preservation, output }, null, 2));
if (Object.values(preservation).some(value => !value)) process.exitCode = 1;
