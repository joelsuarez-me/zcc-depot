import assert from "node:assert/strict";
import { test } from "node:test";
import { adjacentSection, sectionStops } from "../src/lib/section-navigation.ts";

test("stops include top and bottom, clamp to the page and deduplicate horizontal sections", () => {
  assert.deepEqual(sectionStops([-100, 300, 304, 600, 1800], 1000), [0, 300, 600, 1000]);
  assert.deepEqual(sectionStops([], 0), [0]);
});
test("arrows select the adjacent section from a section or between sections", () => {
  const stops = [0, 300, 600, 1000];
  assert.equal(adjacentSection(stops, 0, -1), undefined);
  assert.equal(adjacentSection(stops, 0, 1), 300);
  assert.equal(adjacentSection(stops, 300, 1), 600);
  assert.equal(adjacentSection(stops, 305, -1), 0);
  assert.equal(adjacentSection(stops, 450, -1), 300);
  assert.equal(adjacentSection(stops, 450, 1), 600);
  assert.equal(adjacentSection(stops, 1000, 1), undefined);
  assert.equal(adjacentSection(stops, 1000, -1), 600);
});
