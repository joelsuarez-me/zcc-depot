import assert from "node:assert/strict";
import test from "node:test";
import { attachHashNavigation, fragmentId } from "../src/lib/hash-navigation.ts";

function fixture(hash = "#library") {
  const frames = new Map();
  let serial = 0, observerCallback;
  globalThis.MutationObserver = class {
    constructor(cb) { observerCallback = cb; }
    observe() {}
    disconnect() {}
  };
  const calls = [];
  const targets = new Map();
  const win = Object.assign(new EventTarget(), {
    location: new URL(`https://example.test/resources${hash}`),
    requestAnimationFrame(cb) { frames.set(++serial, cb); return serial; },
    cancelAnimationFrame(id) { frames.delete(id); },
    scrollTo(value) { calls.push(["top", value]); },
  });
  const doc = Object.assign(new EventTarget(), {
    getElementById(id) { return id === "main" ? {} : targets.get(id); },
  });
  const add = id => targets.set(id, { scrollIntoView(options) { calls.push([id, options]); } });
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb()); };
  const mutate = () => observerCallback?.();
  return { win, doc, calls, add, flush, mutate };
}

test("fragments are decoded safely", () => {
  assert.equal(fragmentId("#ai-suggestions"), "ai-suggestions");
  assert.equal(fragmentId("#some%20name"), "some name");
  assert.equal(fragmentId("#bad%zz"), "bad%zz");
});

test("direct load waits for the lazy page section", () => {
  const f = fixture(); const cleanup = attachHashNavigation(f.win, f.doc);
  f.flush(); assert.equal(f.calls.length, 0);
  f.add("library"); f.mutate(); f.flush();
  assert.equal(f.calls[0][0], "library");
  cleanup();
});

test("same-page router pushState and history navigation scroll to each section", () => {
  const f = fixture();
  ["library", "ai-suggestions", "pitch-deck"].forEach(f.add);
  const cleanup = attachHashNavigation(f.win, f.doc); f.flush();
  for (const [event, id] of [["pushState", "ai-suggestions"], ["replaceState", "pitch-deck"], ["popstate", "library"], ["hashchange", "pitch-deck"]]) {
    f.win.location.hash = id;
    f.win.dispatchEvent(new Event(event)); f.flush();
    assert.equal(f.calls.at(-1)[0], id);
  }
  cleanup();
});

test("repeated native anchor clicks scroll again without preventing default", async () => {
  const f = fixture(); f.add("library");
  const cleanup = attachHashNavigation(f.win, f.doc); f.flush();
  const anchor = { getAttribute: name => name === "href" ? "#library" : null };
  const event = new Event("click", { cancelable: true });
  Object.defineProperties(event, { button: { value: 0 }, target: { value: { closest: () => anchor } } });
  f.doc.dispatchEvent(event); await Promise.resolve(); f.flush();
  assert.equal(f.calls.length, 2); assert.equal(event.defaultPrevented, false);
  cleanup();
});

test("cleanup removes history listeners and pending scrolls", () => {
  const f = fixture(); f.add("library");
  const cleanup = attachHashNavigation(f.win, f.doc); cleanup(); f.flush();
  f.win.dispatchEvent(new Event("pushState")); f.flush();
  assert.equal(f.calls.length, 0);
});

test("navigation without a fragment returns to the top", () => {
  const f = fixture(""); const cleanup = attachHashNavigation(f.win, f.doc);
  assert.equal(f.calls[0][0], "top");
  cleanup();
});
