import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import React from "react";
import { act, create } from "react-test-renderer";
import { FEATURES } from "../src/data/content";
import { FEATURE_REGISTRY, REQUESTED_FEATURE_IDS, LEGACY_FEATURE_IDS, filterFeatures, getCategoryCounts, getFeatureById, featureHref } from "../src/data/feature-registry";
import { FEATURE_CATEGORIES, FEATURE_CLASSIFICATIONS } from "../src/data/feature-types";
import { simFor } from "../src/components/features/sims";
import { FeatureExplorer } from "../src/components/features/feature-explorer";
import { usePlayback } from "../src/components/features/use-playback";
import { FeaturePresenterNotes } from "../src/components/features/feature-presenter-notes";
// Server-only modules are imported into this disposable Node test bundle, never browser code.
import { featurePresenterGuidance } from "../../api-server/src/lib/feature-presenter";
import { presenterAccess } from "../../api-server/src/middlewares/presenterAccess";
import { GetPresenterContentResponse } from "../../../lib/api-zod/src/generated/api";
import { depotPrivateContent } from "../../api-server/src/lib/depot-private-content";
import { presenterRooms } from "../../api-server/src/lib/presenter-rooms";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let checks = 0;
const ok = (value: unknown, message: string) => { assert.ok(value, message); checks++; };
ok(FEATURE_REGISTRY.length === 33, "27 requested capabilities plus six additional retained concepts");
ok(REQUESTED_FEATURE_IDS.length === 27, "all 27 explicitly named requested capabilities");
ok(new Set(FEATURE_REGISTRY.map((f) => f.id)).size === 33, "unique stable semantic IDs");
ok(FEATURES.length === 14 && LEGACY_FEATURE_IDS.length === 14, "all original feature concepts retained");
["Omnichannel routing", "IVR and intelligent call routing", "Customer callbacks", "AI-powered after-call work", "Real-time sentiment analysis"].forEach((name, i) => {
  ok(FEATURES[i + 9].t === name, "original added capability order " + name);
  ok(/depend|configured|configuration|enabled/i.test(FEATURES[i + 9].d), "original availability qualification " + name);
});
for (let i = 0; i < FEATURES.length; i++) {
  const f = getFeatureById(LEGACY_FEATURE_IDS[i])!;
  ok(f.legacy?.index === i && f.legacy.title === FEATURES[i].t, "original title and reference retained " + i);
  ok(f.legacy?.description === FEATURES[i].d, "original qualified brief retained " + i);
  ok(JSON.stringify(f.legacy?.sources) === JSON.stringify(FEATURES[i].sources), "original source attribution retained " + i);
  for (const source of FEATURES[i].sources ?? []) ok(["zendesk.com", "aws.amazon.com"].some((host) => new URL(source.href).hostname === host || new URL(source.href).hostname.endsWith("." + host)), "original source remains official");
}
const classes = new Set(FEATURE_CLASSIFICATIONS.map((c) => c.value));
const counts = getCategoryCounts();
for (const c of FEATURE_CATEGORIES) {
  ok(counts[c.id] === FEATURE_REGISTRY.filter((f) => f.categories.includes(c.id)).length, "category count " + c.id);
  ok(filterFeatures(FEATURE_REGISTRY, { category: c.id }).length === counts[c.id], "category filter " + c.id);
}
for (const f of FEATURE_REGISTRY) {
  ok(/^[a-z][a-z0-9-]+$/.test(f.id), "URL-safe ID " + f.id);
  ok(featureHref(f.id) === "/?feature=" + f.id + "#features", "stable direct link " + f.id);
  for (const field of ["description", "overview", "customerProblem", "outcome", "availability"] as const) ok(!!f[field], field + " populated " + f.id);
  ok(f.benefits.length > 0 && f.useCases.length > 0 && f.configuration.length === 3, "complete public detail " + f.id);
  ok(f.classifications.every((c) => classes.has(c)), "known classifications " + f.id);
  ok(f.sources.length > 0, "has official source " + f.id);
  ok(f.lastVerified === "2026-11-15", "real capability claim-review date " + f.id);
  for (const s of f.sources) {
    const url = new URL(s.href);
    ok(url.protocol === "https:" && ["support.zendesk.com", "www.zendesk.com", "docs.aws.amazon.com", "aws.amazon.com"].includes(url.hostname), "official HTTPS source");
    ok(s.lastVerified === "2026-11-15", "actual documentation claim review date");
  }
  const ids = new Set(f.architecture.nodes.map((n) => n.id));
  ok(ids.size === f.architecture.nodes.length, "unique architecture nodes " + f.id);
  ok(f.architecture.edges.every((e) => ids.has(e.from) && ids.has(e.to)), "valid edge endpoints " + f.id);
  const sim = simFor(f);
  ok(sim.stages.length > 0 && sim.scenarios.length > 0, "simulation available " + f.id);
  for (const scenario of sim.scenarios) {
    ok(scenario.steps.length > 0, "scenario has steps " + f.id + "/" + scenario.id);
    for (const step of scenario.steps) {
      ok(Number.isInteger(step.stage) && step.stage >= 0 && step.stage < sim.stages.length, "valid stage reference");
      ok(!!step.caption && step.panels.length > 0, "visible caption and changing panels");
    }
  }
}
for (const [query, id] of [["screen pop", "unified-workspace"], ["Salesforce", "crm-integration"], ["HIPAA", "compliance-phi"], ["staffing", "workforce-management"], ["customer effort", "callbacks"], ["financial services", "customer-verification"]]) {
  ok(filterFeatures(FEATURE_REGISTRY, { query }).some((f) => f.id === id), "search names, aliases, problems, outcomes or industry: " + query);
}
ok(filterFeatures(FEATURE_REGISTRY, { query: "zz-no-such-capability" }).length === 0, "no-results search");
ok(filterFeatures(FEATURE_REGISTRY, { category: "security", classification: "Custom Development" }).every((f) => f.categories.includes("security") && f.classifications.includes("Custom Development")), "composed filters");
ok(filterFeatures(FEATURE_REGISTRY, { demoOnly: true }).every((f) => !!f.demo.href), "dedicated demo filter");
const verification = simFor(getFeatureById("customer-verification")!);
ok(verification.scenarios.map((s) => s.id).join(",") === "verified,failed,vip,unknown,timeout", "five verification paths");
for (const id of ["failed", "timeout"]) {
  const s = verification.scenarios.find((s) => s.id === id)!;
  ok(/unverified|not verified|unavailable/i.test(JSON.stringify(s.steps.at(-1))), "fail-closed verification " + id);
  ok(!/Mara Okafor|HP-20418|Theo Lindqvist|HP-00077/.test(JSON.stringify(s)), "no profile details exposed on failed identity " + id);
}
ok(/not authentication/i.test(JSON.stringify(verification)), "ANI not treated as authentication");
ok(simFor(getFeatureById("crm-integration")!).scenarios.length === 5, "five simulated CRM systems");
ok(simFor(getFeatureById("business-continuity")!).scenarios.every((s) => /Recover/i.test(s.steps.at(-1)?.status?.label ?? "")), "each fallback includes recovery");
ok(/Pending configured post-call/.test(JSON.stringify(simFor(getFeatureById("call-lifecycle")!).scenarios[0].steps[4])), "recording not promised before post-call processing");
ok(getFeatureById("voice-ai-agents")!.availability.includes("future release"), "Voice AI Contact Center exclusion retained");
ok(getFeatureById("voice-translation")!.availability.includes("Early access"), "translation EAP retained");
ok(getFeatureById("workforce-management")!.classifications.includes("Availability Requires Verification"), "WFM ingestion qualification retained");
const workforceGraph = getFeatureById("workforce-management")!.architecture;
ok(!workforceGraph.edges.some((e) => e.from === "wfm" && e.to === "qa"), "WFM is not a dependency of Zendesk QA");
ok(workforceGraph.edges.some((e) => e.from === "workspace" && e.to === "qa"), "QA connection remains a separate help desk branch");
for (const f of FEATURE_REGISTRY.filter((f) => f.architecture.nodes.some((n) => n.id === "cognito"))) {
  ok(!f.architecture.edges.some((e) => e.from === "connect" && e.to === "cognito"), "callers do not traverse agent SSO " + f.id);
  ok(f.architecture.edges.some((e) => e.from === "agentIdentity" && e.to === "cognito"), "agent authentication branch explicit " + f.id);
}

