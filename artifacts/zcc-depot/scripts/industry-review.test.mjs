import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { USE_CASES, USE_CASE_SOURCES, useCaseSummary } from "../src/data/verticals/index.ts";
import { INDUSTRIES } from "../src/data/verticals/metadata.ts";
import { scenarioSignature, scenarioReviewSignature, sourceReviewState, scenarioReviewState, reviewDate, INDUSTRY_REVIEW_LEDGER, acknowledgeSourceReview } from "../src/data/verticals/review.ts";
import { IndustryReviewOverview, ScenarioReviewStatus, SourceReviewStatus } from "../src/components/vertical-use-cases/review-status.tsx";
import { allowedSourceUrl, documentText, inspectSource } from "./industry-source-health.mjs";

const now = new Date("2026-11-13T12:00:00Z"), source = USE_CASE_SOURCES[0], useCase = USE_CASES[0];
const empty = () => ({ version: 1, checkedAt: null, sourceChecks: {}, sourceReviews: {}, scenarioReviews: {} });
function reviewed() {
  const ledger = empty();
  for (const s of USE_CASE_SOURCES) {
    ledger.sourceChecks[s.id] = { url: s.url, finalUrl: s.url, checkedAt: now.toISOString(), status: "available", fingerprint: "hash", observedBaseline: "hash", reason: "Fetched" };
    ledger.sourceReviews[s.id] = { url: s.url, finalUrl: s.url, fingerprint: "hash", reviewedAt: now.toISOString() };
  }
  ledger.scenarioReviews[useCase.id] = { signature: scenarioReviewSignature(useCase, USE_CASE_SOURCES), reviewedAt: now.toISOString() };
  return ledger;
}
const html = text => `<html><title>Documentation</title><main><h1>Product guide</h1><p>${text.repeat(15)}</p></main></html>`;
const response = (body, status = 200, headers = {}) => new Response(body, { status, headers: { "content-type": "text/html", ...headers } });

