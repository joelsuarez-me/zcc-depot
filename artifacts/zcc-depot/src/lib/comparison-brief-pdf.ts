import { jsPDF } from "jspdf";
import { FIT_SIGNALS, DISCOVERY_TOPICS, COMPARISON_SOURCES, getFitGuidance, type FitSignalId } from "@/data/voice-comparison";
import { ResearchPdfLayout, PDF_COLORS as C } from "./research-pdf-layout";
import { drawExecutivePdfHeader } from "./research-pdf-header";

export function comparisonBriefFilename(now = new Date()) {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `Zendesk-Voice-vs-Contact-Center-Brief-${date}.pdf`;
}

/** A concise two-page decision brief, not a printout of the full interactive page. */
export function createComparisonBriefPdf(selected: readonly FitSignalId[] = [], now = new Date()): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter", putOnlyUsedFonts: true });
  doc.setProperties({ title: "Zendesk Voice versus Zendesk Contact Center | Executive brief", author: "Platform Architect Depot", subject: "Solution comparison and discovery summary", creator: "ZCC Depot" });
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const layout = new ResearchPdfLayout(doc, "Voice versus Contact Center", []);
  drawExecutivePdfHeader(layout, "Zendesk Voice vs. Zendesk Contact Center", "SOLUTION BRIEF", "Executive comparison | Technical fit, business value and next steps");
  layout.text(`Prepared ${date}  |  Summary of the comparison page`, layout.margin, layout.y + 8, 8, false, C.muted);
  layout.y += 25;
  layout.section("Choose for the workflow", "01");
  layout.table(["Zendesk Voice", "Zendesk Contact Center"], [[
    "Phone support within Zendesk. Explore when straightforward call handling, familiar administration and speed to launch meet the need.",
    "Built on Amazon Connect. Explore when deeper orchestration, integrations or operating complexity justify a scoped implementation.",
  ]]);
  const takeaway = "Decide by operational complexity, not a fixed agent count.";
  doc.setFillColor(...C.lime);
  doc.roundedRect(layout.margin, layout.y, layout.contentWidth, 31, 7, 7, "F");
  layout.text(takeaway, layout.margin + 12, layout.y + 19, 10, true);
  layout.y += 46;
  layout.section("Compare the essentials", "02");
  layout.table(["Consideration", "Zendesk Voice", "Contact Center"], [
    ["Routing", "Standard phone menus and call handling.", "Configurable Connect flows and orchestration."],
    ["Integrations", "Zendesk workspace and supported integrations.", "Business-data lookups and scoped custom actions."],
    ["AI and quality", "AI features depend on plan and configuration.", "Configured AI services; verify add-ons and licensing."],
    ["Delivery and cost", "Confirm plan, usage and selected add-ons.", "Scope licenses, usage, AWS services and delivery."],
  ]);
  layout.newPage(false);
  layout.section("Fit guide snapshot", "03");
  const signals = FIT_SIGNALS.filter(signal => selected.includes(signal.id));
  const guidance = getFitGuidance(signals.map(signal => signal.id));
  layout.paragraph(signals.length ? `Selected needs: ${signals.map(signal => signal.title).join("; ")}.` : "No customer needs selected. This is a general comparison brief, not a customer-specific recommendation.", { size: 9 });
  layout.paragraph(guidance.title, { bold: true, size: 11 });
  layout.paragraph(guidance.summary, { size: 9 });
  layout.paragraph("Discussion aid only. Confirm plan, feature, regional availability and implementation ownership. No automatic compliance or product eligibility is implied.", { size: 9, quote: true });
  layout.section("Discovery and next steps", "04");
  for (const topic of DISCOVERY_TOPICS) layout.paragraph(topic.question, { marker: "", size: 9 });
  layout.paragraph("Next: baseline the current service; design flows and integrations; validate full operating cost and delivery ownership; pilot; then plan cutover and rollback.", { size: 9 });
  layout.section("Verify before a decision", "05");
  layout.paragraph("Both products can support growing teams. Zendesk digital routing and Amazon Connect voice routing are not interchangeable. Contact Lens and Zendesk QA are distinct; verify licensing and integration. Capabilities are not enabled by default on every plan.", { size: 9 });
  // Public, current sources only: never reproduce restricted sales collateral or historical offers.
  for (const id of ["voice", "contact-center", "pricing", "setup"] as const) {
    const source = COMPARISON_SOURCES.find(item => item.id === id)!;
    layout.paragraph(`[${source.title}](${source.url})`, { size: 9 });
  }
  layout.paragraph("Current official documentation and the signed agreement govern.", { size: 8, quote: true });
  layout.footers(date, "SOLUTION BRIEF");
  return doc;
}
