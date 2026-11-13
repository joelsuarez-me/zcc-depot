import { jsPDF } from "jspdf";
import type { ResearchReport } from "@workspace/api-client-react";
import { splitResearchAgenda } from "./research-agenda";
import { ResearchPdfLayout, PDF_COLORS as C } from "./research-pdf-layout";
import { inlineRuns, parsePdfBlocks, pdfText } from "./research-pdf-markdown";
import { drawExecutivePdfHeader } from "./research-pdf-header";
export { pdfText } from "./research-pdf-markdown";

function opening(layout: ResearchPdfLayout, report: ResearchReport, logoDataUrl?: string) {
  const { doc, margin: M, contentWidth: W } = layout;
  drawExecutivePdfHeader(layout, report.companyName, "DEMO RESEARCH BRIEF",
    "Customer context. Focused conversation. Clear next steps.", logoDataUrl);
  // Equal-height context cells preserve alignment for long roles and regions.
  const data = [["REGION", report.region], ["DEMO AUDIENCE", report.audience],
    ["RESEARCHED", report.researchedAt.slice(0, 10)], ["EVIDENCE", `${report.sources.length} cited sources`]];
  const widths = [W * .22, W * .36, W * .23, W * .19];
  const lines = data.map((item, i) => layout.plainLines(item[1], widths[i] - 22, 9, true));
  const contextHeight = 32 + Math.max(...lines.map(value => value.length)) * 13;
  if (layout.y + contextHeight > layout.bottom) layout.newPage(false);
  doc.setFillColor(...C.mist); doc.roundedRect(M, layout.y, W, contextHeight, 9, 9, "F");
  let x = M;
  data.forEach(([label], i) => {
    layout.text(label, x + 11, layout.y + 17, 6.7, true, C.muted);
    lines[i].forEach((line, n) => layout.paint(line, x + 11, layout.y + 24 + n * 13, 9, true));
    if (i) { doc.setDrawColor(...C.line); doc.line(x, layout.y + 10, x, layout.y + contextHeight - 10); }
    x += widths[i];
  });
  layout.y += contextHeight + 10;
  const website = layout.plainLines(report.companyWebsite, W - 48, 8);
  website.forEach(line => {
    layout.ensure(12);
    layout.text("WEB", M, layout.y + 8, 7, true, C.muted);
    layout.paint(line.map(run => ({ ...run, url: report.companyWebsite })), M + 34, layout.y, 8);
    layout.y += 12;
  });
  layout.y += 13;
  roadmap(layout);
  layout.paragraph("AI-generated preparation from public sources. Verify cited facts and configured capabilities before customer use. Proposed fit and open questions are not confirmed requirements.", { quote: true, size: 8.5 });
  layout.y += 9;
}

/** A process visual, not invented performance metrics or customer findings. */
function roadmap(layout: ResearchPdfLayout) {
  const { doc, margin: M, contentWidth: W } = layout;
  layout.ensure(64);
  layout.text("CONVERSATION AT A GLANCE", M, layout.y + 7, 7, true, C.muted);
  const steps = ["Company", "Platforms", "Conversation", "Validation", "Outcomes"], stepWidth = W / steps.length;
  doc.setDrawColor(...C.line); doc.setLineWidth(1.5);
  doc.line(M + 10, layout.y + 27, M + stepWidth * 4 + 10, layout.y + 27);
  steps.forEach((label, i) => {
    const x = M + stepWidth * i;
    doc.setFillColor(...(i === 0 ? C.lime : C.mist));
    doc.circle(x + 10, layout.y + 27, 9, "F");
    layout.text(String(i + 1), x + 7.5, layout.y + 30, 7, true);
    layout.text(label, x, layout.y + 49, 8, true);
  });
  layout.y += 64;
}

function sourceCards(layout: ResearchPdfLayout, report: ResearchReport) {
  const width = (layout.contentWidth - 14) / 2, { doc } = layout;
  for (let start = 0; start < report.sources.length; start += 2) {
    const pair = report.sources.slice(start, start + 2);
    const cards = pair.map(source => [
      ...layout.lines(inlineRuns(`**${source.title}**`, report.sources), width - 24, 9, true).map(line => ({ line, size: 9, bold: true })),
      ...layout.plainLines(`${source.publisher} · Accessed ${source.accessedAt}`, width - 24, 8).map(line => ({ line, size: 8 })),
      ...layout.lines([{ text: pdfText(source.url), url: source.url }], width - 24, 8).map(line => ({ line, size: 8 })),
    ]);
    const count = Math.max(...cards.map(card => card.length));
    layout.ensure(Math.min(count * 13 + 34, 112));
    let offset = 0;
    while (offset < count) {
      let capacity = Math.floor((layout.bottom - layout.y - 34) / 13);
      if (capacity < 1) { layout.newPage(); capacity = Math.floor((layout.bottom - layout.y - 34) / 13); }
      const take = Math.min(capacity, count - offset), height = take * 13 + 34;
      cards.forEach((card, col) => {
        if (offset >= card.length) return;
        const x = layout.margin + col * (width + 14);
        doc.setDrawColor(...C.line); doc.setFillColor(...C.mist); doc.setLineWidth(.6);
        doc.roundedRect(x, layout.y, width, height, 8, 8, "FD");
        layout.text(`[${pair[col].id}] SOURCE${offset ? " (continued)" : ""}`, x + 12, layout.y + 15, 7, true, C.muted);
        card.slice(offset, offset + take).forEach((row, i) =>
          layout.paint(row.line, x + 12, layout.y + 24 + i * 13, row.size, "bold" in row, C.ink));
      });
      layout.y += height + 12; offset += take;
      if (offset < count) layout.newPage();
    }
  }
}

export function createResearchPdf(report: ResearchReport, logoDataUrl?: string): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter", putOnlyUsedFonts: true });
  doc.setProperties({ title: `${report.companyName} | Zendesk Contact Center Demo Research`, author: "Platform Architect Depot",
    subject: "Company context and five-section demo agenda with cited public sources", creator: "ZCC Depot" });
  const layout = new ResearchPdfLayout(doc, report.companyName, report.sources);
  opening(layout, report, logoDataUrl);
  const sections = splitResearchAgenda(report.markdown).filter(section => !/^(?:\d+\.\s*)?sources$/i.test(section.title));
  sections.forEach((section, i) => {
    layout.section(section.title, String(i + 1).padStart(2, "0"));
    layout.blocks(parsePdfBlocks(section.markdown || "No information provided."));
    layout.y += 12;
  });
  if (report.sources.length) {
    layout.section("Sources", "S");
    layout.paragraph("Use these links to validate the evidence before the customer conversation.", { size: 9 });
    sourceCards(layout, report);
  }
  layout.footers(report.researchedAt.slice(0, 10));
  return doc;
}

export function researchPdfFilename(report: ResearchReport): string {
  const slug = report.companyName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "company";
  return `${slug}-zcc-demo-research-${report.researchedAt.slice(0, 10)}.pdf`;
}
