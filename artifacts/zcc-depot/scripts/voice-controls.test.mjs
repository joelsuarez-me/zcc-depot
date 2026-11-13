import assert from "node:assert/strict";
import { test } from "node:test";
import React, { act, StrictMode } from "react";
import { create } from "react-test-renderer";
import { VoiceTalentControls } from "../src/components/demo-nuggets/voice-talent-controls.tsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const audio = [];
globalThis.Audio = class {
  src = ""; volume = 1; onended = null; onerror = null; pauses = 0;
  constructor() { audio.push(this); }
  async play() {}
  pause() { this.pauses++; }
  removeAttribute() { this.src = ""; }
  load() {}
};
function fixture(authenticated = true) {
  const applied = [], requests = [];
  let stop;
  const n = {
    auth: { isAuthenticated: authenticated, login() {} },
    enabled: authenticated, wanted: true, volume: .9, captions: true,
    voices: [{ id: "a", name: "Liam" }, { id: "b", name: "Laura" }],
    selected: { caller: "a", "ai-agent": "b", "human-agent": "b", narrator: "a" },
    lines: [{ role: "caller", text: "A prepared caller sample." }],
    catalog: { isFetching: false, error: null, refetch() {} },
    setVoice(role, id) { n.stopPlayback(); applied.push([role, id]); n.selected[role] = id; },
    setEnabled(value) { n.stopPlayback(); n.enabled = value; n.wanted = value; },
    setVolume(value) { n.volume = value; }, setCaptions(value) { n.captions = value; },
    stopPlayback() { stop?.(); },
    registerPreview(callback) { stop = callback; return () => { if (stop === callback) stop = undefined; }; },
    async getPreviewClip(role, id) { requests.push([role, id]); return new Blob(["sample"], { type: "audio/mpeg" }); },
  };
  globalThis.__voiceTestNarration = n;
  return { n, applied, requests, registered: () => stop };
}
async function mount(t, authenticated = true, strict = false) {
  const f = fixture(authenticated);
  let root;
  await act(() => { root = create(strict ? React.createElement(StrictMode, null, React.createElement(VoiceTalentControls)) : React.createElement(VoiceTalentControls)); });
  t.after(async () => { await act(() => root.unmount()); assert.equal(f.registered(), undefined); });
  return { ...f, root };
}
const byId = (root, id) => root.root.findByProps({ "data-testid": id });

test("signed-out controls do not expose or generate voice auditions", async t => {
  const h = await mount(t, false);
  assert.ok(byId(h.root, "button-narration-sign-in"));
  assert.equal(h.root.root.findAllByProps({ "data-testid": "list-voices" }).length, 0);
  assert.deepEqual(h.requests, []);
});
test("search and role selection do not apply voices; explicit Apply changes only its role", async t => {
  const h = await mount(t);
  await act(() => byId(h.root, "button-role-human-agent").props.onClick());
  await act(() => byId(h.root, "input-voice-search").props.onChange({ target: { value: "liam" } }));
  assert.deepEqual(h.applied, []);
  assert.deepEqual(h.requests, []);
  assert.equal(h.root.root.findAllByProps({ "data-testid": "row-voice-b" }).length, 0);
  await act(() => byId(h.root, "button-apply-a").props.onClick());
  assert.deepEqual(h.applied, [["human-agent", "a"]]);
  assert.equal(h.n.selected.caller, "a");
  assert.equal(h.n.selected["ai-agent"], "b");
  assert.equal(byId(h.root, "button-apply-a").props.disabled, true);
});
test("Preview auditions the candidate without applying it and Stop remains available after filtering", async t => {
  const h = await mount(t);
  await act(async () => byId(h.root, "button-preview-b").props.onClick());
  assert.deepEqual(h.requests, [["caller", "b"]]);
  assert.equal(h.n.selected.caller, "a");
  assert.deepEqual(h.applied, []);
  await act(() => byId(h.root, "input-voice-search").props.onChange({ target: { value: "liam" } }));
  assert.equal(h.root.root.findAllByProps({ "data-testid": "row-voice-b" }).length, 0);
  await act(() => byId(h.root, "button-stop-preview").props.onClick());
  assert.equal(audio.at(-1).src, "");
  assert.ok(audio.at(-1).pauses > 0);
});
test("StrictMode effect cleanup does not leave the preview controller permanently disposed", async t => {
  const h = await mount(t, true, true);
  await act(async () => byId(h.root, "button-preview-b").props.onClick());
  assert.equal(h.requests.length, 1);
  assert.ok(byId(h.root, "button-stop-preview"));
  await act(() => byId(h.root, "button-role-ai-agent").props.onClick());
  assert.equal(audio.at(-1).src, "");
  assert.deepEqual(h.applied, []);
});
test("applying a voice stops the audition and does not autoplay the demo", async t => {
  const h = await mount(t);
  await act(async () => byId(h.root, "button-preview-b").props.onClick());
  await act(() => byId(h.root, "button-apply-b").props.onClick());
  assert.deepEqual(h.applied, [["caller", "b"]]);
  assert.equal(h.requests.length, 1);
  assert.equal(audio.at(-1).src, "");
  await act(() => byId(h.root, "button-visual-only").props.onClick());
  assert.ok(byId(h.root, "text-visual-only"));
  assert.equal(h.root.root.findAllByProps({ "data-testid": "list-voices" }).length, 0);
});
