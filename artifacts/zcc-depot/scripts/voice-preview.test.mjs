import assert from "node:assert/strict";
import { test } from "node:test";
import { VoicePreviewController } from "../src/lib/voice-preview.ts";

const clip = () => new Blob(["prepared sample"], { type: "audio/mpeg" });
function setup(load = async () => clip(), play = async () => {}) {
  const states = [], audios = [], revoked = [], requests = [];
  const controller = new VoicePreviewController({
    load: (...args) => { requests.push(args); return load(...args); },
    onChange: state => states.push(state),
    createAudio: () => {
      const audio = { src: "", volume: 1, onended: null, onerror: null, pauses: 0, loads: 0,
        play, pause() { this.pauses++; }, load() { this.loads++; }, removeAttribute() { this.src = ""; } };
      audios.push(audio); return audio;
    },
    urls: { createObjectURL: () => `blob:sample-${audios.length}`, revokeObjectURL: url => revoked.push(url) },
  });
  return { controller, states, audios, revoked, requests, state: () => states.at(-1) };
}
test("a preview requests the candidate voice and role without assigning a cast", async () => {
  const h = setup();
  await h.controller.play("human-agent", "candidate-not-applied");
  assert.equal(h.requests[0][0], "human-agent");
  assert.equal(h.requests[0][1], "candidate-not-applied");
  assert.equal(h.state().status, "playing");
  assert.equal(h.audios[0].volume, .9);
  h.controller.dispose();
  assert.equal(h.audios[0].pauses, 1);
  assert.deepEqual(h.revoked, ["blob:sample-1"]);
});
test("stopping during preparation aborts and ignores late audio", async () => {
  let resolve;
  const h = setup(() => new Promise(done => { resolve = done; }));
  const pending = h.controller.play("caller", "voice-a");
  assert.equal(h.state().status, "loading");
  h.controller.stop();
  assert.equal(h.requests[0][2].aborted, true);
  resolve(clip()); await pending;
  assert.equal(h.audios.length, 0);
  assert.equal(h.state().status, "idle");
});
test("a new preview wins even if the previous request finishes last", async () => {
  const pending = new Map();
  const h = setup((_role, id) => new Promise(done => pending.set(id, done)));
  const first = h.controller.play("caller", "old");
  const second = h.controller.play("ai-agent", "new");
  pending.get("new")(clip()); await second;
  pending.get("old")(clip()); await first;
  assert.equal(h.audios.length, 1);
  assert.equal(h.state().voiceId, "new");
  h.controller.dispose();
});
test("new playback pauses the old sample and releases its URL", async () => {
  const h = setup(); await h.controller.play("caller", "a");
  await h.controller.play("narrator", "b");
  assert.equal(h.audios[0].pauses, 1);
  assert.deepEqual(h.revoked, ["blob:sample-1"]);
  h.audios[1].onended();
  assert.equal(h.state().status, "idle");
  assert.deepEqual(h.revoked, ["blob:sample-1", "blob:sample-2"]);
});
test("volume updates affect the active sample and clamp invalid ranges", async () => {
  const h = setup(); h.controller.setVolume(.25);
  await h.controller.play("caller", "a");
  assert.equal(h.audios[0].volume, .25);
  h.controller.setVolume(2); assert.equal(h.audios[0].volume, 1);
  h.controller.setVolume(-1); assert.equal(h.audios[0].volume, 0);
  h.controller.dispose();
});
test("provider and invalid-blob failures remain explicit and can be retried", async () => {
  let count = 0;
  const h = setup(async () => {
    if (++count === 1) throw new Error("Hourly speech-generation limit reached.");
    if (count === 2) return new Blob(["not audio"], { type: "application/json" });
    return clip();
  });
  await h.controller.play("caller", "a");
  assert.match(h.state().error, /Hourly/);
  await h.controller.play("caller", "a");
  assert.match(h.state().error, /No playable/);
  await h.controller.play("caller", "a");
  assert.equal(h.state().status, "playing");
  h.controller.dispose();
});
test("blocked browser playback is explained and its resources are released", async () => {
  const h = setup(undefined, async () => { throw new DOMException("blocked", "NotAllowedError"); });
  await h.controller.play("caller", "a");
  assert.equal(h.state().status, "error");
  assert.match(h.state().error, /browser blocked audio/);
  assert.equal(h.audios[0].pauses, 1);
  assert.equal(h.revoked.length, 1);
});
test("audio decoding failure is visible and a disposed player cannot restart", async () => {
  const h = setup(); await h.controller.play("caller", "a");
  h.audios[0].onerror();
  assert.match(h.state().error, /could not be played/);
  h.controller.dispose();
  const stateCount = h.states.length;
  await h.controller.play("caller", "a");
  assert.equal(h.requests.length, 1);
  assert.equal(h.states.length, stateCount);
});
