import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  BLUEPRINT_STAGES, SESSION_LENGTHS, DEFAULT_SESSION_LENGTH,
  BLUEPRINT_DESCRIPTION, BLUEPRINT_DISCLAIMER,
  buildBlueprintTimeline, formatBlueprintTime,
} from "../src/data/demo-blueprint.ts";
import { DEMO_URL, LINKS, RESOURCES } from "../src/data/content.ts";

const range = item => `${formatBlueprintTime(item.startSeconds)}–${formatBlueprintTime(item.endSeconds)}`;

test("seven stages follow the requested journey, defaulting to 45 minutes", () => {
  assert.equal(DEFAULT_SESSION_LENGTH, 45);
  assert.deepEqual(SESSION_LENGTHS, [30, 45, 60]);
  assert.deepEqual(BLUEPRINT_STAGES.map(stage => stage.title), [
    "Align on outcomes", "Customer entry & handoff", "Agent workspace & context",
    "Voice Copilot & wrap-up", "Voice QA & operational control",
    "Architecture & confidence", "Business value & next step",
  ]);
  assert.equal(new Set(BLUEPRINT_STAGES.map(stage => stage.id)).size, 7);
});

for (const minutes of SESSION_LENGTHS) {
  test(`${minutes}-minute preset totals exactly, with contiguous integer-second stages and beats`, () => {
    const stages = buildBlueprintTimeline(minutes);
    assert.equal(stages[0].startSeconds, 0);
    assert.equal(stages.at(-1).endSeconds, minutes * 60);
    assert.equal(stages.reduce((sum, stage) => sum + stage.durationSeconds, 0), minutes * 60);
    stages.forEach((stage, index) => {
      assert.equal(stage.number, index + 1);
      assert.equal(stage.startSeconds, index ? stages[index - 1].endSeconds : 0);
      assert.equal(stage.endSeconds - stage.startSeconds, stage.durationSeconds);
      assert.equal(stage.durationSeconds, BLUEPRINT_STAGES[index].minutes[minutes] * 60);
      assert.ok(stage.durationSeconds > 0);
      if (!stage.timedBeats.length) return;
      assert.equal(stage.timedBeats[0].startSeconds, stage.startSeconds);
      assert.equal(stage.timedBeats.at(-1).endSeconds, stage.endSeconds);
      assert.equal(stage.timedBeats.reduce((sum, beat) => sum + beat.durationSeconds, 0), stage.durationSeconds);
      const weights = stage.timedBeats.reduce((sum, beat) => sum + beat.weight, 0);
      stage.timedBeats.forEach((beat, beatIndex) => {
        assert.ok(Number.isInteger(beat.startSeconds) && Number.isInteger(beat.endSeconds));
        assert.ok(beat.durationSeconds > 0);
        assert.ok(beat.startSeconds >= stage.startSeconds && beat.endSeconds <= stage.endSeconds);
        assert.equal(beat.startSeconds, beatIndex ? stage.timedBeats[beatIndex - 1].endSeconds : stage.startSeconds);
        if (beatIndex < stage.timedBeats.length - 1) {
          assert.equal(beat.durationSeconds, Math.round(stage.durationSeconds * beat.weight / weights));
        }
      });
    });
  });
}

test("default stage ranges are exactly the requested 45-minute plan", () => {
  assert.deepEqual(buildBlueprintTimeline(45).map(range), [
    "00:00–04:00", "04:00–10:00", "10:00–20:00", "20:00–27:00",
    "27:00–33:00", "33:00–37:00", "37:00–45:00",
  ]);
  assert.deepEqual(buildBlueprintTimeline(45).map(stage => stage.durationSeconds / 60), [4, 6, 10, 7, 6, 4, 8]);
  assert.deepEqual(buildBlueprintTimeline(30).map(stage => stage.durationSeconds / 60), [3, 4, 7, 5, 4, 2, 5]);
  assert.deepEqual(buildBlueprintTimeline(60).map(stage => stage.durationSeconds / 60), [5, 8, 14, 9, 8, 6, 10]);
});

test("default nested Copilot, QA and closing ranges exactly match the brief", () => {
  const stages = buildBlueprintTimeline(45);
  assert.deepEqual(stages[3].timedBeats.map(range), ["20:00–23:00", "23:00–27:00"]);
  assert.deepEqual(stages[4].timedBeats.map(range), ["27:00–30:00", "30:00–33:00"]);
  assert.deepEqual(stages[6].timedBeats.map(range), ["37:00–40:00", "40:00–43:00", "43:00–45:00"]);
});

