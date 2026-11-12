import assert from "node:assert/strict";
import { test } from "node:test";
import { playbackFrame, playbackStatus, stageStart } from "../src/lib/demo-playback.ts";
import { DEMO_NUGGETS } from "../src/data/demo-nuggets.ts";

const stages = [
  { id: "request", label: "Request", description: "Sample request", durationMs: 2500 },
  { id: "confirm", label: "Confirm", description: "Sample confirmation", durationMs: 3000 },
  { id: "complete", label: "Complete", description: "Sample result", durationMs: 3500 },
];

test("a demo starts at the first stage with no elapsed time", () => {
  const frame = playbackFrame(stages, 0);
  assert.equal(frame.stepIndex, 0);
  assert.equal(frame.stage.id, "request");
  assert.equal(frame.elapsedMs, 0);
  assert.equal(frame.progress, 0);
  assert.equal(frame.complete, false);
});

test("stage boundaries advance exactly once and expose local stage progress", () => {
  assert.equal(playbackFrame(stages, 2499).stepIndex, 0);
  const frame = playbackFrame(stages, 2500);
  assert.equal(frame.stepIndex, 1);
  assert.equal(frame.stepElapsedMs, 0);
  assert.equal(frame.stepProgress, 0);
  assert.equal(playbackFrame(stages, 4000).stepProgress, 0.5);
  assert.equal(playbackFrame(stages, 5500).stepIndex, 2);
});

test("completion is finite and cannot advance beyond the last stage", () => {
  const frame = playbackFrame(stages, 99999);
  assert.equal(frame.totalMs, 9000);
  assert.equal(frame.elapsedMs, 9000);
  assert.equal(frame.stepIndex, 2);
  assert.equal(frame.stepProgress, 1);
  assert.equal(frame.progress, 1);
  assert.equal(frame.complete, true);
});

test("frames are deterministic; replay and backwards seeking clear later stages", () => {
  assert.deepEqual(playbackFrame(stages, 4000), playbackFrame(stages, 4000));
  assert.equal(playbackFrame(stages, 9000).complete, true);
  assert.equal(playbackFrame(stages, 0).complete, false);
  assert.equal(playbackFrame(stages, stageStart(stages, 1)).stepIndex, 1);
  assert.equal(playbackFrame(stages, stageStart(stages, 0)).stepIndex, 0);
  assert.equal(stageStart(stages, -1), 0);
  assert.equal(stageStart(stages, 99), 5500);
});

test("seeking to the first step stays paused instead of restoring the idle preview", () => {
  assert.equal(playbackStatus(false, false, false), "idle");
  assert.equal(playbackStatus(false, false, true), "paused");
  assert.equal(playbackStatus(false, true, true), "playing");
  assert.equal(playbackStatus(true, false, true), "complete");
});

test("negative elapsed time is clamped and invalid timelines fail explicitly", () => {
  assert.equal(playbackFrame(stages, -10).elapsedMs, 0);
  assert.throws(() => playbackFrame([], 0), /at least one stage/);
  for (const durationMs of [0, -1, NaN, Infinity]) {
    assert.throws(() => playbackFrame([{ ...stages[0], durationMs }], 0), /positive duration/);
  }
});

test("both real nugget timelines reach each stage in order and replay cleanly", () => {
  assert.deepEqual(DEMO_NUGGETS.map(demo => demo.id), ["voice-copilot", "voice-ai-agents"]);
  for (const demo of DEMO_NUGGETS) {
    assert.equal(new Set(demo.stages.map(stage => stage.id)).size, demo.stages.length);
    demo.stages.forEach((stage, index) => {
      const frame = playbackFrame(demo.stages, stageStart(demo.stages, index));
      assert.equal(frame.stage.id, stage.id);
      assert.equal(frame.stepIndex, index);
      assert.equal(frame.stepProgress, 0);
    });
    assert.equal(playbackFrame(demo.stages, 15000).complete, true);
    assert.equal(playbackFrame(demo.stages, 0).stepIndex, 0);
    assert.equal(playbackFrame(demo.stages, 0).complete, false);
  }
});
