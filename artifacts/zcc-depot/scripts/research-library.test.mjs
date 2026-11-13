import test from "node:test";
import assert from "node:assert/strict";
import React, { useCallback, useState, StrictMode } from "react";
import { create, act } from "react-test-renderer";
import { useResearchLibrary } from "../src/lib/use-research-library.ts";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const fields = { companyName: "Fixture company", companyWebsite: "https://example.com/", region: "Test", audience: "Architects" };
const report = { ...fields, markdown: "Saved research", sources: [], researchedAt: "2026-11-12T10:00:00Z" };
const company = { ...fields, logoUrl: null, logoSourceUrl: null, note: "" };
const record = { id: "11111111-1111-4111-8111-111111111111", fields, report, company, savedAt: report.researchedAt, agendaId: null, logoNote: "" };
let controller, change, opened, navigations;
function Harness({ initial = null, userId = "fixture-user" }) {
  const [current, setCurrent] = useState(initial); change = setCurrent;
  const onOpen = useCallback(saved => { opened.push(saved); setCurrent({ fields: saved.fields, report: saved.report, company: saved.company }); }, []);
  controller = useResearchLibrary({ userId, current, onOpen });
  return null;
}
function setup(query = "") {
  opened = []; navigations = [];
  globalThis.window = {
    location: { href: `https://portal.example/demos/brief${query}`, search: query, assign: url => navigations.push(url) },
    history: { replaceState(_state, _title, url) { window.location.href = String(url); } },
    confirm: () => true, setTimeout, clearTimeout,
  };
  globalThis.__researchApi = {
    list: async () => [], get: async () => record, save: async () => record,
    convert: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
  };
}
const initial = { fields, report, company };
test("saving retries reuse the same key, then conversion navigates to an editable agenda", async () => {
  setup();
  const keys = [];
  let attempts = 0;
  __researchApi.save = async input => { keys.push(input.saveKey); if (++attempts === 1) throw Error("Network"); return record; };
  let root;
  try {
    await act(async () => { root = create(React.createElement(Harness, { initial })); });
    await act(async () => { await controller.save(); });
    assert.match(controller.error, /could not be saved/);
    await act(async () => { await controller.save(); });
    assert.equal(keys[0], keys[1]);
    assert.equal(controller.saved.id, record.id);
    assert.match(window.location.href, /report=11111111/);
    await act(async () => { await controller.convert(); });
    assert.equal(attempts, 2);
    assert.deepEqual(navigations, ["/agenda?agenda=22222222-2222-4222-8222-222222222222"]);
  } finally { await act(async () => root?.unmount()); }
});
test("opening protects an unsaved report, loads stored context without AI, and resets on a new report", async () => {
  setup();
  let gets = 0;
  __researchApi.get = async () => { gets++; return record; };
  let root;
  try {
    await act(async () => { root = create(React.createElement(Harness, { initial })); });
    window.confirm = () => false;
    await act(async () => { await controller.open(record.id); });
    assert.equal(gets, 0);
    window.confirm = () => true;
    await act(async () => { await controller.open(record.id); });
    assert.equal(gets, 1); assert.equal(opened.length, 1);
    assert.equal(controller.saved.id, record.id);
    await act(async () => { change({ ...initial, report: { ...report, researchedAt: "2026-11-13" } }); });
    assert.equal(controller.saved, null);
    assert.equal(new URL(window.location.href).searchParams.has("report"), false);
  } finally { await act(async () => root?.unmount()); }
});
test("saved-report direct links survive StrictMode and opening them does not rerun research", async () => {
  setup(`?report=${record.id}`);
  let root;
  try {
    await act(async () => { root = create(React.createElement(StrictMode, null, React.createElement(Harness))); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); });
    assert.equal(opened.length, 1);
    assert.equal(controller.saved.id, record.id);
  } finally { await act(async () => root?.unmount()); }
});
test("expired sessions and conversion failures stay visible without navigating or dropping a saved report", async () => {
  setup();
  let root;
  try {
    await act(async () => { root = create(React.createElement(Harness, { initial })); });
    await act(async () => { await controller.save(); });
    __researchApi.convert = async () => { throw { status: 422, data: { error: "Report exceeds the agenda limits." } }; };
    await act(async () => { await controller.convert(); });
    assert.match(controller.error, /exceeds/);
    assert.equal(controller.saved.id, record.id);
    assert.equal(navigations.length, 0);
    __researchApi.list = async () => { throw { status: 401 }; };
    await act(async () => { await controller.refresh(); });
    assert.match(controller.listError, /session expired/);
  } finally { await act(async () => root?.unmount()); }
});
