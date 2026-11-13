import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { act, create } from "react-test-renderer";
import { INDUSTRIES, USE_CASES, CATEGORIES, USE_CASE_SOURCES, filterUseCases, useCaseSummary } from "../src/data/verticals/index.ts";
import { NAV, isNavItemActive } from "../src/data/navigation.ts";
import SalesUseCases from "../src/pages/sales-use-cases.tsx";
import { UseCaseDetail } from "../src/components/vertical-use-cases/use-case-detail.tsx";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test("nine industries contain exactly five complete, uniquely authored use cases each", () => {
  assert.equal(INDUSTRIES.length, 9); assert.equal(USE_CASES.length, 45);
  assert.equal(new Set(USE_CASES.map(item => item.id)).size, 45);
  assert.equal(new Set(USE_CASES.map(item => item.title)).size, 45);
  assert.equal(new Set(USE_CASES.map(item => item.challenge)).size, 45);
  assert.deepEqual(INDUSTRIES.map(item => item.name), ["Financial Services", "Healthcare", "Government (State & Local)", "Computers & Electronics", "Energy & Utilities", "Travel", "Telecommunications", "Nonprofit & Social Services", "Pharmaceuticals & Life Sciences"]);
  for (const industry of INDUSTRIES) {
    assert.equal(USE_CASES.filter(item => item.industryId === industry.id).length, 5, industry.name);
    assert.ok(industry.qualification.length > 100);
  }
  for (const item of USE_CASES) {
    assert.ok(CATEGORIES.includes(item.category)); assert.ok(item.challenge.length > 60);
    assert.equal(item.workflow.length, 5); assert.equal(item.architecture.length, 4);
    assert.equal(item.demoSteps.length, 5); assert.ok(item.demoSteps.every(step => step.title && step.detail && step.conceptual));
    assert.ok(item.outcomes.length >= 3 && item.outcomes.length <= 5);
    assert.ok(item.discovery.length >= 3 && item.discovery.length <= 5);
    assert.equal(new Set(item.solution.map(solution => solution.kind)).size, 4);
    for (const node of [...item.workflow, ...item.architecture]) assert.ok(node.label && node.component && node.detail.length > 30 && node.kind);
    assert.equal(item.workflow[4].kind, "External integration");
    assert.doesNotMatch([item.challenge, ...item.outcomes].join(" "), /\d+\s*%|guaranteed\s+(ROI|compliance)/i);
  }
});
test("all source references resolve to official public Zendesk or AWS documentation", () => {
  for (const item of USE_CASES) {
    for (const id of item.sourceIds) {
      const source = USE_CASE_SOURCES.find(entry => entry.id === id);
      assert.ok(source); assert.ok(source.scope.length > 30);
      assert.ok(["www.zendesk.com", "support.zendesk.com", "developer.zendesk.com", "docs.aws.amazon.com"].includes(new URL(source.url).hostname));
    }
  }
});
test("search and combined filters cover all cases and return safe empty results", () => {
  assert.equal(filterUseCases().length, 45);
  for (const industry of INDUSTRIES) assert.equal(filterUseCases({ industryId: industry.id }).length, 5);
  for (const category of CATEGORIES) assert.ok(filterUseCases({ category }).every(item => item.category === category));
  assert.equal(filterUseCases({ industryId: "healthcare", category: "Billing & transactions" }).length, 1);
  assert.ok(filterUseCases({ query: "  MoRTGage   application  " }).some(item => item.id.endsWith("lending-support")));
  assert.equal(filterUseCases({ query: "qzx-no-such-scenario" }).length, 0);
  assert.equal(filterUseCases({ industryId: "unknown" }).length, 0);
  assert.ok(filterUseCases({ query: "pharmacovigilance" }).some(item => item.id.endsWith("adverse-event")));
});
test("copied summaries retain the whole story, qualifications and official references", () => {
  for (const item of USE_CASES) {
    const summary = useCaseSummary(item);
    for (const label of ["Challenge:", "Solution:", "Workflow:", "Potential business outcomes:", "Demo walkthrough", "Discovery:", "Qualification:", "Public references"]) assert.ok(summary.includes(label));
    assert.ok(summary.includes("https://docs.aws.amazon.com/connect/"));
    assert.ok(summary.includes("Hypothetical example only"));
  }
});
test("Sales menu and routing preserve existing entries and highlight the new page", () => {
  const sales = NAV.find(item => item.label === "Sales");
  assert.deepEqual(sales.children.map(item => item.label), ["Sell Sheet", "Pricing", "Use Cases by Vertical"]);
  assert.ok(isNavItemActive(sales, "/sales/use-cases-by-vertical"));
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.match(app, /path="\/sales\/use-cases-by-vertical" component=\{SalesUseCases\}/);
  for (const route of ["/sales", "/pricing", "/sell-sheet", "/agenda", "/demos/nuggets"]) assert.ok(app.includes(`path="${route}"`));
});

