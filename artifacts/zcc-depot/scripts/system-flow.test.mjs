import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SYS_NODES, SYS_EDGES, SYS_FLOWS, CLOUDS, VIEW, STAGE_MS,
  validateGraph, timeline, timelineMs, stepAt, elapsedFor, flowsForNode,
} from "../src/data/system-flow.ts";

test("all components and connectors participate in animated flows", () => {
  assert.deepEqual(validateGraph(), []);
  assert.equal(new Set(SYS_NODES.map(n => n.id)).size, SYS_NODES.length);
  assert.equal(new Set(SYS_EDGES.map(e => e.id)).size, SYS_EDGES.length);
  const tourEdges = new Set(timeline(null).flatMap(stage => stage.edges));
  for (const edge of SYS_EDGES) assert.ok(tourEdges.has(edge.id), edge.id);
  for (const node of SYS_NODES) assert.ok(flowsForNode(node.id).length > 0, node.id);
});

test("the reference components stay inside their correct cloud boundary", () => {
  for (const node of SYS_NODES) {
    const cloud = CLOUDS.find(c => c.id === node.cloud);
    assert.ok(cloud, node.id);
    assert.ok(node.x >= cloud.x && node.y >= cloud.y, node.id);
    assert.ok(node.x + node.w <= cloud.x + cloud.w && node.y + node.h <= cloud.y + cloud.h, node.id);
  }
  assert.ok(CLOUDS.every(c => c.x + c.w <= VIEW.w && c.y + c.h <= VIEW.h));
  for (const id of ["zcc", "connect", "profiles", "lambda", "cognito", "internal", "events", "direct", "logs", "transcripts", "ctr", "ticket", "status", "analysis", "reporting"]) {
    assert.ok(SYS_NODES.some(n => n.id === id), id);
  }
});

test("every flow advances in order and loops exactly at its boundary", () => {
  for (const id of [null, ...SYS_FLOWS.map(f => f.id)]) {
    const stages = timeline(id);
    assert.equal(timelineMs(id), stages.length * STAGE_MS);
    for (let i = 0; i < stages.length; i++) {
      const frame = stepAt(id, i * STAGE_MS);
      assert.equal(frame.index, i);
      assert.deepEqual(frame.edges, stages[i].edges);
      assert.equal(frame.progress, 0);
    }
    assert.equal(stepAt(id, timelineMs(id)).index, 0);
    assert.equal(stepAt(id, timelineMs(id) - 1).index, stages.length - 1);
  }
});

test("manual steps preserve their displayed progress when playback resumes", () => {
  for (const id of [null, ...SYS_FLOWS.map(f => f.id)]) {
    for (let i = 0; i < timeline(id).length; i++) {
      const pausedAt = elapsedFor(i, 0.62);
      const paused = stepAt(id, pausedAt);
      const resumed = stepAt(id, pausedAt + 16);
      assert.equal(paused.index, i);
      assert.ok(Math.abs(paused.progress - 0.62) < 0.0001);
      assert.ok(resumed.progress > paused.progress);
    }
  }
});

test("post-call animation includes all three branches and both consumers", () => {
  const flow = SYS_FLOWS.find(f => f.id === "records");
  assert.deepEqual(flow.stages[0], ["connect-logs", "connect-transcripts", "connect-ctr"]);
  assert.deepEqual(flow.stages[2], ["events-reporting", "events-analysis"]);
});
