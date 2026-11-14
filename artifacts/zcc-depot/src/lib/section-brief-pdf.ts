import { jsPDF } from "jspdf";
import type { SectionBriefContent } from "./section-brief-content";
import { ResearchPdfLayout, PDF_COLORS as C } from "./research-pdf-layout";
import { drawExecutivePdfHeader } from "./research-pdf-header";

const calendarDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function sectionBriefFilename(title: string, date = new Date()) {
  const safe = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "Section";
  return `ZCC-Brief-${safe}-${calendarDate(date)}.pdf`;
}
export function createSectionBriefPdf(content: SectionBriefContent, date = new Date()) {
  const doc = new jsPDF({ unit: "pt", format: "letter", putOnlyUsedFonts: true });
  doc.setProperties({ title: `${content.title} | Section brief`, author: "Platform Architect Depot", subject: content.page, creator: "ZCC Depot" });
  const layout = new ResearchPdfLayout(doc, content.title, []);
  drawExecutivePdfHeader(layout, content.title, "SECTION BRIEF", content.internal ? "Internal enablement | Authorized team use only" : "Technical expertise. Business value. A focused section summary.");
  layout.paragraph(`${content.page} | Prepared ${calendarDate(date)}`, { bold: true, size: 8 });
  const context = [
    content.abridged ? "Abridged section summary; use the source for complete content." : "Section-only brief, not the entire page.",
    content.interactive ? "Reflects the current view and selections; animations, audio and embedded media are not replayed." : "",
  ].filter(Boolean).join(" ");
  layout.paragraph(context, { size: 8, quote: true });
  if (content.summary) layout.paragraph(content.summary);
  let section = 1;
  if (content.blocks.length) { layout.section("Key points", String(section++).padStart(2, "0")); layout.blocks(content.blocks); }
  if (content.qualifications.length) {
    layout.section("Important qualifications", String(section++).padStart(2, "0"));
    content.qualifications.forEach(text => layout.paragraph(text, { size: 9, quote: true }));
  }
  // Keep a short sources/disclaimer group together rather than orphaning a disclaimer on its own page.
  const sourceHeight = content.sources.reduce((sum, source) => sum + layout.plainLines(source.title, layout.contentWidth, 9).length * 14 + 7, 0);
  layout.ensure(Math.min(360, sourceHeight + 115));
  layout.section("Continue exploring", "S");
  layout.paragraph(`[Open the original section](${content.sourceUrl})`, { size: 9 });
  for (const source of content.sources) layout.paragraph(`[${source.title}](${source.url})`, { size: 9 });
  layout.paragraph("This brief supports learning and discovery; it is not a product specification or commitment. Confirm availability, licensing, configuration and commercial terms against current official documentation.", { size: 8, quote: true });
  if (content.internal) layout.paragraph("Internal team material. Do not redistribute without the appropriate review.", { size: 8, bold: true });
  layout.footers(calendarDate(date), "SECTION BRIEF");
  return doc;
}
