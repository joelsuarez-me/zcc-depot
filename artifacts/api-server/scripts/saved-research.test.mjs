import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import { eq, inArray } from "drizzle-orm";
import { db, pool, researchReportsTable, agendasTable } from "@workspace/db";
import router from "../src/routes/saved-research.ts";
import { researchToAgenda } from "../src/lib/research-to-agenda.ts";
import { REPORT_HEADINGS } from "../src/lib/demo-research/report-format.ts";

const fields = { companyName: `Research test ${randomUUID()}`, companyWebsite: "https://example.com/", region: "Test region", audience: "Test architects" };
const markdown = REPORT_HEADINGS.map((title, i) => `## ${title}\n**Section ${i}:** Evidence [1](https://example.com/).`).join("\n\n")
  + "\n\n## Sources\n[1] [Official website](https://example.com/)";
const report = { ...fields, markdown, researchedAt: new Date().toISOString(),
  sources: [{ id: 1, title: "Official website", publisher: "example.com", url: "https://example.com/", accessedAt: "2026-11-12" }] };
const savedKeys = [randomUUID(), randomUUID(), randomUUID()];
const agendaIds = [];
const app = express();
app.use(express.json({ limit: "1mb" }));
// This private test server alone supplies a synthetic identity; production auth is untouched.
app.use((req, _res, next) => {
  req.isAuthenticated = () => !!req.get("x-fixture-user");
  if (req.isAuthenticated()) req.user = { id: req.get("x-fixture-user") };
  req.log = { error() {}, warn() {} };
  next();
});
app.use("/api", router);
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api/demo-research/saved`;
const call = (path = "", data, user = "fixture-author") => fetch(base + path, {
  method: data === undefined ? "GET" : "POST",
  headers: { "Content-Type": "application/json", ...(user ? { "x-fixture-user": user } : {}) },
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});

try {
  await test("all saved-report, image and conversion routes reject anonymous users", async () => {
    for (const [path, data] of [["", undefined], ["", {}], ["/invalid", undefined], ["/invalid/logo", undefined], ["/invalid/agenda", {}], ["/invalid/agenda-draft", undefined]]) {
      const response = await call(path, data, "");
      assert.equal(response.status, 401);
      assert.match(response.headers.get("cache-control"), /private, no-store/);
    }
  });
  let record;
  await test("a completed snapshot is durable, shared and idempotent on repeated saves", async () => {
    const input = { saveKey: savedKeys[0], fields, report };
    const responses = await Promise.all([call("", input), call("", input)]);
    for (const response of responses) assert.equal(response.status, 201);
    const records = await Promise.all(responses.map(response => response.json()));
    assert.equal(records[0].id, records[1].id);
    record = records[0];
    const reopened = await call(`/${record.id}`, undefined, "fixture-colleague");
    assert.equal(reopened.status, 200);
    assert.deepEqual((await reopened.json()).report, report);
    const listing = await call("", undefined, "fixture-colleague");
    assert.ok((await listing.json()).some(item => item.id === record.id && item.audience === fields.audience));
    const rows = await db.select().from(researchReportsTable).where(eq(researchReportsTable.saveKey, savedKeys[0]));
    assert.equal(rows.length, 1);
  });
  await test("draft conversion is read-only, repeatable and retains all five sections and citations", async () => {
    const before = await db.select().from(agendasTable).where(eq(agendasTable.company, fields.companyName));
    const drafts = await Promise.all([call(`/${record.id}/agenda-draft`), call(`/${record.id}/agenda-draft`, undefined, "fixture-colleague")]);
    for (const response of drafts) {
      assert.equal(response.status, 200);
      assert.match(response.headers.get("cache-control"), /private, no-store/);
      const draft = await response.json();
      assert.equal(draft.id, undefined);
      assert.equal(draft.company, fields.companyName);
      for (const [key, index] of [["description", 0], ["currentState", 1], ["conversation", 2], ["problems", 3], ["outcomes", 4]]) {
        assert.match(draft[key], new RegExp(`Section ${index}:`));
        assert.match(draft[key], /\[1\]/);
      }
      assert.equal(draft.logoPath, null);
      assert.match(draft.outcomes, /https:\/\/example\.com\//);
    }
    const after = await db.select().from(agendasTable).where(eq(agendasTable.company, fields.companyName));
    assert.deepEqual(after, before, "Preparing or canceling a draft cannot create an agenda");
    const unchanged = await (await call(`/${record.id}`)).json();
    assert.equal(unchanged.agendaId, null);
    assert.deepEqual(unchanged.report, report);
    assert.equal((await call("/not-a-uuid/agenda-draft")).status, 404);
    assert.equal((await call(`/${randomUUID()}/agenda-draft`)).status, 404);
  });
  await test("conversion maps all five sections, retains citations, and never overwrites an edited agenda", async () => {
    const conversions = await Promise.all([
      call(`/${record.id}/agenda`, {}, "fixture-colleague"),
      call(`/${record.id}/agenda`, {}, "fixture-colleague"),
    ]);
    for (const response of conversions) assert.equal(response.status, 200);
    const [agenda, retry] = await Promise.all(conversions.map(response => response.json()));
    agendaIds.push(agenda.id);
    assert.equal(agenda.id, retry.id);
    assert.equal(agenda.company, fields.companyName);
    for (const [key, i] of [["description", 0], ["currentState", 1], ["conversation", 2], ["problems", 3], ["outcomes", 4]]) {
      assert.ok(agenda[key].includes(`Section ${i}:`));
      assert.ok(!agenda[key].includes("**"));
      assert.ok(agenda[key].includes("[1]"));
    }
    assert.match(agenda.outcomes, /Official website \(https:\/\/example\.com\/\)/);
    await db.update(agendasTable).set({ outcomes: "Keep the presenter's edits." }).where(eq(agendasTable.id, agenda.id));
    const again = await call(`/${record.id}/agenda`, {});
    assert.equal((await again.json()).outcomes, "Keep the presenter's edits.");
    const original = await (await call(`/${record.id}`)).json();
    assert.equal(original.report.markdown, markdown);
    assert.equal(original.agendaId, agenda.id);
    const freshDraft = await (await call(`/${record.id}/agenda-draft`)).json();
    assert.notEqual(freshDraft.outcomes, "Keep the presenter's edits.");
    assert.equal((await db.select().from(agendasTable).where(eq(agendasTable.id, agenda.id)))[0].outcomes, "Keep the presenter's edits.");
  });
  await test("partial reports, mismatched context and arbitrary logo URLs cannot be saved", async () => {
    for (const input of [
      { saveKey: savedKeys[1], fields, report: { ...report, markdown: "Incomplete" } },
      { saveKey: savedKeys[1], fields, report: { ...report, companyName: "Different account" } },
      { saveKey: savedKeys[1], fields, report, logoUrl: "https://localhost/private" },
    ]) assert.equal((await call("", input)).status, 400);
    assert.equal((await call("/not-a-uuid")).status, 404);
  });
  await test("an expired logo is reported explicitly without losing the research", async () => {
    const response = await call("", { saveKey: savedKeys[1], fields, report, logoUrl: `/api/demo-research/logo/${randomUUID()}` });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.company.logoUrl, null);
    assert.match(data.logoNote, /without a logo/);
    assert.equal(data.report.markdown, markdown);
  });
  await test("oversized conversion fails explicitly and preserves the complete saved original", async () => {
    const longReport = { ...report, markdown: markdown.replace("Section 0:", "X".repeat(6000)) };
    const saved = await (await call("", { saveKey: savedKeys[2], fields, report: longReport })).json();
    assert.equal((await call(`/${saved.id}/agenda`, {})).status, 422);
    assert.equal((await call(`/${saved.id}/agenda-draft`)).status, 422);
    const unchanged = await (await call(`/${saved.id}`)).json();
    assert.equal(unchanged.report.markdown, longReport.markdown);
    assert.equal(unchanged.agendaId, null);
    assert.throws(() => researchToAgenda({ ...report, markdown: "Not complete" }));
  });
} finally {
  await db.delete(researchReportsTable).where(inArray(researchReportsTable.saveKey, savedKeys));
  if (agendaIds.length) await db.delete(agendasTable).where(inArray(agendasTable.id, agendaIds));
  await new Promise(resolve => server.close(resolve));
  await pool.end();
}
