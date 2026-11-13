import test from "node:test";
import assert from "node:assert/strict";
import { NarratedPlayback, voiceError } from "../src/lib/narrated-playback.ts";

const tick = () => new Promise(resolve => setImmediate(resolve));
const audioBlob = () => new Blob(["prepared mp3 fixture"], { type: "audio/mpeg" });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
class FakeAudio extends EventTarget {
  src = ""; currentTime = 0; duration = 10; volume = 1;
  playing = false; plays = 0; loads = 0; rejection = null;
  async play() {
    this.plays++;
    if (this.rejection) { const error = this.rejection; this.rejection = null; throw error; }
    this.playing = true;
    this.dispatchEvent(new Event("playing"));
  }
  pause() { this.playing = false; }
  load() { this.currentTime = 0; this.loads++; }
  at(time) { this.currentTime = time; this.dispatchEvent(new Event("timeupdate")); }
  end() { this.playing = false; this.dispatchEvent(new Event("ended")); }
}
function fixture(overrides = {}) {
  const audio = new FakeAudio();
  const calls = [], revoked = [];
  let finished = 0;
  const clock = new NarratedPlayback({
    count: 3, audio,
    loadClip: async (index, signal) => { calls.push({ index, signal }); return audioBlob(); },
    createUrl: () => `blob:test-${calls.length}`,
    revokeUrl: url => revoked.push(url),
    onChange: () => {}, onFinish: () => { finished++; },
    ...overrides,
  });
  return { clock, audio, calls, revoked, get finished() { return finished; } };
}

