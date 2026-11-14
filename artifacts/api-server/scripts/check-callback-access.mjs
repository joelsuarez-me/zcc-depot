import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "callback-access-"));
try {
  const out = join(dir, "check.cjs");
  await build({
    stdin: {
      resolveDir: resolve("artifacts/api-server"),
      loader: "ts",
      contents: `
import assert from "node:assert/strict";
import { callbackPresenterRooms } from "./src/lib/callback-presenter";
import { presenterRooms } from "./src/lib/presenter-rooms";
import { presenterAccess } from "./src/middlewares/presenterAccess";
let checks = 0;
const ok = (v, message) => { assert.ok(v, message); checks++; };
const ids = ["queued","agent-first","customer-first","web","courtesy","chat","external","availability","vip","ai","after-hours","recovery"];
ok(callbackPresenterRooms.length === 12, "Twelve server-only presenter entries");
for (const id of ids) {
  const room = callbackPresenterRooms.find(r => r.id === "callback-" + id);
  ok(room, id + " exists");
  ok(presenterRooms.some(r => r.id === room.id), id + " is included in protected response");
  ok(room.speakerNotes.length >= 3, id + " includes talk track, benefit, expected outcome");
  ok(room.technicalPoints.length >= 4, id + " includes setup, integrations, failure handling");
  ok(room.objections.length && room.discoveryQuestions.length && room.progression.length, id + " includes presenter guidance");
}
function invoke(auth, mode, site) {
  const headers = {};
  let code = 200, next = false;
  const req = { isAuthenticated: () => auth, get: name => name === "X-Depot-Mode" ? mode : name === "Sec-Fetch-Site" ? site : undefined };
  const res = { setHeader: (k,v) => { headers[k] = v; }, status: c => { code=c; return res; }, json: () => res };
  presenterAccess(req, res, () => { next=true; });
  return { code, next, headers };
}
const unauth = invoke(false, "presenter", "same-origin");
ok(unauth.code === 401 && !unauth.next, "No presenter bytes without sign-in");
const customer = invoke(true, "customer", "same-origin");
ok(customer.code === 403 && !customer.next, "No presenter bytes in Customer mode");
ok(invoke(true, undefined, "same-origin").code === 403, "Missing mode denied");
ok(invoke(true, "presenter", "cross-site").code === 403, "Cross-site ambient cookies denied");
const allowed = invoke(true, "presenter", "same-origin");
ok(allowed.code === 200 && allowed.next, "Authenticated Presenter mode allowed");
ok(allowed.headers["Cache-Control"] === "private, no-store", "Internal response not cached");
ok(allowed.headers.Vary.includes("X-Depot-Mode"), "Response varies by mode");
ok(allowed.headers["X-Robots-Tag"].includes("noindex"), "Internal response not indexed");
console.log(checks + " callback presenter access checks passed");
`,
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: out,
  });
  const result = spawnSync(process.execPath, [out], { stdio: "inherit" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
