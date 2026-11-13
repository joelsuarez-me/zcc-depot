import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create } from "react-test-renderer";
import { AgendaPdfAction } from "../src/components/agenda-pdf-action.tsx";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const agenda = { id: "saved-id", company: "Morningstar", updatedAt: "2020-01-01T00:00:00Z", logoPath: null };
async function harness(run, { dirty = false, blocked = false, fail = false, logoPath = null, unsaved = false } = {}) {
  const originalWindow = globalThis.window, originalFetch = globalThis.fetch;
  const calls = [], timers = [], viewer = { opener: "parent", document: {}, location: {}, closed: false, close() { this.closed = true; } };
  const filename = "Demo-Agenda-Morningstar-2026-11-13.pdf";
  globalThis.window = {
    open(...args) { calls.push(["open", ...args]); return blocked ? null : viewer; },
    setTimeout(fn) { timers.push(fn); return timers.length; },
  };
  globalThis.fetch = async (url, options) => { calls.push(["fetch", url, options]); throw new Error("Logo unavailable"); };
  globalThis.__agendaPdf = {
    filename: () => filename,
    create(value, logo) {
      calls.push(["create", value, logo]); if (fail) throw new Error("Export failed");
      return { autoPrint() { calls.push(["print"]); }, output() { return new Blob(["%PDF-1.7"]); },
        save(name) { calls.push(["save", name]); }, setProperties(value) { calls.push(["metadata", value]); } };
    },
  };
  let root;
  try {
    await act(async () => { root = create(React.createElement(AgendaPdfAction, { agenda: unsaved ? undefined : { ...agenda, logoPath }, dirty, busy: false })); });
    const click = async id => act(async () => { root.root.findByProps({ "data-testid": id }).props.onClick(); await new Promise(resolve => setImmediate(resolve)); });
    await run({ root, click, calls, viewer, filename });
  } finally {
    await act(async () => root?.unmount());
    timers.forEach(fn => fn()); globalThis.window = originalWindow; globalThis.fetch = originalFetch;
    delete globalThis.__agendaPdf;
  }
}
test("new drafts display both PDF buttons with a clear save-first instruction", () => harness(async ({ root, click, calls }) => {
  assert.equal(root.root.findByProps({ "data-testid": "button-print-agenda-pdf" }).props.disabled, true);
  assert.equal(root.root.findByProps({ "data-testid": "button-download-agenda-pdf" }).props.disabled, true);
  assert.match(JSON.stringify(root.toJSON()), /Save agenda to enable PDF export/);
  await click("button-print-agenda-pdf"); assert.equal(calls.length, 0);
}, { unsaved: true }));
test("unsaved edits block both print and download without opening a viewer", () => harness(async ({ root, click, calls }) => {
  assert.equal(root.root.findByProps({ "data-testid": "button-print-agenda-pdf" }).props.disabled, true);
  await click("button-print-agenda-pdf"); await click("button-download-agenda-pdf");
  assert.equal(calls.length, 0);
}, { dirty: true }));
test("Print PDF uses only the saved agenda and requests the viewer print action", () => harness(async ({ click, calls, viewer, filename }) => {
  await click("button-print-agenda-pdf");
  assert.equal(calls.filter(c => c[0] === "create").length, 1);
  assert.equal(calls.find(c => c[0] === "create")[1].id, "saved-id");
  assert.ok(calls.some(c => c[0] === "print")); assert.ok(!calls.some(c => c[0] === "save"));
  assert.equal(viewer.opener, null); assert.match(viewer.location.href, /^blob:/);
  assert.equal(calls.find(c => c[0] === "metadata")[1].title, filename);
}));
test("Download PDF uses the exact named file without opening a print window", () => harness(async ({ click, calls, filename }) => {
  await click("button-download-agenda-pdf");
  assert.deepEqual(calls.find(c => c[0] === "save"), ["save", filename]);
  assert.ok(!calls.some(c => ["open", "print"].includes(c[0])));
}));
test("popup blocking falls back to a named printable download", () => harness(async ({ click, calls, root, filename }) => {
  await click("button-print-agenda-pdf");
  assert.deepEqual(calls.find(c => c[0] === "save"), ["save", filename]);
  assert.match(JSON.stringify(root.toJSON()), /blocked the PDF tab/);
}, { blocked: true }));
test("unavailable logos are disclosed and never prevent the saved agenda export", () => harness(async ({ click, calls, root }) => {
  await click("button-download-agenda-pdf");
  assert.equal(calls.find(c => c[0] === "fetch")[2].credentials, "include");
  assert.equal(calls.find(c => c[0] === "create")[2], undefined);
  assert.match(JSON.stringify(root.toJSON()), /logo was unavailable/);
  assert.ok(calls.some(c => c[0] === "save"));
}, { logoPath: "/test-logo" }));
test("export errors close the empty viewer and leave the saved agenda unchanged", () => harness(async ({ click, viewer, root }) => {
  await click("button-print-agenda-pdf");
  assert.equal(viewer.closed, true);
  assert.match(JSON.stringify(root.toJSON()), /saved agenda is unchanged/);
  assert.equal(root.root.findByProps({ "data-testid": "button-print-agenda-pdf" }).props.disabled, false);
}, { fail: true }));
