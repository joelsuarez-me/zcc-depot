import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { create } from "react-test-renderer";
import { ResearchAgendaPicker } from "../src/components/research-agenda-picker.tsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const report = { id: "11111111-1111-4111-8111-111111111111", companyName: "Example QA", region: "Test", audience: "Architect", researchedAt: "2026-11-13T12:00:00Z", savedAt: "2026-11-13T12:01:00Z" };
const draft = { company: report.companyName, description: "Review evidence [1]", conversation: "Demo scenario", logoPath: null };
let applied, closes, logins, props;
function setup() {
  applied = []; closes = []; logins = 0;
  globalThis.__draftApi = {
    library: { data: [report], isLoading: false, isError: false, refetch() {} },
    get: async () => draft,
  };
  props = { open: true, userId: "qa", onOpenChange: value => closes.push(value),
    onLogin: () => logins++, onDraft: (...args) => { applied.push(args); return true; } };
}
const text = root => JSON.stringify(root.toJSON());
const choose = root => root.root.findByProps({ "data-testid": `button-draft-research-${report.id}` });
test("selecting research passes unsaved fields for editing and respects discard cancellation", async () => {
  setup(); let root;
  try {
    props.onDraft = () => false;
    await act(async () => { root = create(React.createElement(ResearchAgendaPicker, props)); });
    await act(async () => { await choose(root).props.onClick(); });
    // The click handler intentionally starts work without returning its promise.
    await act(async () => {});
    assert.deepEqual(closes, [], "Declining to discard must keep the picker open");
    props.onDraft = (...args) => { applied.push(args); return true; };
    await act(async () => root.update(React.createElement(ResearchAgendaPicker, props)));
    await act(async () => { choose(root).props.onClick(); });
    assert.deepEqual(applied, [[draft, report]]);
    assert.deepEqual(closes, [false]);
    assert.equal(applied[0][0].id, undefined, "Conversion yields fields, not a saved agenda");
  } finally { await act(async () => root?.unmount()); }
});
test("saved reports are searchable and an empty library links to Demo Researcher", async () => {
  setup(); let root;
  try {
    await act(async () => { root = create(React.createElement(ResearchAgendaPicker, props)); });
    await act(async () => root.root.findByProps({ "data-testid": "input-agenda-research-search" }).props.onChange({ target: { value: "No match" } }));
    assert.match(text(root), /No saved reports match/);
    __draftApi.library.data = [];
    await act(async () => root.update(React.createElement(ResearchAgendaPicker, props)));
    assert.match(text(root), /No saved research yet/);
    assert.equal(root.root.findByType("a").props.href, "/demos/brief");
  } finally { await act(async () => root?.unmount()); }
});
test("loading, list failures and expired conversion sessions are actionable without changing the agenda", async () => {
  setup(); let root;
  try {
    __draftApi.library.isLoading = true;
    await act(async () => { root = create(React.createElement(ResearchAgendaPicker, props)); });
    assert.match(text(root), /Loading saved research/);
    Object.assign(__draftApi.library, { isLoading: false, isError: true, error: { status: 401 } });
    await act(async () => root.update(React.createElement(ResearchAgendaPicker, props)));
    assert.match(text(root), /Your session expired/);
    const login = root.root.findAllByType("button").find(b => b.children.includes("Sign in again"));
    await act(async () => login.props.onClick());
    assert.equal(logins, 1);
    __draftApi.library.isError = false;
    __draftApi.get = async () => { throw { status: 422, data: { error: "This report exceeds field limits." } }; };
    await act(async () => root.update(React.createElement(ResearchAgendaPicker, props)));
    await act(async () => { choose(root).props.onClick(); });
    assert.match(text(root), /exceeds field limits/);
    assert.deepEqual(applied, []);
    __draftApi.get = async () => { throw { status: 401 }; };
    await act(async () => { choose(root).props.onClick(); });
    assert.match(text(root), /Your session expired/);
    assert.deepEqual(closes, []);
  } finally { await act(async () => root?.unmount()); }
});
test("repeat clicks are deduplicated and closing cancels a pending draft", async () => {
  setup(); let root, finish, signal, gets = 0;
  try {
    __draftApi.get = (_id, options) => { gets++; signal = options.signal; return new Promise(resolve => { finish = resolve; }); };
    await act(async () => { root = create(React.createElement(ResearchAgendaPicker, props)); });
    await act(async () => { choose(root).props.onClick(); choose(root).props.onClick(); });
    assert.equal(gets, 1);
    await act(async () => root.update(React.createElement(ResearchAgendaPicker, { ...props, open: false })));
    assert.equal(signal.aborted, true);
    await act(async () => finish(draft));
    assert.deepEqual(applied, []);
    assert.deepEqual(closes, []);
  } finally { await act(async () => root?.unmount()); }
});