const publicBytes = JSON.stringify(FEATURE_REGISTRY);
ok(featurePresenterGuidance.length === 33, "guidance covers every feature");
ok(new Set(featurePresenterGuidance.map((g) => g.featureId)).size === 33, "guidance keys unique");
for (const g of featurePresenterGuidance) {
  ok(!!getFeatureById(g.featureId), "guidance references stable public ID");
  ok(!publicBytes.includes(g.technical[0]), "private talking point not embedded in registry");
}
if (existsSync("dist/public/assets")) {
  const browserCode = readdirSync("dist/public/assets").filter((name) => name.endsWith(".js")).map((name) => readFileSync("dist/public/assets/" + name, "utf8")).join("\n");
  for (const g of featurePresenterGuidance) ok(!browserCode.includes(g.technical[0]), "private guidance absent from production browser assets " + g.featureId);
}
ok(GetPresenterContentResponse.safeParse({ legacy: depotPrivateContent, rooms: presenterRooms, features: featurePresenterGuidance }).success, "protected response matches generated API contract");
for (const [signedIn, mode, site, status] of [[false, "presenter", "same-origin", 401], [true, "customer", "same-origin", 403], [true, "presenter", "cross-site", 403], [true, "presenter", "same-origin", 200]] as const) {
  const headers = new Map<string, string>();
  let result = 200, continued = false, body: unknown;
  presenterAccess({ isAuthenticated: () => signedIn, get: (name: string) => name === "X-Depot-Mode" ? mode : site } as any,
    { setHeader: (k: string, v: string) => headers.set(k, v), status(n: number) { result = n; return this; }, json(v: unknown) { body = v; } } as any,
    () => { continued = true; });
  ok(result === status && continued === (status === 200), "server authorization " + [signedIn, mode, site].join("/"));
  ok(headers.get("Cache-Control") === "private, no-store", "no private caching");
  ok(headers.get("Vary")?.includes("X-Depot-Mode"), "mode-aware cache policy");
  if (status !== 200) ok(!JSON.stringify(body).includes("technical"), "no guidance bytes in denied response");
}

