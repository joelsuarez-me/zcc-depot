import { jsPDF } from "jspdf";
import type { Agenda } from "@workspace/api-client-react";
import { ResearchPdfLayout, PDF_COLORS as C } from "./research-pdf-layout";
import { drawExecutivePdfHeader } from "./research-pdf-header";
import { parsePdfBlocks } from "./research-pdf-markdown";

export function createAgendaPdf(agenda: Agenda, logoDataUrl?: string): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter", putOnlyUsedFonts: true });
  doc.setProperties({ title: `${agenda.company} | Zendesk Contact Center Demo Agenda`, author: "Platform Architect Depot",
    subject: "Saved customer demo agenda", creator: "ZCC Depot" });
  const sources = [...agenda.outcomes.matchAll(/^\[?(\d+)\]?[.)]?\s+.*?(https?:\/\/[^\s)]+)/gm)]
    .map(match => ({ id: Number(match[1]), url: match[2] }));
  const layout = new ResearchPdfLayout(doc, agenda.company, sources);
  drawExecutivePdfHeader(layout, agenda.company, "DEMO AGENDA", "Zendesk Contact Center | Customer conversation", logoDataUrl);
  layout.text("SAVED WORKSHOP BRIEF", layout.margin, layout.y + 8, 8, true, C.muted);
  layout.text(`Updated ${agenda.updatedAt.slice(0, 10)}`, layout.margin, layout.y + 26, 9);
  layout.y += 47;
  const [outcomes, ...sourceText] = agenda.outcomes.split(/\n\nSources used to prepare this agenda\s*\n/i);
  const sections = [
    ["Company and objective", agenda.description], ["Current platforms", agenda.currentState],
    ["Today’s conversation", agenda.conversation], ["Questions to validate", agenda.problems],
    ["Desired outcomes", outcomes],
  ];
  sections.forEach(([title, text], i) => {
    layout.section(title, String(i + 1).padStart(2, "0"));
    layout.blocks(parsePdfBlocks(text || "Not specified.")); layout.y += 12;
  });
  if (sourceText.length) {
    layout.section("Sources", "S");
    layout.blocks(parsePdfBlocks(sourceText.join("\n\n")));
  }
  layout.footers(agenda.updatedAt.slice(0, 10), "DEMO AGENDA");
  return doc;
}

export function agendaPdfFilename(agenda: Agenda, now = new Date()): string {
  const company = agenda.company.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "").slice(0, 100) || "Customer";
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `Demo-Agenda-${company}-${date}.pdf`;
}
