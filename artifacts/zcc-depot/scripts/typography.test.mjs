import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");

test("the primary font uses the supplied Zendesk system stack in order", () => {
  const stack = css.match(/--app-font-sans:\s*([^;]+);/)[1];
  assert.deepEqual(stack.split(",").map(font => font.trim().replaceAll('"', "")), [
    "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto",
    "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", "Arial", "sans-serif",
  ]);
  assert.match(css, /body\s*\{[^}]*font-family: var\(--app-font-sans\)/);
  assert.match(css, /--app-font-serif: var\(--app-font-sans\)/);
});

test("diagram typography follows the site stack without removing technical monospace", () => {
  for (const path of ["system-data-flow.css", "component-showcase.css"]) {
    const component = readFileSync(new URL(`../src/components/${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(component, /DM Sans|Vanilla Sans/);
    assert.match(component, /var\(--app-font-sans\)/);
  }
  assert.match(css, /--app-font-mono: 'JetBrains Mono', Menlo, monospace/);
  assert.doesNotMatch(css, /DM\+Sans|Instrument\+Serif|Vanilla Sans/);
});

test("landing title scales every responsive size by 50 percent and can wrap on phones", () => {
  const hero = readFileSync(new URL("../src/components/landing-hero-art.css", import.meta.url), "utf8");
  const home = readFileSync(new URL("../src/pages/home.tsx", import.meta.url), "utf8");
  assert.match(hero, /font-size: clamp\(1\.95rem, 4\.65vw, 3\.975rem\)/);
  assert.match(hero, /font-size: clamp\(1\.5rem, 8\.25vw, 3\.15rem\)/);
  assert.match(hero, /grid-template-areas: "title title" "description art"/);
  assert.equal((home.match(/className="block md:whitespace-nowrap"/g) || []).length, 2);
});
