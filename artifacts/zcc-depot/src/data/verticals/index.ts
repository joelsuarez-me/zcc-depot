import { INDUSTRIES, USE_CASE_SOURCES as REFERENCES } from "./metadata";
import { FINANCIAL_SERVICES } from "./financial-services";
import { HEALTHCARE } from "./healthcare";
import { GOVERNMENT } from "./government";
import { COMPUTERS_ELECTRONICS } from "./computers-electronics";
import { ENERGY_UTILITIES } from "./energy-utilities";
import { TRAVEL } from "./travel";
import { TELECOMMUNICATIONS } from "./telecommunications";
import { NONPROFIT } from "./nonprofit";
import { PHARMA_LIFE_SCIENCES } from "./pharma-life-sciences";
import type { Category, VerticalUseCase } from "./types";
import { INDUSTRY_REVIEW_LEDGER as ledger, reviewDate, scenarioReviewState, sourceReviewState } from "./review";
export { INDUSTRIES, USE_CASE_SOURCES } from "./metadata";
export type { Industry, VerticalUseCase, WorkflowNode, CapabilityKind, Category } from "./types";
export const CATEGORIES: Category[] = ["Service & routing", "Risk & escalation", "Applications & onboarding", "Billing & transactions", "Technical support", "Customer engagement"];
export const USE_CASES: VerticalUseCase[] = [
  ...FINANCIAL_SERVICES, ...HEALTHCARE, ...GOVERNMENT, ...COMPUTERS_ELECTRONICS,
  ...ENERGY_UTILITIES, ...TRAVEL, ...TELECOMMUNICATIONS, ...NONPROFIT, ...PHARMA_LIFE_SCIENCES,
];
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function filterUseCases({ query = "", industryId = "all", category = "all" }: { query?: string; industryId?: string; category?: string } = {}): VerticalUseCase[] {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return USE_CASES.filter(useCase => {
    if (industryId !== "all" && useCase.industryId !== industryId) return false;
    if (category !== "all" && useCase.category !== category) return false;
    const industry = INDUSTRIES.find(item => item.id === useCase.industryId);
    const haystack = normalize([useCase.title, industry?.name, useCase.category, useCase.challenge,
      ...useCase.solution.map(item => item.detail), ...useCase.workflow.map(item => item.detail),
      ...useCase.discovery, ...useCase.outcomes].join(" "));
    return terms.every(term => haystack.includes(term));
  });
}
export function useCaseSummary(useCase: VerticalUseCase): string {
  return [
    useCase.title, INDUSTRIES.find(item => item.id === useCase.industryId)?.name ?? "", "",
    `Challenge: ${useCase.challenge}`, "", "Solution:",
    ...useCase.solution.map(item => `${item.kind} — ${item.title}: ${item.detail}`), "",
    "Workflow:", ...useCase.workflow.map((node, i) => `${i + 1}. ${node.component}: ${node.detail}`), "",
    "Potential business outcomes:", ...useCase.outcomes.map(item => `• ${item}`), "",
    "Demo walkthrough (conceptual unless configured):", ...useCase.demoSteps.map((step, i) => `${i + 1}. ${step.title}: ${step.detail}`), "",
    "Discovery:", ...useCase.discovery.map(question => `• ${question}`), "",
    `Qualification: ${INDUSTRIES.find(item => item.id === useCase.industryId)?.qualification}`,
    "", "Public references for platform building blocks:",
    ...REFERENCES.filter(source => useCase.sourceIds.includes(source.id)).map(source => `${source.title}: ${source.url} — ${sourceReviewState(source, ledger).label}`),
    `Scenario review: ${scenarioReviewState(useCase, REFERENCES, ledger).label}. Last reviewed: ${reviewDate(ledger.scenarioReviews[useCase.id]?.reviewedAt)}. Source checks: ${reviewDate(ledger.checkedAt)}.`,
    "", "Hypothetical example only. External integrations and regulatory suitability require customer-specific validation.",
  ].join("\n");
}