// Unit-test grid controls with the dialog boundary stubbed; real dialog behavior is browser-tested.
let listeners: Record<string, () => void> = {};
(globalThis as any).HTMLElement = class {};
(globalThis as any).document = { activeElement: null, getElementById: () => ({ scrollIntoView() {} }), querySelector: () => null };
const location = { search: "", pathname: "/" };
const changeUrl = (url: string) => { location.search = new URL(url, "https://demo.example").search; };
(globalThis as any).window = {
  location, addEventListener: (key: string, fn: () => void) => { listeners[key] = fn; }, removeEventListener: (key: string) => { delete listeners[key]; },
  history: { state: null, pushState: (_s: unknown, _t: string, u: string) => changeUrl(u), replaceState: (_s: unknown, _t: string, u: string) => changeUrl(u), back() { location.search = ""; listeners.popstate?.(); } },
};
let tree: any;
act(() => { tree = create(<FeatureExplorer />); });
const byId = (id: string) => tree.root.findByProps({ "data-testid": id });
const cardCount = () => tree.root.findAll((n: any) => typeof n.type === "string" && n.props["data-testid"]?.startsWith("card-feature-")).length;
ok(cardCount() === 33, "initial grid contains all features");
for (const c of FEATURE_CATEGORIES) {
  act(() => byId("filter-category-" + c.id).props.onClick());
  ok(cardCount() === counts[c.id], "category control changes grid " + c.id);
  ok(byId("filter-category-" + c.id).props["aria-pressed"] === true, "selected category exposed");
}
act(() => byId("button-reset-filters").props.onClick());
act(() => byId("input-feature-search").props.onChange({ target: { value: "zz-no-such-capability" } }));
ok(!!byId("empty-features"), "visible empty state");
act(() => byId("button-empty-reset").props.onClick());
ok(cardCount() === 33, "empty reset restores grid");
act(() => byId("button-more-filters").props.onClick());
act(() => byId("select-outcome").props.onChange({ target: { value: "Risk & resilience" } }));
ok(cardCount() === FEATURE_REGISTRY.filter((f) => f.outcome === "Risk & resilience").length, "outcome control works");
act(() => byId("button-reset-filters").props.onClick());
act(() => byId("checkbox-demo-only").props.onChange({ target: { checked: true } }));
ok(cardCount() === FEATURE_REGISTRY.filter((f) => f.demo.reused).length, "dedicated-demo checkbox works");
act(() => byId("button-reset-filters").props.onClick());
for (const f of FEATURE_REGISTRY) {
  act(() => byId("button-explore-" + f.id).props.onClick());
  ok(byId("detail-stub").props.feature?.id === f.id, "card opens corresponding detail " + f.id);
  ok(location.search.includes(f.id), "opening updates direct URL " + f.id);
  act(() => byId("detail-stub").props.onClose());
}
act(() => byId("button-launch-demo-customer-verification").props.onClick());
ok(byId("detail-stub").props.tab === "demo", "Launch Demo selects interactive view");
act(() => byId("detail-stub").props.onClose());
act(() => tree.unmount());

