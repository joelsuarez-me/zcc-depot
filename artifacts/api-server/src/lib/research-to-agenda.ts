import type { ResearchReport } from "@workspace/api-zod";
import { validateReportOutline } from "./demo-research/report-format";

const agendaText = (text: string) => text
  .replace(/^#{1,6}[ \t]+/gm, "")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label: string, url: string) =>
    /^\d+$/.test(label) ? `[${label}]` : `${label} (${url})`);

/** Deterministic conversion: no extra AI request, invented claims or discarded citations. */
export function researchToAgenda(report: ResearchReport) {
  const sourceAt = report.markdown.search(/^##[ \t]+Sources[ \t]*$/im);
  const outline = sourceAt < 0 ? report.markdown : report.markdown.slice(0, sourceAt);
  validateReportOutline(outline);
  const headings = [...outline.matchAll(/^##[ \t]+(.+?)[ \t]*#*[ \t]*$/gm)];
  const sections = headings.map((heading, i) => outline.slice(
    heading.index! + heading[0].length, headings[i + 1]?.index ?? outline.length,
  ).trim());
  const sources = sourceAt < 0
    ? report.sources.map(source => `[${source.id}] ${source.title}: ${source.url}`).join("\n")
    : report.markdown.slice(sourceAt).replace(/^##[ \t]+Sources[ \t]*\r?\n/i, "").trim();
  return {
    company: report.companyName,
    description: agendaText(sections[0]),
    currentState: agendaText(sections[1]),
    conversation: agendaText(sections[2]),
    problems: agendaText(sections[3]),
    outcomes: `${agendaText(sections[4])}${sources ? `\n\nSources used to prepare this agenda\n${agendaText(sources)}` : ""}`,
  };
}