test("all 45 scenarios and four current sources have discoverable review states without fabricated approvals", () => {
  assert.equal(USE_CASES.length, 45); assert.equal(USE_CASE_SOURCES.length, 4);
  for (const item of USE_CASES) {
    assert.equal(scenarioReviewState(item, USE_CASE_SOURCES, empty(), now).label, "Scenario not yet reviewed");
    assert.ok(item.solution.some(s => s.kind === "External integration"));
    assert.ok(item.solution.some(s => s.kind === "Conceptual workflow"));
    assert.ok(INDUSTRIES.find(i => i.id === item.industryId).qualification.length > 100);
  }
  assert.deepEqual(INDUSTRY_REVIEW_LEDGER.sourceReviews, {});
  assert.deepEqual(INDUSTRY_REVIEW_LEDGER.scenarioReviews, {});
});
test("source states distinguish missing, failed, blocked and changed references", () => {
  assert.equal(sourceReviewState(source, empty(), now).label, "Not checked");
  const ledger = reviewed(), check = ledger.sourceChecks[source.id];
  check.status = "unavailable"; assert.equal(sourceReviewState(source, ledger, now).label, "Source unavailable");
  check.status = "inconclusive"; assert.equal(sourceReviewState(source, ledger, now).label, "Check inconclusive");
  check.status = "available"; check.fingerprint = "new"; assert.equal(sourceReviewState(source, ledger, now).label, "Document changed");
  check.fingerprint = "hash"; check.url = "https://www.zendesk.com/new"; assert.equal(sourceReviewState(source, ledger, now).label, "Reference URL edited");
  check.url = source.url; check.finalUrl += "new"; assert.equal(sourceReviewState(source, ledger, now).label, "Reference moved");
});
test("fetch success is not approval; changed text also flags an unreviewed observed baseline", () => {
  const ledger = reviewed(); delete ledger.sourceReviews[source.id];
  assert.equal(sourceReviewState(source, ledger, now).label, "First review needed");
  ledger.sourceChecks[source.id].fingerprint = "edited";
  assert.equal(sourceReviewState(source, ledger, now).label, "Document changed");
});
test("checks and editorial reviews expire independently, including invalid and future dates", () => {
  const ledger = reviewed();
  assert.equal(sourceReviewState(source, ledger, now).needsReview, false);
  ledger.sourceChecks[source.id].checkedAt = "2026-11-01";
  assert.equal(sourceReviewState(source, ledger, now).label, "Check overdue");
  ledger.sourceChecks[source.id].checkedAt = now.toISOString();
  ledger.sourceReviews[source.id].reviewedAt = "2026-01-01";
  assert.equal(sourceReviewState(source, ledger, now).label, "Review overdue");
  ledger.sourceReviews[source.id].reviewedAt = "invalid";
  assert.equal(sourceReviewState(source, ledger, now).needsReview, true);
  ledger.sourceReviews[source.id].reviewedAt = "2027-01-01";
  assert.equal(sourceReviewState(source, ledger, now).needsReview, true);
});
test("explicit acknowledgements require a successful current URL check within 24 hours and never approve scenarios", () => {
  const ledger = reviewed();
  delete ledger.sourceReviews[source.id];
  delete ledger.scenarioReviews[useCase.id];
  const approval = acknowledgeSourceReview(source, ledger, now);
  assert.equal(approval.reviewedAt, now.toISOString());
  assert.equal(approval.fingerprint, "hash");
  assert.deepEqual(ledger.scenarioReviews, {});
  assert.equal(ledger.sourceReviews[source.id], undefined, "recording is a separate explicit CLI write");
  for (const change of [
    { checkedAt: "2026-01-01" }, { checkedAt: "2027-01-01" }, { checkedAt: "invalid" },
    { status: "inconclusive" }, { status: "unavailable" }, { fingerprint: null }, { url: "https://www.zendesk.com/changed" },
  ]) {
    const copy = structuredClone(ledger); Object.assign(copy.sourceChecks[source.id], change);
    assert.throws(() => acknowledgeSourceReview(source, copy, now), /successful check/);
  }
});
test("scenario reviews invalidate on edits, reference scope changes, missing sources and age", () => {
  const ledger = reviewed();
  assert.equal(scenarioReviewState(useCase, USE_CASE_SOURCES, ledger, now).label, "Scenario review recorded");
  assert.equal(scenarioReviewState({ ...useCase, challenge: "Updated claim" }, USE_CASE_SOURCES, ledger, now).label, "Scenario edited");
  assert.equal(scenarioReviewState(useCase, USE_CASE_SOURCES.map(s => ({ ...s, scope: "Changed scope" })), ledger, now).label, "Scenario edited");
  assert.equal(scenarioReviewState(useCase, [], ledger, now).needsReview, true);
  ledger.sourceChecks[source.id].fingerprint = "changed";
  assert.equal(scenarioReviewState(useCase, USE_CASE_SOURCES, ledger, now).label, "Source review needed");
  ledger.scenarioReviews[useCase.id].reviewedAt = "2026-01-01";
  assert.equal(scenarioReviewState(useCase, USE_CASE_SOURCES, ledger, now).label, "Scenario review overdue");
});
test("qualification changes invalidate scenario reviews and key order alone does not", () => {
  assert.equal(scenarioSignature({ a: 1, b: [2, 3] }), scenarioSignature({ b: [2, 3], a: 1 }));
  const original = INDUSTRIES[0].qualification;
  const signature = scenarioReviewSignature(useCase, USE_CASE_SOURCES);
  try { INDUSTRIES[0].qualification += " New condition."; assert.notEqual(scenarioReviewSignature(useCase, USE_CASE_SOURCES), signature); }
  finally { INDUSTRIES[0].qualification = original; }
});
test("document fingerprints ignore scripts, navigation and formatting but preserve meaningful text", async () => {
  const a = await inspectSource(source, undefined, { now, fetcher: async () => response(html("Platform capability ")) });
  const b = await inspectSource(source, a, { now, fetcher: async () => response(`<nav>New menu</nav><script>nonce=123</script>${html("Platform   capability ")}`) });
  assert.equal(a.status, "available"); assert.equal(a.fingerprint, b.fingerprint);
  const c = await inspectSource(source, b, { now, fetcher: async () => response(html("License conditions changed ")) });
  assert.notEqual(c.fingerprint, a.fingerprint); assert.equal(c.observedBaseline, a.fingerprint);
  assert.match(documentText("<main><header>New heading</header><p>A &amp; B</p></main>"), /New heading A & B/);
});
test("source checks distinguish 404/410 from 403/429/500 and network failure", async () => {
  for (const status of [404, 410, 403, 429, 500]) {
    const result = await inspectSource(source, undefined, { now, fetcher: async () => response("Error", status) });
    assert.equal(result.status, [404, 410].includes(status) ? "unavailable" : "inconclusive");
    assert.equal(result.fingerprint, null);
  }
  const timeout = await inspectSource(source, undefined, { now, fetcher: async () => { throw new Error("Timeout"); } });
  assert.equal(timeout.status, "inconclusive"); assert.match(timeout.reason, /Timeout/);
});
test("redirects are bounded and restricted to approved HTTPS hosts", async () => {
  let calls = 0;
  const blocked = await inspectSource(source, undefined, { now, fetcher: async () => { calls++; return response("", 302, { location: "http://127.0.0.1/admin" }); } });
  assert.equal(calls, 1); assert.equal(blocked.status, "inconclusive");
  const loop = await inspectSource(source, undefined, { now, fetcher: async () => response("", 302, { location: source.url }) });
  assert.match(loop.reason, /limit/);
  assert.equal(allowedSourceUrl("https://www.zendesk.com.evil.test/"), false);
  assert.equal(allowedSourceUrl("https://user:pass@www.zendesk.com/"), false);
  assert.equal(allowedSourceUrl("https://www.zendesk.com:8443/"), false);
  const moved = await inspectSource(source, undefined, { now, fetcher: async url => url === source.url ? response("", 301, { location: "/new-guide" }) : response(html("Real documentation ")) });
  assert.equal(moved.status, "available"); assert.equal(moved.finalUrl, "https://www.zendesk.com/new-guide");
});
test("200 challenge pages, non-HTML and oversized documents cannot be recorded as available", async () => {
  for (const res of [
    response(`<title>Just a moment</title>${html("Unrelated challenge ")}`),
    response("PDF", 200, { "content-type": "application/pdf" }),
    response(html("Guide "), 200, { "content-length": "8000001" }),
    response("<main>Short error</main>"),
  ]) assert.equal((await inspectSource(source, undefined, { now, fetcher: async () => res })).status, "inconclusive");
});
test("review UI shows dates, queue links and limitations; copied summaries carry warnings", () => {
  const markup = renderToStaticMarkup(React.createElement(IndustryReviewOverview));
  assert.match(markup, /Documentation review/); assert.match(markup, /not a live monitoring service/);
  assert.match(markup, /claims are never automatically rewritten/);
  assert.equal((markup.match(/href="\?case=/g) ?? []).length, 45);
  assert.match(renderToStaticMarkup(React.createElement(ScenarioReviewStatus, { useCase })), /Last reviewed: Not recorded/);
  assert.match(renderToStaticMarkup(React.createElement(SourceReviewStatus, { source })), /Reviewed: /);
  assert.match(useCaseSummary(useCase), /Scenario review: Scenario not yet reviewed/);
  assert.equal(reviewDate("invalid"), "Not recorded");
});
