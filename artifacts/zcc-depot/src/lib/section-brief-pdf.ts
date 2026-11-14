import { jsPDF } from "jspdf";
import type { SectionBriefContent } from "./section-brief-content";
import { ExecutiveBriefLayout } from "./brief-pdf-layout";
import { briefTopicVisual, drawBriefIllustration } from "./brief-pdf-illustration";
import { drawExecutivePdfHeader } from "./research-pdf-header";

const calendarDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function sectionBriefFilename(title: string, date = new Date()) {
  const safe = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "Section";
  return `ZCC-Brief-${safe}-${calendarDate(date)}.pdf`;
}
export function createSectionBriefPdf(content: SectionBriefContent, date = new Date(), label = "SECTION BRIEF") {
  const doc = new jsPDF({ unit: "pt", format: "letter", putOnlyUsedFonts: true });
  doc.setProperties({ title: `${content.title} | Section brief`, author: "Platform Architect Depot", subject: content.page, creator: "ZCC Depot" });
  const layout = new ExecutiveBriefLayout(doc, content.title);
  drawExecutivePdfHeader(layout, content.title, label, content.internal ? "Internal enablement | Authorized team use only" : "Technical expertise. Business value. A focused executive brief.");
  layout.paragraph(`${content.page} | Prepared ${calendarDate(date)}`, { bold: true, size: 10 });
  if (content.summary) layout.paragraph(content.summary, { size: 13 });
  drawBriefIllustration(layout, briefTopicVisual(content.title, content.page, content.blocks.filter(block => block.kind === "heading").map(block => block.text)));
  if (content.blocks.length) {
    if (content.blocks[0].kind !== "heading") layout.blocks([{ kind: "heading", text: "Executive essentials" }]);
    layout.blocks(content.blocks);
  }
  if (content.qualifications.length) {
    layout.blocks([{ kind: "heading", text: "Important qualifications" }]);
    content.qualifications.forEach(text => layout.paragraph(text, { quote: true }));
  }
  const context = [
    content.abridged ? "Abridged summary; refer to the original section for full details." : "",
    content.interactive ? "Simulation or interactive content: this brief reflects the current view and selections, not a replay of animation, audio or embedded media." : "",
    "Confirm availability, licensing, configuration and commercial terms against current official documentation. This brief is a learning aid, not a product commitment.",
    content.internal ? "Internal team material. Do not redistribute without the appropriate review." : "",
  ].filter(Boolean).join(" ");
  layout.references(content.sourceUrl, content.sources, context);
  layout.footers(calendarDate(date), label);
  return doc;
}
