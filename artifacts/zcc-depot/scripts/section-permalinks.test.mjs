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

test("Overview has a compact linked hero and fixed arrows remain on the left", () => {
  const home = readFileSync(new URL("../src/pages/home.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/landing-hero-art.css", import.meta.url), "utf8");
  const nav = readFileSync(new URL("../src/components/section-navigation.tsx", import.meta.url), "utf8");
  assert.match(home, /id="overview" data-section-nav/);
  assert.match(css, /landing-overview-wrap\s*\{[^}]*min-height: 0/);
  assert.doesNotMatch(css, /(?:min-)?height:\s*(?:calc\([^;]*|\d+)(?:svh|vh)/);
  assert.match(nav, /fixed left-3/);
  assert.match(nav, /data-testid="link-current-section"/);
});

test("section links preserve route and query by using native fragments", () => {
  const source = readFileSync(new URL("../src/components/section-link.tsx", import.meta.url), "utf8");
  assert.match(source, /href=\{`#\$\{encodeURIComponent\(id\)\}`\}/);
  assert.doesNotMatch(source, /href="\/"/);
});

test("each pricing column has a visible named permalink beside its heading", () => {
  const source = readFileSync(new URL("../src/pages/pricing.tsx", import.meta.url), "utf8");
  assert.match(source, /import \{ SectionLink \} from "@\/components\/section-link"/);
  assert.match(source, /<div className="mt-4 flex items-start justify-between gap-3">\s*<h2[^>]*min-w-0[^>]*>[\s\S]*?<\/h2>\s*<SectionLink id=\{m.id\} label=\{m.name\} dark=\{v.tone === "forest"\} \/>/);
  assert.match(source, /<section id=\{m.id\}[\s\S]*?scroll-mt-24/);
  assert.match(source, /grid gap-5 lg:grid-cols-3/);
  const guide = readFileSync(new URL("../../api-server/src/lib/pricingGuide.ts", import.meta.url), "utf8");
  for (const id of ["bundle", "byoa", "team"]) {
    assert.match(guide, new RegExp(`id: "${id}"`));
    const destination = new URL(`#${encodeURIComponent(id)}`, "https://example.com/depot/pricing?source=internal");
    assert.equal(destination.pathname, "/depot/pricing");
    assert.equal(destination.search, "?source=internal");
    assert.equal(destination.hash, `#${id}`);
  }
});

test("pricing fragment visits retain the client and server sign-in gates", () => {
  const client = readFileSync(new URL("../src/pages/pricing.tsx", import.meta.url), "utf8");
  const server = readFileSync(new URL("../../api-server/src/routes/pricing.ts", import.meta.url), "utf8");
  assert.match(client, /enabled: isAuthenticated/);
  assert.match(client, /if \(!isAuthenticated\) return <SignIn/);
  assert.match(client, /q.error[\s\S]*?status === 401\) return <SignIn login=\{login\} expired/);
  assert.match(server, /Cache-Control", "private, no-store"/);
  assert.match(server, /if \(!req.isAuthenticated\(\)\) \{\s*res.status\(401\)/);
  assert.match(server, /res.json\(GetPricingGuideResponse.parse\(pricingGuide\)\)/);
});

test("phone arrows use shared header placement on every route without covering content", () => {
  const nav = readFileSync(new URL("../src/components/section-navigation.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/section-navigation.css", import.meta.url), "utf8");
  assert.match(nav, /import "\.\/section-navigation\.css"/);
  assert.match(nav, /className=\{`section-navigation fixed left-3/);
  assert.match(nav, /bottom: "var\(--section-nav-bottom, calc\(env\(safe-area-inset-bottom/);
  assert.match(css, /@media \(max-width:767px\)\{\s*\.section-navigation\{/);
  assert.match(css, /--section-nav-bottom:auto;[\s\S]*?top:15px;[\s\S]*?flex-direction:row;/);
  assert.match(css, /\.section-navigation \[data-testid="link-current-section"\]\{display:none\}/);
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
