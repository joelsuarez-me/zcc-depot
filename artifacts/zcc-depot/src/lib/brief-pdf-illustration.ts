import { PDF_COLORS as C, type ResearchPdfLayout } from "./research-pdf-layout";

type TopicVisual = { key: string; title: string; steps: [string, string, string]; note: string };
/** Concept illustrations, never purported product screenshots, metrics or deployment diagrams. */
export function briefTopicVisual(title: string, page = "", headings: string[] = []): TopicVisual {
  const rules: [RegExp, TopicVisual][] = [
    [/versus|vs\.|comparison/i, { key: "comparison", title: "Two solutions. One informed decision.", steps: ["Service needs", "Technical fit", "Solution choice"], note: "Compare the operating model, required capabilities and delivery scope." }],
    [/video|screen.shar/i, { key: "video", title: "A shared view of the customer conversation", steps: ["Customer", "Shared context", "Agent"], note: "Illustrative collaboration concept; availability depends on configuration." }],
    [/callback/i, { key: "callback", title: "From a waiting caller to a return conversation", steps: ["Callback request", "Queue handling", "Return call"], note: "Illustrative callback journey; eligibility and timing depend on the configured flow." }],
    [/outbound|dialer|campaign/i, { key: "outbound", title: "Plan the outreach. Connect the conversation.", steps: ["Audience & consent", "Configured dialer", "Conversation"], note: "Illustrative outreach concept; confirm consent, operating rules and delivery scope." }],
    [/routing|queues?|ivr/i, { key: "routing", title: "Connect the right work to an eligible agent", steps: ["Incoming work", "Configured rules", "Eligible agent"], note: "Illustrative routing concept; routing rules differ by channel and configuration." }],
    [/sign.in|identity|authenticat|cognito|security|permission/i, { key: "identity", title: "Access follows identity and permissions", steps: ["Identity", "Access policies", "Authorized access"], note: "Conceptual access boundary, not a complete security or compliance design." }],
    [/pod|global|residen|region|resilien/i, { key: "global", title: "A distributed service footprint", steps: ["Regional footprint", "Isolated pods", "Service resilience"], note: "Conceptual infrastructure view; validate current residency and service commitments." }],
    [/architecture|integration|system|data flow|connect|cloudformation/i, { key: "architecture", title: "Connected experiences. Clearly defined boundaries.", steps: ["Agent workspace", "Contact platform", "Connected systems"], note: "Conceptual integration view; individual connections require supported configuration." }],
    [/supervis|quality|voice qa|analytics|reporting|sentiment/i, { key: "quality", title: "Turn service context into informed action", steps: ["Service context", "Review & insight", "Team action"], note: "Illustrative oversight workflow; confirm data access and licensed capabilities." }],
    [/copilot|\bai\b|automat|intelligen/i, { key: "ai", title: "Bring intelligence into the service workflow", steps: ["Conversation", "Configured AI", "Supported action"], note: "Illustrative AI workflow; verify the feature, required setup and review controls." }],
    [/knowledge/i, { key: "knowledge", title: "Useful knowledge, in the right context", steps: ["Customer need", "Relevant knowledge", "Supported response"], note: "Conceptual knowledge workflow; quality depends on content and configuration." }],
    [/pric|cost|commercial|bundle|licens/i, { key: "commercial", title: "Evaluate the complete operating picture", steps: ["Capabilities", "Usage & delivery", "Commercial scope"], note: "Conceptual cost framework, not a quotation or pricing commitment." }],
    [/proof|customer stor|testimonial/i, { key: "proof", title: "Customer context. Solution choice. Reported impact.", steps: ["Customer challenge", "Solution approach", "Reported results"], note: "Read results in their source context; individual outcomes are not a guarantee." }],
    [/value|outcome|business|discovery|sales/i, { key: "value", title: "Connect technical choices to business priorities", steps: ["Business priority", "Solution approach", "Value discussion"], note: "A discovery framework, not a promise of a specific business outcome." }],
  ];
  const match = (text: string) => rules.find(([pattern]) => pattern.test(text))?.[1];
  const selected = match(title) ?? match(page);
  if (selected) return selected;
  const labels = headings.filter(text => text.length < 48).slice(0, 3);
  return {
    key: "learning", title: "Your topic, at a glance",
    steps: labels.length === 3 ? labels as [string, string, string] : ["Understand", "Explore", "Apply"],
    note: "A conceptual reading guide. Use the section content for the full explanation.",
  };
}