// Render the real protected component and PresenterGate with controlled auth/query
// states. These supplement, not replace, the reported blocked OIDC browser check.
const fixture = globalThis as any;
fixture.__featureQueryCalls = 0;
fixture.__featureNotesQuery = { enabled: true, data: { features: featurePresenterGuidance }, refetch() {} };
const auth = (isAuthenticated: boolean) => ({ isAuthenticated, isLoading: false, login() {} });
fixture.__featureTestDepot = { isPresenter: false, auth: auth(true), setMode() {} };
act(() => { tree = create(<FeaturePresenterNotes featureId="customer-verification" />); });
ok(tree.toJSON() === null && fixture.__featureQueryCalls === 0, "Customer Mode never mounts the private query, even with a signed-in user");
fixture.__featureTestDepot = { ...fixture.__featureTestDepot, isPresenter: true, auth: auth(false) };
act(() => tree.update(<FeaturePresenterNotes featureId="customer-verification" />));
ok(!!byId("gate-presenter") && fixture.__featureQueryCalls === 0, "anonymous Presenter Mode renders a sign-in gate, not private data");
fixture.__featureTestDepot = { ...fixture.__featureTestDepot, auth: auth(true) };
act(() => tree.update(<FeaturePresenterNotes featureId="customer-verification" />));
const point = featurePresenterGuidance.find((g) => g.featureId === "customer-verification")!.technical[0];
ok(!!byId("panel-presenter-notes") && JSON.stringify(tree.toJSON()).includes(point), "signed-in Presenter renders guidance for the selected feature");
for (const label of ["Technical points", "Discovery questions", "Demonstration tips", "Objections", "Implementation"]) ok(JSON.stringify(tree.toJSON()).includes(label), "protected guidance group " + label);
fixture.__featureNotesQuery = { ...fixture.__featureNotesQuery, isError: true };
act(() => tree.update(<FeaturePresenterNotes featureId="customer-verification" />));
ok(!JSON.stringify(tree.toJSON()).includes(point) && !!byId("button-retry-presenter-notes"), "request failure cannot reveal stale cached notes");
fixture.__featureNotesQuery = { ...fixture.__featureNotesQuery, isError: false, enabled: false };
act(() => tree.update(<FeaturePresenterNotes featureId="customer-verification" />));
ok(tree.toJSON() === null, "disabled private query cannot render cached notes");
fixture.__featureNotesQuery = { ...fixture.__featureNotesQuery, enabled: true };
act(() => tree.update(<FeaturePresenterNotes featureId="customer-verification" />));
ok(!!byId("panel-presenter-notes"), "valid presenter data renders after recovery");
fixture.__featureTestDepot = { ...fixture.__featureTestDepot, isPresenter: false };
act(() => tree.update(<FeaturePresenterNotes featureId="customer-verification" />));
ok(tree.toJSON() === null, "switching to Customer Mode removes all private guidance");
act(() => tree.unmount());

// Test playback deterministically without waiting for wall-clock time.
const realSetTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;
let timer = 0;
const timers = new Map<number, () => void>();
(globalThis as any).setTimeout = (fn: () => void) => { timers.set(++timer, fn); return timer; };
(globalThis as any).clearTimeout = (id: number) => timers.delete(id);
let player: ReturnType<typeof usePlayback>;
function Player() { player = usePlayback(3); return null; }
const advance = () => { const [id, fn] = timers.entries().next().value!; timers.delete(id); act(fn); };
act(() => { tree = create(<Player />); });
act(() => player.play());
advance(); ok(player!.index === 1 && player!.playing, "play advances");
act(() => player.pause());
ok(timers.size === 0 && !player!.playing, "pause cancels timer");
act(() => player.next()); ok(player!.index === 2 && !player!.playing, "next steps without autoplay");
act(() => player.play()); ok(player!.index === 0 && player!.playing, "replay restarts from beginning");
advance(); advance(); ok(player!.index === 2 && !player!.playing, "terminal step stops playback");
act(() => player.prev()); ok(player!.index === 1, "previous steps back");
act(() => player.reset()); ok(player!.index === 0 && !player!.playing, "reset clears playback");
act(() => tree.unmount());
globalThis.setTimeout = realSetTimeout; globalThis.clearTimeout = realClearTimeout;

const css = readFileSync("src/components/features/features.css", "utf8");
ok(css.includes("prefers-reduced-motion"), "reduced-motion fallback");
const notes = readFileSync("src/components/features/feature-presenter-notes.tsx", "utf8");
ok(notes.includes("if (!isPresenter) return null") && notes.includes("if (!q.enabled) return null") && notes.includes("if (q.isError)"), "Customer Mode and stale error data never render notes");
console.log(`${checks} feature experience checks passed`);
console.log(JSON.stringify({ total: FEATURE_REGISTRY.length, retained: 14, added: FEATURE_REGISTRY.length - 14, categories: counts, dedicatedDemoLinks: FEATURE_REGISTRY.filter((f) => f.demo.reused).length, uniqueDedicatedDemoTargets: new Set(FEATURE_REGISTRY.map((f) => f.demo.href).filter(Boolean)).size, inlineDemoTypes: [...new Set(FEATURE_REGISTRY.map((f) => f.demo.kind))], availabilityNeedsConfirmation: FEATURE_REGISTRY.filter((f) => f.classifications.includes("Availability Requires Verification")).map((f) => f.id) }, null, 2));
