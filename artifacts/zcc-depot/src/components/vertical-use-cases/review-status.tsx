import { memo } from "react";
import { USE_CASES, USE_CASE_SOURCES } from "@/data/verticals";
import { CHECK_INTERVAL_DAYS, REVIEW_INTERVAL_DAYS, INDUSTRY_REVIEW_LEDGER as ledger, reviewDate, scenarioReviewState, sourceReviewState } from "@/data/verticals/review";
import type { UseCaseSource, VerticalUseCase } from "@/data/verticals/types";

export function SourceReviewStatus({ source }: { source: UseCaseSource }) {
  const state = sourceReviewState(source, ledger);
  return <div className="mt-1 text-xs leading-relaxed" data-testid={`review-source-${source.id}`}>
    <strong className={state.needsReview ? "text-[#80500d]" : "text-[#294735]"}>{state.label}</strong>
    <span className="text-[#536157]"> · Reviewed: {reviewDate(ledger.sourceReviews[source.id]?.reviewedAt)} · Checked: {reviewDate(ledger.sourceChecks[source.id]?.checkedAt)}</span>
    <p className="text-[#536157]">{state.detail}</p>
  </div>;
}

export function ScenarioReviewStatus({ useCase }: { useCase: VerticalUseCase }) {
  const state = scenarioReviewState(useCase, USE_CASE_SOURCES, ledger);
  return <aside className="mt-4 rounded-xl border border-[#d5c59f] bg-[#f6efdf] p-3 text-sm text-[#654711]" aria-label="Scenario review status">
    <strong>{state.label}</strong>
    <p className="mt-1 text-xs">Last reviewed: {reviewDate(ledger.scenarioReviews[useCase.id]?.reviewedAt)}. {state.detail}</p>
  </aside>;
}

export const IndustryReviewOverview = memo(function IndustryReviewOverview() {
  const sourceQueue = USE_CASE_SOURCES.filter(s => sourceReviewState(s, ledger).needsReview);
  const scenarioQueue = USE_CASES.filter(u => scenarioReviewState(u, USE_CASE_SOURCES, ledger).needsReview);
  return <details className="mb-5 rounded-2xl border border-[#d5c59f] bg-[#faf6eb] p-4 text-[#294735]" data-testid="industry-review-overview">
    <summary className="cursor-pointer text-sm font-semibold">Documentation review · {sourceQueue.length} sources and {scenarioQueue.length} scenarios need attention</summary>
    <div className="mt-3 space-y-4 text-sm">
      <p>Last source check: <strong>{reviewDate(ledger.checkedAt)}</strong>. This is a published snapshot, not a live monitoring service. Checks are due every {CHECK_INTERVAL_DAYS} days and editorial reviews every {REVIEW_INTERVAL_DAYS} days.</p>
      <p>Sources support individual platform building blocks. Availability, unchanged text or a recorded review does not validate an entire customer-specific solution. Changes are flagged for a person; claims are never automatically rewritten.</p>
      <ul className="grid gap-3 md:grid-cols-2">{USE_CASE_SOURCES.map(source => <li key={source.id} className="min-w-0 rounded-xl border border-[#d5c59f] bg-white/70 p-3">
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{source.title}</a>
        <SourceReviewStatus source={source} />
      </li>)}</ul>
      <details>
        <summary className="cursor-pointer font-semibold">Scenario review queue ({scenarioQueue.length})</summary>
        {scenarioQueue.length ? <ul className="mt-2 grid gap-2 md:grid-cols-2">{scenarioQueue.map(useCase => <li key={useCase.id} className="min-w-0">
          <a href={`?case=${encodeURIComponent(useCase.id)}`} className="underline">{useCase.title}</a>
          <span className="block text-xs">{scenarioReviewState(useCase, USE_CASE_SOURCES, ledger).label} · Reviewed: {reviewDate(ledger.scenarioReviews[useCase.id]?.reviewedAt)}</span>
        </li>)}</ul> : <p className="mt-2">No scenarios are currently due for review. Customer-specific validation still applies.</p>}
      </details>
      <p className="text-xs">Maintainers run <code>pnpm --filter @workspace/zcc-depot review:industry --check</code> in the workspace, review the source and affected scenarios, then explicitly record each review. Updated snapshots reach this page only after publication.</p>
    </div>
  </details>;
});
