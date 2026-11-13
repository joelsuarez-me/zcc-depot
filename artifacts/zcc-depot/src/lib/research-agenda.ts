export const RESEARCH_AGENDA_HEADINGS = [
  "Company and objective",
  "Current platforms",
  "Today’s conversation",
  "Questions to validate",
  "Desired outcomes",
] as const;

export type ResearchAgendaSection = { title: string; markdown: string; id: string };

/** Keep partial streaming text and all inline citations intact. */
export function splitResearchAgenda(markdown: string): ResearchAgendaSection[] {
  const sections: ResearchAgendaSection[] = [];
  let title = "";
  let lines: string[] = [];
  const append = () => {
    if (!title && !lines.some(line => line.trim())) return;
    const canonical = [...RESEARCH_AGENDA_HEADINGS, "Sources"].find(
      heading => heading.toLowerCase().replace(/’/g, "'") === title.toLowerCase().replace(/’/g, "'"),
    );
    const label = canonical ?? (title || "Research draft");
    sections.push({
      title: label,
      markdown: lines.join("\n").trim(),
      id: `report-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${sections.length}`,
    });
  };
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);
    if (heading) {
      append();
      title = heading[1].trim();
      lines = [];
    } else {
      lines.push(line);
    }
  }
  append();
  return sections;
}
