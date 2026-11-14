import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  COMPARISON_PATH, COMPARISON_SOURCES, COMPARISON_ROWS, COMPARISON_CATEGORIES,
  FIT_SIGNALS, getFitGuidance, COMPARISON_FAQ, DISCOVERY_TOPICS, MIGRATION_STEPS,
} from "../src/data/voice-comparison.ts";

test("comparison is linked through route, Sales menu, breadcrumbs and search", () => {
  const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
  for (const path of ["../src/App.tsx", "../src/data/navigation.ts", "../src/data/depot-rooms.ts"])
    assert.ok(read(path).includes(COMPARISON_PATH), `${path} includes comparison route`);
  assert.match(read("../src/data/search.ts"), /page\("contact-center-vs-voice", COMPARISON_TITLE, COMPARISON_PATH/);
});

test("comparison rows have complete, qualified descriptions and official sources", () => {
  assert.equal(COMPARISON_ROWS.length, 10);
  assert.equal(new Set(COMPARISON_ROWS.map(row => row.id)).size, COMPARISON_ROWS.length);
  for (const category of COMPARISON_CATEGORIES) assert.ok(COMPARISON_ROWS.some(row => row.category === category));
  for (const row of COMPARISON_ROWS) {
    assert.ok(row.topic.length > 5);
    for (const key of ["voice", "contactCenter", "confirm"]) assert.ok(row[key].length > 15);
    assert.ok(row.sources.length > 0);
    for (const id of row.sources) assert.ok(COMPARISON_SOURCES.some(source => source.id === id));
  }
  for (const source of COMPARISON_SOURCES) {
    assert.equal(new URL(source.url).protocol, "https:");
    assert.ok(["www.zendesk.com", "support.zendesk.com"].includes(new URL(source.url).hostname));
  }
  assert.ok(COMPARISON_ROWS.find(row => row.id === "ai").confirm.includes("distinct"));
  assert.ok(COMPARISON_ROWS.find(row => row.id === "routing").confirm.includes("separate"));
  assert.ok(COMPARISON_ROWS.find(row => row.id === "fit").confirm.includes("fixed agent-count"));
});

test("fit guide handles empty, simple, advanced, mixed and readiness-only needs", () => {
  assert.equal(getFitGuidance([]).kind, "discovery");
  assert.equal(getFitGuidance(["limited-it"]).kind, "discovery");
  assert.equal(getFitGuidance(["fast-launch"]).kind, "voice");
  assert.equal(getFitGuidance(["standard-routing", "limited-it"]).kind, "voice");
  assert.equal(getFitGuidance(["custom-routing"]).kind, "contact-center");
  assert.equal(getFitGuidance(["fast-launch", "custom-routing"]).kind, "contact-center");
  assert.match(getFitGuidance(["custom-routing", "limited-it"]).summary, /technical ownership/);
});

test("every combination of fit selections yields stable, explainable guidance", () => {
  for (let mask = 0; mask < 2 ** FIT_SIGNALS.length; mask++) {
    const selected = FIT_SIGNALS.filter((_, index) => mask & (1 << index)).map(s => s.id);
    const result = getFitGuidance(selected);
    assert.ok(["voice", "contact-center", "discovery"].includes(result.kind));
    assert.ok(result.title && result.summary);
    assert.deepEqual(result, getFitGuidance([...selected].reverse()));
    for (const reason of result.reasons) assert.ok(FIT_SIGNALS.some(s => selected.includes(s.id) && s.title === reason));
  }
});

test("discovery, migration and FAQs cover the original qualification topics safely", () => {
  assert.equal(DISCOVERY_TOPICS.length, 4);
  assert.equal(MIGRATION_STEPS.length, 5);
  assert.equal(COMPARISON_FAQ.length, 6);
  const text = JSON.stringify({ COMPARISON_ROWS, COMPARISON_FAQ, DISCOVERY_TOPICS, MIGRATION_STEPS });
  assert.doesNotMatch(text, /40%|quota|commission|Dec 31|planned for Q3|guaranteed savings/i);
  assert.match(text, /porting/i);
  assert.match(text, /licens/i);
  assert.match(text, /compliance/i);
  assert.match(text, /outbound/i);
});