export function drawBriefIllustration(layout: ResearchPdfLayout, visual: TopicVisual) {
  const { doc, margin: M, contentWidth: W } = layout;
  const labelLines = visual.steps.map(label => layout.plainLines(label, 128, 11, true));
  const labelHeight = Math.max(...labelLines.map(lines => lines.length)) * 14;
  const noteLines = layout.plainLines(visual.note, W - 32, 9);
  const h = 104 + labelHeight + noteLines.length * 12 + 17;
  layout.ensure(h + 16);
  const y = layout.y;
  doc.setFillColor(...C.mist); doc.setDrawColor(...C.line); doc.setLineWidth(.6);
  doc.roundedRect(M, y, W, h, 12, 12, "FD");
  layout.text("CONCEPT ILLUSTRATION", M + 16, y + 20, 8, true, C.muted);
  // A bounded title keeps unusually long user-facing topics out of the drawing area.
  layout.text(visual.title, M + 16, y + 39, 11, true, C.forest);
  const centers = [M + 88, M + W / 2, M + W - 88];
  const top = y + 54, cardW = 146, cardH = 38 + labelHeight;
  doc.setDrawColor(...C.muted); doc.setLineWidth(1.2);
  for (let i = 0; i < 2; i++) {
    const start = centers[i] + cardW / 2 + 3, end = centers[i + 1] - cardW / 2 - 3, cy = top + cardH / 2;
    doc.line(start, cy, end, cy); doc.line(end - 4, cy - 3, end, cy); doc.line(end - 4, cy + 3, end, cy);
  }
  const accents: [number, number, number][] = [C.forest, [26, 117, 113], [102, 75, 132]];
  visual.steps.forEach((label, i) => {
    const x = centers[i] - cardW / 2;
    doc.setFillColor(...C.white); doc.setDrawColor(...C.line);
    doc.roundedRect(x, top, cardW, cardH, 8, 8, "FD");
    doc.setFillColor(...accents[i]); doc.roundedRect(x, top, 4, cardH, 2, 2, "F");
    const ix = centers[i], iy = top + 13;
    doc.setDrawColor(...accents[i]); doc.setLineWidth(1.3);
    const glyphs: Record<string, string[]> = {
      ai: ["speech", "chip", "check"], routing: ["phone", "branch", "person"],
      callback: ["phone", "document", "phone"], outbound: ["document", "phone", "person"],
      architecture: ["window", "branch", "database"], global: ["globe", "branch", "check"],
      identity: ["person", "lock", "check"], video: ["window", "window", "person"],
      comparison: ["document", "search", "check"], quality: ["document", "search", "person"],
      commercial: ["document", "branch", "document"], proof: ["person", "search", "check"],
      value: ["document", "branch", "check"], knowledge: ["speech", "document", "check"],
      learning: ["document", "search", "check"],
    };
    const glyph = glyphs[visual.key]?.[i] ?? "document";
    if (glyph === "person") {
      doc.circle(ix, iy - 1, 3.5, "S"); doc.roundedRect(ix - 7, iy + 4, 14, 6, 3, 3, "S");
    } else if (glyph === "check") {
      doc.circle(ix, iy + 2, 8, "S"); doc.line(ix - 4, iy + 2, ix - 1, iy + 5); doc.line(ix - 1, iy + 5, ix + 5, iy - 2);
    } else if (glyph === "search") {
      doc.circle(ix - 2, iy, 6, "S"); doc.line(ix + 3, iy + 5, ix + 8, iy + 10);
    } else if (glyph === "phone") {
      doc.roundedRect(ix - 5, iy - 6, 10, 17, 3, 3, "S"); doc.line(ix - 2, iy + 7, ix + 2, iy + 7);
    } else if (glyph === "speech") {
      doc.roundedRect(ix - 9, iy - 5, 18, 12, 3, 3, "S");
      doc.line(ix - 4, iy + 7, ix - 4, iy + 11); doc.line(ix - 4, iy + 11, ix, iy + 7);
      [-4, 0, 4].forEach(dx => { doc.setFillColor(...accents[i]); doc.circle(ix + dx, iy + 1, .8, "F"); });
    } else if (glyph === "chip") {
      doc.roundedRect(ix - 6, iy - 4, 12, 12, 2, 2, "S"); doc.rect(ix - 2, iy, 4, 4, "S");
      [-3, 3].forEach(dx => { doc.line(ix + dx, iy - 7, ix + dx, iy - 4); doc.line(ix + dx, iy + 8, ix + dx, iy + 11); });
      [-1, 5].forEach(dy => { doc.line(ix - 9, iy + dy, ix - 6, iy + dy); doc.line(ix + 6, iy + dy, ix + 9, iy + dy); });
    } else if (glyph === "database") {
      doc.ellipse(ix, iy - 3, 7, 3, "S"); doc.line(ix - 7, iy - 3, ix - 7, iy + 7); doc.line(ix + 7, iy - 3, ix + 7, iy + 7);
      doc.ellipse(ix, iy + 7, 7, 3, "S");
    } else if (glyph === "globe") {
      doc.circle(ix, iy + 2, 8, "S"); doc.ellipse(ix, iy + 2, 3, 8, "S"); doc.line(ix - 8, iy + 2, ix + 8, iy + 2);
    } else if (glyph === "lock") {
      doc.roundedRect(ix - 6, iy, 12, 9, 2, 2, "S");
      doc.ellipse(ix, iy - 1, 4, 5, "S"); doc.line(ix, iy + 3, ix, iy + 6);
    } else if (glyph === "window") {
      doc.roundedRect(ix - 9, iy - 4, 18, 13, 2, 2, "S");
      doc.line(ix - 9, iy, ix + 9, iy); doc.circle(ix, iy + 4, 2, "S");
    } else if (glyph === "document") {
      doc.roundedRect(ix - 9, iy - 4, 18, 14, 2, 2, "S");
      doc.line(ix - 5, iy, ix + 5, iy); doc.line(ix - 5, iy + 4, ix + 2, iy + 4);
      doc.setFillColor(...accents[i]); doc.circle(ix + 8, iy + 8, 3, "F");
    } else if (glyph === "branch") {
      doc.roundedRect(ix - 5, iy - 4, 10, 8, 2, 2, "S");
      doc.line(ix, iy + 4, ix, iy + 8); doc.line(ix - 9, iy + 8, ix + 9, iy + 8);
      doc.circle(ix - 9, iy + 8, 2, "S"); doc.circle(ix + 9, iy + 8, 2, "S");
    } else {
      doc.roundedRect(ix - 6, iy - 5, 12, 15, 2, 2, "S");
      doc.line(ix - 3, iy, ix + 3, iy); doc.line(ix - 3, iy + 4, ix + 2, iy + 4);
    }
    labelLines[i].forEach((line, n) => {
      const width = line.reduce((sum, run) => sum + run.width, 0);
      layout.paint(line, centers[i] - width / 2, top + 29 + n * 14, 11, true);
    });
  });
  noteLines.forEach((line, i) => layout.paint(line, M + 16, top + cardH + 12 + i * 12, 9, false, C.muted));
  layout.y = y + h + 18;
}