test("non-default nested ranges round to whole seconds and assign the remainder to the last beat", () => {
  const short = buildBlueprintTimeline(30);
  const long = buildBlueprintTimeline(60);
  assert.deepEqual(short[3].timedBeats.map(range), ["14:00–16:09", "16:09–19:00"]);
  assert.deepEqual(short[6].timedBeats.map(range), ["25:00–26:53", "26:53–28:46", "28:46–30:00"]);
  assert.deepEqual(long[3].timedBeats.map(range), ["27:00–30:51", "30:51–36:00"]);
  assert.deepEqual(long[6].timedBeats.map(range), ["50:00–53:45", "53:45–57:30", "57:30–60:00"]);
});

test("switching presets keeps stable stage identities and does not mutate the content source", () => {
  const before = JSON.stringify(BLUEPRINT_STAGES);
  const ids = BLUEPRINT_STAGES.map(stage => stage.id);
  for (const preset of SESSION_LENGTHS) assert.deepEqual(buildBlueprintTimeline(preset).map(stage => stage.id), ids);
  assert.equal(JSON.stringify(BLUEPRINT_STAGES), before);
  assert.throws(() => buildBlueprintTimeline(15), /Unsupported session length/);
  assert.equal(formatBlueprintTime(3600), "60:00");
});

test("supporting links reuse only existing public routes and resources", () => {
  const routes = new Set(["/#platform", "/#how-it-works", "/resources#ai-suggestions", "/architecture#data-flow", "/sales#use-cases"]);
  const external = new Set([DEMO_URL, LINKS.aiSuggestions, LINKS.awsServices, LINKS.dashboardsGuide,
    RESOURCES.find(resource => resource.id === "qa-transcriptions").url]);
  for (const stage of BLUEPRINT_STAGES) {
    assert.ok(stage.value && stage.presenterCue && stage.proof && stage.transition && stage.links.length);
    for (const link of stage.links) assert.ok(routes.has(link.href) || external.has(link.href), link.href);
  }
  assert.ok(BLUEPRINT_STAGES.at(-1).links.some(link => link.href === DEMO_URL));
});

test("QA product boundaries and conditional demonstration scope remain explicit", () => {
  const quality = BLUEPRINT_STAGES.find(stage => stage.id === "quality");
  assert.equal(quality.title, "Voice QA & operational control");
  assert.deepEqual(quality.productNotes.map(note => note.label), [
    "Voice QA & conversation analytics — powered by Contact Lens",
    "Zendesk QA — optional, separately configured",
  ]);
  assert.match(quality.productNotes[1].description, /does not require Contact Lens/);
  assert.match(quality.presenterCue, /prepared, previously completed call/);
  assert.match(quality.presenterCue, /Do not depend on the current demo call/);
  assert.match(BLUEPRINT_STAGES[1].presenterCue, /Caller recognition is not authentication/);
  assert.doesNotMatch(JSON.stringify(BLUEPRINT_STAGES), /Auto Assist|docs\.google|roadmap/i);
  assert.equal(BLUEPRINT_DESCRIPTION, "One customer journey. From first contact to AI-assisted resolution, quality insights, and measurable business value.");
  assert.equal(BLUEPRINT_DISCLAIMER, "Demonstrate capabilities enabled in your environment. Availability, licensing, and configuration vary; confirm current scope with Zendesk.");
});

test("Demos keeps its supporting sections and original navigation anchor", () => {
  const demos = readFileSync(new URL("../src/pages/demos.tsx", import.meta.url), "utf8");
  assert.match(demos, /<DemoBlueprint\s*\/>/);
  assert.match(demos, /href="#agenda"/);
  assert.match(demos, /id="guided-demo"/);
  assert.match(demos, /<VideoHighlights\s*\/>/);
  assert.match(demos, /id="spotlight"/);
  assert.match(demos, /id="video"/);
});

test("phone and tablet section arrows leave blueprint content unobstructed", () => {
  const navigation = readFileSync(new URL("../src/components/section-navigation.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/demo-blueprint.css", import.meta.url), "utf8");
  assert.match(navigation, /location === "\/demos" \? "section-nav-blueprint" : ""/);
  assert.match(css, /@media \(max-width:1279px\)/);
  assert.match(css, /\.section-nav-blueprint\{\s*--section-nav-bottom:auto;\s*top:15px/);
});
