import type { UseCaseSource, VerticalUseCase } from "./types";
import { INDUSTRIES } from "./metadata";
import rawLedger from "./review-ledger.json";

export type SourceCheck = {
  url: string; finalUrl: string; checkedAt: string;
  status: "available" | "unavailable" | "inconclusive";
  fingerprint: string | null; observedBaseline: string | null; reason: string;
};
export type ReviewLedger = {
  version: number; checkedAt: string | null;
  sourceChecks: Record<string, SourceCheck>;
  sourceReviews: Record<string, { url: string; finalUrl: string; fingerprint: string; reviewedAt: string }>;
  scenarioReviews: Record<string, { signature: string; reviewedAt: string }>;
};
export type ReviewState = { label: string; detail: string; needsReview: boolean };
export const INDUSTRY_REVIEW_LEDGER = rawLedger as ReviewLedger;
export const REVIEW_INTERVAL_DAYS = 90;
export const CHECK_INTERVAL_DAYS = 7;
const age = (date: string, now: Date) => (now.getTime() - new Date(date).getTime()) / 86_400_000;
const attention = (label: string, detail: string): ReviewState => ({ label, detail, needsReview: true });

// Deterministic change detector, not a security signature. Sorted object keys
// avoid invalidating a review for formatting-only changes to the data files.
export function scenarioSignature(value: unknown): string {
  const canonical = (v: unknown): string => {
    if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
    if (v && typeof v === "object") return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}`;
    return JSON.stringify(v) ?? "null";
  };
  let hash = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(canonical(value))) hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1099511628211n);
  return hash.toString(16).padStart(16, "0");
}

export function scenarioReviewSignature(useCase: VerticalUseCase, sources: UseCaseSource[]): string {
  return scenarioSignature({
    useCase, qualification: INDUSTRIES.find(i => i.id === useCase.industryId)?.qualification ?? null,
    references: useCase.sourceIds.map(id => sources.find(s => s.id === id) ?? { id, missing: true }),
  });
}

export function sourceReviewState(source: UseCaseSource, ledger: ReviewLedger, now = new Date()): ReviewState {
  const check = ledger.sourceChecks[source.id], review = ledger.sourceReviews[source.id];
  if (!check) return attention("Not checked", "No source-health check has been recorded.");
  if (check.url !== source.url) return attention("Reference URL edited", "Check and review the current URL before relying on it.");
  if (check.status !== "available") return attention(check.status === "unavailable" ? "Source unavailable" : "Check inconclusive", check.reason);
  if (!check.fingerprint) return attention("Check inconclusive", "No usable document content was obtained.");
  if ((review?.fingerprint ?? check.observedBaseline) !== check.fingerprint)
    return attention("Document changed", "Document text changed since the recorded baseline. A person must assess its effect on the claims.");
  if (!review) return attention("First review needed", "A successful fetch is not a human review or validation of a scenario.");
  if (review.url !== source.url || review.finalUrl !== check.finalUrl)
    return attention("Reference moved", "The source location changed. Review the destination and update the reference if appropriate.");
  if (!Number.isFinite(age(check.checkedAt, now)) || age(check.checkedAt, now) < 0 || age(check.checkedAt, now) > CHECK_INTERVAL_DAYS)
    return attention("Check overdue", `Run a source-health check at least every ${CHECK_INTERVAL_DAYS} days.`);
  if (!Number.isFinite(age(review.reviewedAt, now)) || age(review.reviewedAt, now) < 0 || age(review.reviewedAt, now) > REVIEW_INTERVAL_DAYS)
    return attention("Review overdue", `Reassess the platform reference at least every ${REVIEW_INTERVAL_DAYS} days.`);
  return { label: "No text change detected", detail: "Compared with the reviewed text snapshot; this does not certify the full customer solution.", needsReview: false };
}

export function scenarioReviewState(useCase: VerticalUseCase, sources: UseCaseSource[], ledger: ReviewLedger, now = new Date()): ReviewState {
  const review = ledger.scenarioReviews[useCase.id];
  if (!review) return attention("Scenario not yet reviewed", "Review the scenario, capability boundaries, industry qualifications and source scope.");
  if (review.signature !== scenarioReviewSignature(useCase, sources)) return attention("Scenario edited", "Scenario content, industry qualification or reference scope changed after its last recorded review.");
  if (!Number.isFinite(age(review.reviewedAt, now)) || age(review.reviewedAt, now) < 0 || age(review.reviewedAt, now) > REVIEW_INTERVAL_DAYS)
    return attention("Scenario review overdue", `Reassess the scenario every ${REVIEW_INTERVAL_DAYS} days.`);
  if (useCase.sourceIds.some(id => {
    const source = sources.find(s => s.id === id);
    return !source || sourceReviewState(source, ledger, now).needsReview;
  })) return attention("Source review needed", "The scenario review remains recorded, but one or more supporting references need attention.");
  return { label: "Scenario review recorded", detail: "Customer-specific suitability, integration and regulatory validation are still required.", needsReview: false };
}

export function reviewDate(value?: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not recorded";
  return new Date(value).toISOString().slice(0, 10);
}

export function acknowledgeSourceReview(source: UseCaseSource, ledger: ReviewLedger, now = new Date()) {
  const check = ledger.sourceChecks[source.id];
  if (!check || check.url !== source.url || check.status !== "available" || !check.fingerprint
    || !Number.isFinite(age(check.checkedAt, now)) || age(check.checkedAt, now) < 0 || age(check.checkedAt, now) > 1)
    throw new Error("Review requires a successful check of the current URL from the past 24 hours. Run --check first.");
  return { url: source.url, finalUrl: check.finalUrl, fingerprint: check.fingerprint, reviewedAt: now.toISOString() };
}
