// Run with pnpm --filter @workspace/zcc-depot run test:components.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement, act } from "react";
import { create } from "react-test-renderer";
import { ComponentShowcase } from "../src/components/component-showcase.tsx";
import { CORE_COMPONENTS, COMPONENT_DOCUMENTATION } from "../src/data/content.ts";
import { componentDocumentation } from "../src/lib/component-documentation.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let reduced = false, nextTimer = 0;
const timers = new Map(), observers = new Set(), mediaListeners = new Set();
const doc = new EventTarget();
doc.hidden = false;
globalThis.document = doc;
globalThis.window = {
  matchMedia: () => ({
    get matches() { return reduced; },
    addEventListener: (_name, callback) => mediaListeners.add(callback),
    removeEventListener: (_name, callback) => mediaListeners.delete(callback),
  }),
  setInterval: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
  clearInterval: id => timers.delete(id),
};
globalThis.IntersectionObserver = class {
  constructor(callback) { this.callback = callback; observers.add(this); }
  observe() { this.callback([{ isIntersecting: true }]); }
  disconnect() { observers.delete(this); }
};

const read = name => readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");
async function mount(t, resources = COMPONENT_DOCUMENTATION) {
  assert.equal(timers.size, 0);
  reduced = false; doc.hidden = false;
  let tree;
  await act(() => {
    tree = create(createElement(ComponentShowcase, { resources }), { createNodeMock: () => ({}) });
  });
  t.after(async () => {
    await act(() => tree.unmount());
    assert.equal(timers.size, 0);
    assert.equal(observers.size, 0);
    assert.equal(mediaListeners.size, 0);
  });
  return tree;
}
const byId = (tree, id) => tree.root.findByProps({ "data-testid": id });
const caption = (tree, id) => byId(tree, `card-component-${id}`).findByProps({ className: "cs-caption" }).children.join("");

