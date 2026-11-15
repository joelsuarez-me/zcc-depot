import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { once } from "node:events";
import agendaRouter from "../src/routes/agendas.ts";
import savedResearchRouter from "../src/routes/saved-research.ts";
import { ObjectStorageService } from "../src/lib/objectStorage.ts";
import { Readable } from "node:stream";
import { db } from "@workspace/db";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.isAuthenticated = () => req.get("x-fixture-user") === "readiness-fixture";
  if (req.isAuthenticated()) req.user = { id: "readiness-fixture" };
  req.log = { error() {}, warn() {} };
  next();
});
app.use("/api", agendaRouter, savedResearchRouter);
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}/api`;
try {
  await test("shared customer routes reject anonymous reads and writes before validation", async () => {
    for (const [method, path] of [
      ["GET", "/agendas"], ["POST", "/agendas"], ["GET", "/agendas/invalid"],
      ["PATCH", "/agendas/invalid"], ["DELETE", "/agendas/invalid"],
      ["GET", "/demo-research/saved"], ["POST", "/demo-research/saved"],
      ["GET", "/demo-research/saved/invalid/agenda-draft"],
    ]) {
      const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json" }, ...(method === "POST" || method === "PATCH" ? { body: "{}" } : {}) });
      assert.equal(response.status, 401, `${method} ${path}`);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.match(response.headers.get("vary"), /Cookie/);
      await response.arrayBuffer();
    }
  });
  await test("existing shared-workspace access remains available to signed-in users in both modes", async () => {
    for (const mode of ["customer", "presenter"]) {
      for (const path of ["/agendas", "/demo-research/saved"]) {
        const response = await fetch(base + path, { headers: { "x-fixture-user": "readiness-fixture", "X-Depot-Mode": mode } });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("cache-control"), "private, no-store");
        assert.ok(Array.isArray(await response.json()));
      }
    }
  });
  await test("private objects are not cached, public objects retain their intended cache policy", async () => {
    const storage = new ObjectStorageService();
    for (const visibility of ["private", "public"]) {
      const file = {
        getMetadata: async () => [{ contentType: "text/plain", size: "7", metadata: { "custom:aclPolicy": JSON.stringify({ owner: "fixture", visibility }) } }],
        createReadStream: () => Readable.from([Buffer.from("fixture")]),
      };
      const response = await storage.downloadObject(file);
      assert.equal(await response.text(), "fixture");
      if (visibility === "private") assert.equal(response.headers.get("cache-control"), "private, no-store");
      else assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
    }
  });
} finally {
  await new Promise(resolve => server.close(resolve));
  await db.$client.end();
}
