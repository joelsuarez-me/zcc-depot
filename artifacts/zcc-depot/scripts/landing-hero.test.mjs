import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/components/landing-hero-art.css", import.meta.url), "utf8");
const art = readFileSync(new URL("../src/components/landing-hero-art.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/pages/home.tsx", import.meta.url), "utf8");

test("landing copy includes the new title, subtitle, positioning and image tagline", () => {
  assert.match(home, />Platform<\/span>\{" "\}Architect Depot/);
  assert.ok(home.includes("Where technical expertise meets business value."));
  assert.ok(home.includes("Built by Zendesk Contact Center Platform Architects, this centralized resource"));
  assert.ok(home.includes("confidently position, demonstrate, and accelerate the adoption of Zendesk Contact Center."));
  for (const line of ["Architect the solution.", "Demonstrate the value.", "Accelerate the win."]) {
    assert.ok(art.includes(line));
  }
  assert.doesNotMatch(home, /Developed by Zendesk|ZENDESK CONTACT CENTER ·/);
});

test("landing hero pairs the title and description with a contained right-hand image", () => {
  assert.match(css, /grid-template-areas: "title art" "description art"/);
  assert.match(css, /aspect-ratio: 1484 \/ 1114/);
  assert.match(css, /\.landing-hero-art img \{[^}]*width: 100%; height: auto/);
  assert.doesNotMatch(css, /min-height:\s*(?:calc\([^;]*|\d+)(?:svh|vh)/);
});

test("halo, float, sweep, rings and wave animate continuously without hover", () => {
  for (const name of ["halo", "float", "sweep", "ring", "wave"]) {
    assert.match(css, new RegExp(`animation: lh-${name} [^;]*infinite`));
    assert.match(css, new RegExp(`@keyframes lh-${name}`));
  }
  assert.doesNotMatch(css, /:hover[^}]*animation/);
});

test("one accessible toggle pauses every illustration animation and starts unpaused", () => {
  assert.match(art, /\[paused, setPaused\] = useState\(false\)/);
  assert.match(art, /paused \? " is-paused" : ""/);
  assert.match(art, /aria-pressed=\{paused\}/);
  assert.match(art, /setPaused\(value => !value\)/);
  assert.match(css, /\.landing-hero-art\.is-paused \*[^}]*animation-play-state: paused !important/);
  assert.match(css, /width: 44px;[\s\S]*height: 44px/);
});

test("reduced-motion stops every animation and suppresses decorative sweeps", () => {
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  for (const name of ["halo", "float", "clip::after", "rings span", "wave b"]) {
    assert.ok(reduced.includes(`.landing-hero-art-${name}`));
  }
  assert.match(reduced, /animation: none !important/);
  assert.match(reduced, /\.landing-hero-art-clip::after \{ opacity: 0/);
});

test("tablet spacing and phone stacking are scoped to the landing hero", () => {
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1023px\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(150px, 24vw\)/);
  assert.match(css, /grid-template-areas: "title" "description" "art"/);
  assert.doesNotMatch(css, /(?:^|\n)\.zhero\s*\{/);
});
