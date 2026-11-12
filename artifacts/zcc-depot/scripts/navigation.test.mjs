import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NAV, isNavItemActive } from "../src/data/navigation.ts";

test("main menu keeps Resources as its final destination", () => {
  assert.deepEqual(NAV.map(n => n.label), ["Overview", "Architecture", "Sales", "Demos", "Resources"]);
  assert.equal(NAV.at(-1).href, "/resources");
  assert.equal(NAV[0].children[1].href, "/architecture#journey");
});

test("Sales and Demos contain the exact requested destinations and sequence", () => {
  assert.deepEqual(NAV[2].children.map(n => [n.label, n.href]), [
    ["Sell Sheet", "/sell-sheet"], ["Pricing", "/pricing"],
  ]);
  assert.deepEqual(NAV[3].children.map(n => [n.label, n.href]), [
    ["01 Demo Methodology", "/demos#agenda"],
    ["02 Demo Click-Through", "/demos#guided-demo"],
    ["03 Demo Instance Details", "/demos/instance-details"],
    ["04 Demo Researcher", "/demos/brief"],
    ["05 Demo Agenda", "/agenda"],
    ["06 Demo Nuggets", "/demos/nuggets"],
  ]);
});

test("Architecture contains only the two requested submenu destinations", () => {
  assert.deepEqual(NAV[1].children.map(item => [item.label, item.href]), [
    ["System + data flow", "/architecture#data-flow"],
    ["Components", "/architecture#components"],
  ]);
});

test("Architecture removes Global platform and keeps section numbering continuous", () => {
  const source = readFileSync(new URL("../src/pages/architecture.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Global platform|#footprint|id="footprint"|<Footprint/);
  assert.deepEqual([...source.matchAll(/<SectionHead[^>]*num="(\d+)"/g)].map(match => match[1]), ["01", "02", "03"]);
  assert.doesNotMatch(source, /id="ai-suggestions"|id="collaboration"/);
});

test("Resources owns the moved sections and all resource section numbers remain continuous", () => {
  assert.deepEqual(NAV[4].children.map(item => [item.label, item.href]), [
    ["Resource library", "/resources#library"],
    ["Agent knowledge", "/resources#ai-suggestions"],
    ["Latest news · per internal briefing", "/resources#collaboration"],
    ["Pitch Deck", "/resources#pitch-deck"],
  ]);
  const resources = readFileSync(new URL("../src/pages/resources.tsx", import.meta.url), "utf8");
  const briefings = readFileSync(new URL("../src/components/resource-briefings.tsx", import.meta.url), "utf8");
  const pitchDeck = readFileSync(new URL("../src/components/pitch-deck-section.tsx", import.meta.url), "utf8");
  assert.match(resources, /<AgentKnowledgeSection \/>\s*<LatestNewsSection \/>\s*<PitchDeckSection \/>/);
  assert.deepEqual([
    ...[...resources.matchAll(/<SectionHead[^>]*num="(\d+)"/g)].map(match => match[1]),
    ...[...resources.matchAll(/eyebrow[^>]*>(\d+) ·/g)].map(match => match[1]),
    ...[...briefings.matchAll(/<SectionHead[^>]*num="(\d+)"/g)].map(match => match[1]),
    ...[...pitchDeck.matchAll(/<SectionHead[^>]*num="(\d+)"/g)].map(match => match[1]),
  ], ["01", "02", "03", "04", "05", "06", "07"]);
});

test("nested routes highlight their new parent without activating Overview twice", () => {
  for (const path of ["/sell-sheet", "/pricing"]) assert.equal(isNavItemActive(NAV[2], path), true);
  for (const path of ["/agenda", "/demos/brief", "/demos/instance-details", "/demos/nuggets"]) assert.equal(isNavItemActive(NAV[3], path), true);
  assert.equal(isNavItemActive(NAV[0], "/architecture"), false);
  assert.equal(isNavItemActive(NAV[1], "/architecture"), true);
  assert.equal(isNavItemActive(NAV[2], "/salesman"), false);
});