const byId = (root, id) => root.root.findByProps({ "data-testid": id });
const serialized = root => JSON.stringify(root.toJSON());
const click = async (root, id) => act(async () => { byId(root, id).props.onClick(); });
const title = root => byId(root, "text-usecase-title").children.join("");
async function harness(run, { query = "", clipboardBlocked = false, reduce = false } = {}) {
  const previous = { window: globalThis.window, document: globalThis.document, navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator") };
  const listeners = new Map(), history = [], copied = [], focused = [], scrolls = [];
  let location = new URL(`https://example.com/sales/use-cases-by-vertical${query}`);
  globalThis.__verticalToasts = []; globalThis.__reduceVerticalMotion = reduce;
  const document = { title: "Original", body: { style: { overflow: "auto" } }, querySelector: () => null,
    getElementById: id => ({ scrollIntoView: value => scrolls.push([id, value]) }), activeElement: null };
  globalThis.document = document;
  globalThis.window = { get location() { return location; },
    history: { state: {}, pushState(state, _, url) { location = new URL(url, location); history.push(location.href); },
      replaceState(state, _, url) { location = new URL(url, location); } },
    addEventListener(name, cb) { listeners.set(name, cb); }, removeEventListener(name) { listeners.delete(name); } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { async writeText(value) { if (clipboardBlocked) throw new Error("Denied"); copied.push(value); } } } });
  let root;
  try {
    await act(async () => { root = create(React.createElement(SalesUseCases), { createNodeMock(element) {
      const node = { focus() { document.activeElement = node; focused.push(element.props["data-testid"]); },
        querySelectorAll() { return []; } };
      return node;
    } }); });
    await run({ root, history, copied, focused, scrolls, document, listeners,
      async pop(url) { location = new URL(url, location); await act(async () => listeners.get("popstate")()); },
      async key(key) { await act(async () => listeners.get("keydown")?.({ key, target: { closest: () => null }, preventDefault() {} })); } });
  } finally {
    await act(async () => root?.unmount()); globalThis.window = previous.window; globalThis.document = previous.document;
    if (previous.navigator) Object.defineProperty(globalThis, "navigator", previous.navigator); else delete globalThis.navigator;
    delete globalThis.__verticalToasts; delete globalThis.__reduceVerticalMotion;
  }
}
test("industry/category/search selection updates the actual displayed case and empty state", () => harness(async ({ root, scrolls }) => {
  assert.equal(root.root.findAll(node => typeof node.type === "string" && node.props["data-testid"]?.startsWith("card-industry-")).length, 9);
  await click(root, "card-industry-healthcare");
  assert.equal(byId(root, "text-result-count").children.join(""), "5 shown");
  assert.equal(title(root), "Patient Appointment Scheduling & Reminders"); assert.equal(scrolls.length, 1);
  await click(root, "filter-category-billing-transactions");
  assert.equal(title(root), "Billing and Insurance Inquiry Management");
  await act(async () => byId(root, "input-search-usecases").props.onChange({ target: { value: "mortgage" } }));
  assert.match(serialized(root), /No use cases match/);
  await click(root, "button-reset-filters");
  assert.equal(byId(root, "text-result-count").children.join(""), "45 shown");
}));
test("Next and Previous open all 45 case details and stop at the boundaries", () => harness(async ({ root }) => {
  assert.equal(byId(root, "button-prev").props.disabled, true);
  for (let i = 0; i < USE_CASES.length; i++) {
    assert.equal(title(root), USE_CASES[i].title);
    if (i < USE_CASES.length - 1) await click(root, "button-next");
  }
  assert.equal(byId(root, "button-next").props.disabled, true);
  await click(root, "button-prev"); assert.equal(title(root), USE_CASES.at(-2).title);
}));
test("direct URLs, browser history and the mobile selector preserve selection", () => harness(async ({ root, pop }) => {
  assert.equal(title(root), USE_CASES.at(-1).title);
  await act(async () => byId(root, "select-mobile-usecase").props.onChange({ target: { value: USE_CASES[2].id } }));
  assert.equal(title(root), USE_CASES[2].title);
  await pop(`?industry=healthcare&case=${USE_CASES[0].id}`);
  assert.equal(title(root), "Patient Appointment Scheduling & Reminders", "A stale case URL must not override active filters");
}, { query: `?case=${USE_CASES.at(-1).id}` }));
test("presentation supports keyboard navigation, Escape, focus restoration and copy", () => harness(async ({ root, key, document, copied, focused }) => {
  await click(root, "button-copy-summary"); assert.ok(copied[0].includes(USE_CASES[0].title));
  await click(root, "button-present"); assert.equal(document.body.style.overflow, "hidden");
  assert.ok(byId(root, "dialog-present"));
  await key("ArrowRight");
  assert.ok(byId(root, "dialog-present").props["aria-label"].includes(USE_CASES[1].title));
  await key("Escape");
  assert.equal(root.root.findAllByProps({ "data-testid": "dialog-present" }).length, 0);
  assert.equal(document.body.style.overflow, "auto"); assert.ok(focused.includes("button-present"));
}));
test("clipboard rejection is visible and reduced-motion navigation avoids smooth scrolling", () => harness(async ({ root, scrolls }) => {
  await click(root, "button-copy-summary");
  assert.equal(globalThis.__verticalToasts.at(-1).title, "Copy unavailable");
  await click(root, "card-industry-travel"); assert.equal(scrolls.at(-1)[1].behavior, "instant");
  const css = readFileSync(new URL("../src/components/vertical-use-cases/vuc.css", import.meta.url), "utf8");
  assert.match(css, /prefers-reduced-motion:reduce/); assert.match(css, /focus-visible/);
}, { clipboardBlocked: true, reduce: true }));
for (const item of USE_CASES) test(`workflow and architecture nodes respond: ${item.title}`, async () => {
  let root;
  try {
    await act(async () => { root = create(React.createElement(UseCaseDetail, {
      useCase: item, industry: INDUSTRIES.find(industry => industry.id === item.industryId), sources: USE_CASE_SOURCES,
    })); });
    assert.equal(title(root), item.title);
    for (const [kind, nodes] of [["workflow", item.workflow], ["architecture", item.architecture]]) {
      for (const node of nodes) {
        const id = `node-d-${kind}-${node.id}`;
        if (byId(root, id).props["aria-pressed"]) await click(root, id);
        await click(root, id); assert.equal(byId(root, id).props["aria-pressed"], true);
        assert.ok(serialized(root).includes(node.detail));
      }
      await click(root, `button-expand-d-${kind}`);
      assert.equal(byId(root, `button-expand-d-${kind}`).props["aria-expanded"], true);
    }
    for (const heading of ["Customer challenge", "Zendesk Contact Center solution", "Interactive workflow and architecture", "Potential business outcomes", "Demo walkthrough", "Discovery questions"]) assert.ok(serialized(root).includes(heading));
  } finally { await act(async () => root?.unmount()); }
});