test("uses audio currentTime rather than a visual timer and only advances on ended", async () => {
  const f = fixture();
  await f.clock.play();
  f.audio.at(2.5);
  assert.equal(f.clock.snapshot.fraction, 0.25);
  f.audio.at(10);
  assert.equal(f.clock.snapshot.stepIndex, 0);
  assert.ok(f.clock.snapshot.fraction < 1);
  f.audio.end(); await tick();
  assert.equal(f.clock.snapshot.stepIndex, 1);
  assert.equal(f.clock.snapshot.fraction, 0);
  assert.equal(f.clock.snapshot.playing, true);
  f.clock.dispose();
});
test("pause and resume preserve the audio position and do not regenerate a clip", async () => {
  const f = fixture();
  await f.clock.play(); f.audio.at(4);
  f.clock.pause(); f.audio.at(6);
  assert.equal(f.clock.snapshot.fraction, 0.4);
  assert.equal(f.audio.playing, false);
  await f.clock.play();
  assert.equal(f.calls.length, 1);
  assert.equal(f.audio.currentTime, 6);
  assert.equal(f.clock.snapshot.playing, true);
  f.clock.dispose();
});
test("pause cancels preparation; a late network response cannot start audio", async () => {
  const pending = deferred(); let signal;
  const f = fixture({ loadClip: (_i, s) => { signal = s; return pending.promise; } });
  const started = f.clock.play();
  assert.equal(f.clock.snapshot.pending, true);
  f.clock.pause();
  assert.equal(signal.aborted, true);
  pending.resolve(audioBlob()); await started;
  assert.equal(f.audio.plays, 0);
  assert.equal(f.clock.snapshot.playing, false);
  assert.equal(f.clock.snapshot.pending, false);
  f.clock.dispose();
});
test("seeking cancels stale generation and only plays the selected stage", async () => {
  const old = deferred(), next = deferred();
  const f = fixture({ loadClip: index => index === 0 ? old.promise : next.promise });
  const first = f.clock.play();
  f.clock.seek(2);
  old.resolve(audioBlob()); await first;
  assert.equal(f.audio.plays, 0);
  next.resolve(audioBlob()); await tick();
  assert.equal(f.clock.snapshot.stepIndex, 2);
  assert.equal(f.audio.plays, 1);
  f.clock.dispose();
});
test("a paused step selection stays paused, restart starts at the first stage", async () => {
  const f = fixture();
  f.clock.seek(2);
  assert.equal(f.clock.snapshot.stepIndex, 2);
  assert.equal(f.audio.plays, 0);
  f.clock.restart(); await tick();
  assert.equal(f.clock.snapshot.stepIndex, 0);
  assert.equal(f.clock.snapshot.playing, true);
  f.clock.dispose();
});
test("only natural completion of the last clip completes playback; replay works", async () => {
  const f = fixture();
  f.clock.seek(2); await f.clock.play(); f.audio.end();
  assert.equal(f.clock.snapshot.complete, true);
  assert.equal(f.finished, 1);
  assert.equal(f.clock.snapshot.playing, false);
  await f.clock.play();
  assert.equal(f.clock.snapshot.stepIndex, 0);
  assert.equal(f.clock.snapshot.complete, false);
  assert.equal(f.clock.snapshot.playing, true);
  f.clock.dispose();
});
test("autoplay rejection is visible and a fresh user Play can reuse prepared audio", async () => {
  const f = fixture();
  f.audio.rejection = new DOMException("blocked", "NotAllowedError");
  await f.clock.play();
  assert.match(f.clock.snapshot.error, /browser blocked sound/i);
  assert.equal(f.clock.snapshot.playing, false);
  assert.equal(f.clock.snapshot.pending, false);
  await f.clock.play();
  assert.equal(f.clock.snapshot.error, null);
  assert.equal(f.calls.length, 1);
  assert.equal(f.clock.snapshot.playing, true);
  f.clock.dispose();
});
test("buffering pauses visual animation until audio resumes", async () => {
  const f = fixture(); await f.clock.play();
  f.audio.dispatchEvent(new Event("waiting"));
  assert.equal(f.clock.snapshot.playing, false);
  assert.equal(f.clock.snapshot.pending, true);
  f.audio.dispatchEvent(new Event("playing"));
  assert.equal(f.clock.snapshot.playing, true);
  assert.equal(f.clock.snapshot.pending, false);
  f.clock.dispose();
});
test("dispose cancels work, releases object URLs, removes listeners and prevents restart", async () => {
  const f = fixture(); await f.clock.play();
  f.clock.dispose();
  assert.equal(f.audio.playing, false);
  assert.equal(f.audio.src, "");
  assert.equal(f.revoked.length, 1);
  f.audio.end(); await f.clock.play();
  assert.equal(f.calls.length, 1);
});
test("a pending play promise cannot restart playback after pause or disposal", async () => {
  const pending = deferred();
  const f = fixture();
  f.audio.play = () => pending.promise;
  const playing = f.clock.play(); await tick();
  f.clock.pause(); pending.resolve(); await playing;
  assert.equal(f.clock.snapshot.playing, false);
  assert.equal(f.clock.snapshot.pending, false);
  f.clock.dispose();
});
test("generation failures never silently fall back or advance the visuals", async () => {
  const f = fixture({ loadClip: async () => { throw { status: 503, data: { error: "ElevenLabs rejected the saved connection." } }; } });
  await f.clock.play();
  assert.match(f.clock.snapshot.error, /rejected the saved connection/);
  assert.equal(f.clock.snapshot.stepIndex, 0);
  assert.equal(f.audio.plays, 0);
  assert.equal(f.clock.snapshot.pending, false);
  f.clock.dispose();
});
test("empty or non-audio provider responses are rejected", async () => {
  for (const blob of [new Blob([], { type: "audio/mpeg" }), new Blob(["{}"], { type: "application/json" })]) {
    const f = fixture({ loadClip: async () => blob });
    await f.clock.play();
    assert.match(f.clock.snapshot.error, /no playable audio/);
    assert.equal(f.audio.plays, 0);
    f.clock.dispose();
  }
});
test("media decode errors are recoverable; invalid time and volume values stay bounded", async () => {
  const f = fixture(); await f.clock.play();
  f.audio.at(Number.NaN); assert.equal(f.clock.snapshot.fraction, 0);
  f.clock.setVolume(5); assert.equal(f.audio.volume, 1);
  f.clock.setVolume(-3); assert.equal(f.audio.volume, 0);
  f.audio.dispatchEvent(new Event("error"));
  assert.match(f.clock.snapshot.error, /could not be decoded/);
  assert.equal(f.audio.playing, false);
  await f.clock.play(); assert.equal(f.calls.length, 2);
  f.clock.reset(); assert.equal(f.clock.snapshot.interacted, false);
  f.clock.dispose();
});
test("authentication and rate-limit messages retain actionable, safe errors", () => {
  assert.match(voiceError({ status: 401 }), /Sign in again/);
  assert.equal(voiceError({ status: 429, data: { error: "Wait and retry." } }), "Wait and retry.");
});
