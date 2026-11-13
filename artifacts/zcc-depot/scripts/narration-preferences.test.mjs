import assert from "node:assert/strict";
import { test } from "node:test";
import React, { act } from "react";
import { create } from "react-test-renderer";
import { NarrationProvider, useNarration } from "../src/components/demo-nuggets/narration-provider.tsx";
import { useNarratedDemo } from "../src/hooks/use-narrated-demo.ts";
import { DEMO_NUGGETS } from "../src/data/demo-nuggets.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.document = new EventTarget();
globalThis.document.hidden = false;
globalThis.window = new EventTarget();
globalThis.window.location = { search: "" };
let audioPlays = 0;
globalThis.Audio = class extends EventTarget {
  src = ""; volume = 1; currentTime = 0; duration = 10;
  async play() { audioPlays++; }
  pause() {}
  load() {}
  removeAttribute() { this.src = ""; }
};
const defaults = () => ({ voices: {}, enabled: true, volume: .9, captions: true });
const saved = () => ({
  voices: { caller: "b", "ai-agent": "a", "human-agent": "b", narrator: "a" },
  enabled: true, volume: .35, captions: false,
});
const wait = () => act(() => new Promise(resolve => setTimeout(resolve, 450)));
let n;
let player;
const onActiveChange = () => {};
function Probe() {
  n = useNarration();
  player = useNarratedDemo({ nugget: DEMO_NUGGETS[0], activeId: null, onActiveChange });
  return null;
}
async function mount(t, options = {}, requireOptIn = false) {
  audioPlays = 0;
  const records = new Map([["one", saved()], ["two", { ...defaults(), enabled: false }]]);
  const writes = [], speech = [], loads = [];
  globalThis.__narrationAuth = { user: { id: "one" }, isAuthenticated: true };
  globalThis.__narrationCatalog = {
    data: { voices: [{ id: "a", name: "A" }, { id: "b", name: "B" }], lines: [{ nuggetId: "voice-copilot", id: "line", role: "caller" }] },
  };
  globalThis.__narrationApi = {
    async get() { const owner = globalThis.__narrationAuth.user.id; loads.push(owner); return structuredClone(records.get(owner) ?? defaults()); },
    async save(value) { const owner = globalThis.__narrationAuth.user.id; writes.push({ owner, value }); records.set(owner, structuredClone(value)); return value; },
    async speech(...args) { speech.push(args); return new Blob(["audio"], { type: "audio/mpeg" }); },
    ...options,
  };
  let root, stops = 0;
  const element = () => React.createElement(NarrationProvider, { requireOptIn, onStop() { stops++; } }, React.createElement(Probe));
  await act(async () => { root = create(element()); });
  t.after(async () => {
    assert.equal(audioPlays, 0, "restoring, changing, retrying or resetting settings must never play audio");
    assert.equal(player.pb.playing, false);
    await act(() => root.unmount());
  });
  return {
    records, writes, speech, loads, root, stops: () => stops,
    async rerender() { await act(async () => root.update(element())); },
    async revisit() {
      await act(async () => root.unmount());
      await act(async () => { root = create(element()); });
    },
  };
}

