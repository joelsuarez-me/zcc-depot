import type { EnterpriseFeature } from "./feature-types";

export const EVIDENCE_REVIEW_DAYS = 90;
export function evidenceIssues(feature: EnterpriseFeature, now = new Date()): string[] {
  const reasons: string[] = [];
  const reviewed = feature.evidence.reviewedAt && Date.parse(feature.evidence.reviewedAt);
  if (!feature.sources.length || feature.sources.some(s => !s.href || !s.lastVerified)) reasons.push("Missing source evidence");
  if (feature.sources.some(s => s.lastVerified && (!Number.isFinite(Date.parse(s.lastVerified)) || now.getTime() - Date.parse(s.lastVerified) > EVIDENCE_REVIEW_DAYS * 86400000))) reasons.push("Source review missing or older than 90 days");
  if (!reviewed || !Number.isFinite(reviewed)) reasons.push("Missing review date");
  else if (now.getTime() - reviewed > EVIDENCE_REVIEW_DAYS * 86400000) reasons.push("Review older than 90 days");
  else if (reviewed > now.getTime()) reasons.push("Review date is in the future");
  if (!feature.evidence.owner) reasons.push("Owner unassigned");
  if (feature.evidence.status === "requires-verification") reasons.push("Availability requires verification");
  return reasons;
}
export function evidenceReviewQueue(features: EnterpriseFeature[], now = new Date()) {
  return features.map(feature => ({ feature, reasons: evidenceIssues(feature, now) }))
    .filter(item => item.reasons.length)
    .sort((a, b) => Number(b.feature.evidence.status === "requires-verification") - Number(a.feature.evidence.status === "requires-verification") || a.feature.title.localeCompare(b.feature.title));
}
export function relatedFeatures(feature: EnterpriseFeature, features: EnterpriseFeature[], limit = 3) {
  return features.filter(other => other.id !== feature.id)
    .map(other => ({ other, score: other.categories.filter(c => feature.categories.includes(c)).length * 2 + Number(other.outcome === feature.outcome) }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.other.title.localeCompare(b.other.title))
    .slice(0, limit).map(item => item.other);
}