test("all thirteen terms map to official public documentation without missing values", () => {
  const terms = CORE_COMPONENTS.flatMap(c => c.chips);
  assert.equal(terms.length, 13);
  assert.deepEqual(Object.keys(COMPONENT_DOCUMENTATION).sort(), [...terms].sort());
  for (const term of terms) {
    const href = componentDocumentation(term, COMPONENT_DOCUMENTATION);
    assert.ok(href, term);
    assert.match(href, /^https:\/\/(?:docs\.aws\.amazon\.com|support\.zendesk\.com)\//);
  }
});
test("missing, malformed, private and unsafe mappings cannot become clickable links", () => {
  for (const href of [undefined, "", "javascript:alert(1)", "http://docs.aws.amazon.com/foo",
    "https://docs.google.com/private", "https://support.zendesk.com/admin",
    "https://docs.aws.amazon.com.evil.example/foo", "https://secret@docs.aws.amazon.com/foo", "not a url"]) {
    assert.equal(componentDocumentation("Term", { Term: href }), undefined);
  }
});
test("renders four unnumbered named panels, stable direct links and thirteen new-tab documentation links", async t => {
  const tree = await mount(t);
  const cards = tree.root.findAllByType("article");
  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map(c => c.props.id), ["component-connect", "component-app", "component-identity", "component-cloudformation"]);
  assert.deepEqual(tree.root.findAllByType("h3").map(h => h.children.join("")), CORE_COMPONENTS.map(c => c.t));
  for (const card of cards) {
    assert.equal(card.props["aria-labelledby"], `${card.props.id}-title`);
    assert.equal(byId(tree, `link-section-${card.props.id}`).props.href, `#${card.props.id}`);
  }
  const docs = tree.root.findAllByType("a").filter(a => a.props.target === "_blank");
  assert.equal(docs.length, 13);
  docs.forEach(a => { assert.equal(a.props.rel, "noopener noreferrer"); assert.ok(a.props.href); });
  assert.equal(timers.size, 4);
});
test("missing documentation renders an explicit unavailable message rather than an undefined anchor", async t => {
  const tree = await mount(t, { ...COMPONENT_DOCUMENTATION, Voice: undefined });
  assert.equal(tree.root.findAllByProps({ "data-testid": "link-chip-component-connect-voice" }).length, 0);
  assert.ok(tree.root.findByProps({ className: "cs-chip cs-chip-unavailable" }).children.join("").includes("Documentation unavailable"));
});
test("Amazon Connect manual channel and step controls work and pause autoplay", async t => {
  const tree = await mount(t);
  await act(() => byId(tree, "button-connect-chat").props.onClick());
  assert.equal(byId(tree, "button-connect-chat").props["aria-pressed"], true);
  assert.equal(caption(tree, "connect"), "Contact arrives");
  assert.equal(byId(tree, "button-pause-component-connect").props["aria-pressed"], true);
  assert.equal(timers.size, 3);
  for (let i = 0; i < 3; i++) await act(() => byId(tree, "button-connect-step").props.onClick());
  assert.equal(caption(tree, "connect"), "Routed to agent");
  await act(() => byId(tree, "button-connect-voice").props.onClick());
  assert.equal(caption(tree, "connect"), "Contact arrives");
});
test("the app's native buttons select all views without an autoplay race", async t => {
  const tree = await mount(t);
  for (const [view, expected] of [["messages", "omnichannel inbox"], ["dashboard", "supervisor dashboard"], ["call", "call controls"]]) {
    await act(() => byId(tree, `button-app-${view}`).props.onClick());
    const button = byId(tree, `button-app-${view}`);
    assert.equal(button.props.type, "button");
    assert.equal(button.props["aria-pressed"], true);
    assert.ok(caption(tree, "app").includes(expected));
  }
  assert.equal(timers.size, 3);
});
test("identity step selection and restart work without performing sign-in", async t => {
  const tree = await mount(t);
  await act(() => byId(tree, "button-identity-step-3").props.onClick());
  assert.match(caption(tree, "identity"), /Connect, Cognito and console/);
  await act(() => byId(tree, "button-identity-restart").props.onClick());
  assert.match(caption(tree, "identity"), /Corporate.*configured MFA/);
  assert.equal(timers.size, 3);
});
test("CloudFormation's range reveals each layer and supports a template-only state", async t => {
  const tree = await mount(t);
  for (let count = 0; count <= 4; count++) {
    await act(() => byId(tree, "input-cfn-layers").props.onChange({ target: { value: String(count) } }));
    assert.equal(byId(tree, "input-cfn-layers").props.value, count);
  }
  assert.match(caption(tree, "cloudformation"), /Cognito, IAM roles, Lambda functions, Streaming connections/);
  await act(() => byId(tree, "input-cfn-layers").props.onChange({ target: { value: "0" } }));
  assert.equal(byId(tree, "input-cfn-layers").props["aria-valuetext"], "Template only");
  assert.equal(timers.size, 3);
});
test("pause and resume stop and restart the actual automatic progression", async t => {
  const tree = await mount(t);
  await act(() => byId(tree, "button-pause-component-connect").props.onClick());
  assert.equal(timers.size, 3);
  assert.equal(byId(tree, "button-pause-component-connect").props["aria-pressed"], true);
  await act(() => byId(tree, "button-pause-component-connect").props.onClick());
  assert.equal(timers.size, 4);
  await act(() => [...timers.values()].forEach(callback => callback()));
  assert.equal(caption(tree, "connect"), "Contact flow runs");
});
test("off-screen and hidden-tab illustrations stop ticking and resume only when visible", async t => {
  const tree = await mount(t);
  const first = [...observers][0];
  await act(() => first.callback([{ isIntersecting: false }]));
  assert.equal(timers.size, 3);
  await act(() => { doc.hidden = true; doc.dispatchEvent(new Event("visibilitychange")); });
  assert.equal(timers.size, 0);
  await act(() => { doc.hidden = false; doc.dispatchEvent(new Event("visibilitychange")); });
  assert.equal(timers.size, 3);
  await act(() => first.callback([{ isIntersecting: true }]));
  assert.equal(timers.size, 4);
  assert.ok(byId(tree, "card-component-connect").props.className.includes("run"));
});
test("reduced-motion changes stop autoplay but keep manual exploration usable", async t => {
  const tree = await mount(t);
  await act(() => { reduced = true; [...mediaListeners].forEach(callback => callback()); });
  assert.equal(timers.size, 0);
  for (const id of ["connect", "app", "identity", "cloudformation"]) {
    assert.equal(byId(tree, `button-pause-component-${id}`).props.disabled, true);
  }
  await act(() => byId(tree, "button-connect-step").props.onClick());
  assert.equal(caption(tree, "connect"), "Contact flow runs");
});
test("responsive controls and paused/reduced-motion visuals have explicit scoped safeguards", () => {
  const css = read("components/component-showcase.css");
  const nav = read("components/section-navigation.tsx");
  const architecture = read("pages/architecture.tsx");
  assert.match(css, /@media\(min-width:768px\).*grid-template-columns:1fr 1fr/);
  assert.match(css, /\.still \*.*animation-play-state:paused!important/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.cs-dots button\{[^}]*min-height:44px/);
  assert.match(css, /\.cs-app-preview\{[^}]*perspective/);
  assert.doesNotMatch(css, /\.cs-app\{/);
  assert.match(css, /\.section-nav-architecture\{[^}]*top:15px/);
  assert.match(nav, /location === "\/architecture\/components" \? "section-nav-components"/);
  assert.match(nav, /location === "\/architecture" \? "section-nav-architecture"/);
  assert.match(architecture, /<ComponentShowcase resources=\{COMPONENT_DOCUMENTATION\}/);
  assert.match(architecture, /id="components"/);
  assert.match(architecture, /link-components-guide/);
  assert.match(architecture, /Customer data boundary/);
});
