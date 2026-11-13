import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement, useState } from "react";
import { create } from "react-test-renderer";
import { playlistUrl, readPlaylist, validatePlaylist } from "../src/lib/nugget-playlist.ts";
import { useNuggetPlaylist } from "../src/hooks/use-nugget-playlist.ts";
import { NuggetPlaylist } from "../src/components/demo-nuggets/nugget-playlist.tsx";
import { DemoPlayer } from "../src/components/demo-nuggets/demo-player.tsx";
import { DEMO_NUGGETS } from "../src/data/demo-nuggets.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const all = ["voice-copilot", "voice-qa", "voice-ai-agents", "video-screen-sharing"];

test("playlist input keeps only catalog IDs in order with no duplicate or unbounded payload", () => {
  assert.deepEqual(validatePlaylist(["voice-qa", "voice-qa", "<script>", "video-screen-sharing"]), ["voice-qa", "video-screen-sharing"]);
  for (const value of ["?playlist=", "?playlist=unknown", "?playlist=voice-qa&playlist=voice-copilot", `?playlist=${"a".repeat(257)}`]) {
    assert.equal(readPlaylist(value).notice.length > 0, true, value);
    assert.deepEqual(readPlaylist(value).ids, []);
  }
  assert.equal(readPlaylist("?playlist=voice-qa,voice-qa").notice.length > 0, true);
  assert.equal(readPlaylist("").shared, false);
  assert.deepEqual(readPlaylist("?playlist=video-screen-sharing,voice-qa").ids, ["video-screen-sharing", "voice-qa"]);
  assert.equal(readPlaylist("?playlist=voice-qa").notice, "");
});

test("share links round-trip all permutations and strip incoming private query, hash and credentials", () => {
  const permutations = values => values.length ? values.flatMap((v, i) => permutations(values.filter((_, j) => i !== j)).map(rest => [v, ...rest])) : [[]];
  for (const ids of permutations(all)) {
    const url = new URL(playlistUrl("https://user:secret@example.com/base/demos/nuggets?customer=private&token=secret#private", [...ids, "unknown", ids[0]]));
    assert.equal(url.pathname, "/base/demos/nuggets");
    assert.equal(url.username, "");
    assert.equal(url.password, "");
    assert.deepEqual([...url.searchParams.keys()], ["playlist"]);
    assert.equal(url.hash, "#playlist");
    assert.deepEqual(readPlaylist(url.search).ids, ids);
    assert.doesNotMatch(url.href, /private|secret|unknown|customer|token/);
  }
});

let playlist;
async function mountHook(t, search = "?playlist=voice-copilot,voice-qa") {
  const location = new URL(`https://example.com/demos/nuggets${search}`);
  const events = new EventTarget(), scrolled = [], actions = [];
  globalThis.window = events;
  window.location = location;
  window.history = { state: { preserved: true }, replaceState(state, _, url) {
    assert.equal(state.preserved, true);
    location.href = url.href;
  } };
  globalThis.document = { getElementById: id => ({ scrollIntoView: () => scrolled.push(id) }) };
  let setActive;
  globalThis.__playlistNarration = { stopPlayback() { actions.push("stop"); setActive(null); } };
  function Probe() {
    const [active, update] = useState(null);
    setActive = update;
    playlist = useNuggetPlaylist(active);
    return null;
  }
  let root;
  await act(() => { root = create(createElement(Probe)); });
  for (const id of all) playlist.registerPlayer(id, { play() { actions.push(`play:${id}`); setActive(id); } });
  t.after(() => act(() => root.unmount()));
  return { actions, scrolled, location, setActive };
}

test("selection, reorder, removal and explicit transport stop old playback and preserve order after reload", async t => {
  const h = await mountHook(t);
  assert.equal(playlist.currentId, all[0]);
  await act(() => playlist.onPrevious());
  assert.deepEqual(h.actions, []);
  await act(() => playlist.onToggle());
  assert.deepEqual(h.actions, ["stop", `play:${all[0]}`]);
  assert.equal(playlist.playing, true);
  await act(() => playlist.onToggle());
  assert.equal(playlist.playing, false);
  await act(() => playlist.onNext());
  assert.equal(playlist.currentId, all[1]);
  assert.equal(playlist.playing, false, "Next never auto-plays");
  assert.equal(h.scrolled.at(-1), all[1]);
  await act(() => playlist.onNext());
  assert.equal(playlist.currentId, all[1]);
  await act(() => playlist.onChange([all[1], all[0]]));
  assert.equal(playlist.index, 0);
  assert.deepEqual(readPlaylist(h.location.search).ids, [all[1], all[0]]);
  await act(() => playlist.onChange([all[0]]));
  assert.equal(playlist.currentId, all[0], "removing the current demo selects a valid remaining demo paused");
  assert.equal(playlist.playing, false);
  await act(() => playlist.onChange([]));
  assert.equal(playlist.currentId, null);
  const count = h.actions.length;
  await act(() => playlist.onToggle());
  assert.equal(h.actions.length, count);
});

test("pending cancellation, fragment navigation and history restoration cannot keep a player running", async t => {
  const h = await mountHook(t);
  await act(() => playlist.onPendingChange(all[0], true));
  assert.equal(playlist.pending, true);
  await act(() => playlist.onToggle());
  assert.deepEqual(h.actions, ["stop"]);
  await act(() => playlist.onPendingChange(all[0], false));
  await act(() => playlist.onSelect(all[1]));
  await act(() => { h.location.hash = "#voice-qa"; window.dispatchEvent(new Event("popstate")); window.dispatchEvent(new Event("hashchange")); });
  assert.equal(playlist.currentId, all[1], "same-query fragment navigation keeps playlist position");
  await act(() => { h.location.search = "?playlist=video-screen-sharing"; window.dispatchEvent(new Event("popstate")); });
  assert.deepEqual(playlist.ids, [all[3]]);
  assert.equal(playlist.currentId, all[3]);
  assert.equal(playlist.playing, false);
});

