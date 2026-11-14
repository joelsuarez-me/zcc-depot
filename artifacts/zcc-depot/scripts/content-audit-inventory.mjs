import ts from "typescript";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";

const root = resolve("artifacts/zcc-depot/src");
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(ts|tsx)$/.test(path) && !/\.(test|spec)\./.test(path)) files.push(path);
  }
}
await walk(root);
for (const name of ["pricingGuide", "sellSheet", "depot-private-content"]) files.push(resolve(`artifacts/api-server/src/lib/${name}.ts`));
const claims = [], urls = new Set();
for (const file of files.sort()) {
  const text = await readFile(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const seen = new Set();
  function visit(node) {
    if (ts.isStringLiteralLike(node) || ts.isJsxText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const value = node.text.replace(/\s+/g, " ").trim();
      if (/^https:\/\//.test(value)) urls.add(value);
      if (value.length >= 45 && value.split(/\s+/).length >= 7 &&
          !/className|<svg|^https?:|^data:|^import\s|^function\s|^\[|=>|\.test\(/.test(value) &&
          !seen.has(value)) {
        seen.add(value);
        claims.push({ file: relative(process.cwd(), file), line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, text: value });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const output = resolve("generated-artifacts/content-audit");
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "current-content-inventory.json"), JSON.stringify({ generatedAt: new Date().toISOString(), sourceFiles: files.length, candidateClaims: claims.length, urls: [...urls].sort(), claims }, null, 2));
const groups = [
  ["core", c => /src\/data\/(content|arch-model|contact-center-components|customer-proof|system-flow|system-overview|zendesk-pods|voice-comparison|demo-blueprint|demo-nuggets)|src\/pages\/|api-server/.test(c.file)],
  ["operations", c => /routing|callback|outbound|supervisor/.test(c.file)],
  ["industry", c => /verticals/.test(c.file)],
  ["other", c => true],
];
const assigned = new Set();
for (const [name, matches] of groups) {
  const selected = claims.filter((c, i) => { if (assigned.has(i) || !matches(c)) return false; assigned.add(i); return true; });
  await writeFile(resolve(output, `${name}-claims.txt`), selected.map(c => `${c.file}:${c.line} ${c.text}`).join("\n"));
  console.log(`${name}: ${selected.length} candidate passages`);
}
console.log(`${files.length} source files; ${claims.length} candidate passages; ${urls.size} literal HTTPS references. Inventory is not a declaration that every claim is verified.`);
