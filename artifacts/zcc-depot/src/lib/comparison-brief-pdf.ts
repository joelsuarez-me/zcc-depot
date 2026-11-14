import { FIT_SIGNALS, DISCOVERY_TOPICS, COMPARISON_SOURCES, getFitGuidance, type FitSignalId } from "@/data/voice-comparison";
import { createSectionBriefPdf } from "./section-brief-pdf";

export function comparisonBriefFilename(now = new Date()) {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `Zendesk-Voice-vs-Contact-Center-Brief-${date}.pdf`;
}

/** The full comparison uses the same illustrated theme as individual section briefs. */
export function createComparisonBriefPdf(selected: readonly FitSignalId[] = [], now = new Date()) {
  const signals = FIT_SIGNALS.filter(signal => selected.includes(signal.id));
  const guidance = getFitGuidance(signals.map(signal => signal.id));
  const doc = createSectionBriefPdf({
    title: "Zendesk Voice vs. Zendesk Contact Center",
    page: "Solution comparison and discovery", internal: false, abridged: false, interactive: true,
    sourceUrl: typeof window !== "undefined" && window.location ? `${window.location.origin}${window.location.pathname}` : "https://zcc-depot.replit.app/sales/contact-center-vs-voice",
    summary: "Decide by operational complexity, not a fixed agent count. Compare the service workflow, technical fit and operating model before choosing a solution.",
    blocks: [
      { kind: "heading", text: "Choose for the workflow" },
      { kind: "table", headers: ["Zendesk Voice", "Zendesk Contact Center"], rows: [[
        "Phone support within Zendesk. Explore when straightforward call handling, familiar administration and speed to launch meet the need.",
        "Built on Amazon Connect. Explore when deeper orchestration, integrations or operating complexity justify a scoped implementation.",
      ]], align: [] },
      { kind: "heading", text: "Compare the essentials" },
      { kind: "table", headers: ["Consideration", "Zendesk Voice", "Contact Center"], rows: [
        ["Routing", "Standard phone menus and call handling.", "Configurable Connect flows and orchestration."],
        ["Integrations", "Zendesk workspace and supported integrations.", "Business-data lookups and scoped custom actions."],
        ["AI and quality", "AI features depend on plan and configuration.", "Configured AI services; verify add-ons and licensing."],
        ["Delivery and cost", "Confirm plan, usage and selected add-ons.", "Scope licenses, usage, AWS services and delivery."],
      ], align: [] },
      { kind: "heading", text: "Fit guide snapshot" },
      { kind: "paragraph", text: signals.length ? `Selected needs: ${signals.map(signal => signal.title).join("; ")}.` : "No customer needs selected. This is a general comparison brief, not a customer-specific recommendation." },
      { kind: "paragraph", text: `**${guidance.title}** ${guidance.summary}` },
      { kind: "quote", text: "Discussion aid only. Confirm plan, feature, regional availability and implementation ownership. No automatic compliance or product eligibility is implied." },
      { kind: "heading", text: "Discovery and next steps" },
      ...DISCOVERY_TOPICS.map(topic => ({ kind: "list" as const, text: topic.question, marker: "", indent: 0 })),
      { kind: "paragraph", text: "Next: baseline the current service; design flows and integrations; validate full operating cost and delivery ownership; pilot; then plan cutover and rollback." },
      { kind: "heading", text: "Verify before a decision" },
      { kind: "paragraph", text: "Both products can support growing teams. Zendesk digital routing and Amazon Connect voice routing are not interchangeable. Contact Lens and Zendesk QA are distinct; verify licensing and integration. Capabilities are not enabled by default on every plan." },
    ],
    qualifications: [],
    sources: ["voice", "contact-center", "pricing", "setup"].map(id => {
      const source = COMPARISON_SOURCES.find(item => item.id === id)!;
      return { title: source.title, url: source.url };
    }),
  }, now, "SOLUTION BRIEF");
  doc.setProperties({ title: "Zendesk Voice versus Zendesk Contact Center | Executive brief", subject: "Solution comparison and discovery summary" });
  return doc;
}
