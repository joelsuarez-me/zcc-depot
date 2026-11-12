import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { sectionAnchorId } from "../src/lib/section-navigation.ts";

test("bespoke section fragments are readable and unique", () => {
  assert.equal(sectionAnchorId("Quality & assurance", new Set()), "section-quality-assurance");
  assert.equal(sectionAnchorId("Café", new Set()), "section-cafe");
  assert.equal(sectionAnchorId("Quality", new Set(["section-quality", "section-quality-2"])), "section-quality-3");
  assert.equal(sectionAnchorId("💡", new Set()), "section-untitled");
});

test("Overview has a full-viewport hero and fixed arrows are on the left", () => {
  const home = readFileSync(new URL("../src/pages/home.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/landing-hero-art.css", import.meta.url), "utf8");
  const nav = readFileSync(new URL("../src/components/section-navigation.tsx", import.meta.url), "utf8");
  assert.match(home, /id="overview" data-section-nav/);
  assert.match(css, /landing-overview-wrap[\s\S]*?min-height: 100svh/);
  assert.match(nav, /fixed left-3/);
  assert.match(nav, /data-testid="link-current-section"/);
});

test("section links preserve route and query by using native fragments", () => {
  const source = readFileSync(new URL("../src/components/section-link.tsx", import.meta.url), "utf8");
  assert.match(source, /href=\{`#\$\{encodeURIComponent\(id\)\}`\}/);
  assert.doesNotMatch(source, /href="\/"/);
});

test("phone arrow placement is scoped to Components and does not cover its content", () => {
  const nav = readFileSync(new URL("../src/components/section-navigation.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/contact-center-components/components-guide.css", import.meta.url), "utf8");
  assert.match(nav, /location === "\/architecture\/components" \? "section-nav-components" : ""/);
  assert.match(nav, /bottom: "var\(--section-nav-bottom, calc\(env\(safe-area-inset-bottom/);
  assert.match(css, /@media \(max-width:767px\)\{\s*\.section-nav-components\{/);
  assert.match(css, /--section-nav-bottom:auto;[\s\S]*?top:15px;[\s\S]*?flex-direction:row;/);
  assert.match(css, /\.section-nav-components \[data-testid="link-current-section"\]\{display:none\}/);
  assert.match(nav, /h-11 w-11/);
});

test("FAQ moved to Resources and the Human plus AI section was deleted", () => {
  const sales = readFileSync(new URL("../src/pages/sales.tsx", import.meta.url), "utf8");
  const resources = readFileSync(new URL("../src/pages/resources.tsx", import.meta.url), "utf8");
  const search = readFileSync(new URL("../src/data/search.ts", import.meta.url), "utf8");
  assert.doesNotMatch(sales, /id="operating-model"|function OperatingModel|id="faq"/);
  assert.doesNotMatch(sales, /\["#outcomes", "Outcomes"\]/);
  assert.match(sales, /navigate\("\/resources#faq"/);
  assert.match(resources, /<ResourceFaq \/>/);
  assert.doesNotMatch(search, /\/sales#faq|\/sales#operating-model/);
});
