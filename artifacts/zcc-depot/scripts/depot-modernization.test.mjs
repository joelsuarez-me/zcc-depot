import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = path => readFileSync(resolve(root, path), "utf8");
const frontend = "artifacts/zcc-depot/src/";
const app = () => read(frontend + "App.tsx");

test("all original route destinations survive beside all six demo rooms", () => {
  for (const path of ["/", "/demos", "/demos/instance-details", "/demos/brief", "/demos/nuggets", "/architecture", "/architecture/components", "/sales", "/pricing", "/sell-sheet", "/resources", "/agenda"]) {
    assert.ok(app().includes(`path="${path}"`), path);
  }
  const rooms = ["executive-overview", "architecture-integrations", "ai-automation", "agent-experience", "use-cases", "technical-resources"];
  for (const room of rooms) {
    assert.ok(app().includes(`/rooms/${room}`), room);
    assert.ok(read(frontend + `pages/rooms/${room}.tsx`).length > 500, `${room} has real implementation`);
  }
  assert.match(app(), /lazy\(/);
  assert.match(app(), /Suspense/);
});

test("confidential legacy content is absent from every frontend source file", () => {
  const files = [];
  const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.[jt]sx?$/.test(path)) files.push(path);
    }
  };
  walk(resolve(root, frontend));
  const forbidden = ["Native Contact Center parity", "Feb–Jul FY2028", "1Cpv8Sg_BQ_R6kK6uBK91NOJGw3s0mVL7cN0uQ4PbiTA", "HyperArc"];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const phrase of forbidden) assert.ok(!text.includes(phrase), `${file} leaked ${phrase}`);
    assert.doesNotMatch(text, /from\s+["'][^"']*api-server/);
  }
});

test("restricted endpoints are guarded before their routers are mounted", () => {
  const source = read("artifacts/api-server/src/routes/index.ts");
  for (const [path, router] of [["/pricing-guide", "pricingRouter"], ["/sell-sheet", "sellSheetRouter"], ["/pitch-deck", "pitchDeckRouter"]]) {
    const guard = source.indexOf(`router.use("${path}", presenterAccess)`);
    assert.ok(guard >= 0, path);
    assert.ok(guard < source.indexOf(`router.use(${router})`), path);
  }
});
