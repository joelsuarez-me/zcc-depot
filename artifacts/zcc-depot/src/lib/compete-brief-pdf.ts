import type { CompeteBattlecard } from "@workspace/api-client-react";
import type { SectionBriefContent } from "./section-brief-content";
import { createSectionBriefPdf, sectionBriefFilename } from "./section-brief-pdf";

/** Export all themes, not just the selected tab or currently expanded objection. */
export function competeBriefContent(data: CompeteBattlecard, sourceUrl: string): SectionBriefContent {
  return {
    title: `Zendesk vs. ${data.name}`,
    page: "Compete | Internal competitive brief",
    sourceUrl, internal: true, abridged: false, interactive: false,
    summary: data.summary,
    blocks: [
      { kind: "heading", text: "The resolution pitch" },
      { kind: "paragraph", text: data.pitch },
      { kind: "heading", text: `Understand ${data.name}` },
      ...data.strengths.map(text => ({ kind: "list" as const, text, marker: "•", indent: 0 })),
      ...data.themes.flatMap(theme => [
        { kind: "heading" as const, text: theme.title },
        { kind: "table" as const, headers: ["Zendesk advantage", `${data.name}: context to validate`], rows: [[theme.zendesk, theme.five9]], align: [] },
        { kind: "quote" as const, text: `Ask: ${theme.question}` },
        { kind: "paragraph" as const, text: `Proof to show: ${theme.proof}` },
        { kind: "paragraph" as const, text: theme.sourcePages },
      ]),
      { kind: "heading", text: "Objection responses" },
      ...data.objections.flatMap(objection => [
        { kind: "heading" as const, text: objection.question },
        { kind: "paragraph" as const, text: objection.response },
        { kind: "quote" as const, text: `Proof to show: ${objection.proof}` },
        { kind: "paragraph" as const, text: objection.sourcePages },
      ]),
      { kind: "heading", text: "Source context" },
      { kind: "paragraph", text: data.sourceTitle },
      { kind: "paragraph", text: data.sourceDates },
      { kind: "paragraph", text: `Site summary prepared ${data.preparedOn}. Export date does not imply a fresh product review.` },
    ],
    qualifications: data.guardrails,
    sources: data.sources.map(source => ({ title: `${source.title} — ${source.note}`, url: source.url })),
  };
}

export function createCompeteBriefPdf(data: CompeteBattlecard, sourceUrl: string, date = new Date()) {
  return createSectionBriefPdf(competeBriefContent(data, sourceUrl), date, "COMPETITIVE BRIEF");
}
export function competeBriefFilename(name: string, date = new Date()) {
  return sectionBriefFilename(`Zendesk-vs-${name}`, date);
}