test("builder actions, boundaries, clipboard failure and manual sharing work", async t => {
  let ids = [all[0], all[1]], selected = all[0], tree;
  const props = () => ({
    ids, currentId: selected, playing: false, pending: false,
    shareUrl: playlistUrl("https://example.com/demos/nuggets?private=x", ids), notice: "",
    onChange(next) { ids = next; }, onSelect(id) { selected = id; },
    onPrevious() {}, onNext() {}, onToggle() {},
  });
  await act(() => { tree = create(createElement(NuggetPlaylist, props())); });
  t.after(() => act(() => tree.unmount()));
  const byId = id => tree.root.findByProps({ "data-testid": id });
  const update = () => act(() => tree.update(createElement(NuggetPlaylist, props())));
  assert.equal(byId("button-playlist-previous").props.disabled, true);
  assert.equal(byId(`button-playlist-up-${all[0]}`).props.disabled, true);
  assert.equal(byId(`button-playlist-down-${all[1]}`).props.disabled, true);
  await act(() => byId(`button-playlist-up-${all[1]}`).props.onClick());
  assert.deepEqual(ids, [all[1], all[0]]);
  await update();
  await act(() => byId(`checkbox-playlist-${all[2]}`).props.onChange());
  assert.deepEqual(ids, [all[1], all[0], all[2]]);
  await update();
  await act(() => byId(`button-playlist-remove-${all[1]}`).props.onClick());
  assert.deepEqual(ids, [all[0], all[2]]);
  await update();
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async () => { throw new Error("denied"); } } } });
  await act(() => byId("button-playlist-share").props.onClick());
  assert.equal(byId("input-playlist-share-url").props.value, props().shareUrl);
  let copied;
  navigator.clipboard.writeText = async text => { copied = text; };
  await act(() => byId("button-playlist-share").props.onClick());
  assert.equal(copied, props().shareUrl);
  assert.equal(byId("status-playlist-share").children.length > 0, true);
  ids = [];
  await update();
  assert.equal(byId("button-playlist-share").props.disabled, true);
  assert.equal(byId("button-playlist-toggle").props.disabled, true);
});

test("the playlist transport operates the existing visual players with only one active at a time", async t => {
  const location = new URL("https://example.com/demos/nuggets?playlist=voice-copilot,voice-qa");
  globalThis.window = new EventTarget();
  window.location = location;
  window.history = { state: {}, replaceState(_s, _t, url) { location.href = url.href; } };
  globalThis.document = new EventTarget();
  document.hidden = false;
  document.getElementById = () => ({ scrollIntoView() {} });
  const frames = new Map();
  let nextFrame = 0, activeSetter;
  globalThis.requestAnimationFrame = callback => { const id = ++nextFrame; frames.set(id, callback); return id; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  globalThis.Audio = class extends EventTarget {
    pause() {} load() {} removeAttribute() {}
  };
  globalThis.__playlistNarration = {
    enabled: false, volume: 1, settingsKey: "visual-only", captions: false,
    auth: { isAuthenticated: false, login() {} }, preferencesReady: true,
    register: () => () => {}, claim() {}, stopPlayback() { activeSetter(null); },
  };
  function Presentation() {
    const [activeId, setActiveId] = useState(null);
    activeSetter = setActiveId;
    const p = useNuggetPlaylist(activeId);
    return createElement("div", null, createElement(NuggetPlaylist, p),
      ...DEMO_NUGGETS.map(nugget => createElement(DemoPlayer, {
        key: nugget.id, nugget, activeId, onActiveChange: setActiveId,
        controlsRef: controls => p.registerPlayer(nugget.id, controls),
        onPendingChange: p.onPendingChange,
        children: () => null,
      })));
  }
  let tree;
  await act(() => { tree = create(createElement(Presentation)); });
  t.after(async () => { await act(() => tree.unmount()); assert.equal(frames.size, 0); });
  const byId = id => tree.root.findByProps({ "data-testid": id });
  const statuses = () => DEMO_NUGGETS.map(d => byId(`status-${d.id}`).children.join(""));
  assert.deepEqual(statuses(), ["Ready to play", "Ready to play", "Ready to play", "Ready to play"]);
  await act(() => byId("button-playlist-toggle").props.onClick());
  assert.deepEqual(statuses(), ["Playing", "Ready to play", "Ready to play", "Ready to play"]);
  assert.equal(frames.size, 1);
  await act(() => byId("button-playlist-next").props.onClick());
  assert.deepEqual(statuses(), ["Paused", "Ready to play", "Ready to play", "Ready to play"]);
  assert.equal(frames.size, 0);
  await act(() => byId("button-playlist-toggle").props.onClick());
  assert.deepEqual(statuses(), ["Paused", "Playing", "Ready to play", "Ready to play"]);
  assert.equal(frames.size, 1);
  await act(() => byId("button-play-voice-ai-agents").props.onClick());
  assert.deepEqual(statuses(), ["Paused", "Paused", "Playing", "Ready to play"]);
  assert.equal(frames.size, 1, "individual demo controls also relinquish the previous player");
  await act(() => { document.hidden = true; document.dispatchEvent(new Event("visibilitychange")); });
  assert.deepEqual(statuses(), ["Paused", "Paused", "Paused", "Ready to play"]);
  assert.equal(frames.size, 0);
});
