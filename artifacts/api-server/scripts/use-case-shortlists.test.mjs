import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { inArray } from "drizzle-orm";
import { db, pool, useCaseShortlistsTable as table } from "@workspace/db";
import { CreateUseCaseShortlistBody } from "@workspace/api-zod";
import shortlists from "../src/routes/use-case-shortlists.ts";

test("shortlist API accepts 45 distinct public scenario IDs", () => {
  const ids = CreateUseCaseShortlistBody.shape.scenarioIds.element.options;
  assert.equal(ids.length, 45);
  assert.equal(new Set(ids).size, 45);
});

test("shared Presenter shortlists are protected, durable and revision-safe", async t => {
  const created = [];
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.isAuthenticated = () => Boolean(req.get("x-test-user")); next(); });
  app.use(shortlists);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/use-case-shortlists`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    if (created.length) await db.delete(table).where(inArray(table.id, created));
    await pool.end();
  });
  const call = (method = "GET", suffix = "", body, headers = {}) => fetch(base + suffix, {
    method, headers: { "Content-Type": "application/json", "x-test-user": "presenter-one", "X-Depot-Mode": "presenter", ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const input = { name: "Integration shortlist", customer: "Example customer", notes: "Private discussion", scenarioIds: ["financial-services-banking-routing", "pharma-life-sciences-adverse-event"] };
  let row;
  await t.test("every route rejects anonymous, Customer-mode and cross-site requests without returning private bytes", async () => {
    for (const [method, path, body] of [["GET", ""], ["POST", "", input], ["GET", "/00000000-0000-4000-8000-000000000000"], ["PATCH", "/00000000-0000-4000-8000-000000000000", input], ["DELETE", "/00000000-0000-4000-8000-000000000000", { revision: 1 }]]) {
      for (const [headers, status] of [[{ "x-test-user": "" }, 401], [{ "X-Depot-Mode": "customer" }, 403], [{ "Sec-Fetch-Site": "cross-site" }, 403]]) {
        const response = await call(method, path, body, headers);
        assert.equal(response.status, status);
        assert.match(response.headers.get("cache-control"), /private, no-store/);
        assert.doesNotMatch(await response.text(), /Example customer|Private discussion/);
      }
    }
  });
  await t.test("invalid fields and non-public, duplicate or empty selections are rejected", async () => {
    for (const patch of [
      { name: "  " }, { customer: "" }, { notes: "x".repeat(10001) }, { name: "x".repeat(161) },
      { scenarioIds: [] }, { scenarioIds: ["unknown"] }, { scenarioIds: ["financial-services-banking-routing", "financial-services-banking-routing"] },
    ]) assert.equal((await call("POST", "", { ...input, ...patch })).status, 400);
  });
  await t.test("creates and reopens across independent authenticated sessions", async () => {
    const response = await call("POST", "", input);
    assert.equal(response.status, 201);
    row = await response.json(); created.push(row.id);
    assert.equal(row.revision, 1); assert.equal(row.notes, input.notes);
    const second = await call("GET", `/${row.id}`, undefined, { "x-test-user": "presenter-two" });
    assert.deepEqual(await second.json(), row);
    const list = await (await call()).json();
    assert.ok(list.some(item => item.id === row.id));
    const [stored] = await db.select().from(table).where(inArray(table.id, [row.id]));
    assert.deepEqual(stored.scenarioIds, input.scenarioIds);
  });
  await t.test("updates all fields, clears notes, rejects stale writes and stale deletes", async () => {
    const update = { ...input, name: "Updated", notes: "", scenarioIds: ["pharma-life-sciences-adverse-event"], revision: row.revision };
    const response = await call("PATCH", `/${row.id}`, update);
    assert.equal(response.status, 200);
    const latest = await response.json();
    assert.equal(latest.notes, ""); assert.equal(latest.revision, 2);
    assert.equal((await call("PATCH", `/${row.id}`, update)).status, 409);
    assert.equal((await call("DELETE", `/${row.id}`, { revision: row.revision })).status, 409);
    assert.deepEqual(await (await call("GET", `/${row.id}`)).json(), latest);
    row = latest;
  });
  await t.test("removes from the shared library and handles missing and invalid IDs explicitly", async () => {
    assert.equal((await call("DELETE", `/${row.id}`, { revision: row.revision })).status, 204);
    assert.equal((await call("GET", `/${row.id}`)).status, 404);
    assert.equal((await call("PATCH", `/${row.id}`, { ...input, revision: 2 })).status, 404);
    assert.equal((await call("DELETE", `/${row.id}`, { revision: 2 })).status, 404);
    assert.equal((await call("GET", "/not-an-id")).status, 400);
    assert.ok(!(await (await call()).json()).some(item => item.id === row.id));
  });
});