test("restores all role assignments and playback preferences without autoplay or saving defaults", async t => {
  const h = await mount(t);
  assert.deepEqual(n.selected, saved().voices);
  assert.equal(n.volume, .35);
  assert.equal(n.captions, false);
  assert.equal(n.enabled, true);
  await wait();
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.speech, []);
});
test("unavailable saved IDs are preserved and block narration, not silently substituted", async t => {
  const h = await mount(t, { get: async () => ({ ...saved(), voices: { caller: "removed" } }) });
  assert.equal(n.selected.caller, "removed");
  assert.equal(n.unavailableRoles[0].id, "caller");
  await assert.rejects(n.getClip("voice-copilot", "line", new AbortController().signal), /saved voice is unavailable/);
  assert.equal(h.speech.length, 0);
  await act(() => n.setVoice("caller", "a"));
  assert.equal(n.unavailableRoles.length, 0);
  assert.equal(h.speech.length, 0);
  await wait();
  assert.equal(h.writes.at(-1).value.voices.caller, "a");
});
test("changes save to the current account, reset stays private, and switching users clears settings", async t => {
  const h = await mount(t);
  await act(() => { n.setVolume(.6); n.setCaptions(true); n.setVoice("caller", "a"); n.setEnabled(false); });
  await wait();
  assert.equal(h.writes.length, 1);
  assert.deepEqual(h.writes[0].value, { voices: { ...saved().voices, caller: "a" }, volume: .6, captions: true, enabled: false });
  await h.revisit();
  assert.equal(n.volume, .6);
  assert.equal(n.captions, true);
  assert.equal(n.wanted, false);
  assert.equal(n.selected.caller, "a");
  globalThis.__narrationAuth = { user: { id: "two" }, isAuthenticated: true };
  await h.rerender();
  assert.equal(n.volume, .9);
  assert.equal(n.wanted, false);
  await act(() => n.resetPreferences());
  await wait();
  assert.deepEqual(h.records.get("two"), defaults());
  assert.equal(h.records.get("one").volume, .6);
  assert.equal(h.speech.length, 0);
  globalThis.__narrationAuth = { user: null, isAuthenticated: false };
  await h.rerender();
  assert.equal(n.enabled, false);
  assert.equal(n.volume, .9);
  assert.deepEqual(n.selected, { caller: "", "ai-agent": "", "human-agent": "", narrator: "" });
});
test("failed loads cannot overwrite saved settings and expose a retry", async t => {
  const h = await mount(t, { get: async () => { throw new Error("offline"); } });
  assert.equal(n.preferencesReady, false);
  assert.equal(n.preferencesError, true);
  await act(() => n.setVolume(.2));
  await wait();
  assert.deepEqual(h.writes, []);
  globalThis.__narrationApi.get = async () => saved();
  await act(async () => n.retryPreferences());
  assert.equal(n.preferencesReady, true);
  assert.equal(n.volume, .35);
  assert.deepEqual(h.writes, []);
});
test("failed saves are visible and retry preserves local choices", async t => {
  const h = await mount(t, { save: async () => { throw new Error("offline"); } });
  await act(() => n.setVolume(.5));
  await wait();
  assert.equal(n.preferencesError, true);
  assert.match(n.preferencesStatus, /Could not save/);
  assert.equal(n.volume, .5);
  globalThis.__narrationApi.save = async value => { h.writes.push(value); return value; };
  await act(async () => n.retryPreferences());
  await wait();
  assert.equal(n.preferencesError, false);
  assert.equal(h.writes[0].volume, .5);
  assert.equal(h.speech.length, 0);
});
test("edits made during an in-flight write are saved afterwards in order", async t => {
  let finish;
  const h = await mount(t, { save: value => {
    h.writes.push(value);
    if (h.writes.length === 1) return new Promise(resolve => { finish = () => resolve(value); });
    return Promise.resolve(value);
  } });
  await act(() => n.setVolume(.1));
  await wait();
  await act(() => n.setVolume(.8));
  await wait();
  assert.equal(h.writes.length, 1);
  await act(async () => finish());
  await wait();
  assert.deepEqual(h.writes.map(value => value.volume), [.1, .8]);
  assert.match(n.preferencesStatus, /saved to your account/);
});
test("a late load from the previous account cannot replace the new account", async t => {
  let finish;
  const h = await mount(t, { get: () => new Promise(resolve => { finish = resolve; }) });
  const finishFirst = finish;
  globalThis.__narrationAuth = { user: { id: "two" }, isAuthenticated: true };
  globalThis.__narrationApi.get = async () => ({ ...defaults(), volume: .7 });
  await h.rerender();
  await act(async () => finishFirst(saved()));
  assert.equal(n.volume, .7);
  assert.equal(h.speech.length, 0);
});

test("shared playlists require fresh narration consent without overwriting saved overlay settings", async t => {
  const h = await mount(t, {}, true);
  assert.equal(n.enabled, false);
  assert.equal(n.wanted, false, "the receiving presenter's checkbox starts off");
  await assert.rejects(n.getClip("voice-copilot", "line", new AbortController().signal), /Enable/);
  await wait();
  assert.deepEqual(h.writes, [], "opening a link does not save a preference change");
  assert.equal(h.records.get("one").enabled, true);
  await act(() => n.setEnabled(true));
  assert.equal(n.enabled, true);
  assert.equal(h.speech.length, 0, "opting in still requires Play");
  await h.revisit();
  assert.equal(n.enabled, false, "each shared-link visit needs consent");
});

test("hiding the tab, page navigation, and unmount stop demos and voice auditions", async t => {
  await mount(t);
  let demoStops = 0, previewStops = 0;
  n.register("voice-copilot", () => demoStops++);
  n.registerPreview(() => previewStops++);
  await act(() => {
    document.hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(demoStops, 1);
  assert.equal(previewStops, 1);
  await act(() => window.dispatchEvent(new Event("pagehide")));
  assert.equal(demoStops, 2);
  assert.equal(previewStops, 2);
  document.hidden = false;
  window.location.search = "?playlist=voice-qa";
  await act(() => window.dispatchEvent(new Event("popstate")));
  assert.equal(n.enabled, false, "history navigation into shared playback also requires consent");
  assert.equal(demoStops, 3);
  assert.equal(previewStops, 3);
  window.location.search = "";
});

test("claiming a demo stops every other narration and any voice audition", async t => {
  await mount(t);
  const counts = Object.fromEntries(DEMO_NUGGETS.map(demo => [demo.id, 0]));
  for (const demo of DEMO_NUGGETS) n.register(demo.id, () => counts[demo.id]++);
  let previews = 0;
  n.registerPreview(() => previews++);
  await act(() => n.claim("voice-qa"));
  assert.deepEqual(counts, { "voice-copilot": 1, "voice-qa": 0, "voice-ai-agents": 1, "video-screen-sharing": 1 });
  assert.equal(previews, 1);
  await act(() => n.claim("video-screen-sharing"));
  assert.equal(counts["voice-qa"], 1, "switching demos synchronously stops the previous narration");
});
