import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create } from "react-test-renderer";
import { UseCaseShortlists } from "../src/components/vertical-use-cases/shortlists.tsx";
import { mayLeavePrivateContext } from "../src/lib/unsaved-shortlist.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const text = root => JSON.stringify(root.toJSON());
const button = (root, label) => root.root.findAllByType("button").find(node => node.children.join("") === label);
const click = async (root, label) => act(async () => { button(root, label).props.onClick(); await new Promise(setImmediate); });
const input = async (root, id, value) => act(async () => {
  root.root.findByProps({ "data-testid": id }).props.onChange({ target: { value } });
});
const submit = async root => act(async () => {
  root.root.findByType("form").props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
});
async function harness(run, authorized = true) {
  const originals = Object.fromEntries(["window", "history", "location"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const win = new EventTarget();
  let url = new URL("https://example.com/sales/use-cases-by-vertical");
  const confirmations = [];
  let accept = false;
  win.confirm = message => { confirmations.push(message); return accept; };
  win.alert = message => confirmations.push(message);
  Object.defineProperty(win, "location", { get: () => url });
  const history = {
    state: null,
    pushState(state, _, next) { this.state = state; if (next != null) url = new URL(next, url); },
    replaceState(state, _, next) { this.state = state; if (next != null) url = new URL(next, url); },
  };
  win.history = history;
  for (const [key, get] of [["window", () => win], ["history", () => history], ["location", () => url]]) {
    Object.defineProperty(globalThis, key, { configurable: true, get });
  }
  const rows = new Map();
  const calls = [];
  const fixture = { id: "saved-id", name: "Saved discussion", customer: "Example customer", notes: "Existing notes", scenarioIds: ["pharma-life-sciences-adverse-event"], revision: 1 };
  rows.set(fixture.id, fixture);
  const api = globalThis.__shortlists = {
    authorized, invalidations: 0,
    list: { data: [fixture], isLoading: false, isError: false, error: null },
    async get(id) { calls.push(["get", id]); return structuredClone(rows.get(id)); },
    async create(data) { calls.push(["create", structuredClone(data)]); const row = { ...structuredClone(data), id: "new-id", revision: 1 }; rows.set(row.id, row); return row; },
    async update(id, data) { calls.push(["update", id, structuredClone(data)]); const row = { ...structuredClone(data), id, revision: data.revision + 1 }; rows.set(id, row); return row; },
    async delete(id, data) { calls.push(["delete", id, data]); rows.delete(id); },
  };
  let root;
  try {
    await act(async () => { root = create(React.createElement(UseCaseShortlists, { selectedId: "financial-services-banking-routing", onOpen: id => calls.push(["open-scenario", id]) })); });
    await run({ root, api, rows, calls, win, confirmations, history, accept: value => { accept = value; }, setUrl: value => { url = new URL(value, url); } });
  } finally {
    if (root) await act(async () => root.unmount());
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
}

test("Customer mode never mounts or loads the shortlist editor", () => harness(async ({ root, calls }) => {
  assert.doesNotMatch(text(root), /Existing notes|input-shortlist-customer|Example customer/);
  assert.equal(calls.length, 0);
}, false));

test("create, update, reopen, selection removal and confirmed shared deletion", () => harness(async ({ root, calls, accept, api }) => {
  await input(root, "input-shortlist-name", "Customer discussion");
  await input(root, "input-shortlist-customer", "Example");
  await input(root, "input-shortlist-notes", "Discussion notes");
  await click(root, "Add current scenario");
  assert.match(text(root), /Unsaved changes/);
  await submit(root);
  assert.deepEqual(calls[0], ["create", { name: "Customer discussion", customer: "Example", notes: "Discussion notes", scenarioIds: ["financial-services-banking-routing"] }]);
  assert.match(text(root), /All changes saved/);
  await input(root, "input-shortlist-notes", "");
  await submit(root);
  assert.equal(calls.at(-1)[0], "update"); assert.equal(calls.at(-1)[2].notes, "");
  assert.equal(calls.at(-1)[2].revision, 1);
  await input(root, "select-shortlist", "saved-id");
  await click(root, "Open shortlist");
  assert.equal(root.root.findByProps({ "data-testid": "input-shortlist-notes" }).props.value, "Existing notes");
  const item = root.root.findByProps({ "aria-label": "Shortlisted scenarios" });
  await act(async () => item.findAllByType("button")[0].props.onClick());
  assert.deepEqual(calls.at(-1), ["open-scenario", "pharma-life-sciences-adverse-event"]);
  await act(async () => item.findAllByType("button")[1].props.onClick());
  assert.equal(root.root.findByProps({ "aria-label": "Shortlisted scenarios" }).children.length, 0);
  await click(root, "Delete shortlist"); assert.notEqual(calls.at(-1)[0], "delete");
  accept(true);
  await click(root, "Delete shortlist");
  assert.deepEqual(calls.at(-1), ["delete", "saved-id", { revision: 1 }]);
  assert.match(text(root), /Shortlist deleted/); assert.equal(api.invalidations, 3);
}));

test("unsaved edits survive canceled replacement, route exits, mode change, logout and failed save", () => harness(async ({ root, api, win, history, confirmations, accept, setUrl }) => {
  await input(root, "input-shortlist-name", "Do not lose");
  await input(root, "select-shortlist", "saved-id");
  await click(root, "Open shortlist");
  await click(root, "New shortlist");
  assert.equal(root.root.findByProps({ "data-testid": "input-shortlist-name" }).props.value, "Do not lose");
  assert.equal(mayLeavePrivateContext(), false);
  history.pushState(null, "", "/sales");
  assert.equal(win.location.pathname, "/sales/use-cases-by-vertical");
  history.replaceState(null, "", "?q=banking&case=banking-routing");
  assert.equal(win.location.search, "?q=banking&case=banking-routing");
  const unload = new Event("beforeunload", { cancelable: true });
  win.dispatchEvent(unload); assert.equal(unload.defaultPrevented, true);
  setUrl("/sales");
  win.dispatchEvent(new Event("popstate"));
  assert.equal(win.location.pathname, "/sales/use-cases-by-vertical");
  assert.ok(confirmations.length >= 5);
  api.create = async () => { throw new Error("Save failed: retained draft"); };
  await input(root, "input-shortlist-customer", "Example");
  await click(root, "Add current scenario");
  await submit(root);
  assert.match(text(root), /Save failed: retained draft/);
  assert.match(text(root), /Unsaved changes/);
  assert.equal(root.root.findByProps({ "data-testid": "input-shortlist-name" }).props.value, "Do not lose");
  accept(true);
  await click(root, "Discard changes");
  assert.equal(root.root.findByProps({ "data-testid": "input-shortlist-name" }).props.value, "");
  assert.equal(mayLeavePrivateContext(), true);
}));
