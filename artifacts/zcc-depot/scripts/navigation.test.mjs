import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NAV, isNavItemActive } from "../src/data/navigation.ts";

test("main menu keeps Resources as its final destination", () => {
  assert.deepEqual(NAV.map(n => n.label), ["Overview", "Architecture", "Sales", "Demos", "Resources"]);
  assert.equal(NAV.at(-1).href, "/resources");
  assert.equal(NAV[0].children[0].href, "/#overview");
  assert.equal(NAV[0].children[2].href, "/#how-it-works");
});

test("Sales and Demos contain the exact requested destinations and sequence", () => {
  assert.deepEqual(NAV[2].children.map(n => [n.label, n.href]), [
    ["Sell Sheet", "/sell-sheet"], ["Pricing", "/pricing"],
  ]);
  assert.deepEqual(NAV[3].children.map(n => [n.label, n.href]), [
    ["Demo Blueprint", "/demos#agenda"],
    ["Demo Click-Through", "/demos#guided-demo"],
    ["Demo Instance Details", "/demos/instance-details"],
    ["Demo Researcher", "/demos/brief"],
    ["Demo Agenda", "/agenda"],
    ["Demo Nuggets", "/demos/nuggets"],
  ]);
});

test("Architecture contains only the two requested submenu destinations", () => {
  assert.equal(NAV[1].href, "/architecture#data-flow");
  assert.deepEqual(NAV[1].children.map(item => [item.label, item.href]), [
    ["System + data flow", "/architecture#data-flow"],
    ["Components", "/architecture/components"],
  ]);
});

test("Architecture starts with data flow and no longer contains How it works", () => {
  const source = readFileSync(new URL("../src/pages/architecture.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Global platform|#footprint|id="footprint"|<Footprint/);
  assert.deepEqual([...source.matchAll(/<SectionHead[^>]*id="([^"]+)"/g)].map(match => match[1]), ["data-flow", "components"]);
  assert.doesNotMatch(source, /id="ai-suggestions"|id="collaboration"|<CallJourney|eyebrow="How it works"/);
  assert.match(source, /hash === "#journey"[\s\S]*?navigate\("\/#how-it-works", \{ replace: true \}\)/);
});

test("Resources owns the moved sections without changing the existing library", () => {
  assert.deepEqual(NAV[4].children.map(item => [item.label, item.href]), [
    ["Resource library", "/resources#library"],
    ["Agent knowledge", "/resources#ai-suggestions"],
    ["Latest news · per internal briefing", "/resources#collaboration"],
    ["Pitch Deck", "/resources#pitch-deck"],
    ["FAQ", "/resources#faq"],
    ["Roadmap · confidential", "/resources#roadmap"],
  ]);
  const resources = readFileSync(new URL("../src/pages/resources.tsx", import.meta.url), "utf8");
  assert.match(resources, /<AgentKnowledgeSection \/>\s*<LatestNewsSection \/>\s*<PitchDeckSection \/>/);
  assert.doesNotMatch(resources, />0[34] ·/);
});

test("Section headings and navigation names have no numerical prefixes", () => {
  for (const item of NAV) {
    for (const label of [item.label, ...(item.children ?? []).map(child => child.label)]) {
      assert.doesNotMatch(label, /^\d/);
    }
  }
  const kit = readFileSync(new URL("../src/components/kit.tsx", import.meta.url), "utf8");
  const sectionHead = kit.slice(kit.indexOf("export function SectionHead"), kit.indexOf("const MOTIFS"));
  assert.doesNotMatch(sectionHead, /\{num\}/);
  const header = readFileSync(new URL("../src/components/header-navigation.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(header, /0\{index \+ 1\}/);
  assert.match(header, /<a \{\.\.\.props\} href=\{sectionHref\(item\)\}/);
});

test("nested routes highlight their new parent without activating Overview twice", () => {
  for (const path of ["/sell-sheet", "/pricing"]) assert.equal(isNavItemActive(NAV[2], path), true);
  for (const path of ["/agenda", "/demos/brief", "/demos/instance-details", "/demos/nuggets"]) assert.equal(isNavItemActive(NAV[3], path), true);
  assert.equal(isNavItemActive(NAV[0], "/architecture"), false);
  assert.equal(isNavItemActive(NAV[1], "/architecture"), true);
  assert.equal(isNavItemActive(NAV[1], "/architecture/components"), true);
  assert.equal(isNavItemActive(NAV[2], "/salesman"), false);
});
