import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createResearchPdf, researchPdfFilename } from "../src/lib/research-pdf.ts";
import { streamResearchReport } from "../src/lib/research-stream.ts";
import { RESEARCH_AGENDA_HEADINGS } from "../src/lib/research-agenda.ts";
import { parsePdfBlocks, tableCells, pdfText } from "../src/lib/research-pdf-markdown.ts";
import { executiveReport } from "./fixtures/executive-research.mjs";
const report = {
  companyName: "Example Company", companyWebsite: "https://example.com/", region: "North America", audience: "Platform architects",
  researchedAt: "2026-11-12T12:00:00.000Z",
  markdown: RESEARCH_AGENDA_HEADINGS.map(title => `## ${title}\n${"Evidence-based research with an explicit Unknown. [1](https://example.com/) ".repeat(20)}`).join("\n\n") + "\n\n## Sources\nThe structured sources are exported below.",
  sources: [{ id: 1, title: "Official example source", publisher: "example.com", url: "https://example.com/a/very/long/source/url", accessedAt: "2026-11-12" }],
};
test("PDF exporter loads with the research route, never through a later hashed import", () => {
  const page = readFileSync(new URL("../src/pages/demo-brief.tsx", import.meta.url), "utf8");
  assert.match(page, /import\s+\{\s*createResearchPdf,\s*researchPdfFilename\s*\}\s+from\s+["']@\/lib\/research-pdf["']/);
  assert.doesNotMatch(page, /import\s*\(\s*["']@\/lib\/research-pdf["']/);
  assert.match(page, /createResearchPdf\(r,\s*logo\)/);
  assert.match(page, /doc\.save\(researchPdfFilename\(r\)\)/);
});
test("PDF export creates selectable multipage text, full source URLs and page numbers", () => {
  const pdf = createResearchPdf(report);
  const output = pdf.output();
  assert.match(output, /^%PDF-/);
  assert.ok(pdf.getNumberOfPages() > 1);
  for (const heading of RESEARCH_AGENDA_HEADINGS) assert.ok(output.includes(heading.replace("’", "'")));
  assert.match(output, /Sources/);
  assert.doesNotMatch(output, /8\. Sources/);
  assert.match(output, /example\.com\/a\/very\/long\/source\/url/);
  assert.match(output, /Page 1 of/);
  assert.match(output, /\/Subtype \/Link/);
  assert.equal(researchPdfFilename(report), "example-company-zcc-demo-research-2026-11-12.pdf");
});
test("PDF rejects corrupt logos explicitly and paginates very long source URLs", () => {
  assert.throws(() => createResearchPdf(report, "data:image/png;base64,invalid"), /company logo could not/);
  const longUrl = `https://example.com/${"long-attribution-".repeat(1000)}`;
  const pdf = createResearchPdf({ ...report, sources: [{ ...report.sources[0], url: longUrl }] });
  assert.ok(pdf.output().includes(longUrl));
  assert.ok(pdf.getNumberOfPages() > 1);
  assert.match(pdf.output(), /continued/);
});
test("markdown structure preserves tables, nested headings, ordered lists and escaped pipes", () => {
  const blocks = parsePdfBlocks("### Validation\n1. Confirm **routing**\n  - Nested question\n\n| Area | Detail |\n| --- | :---: |\n| Voice | A \\| B |\n| Code | `x|y` |\n");
  assert.deepEqual(blocks.map(block => block.kind), ["heading", "list", "list", "table"]);
  assert.equal(blocks[1].marker, "1");
  assert.equal(blocks[2].indent, 6);
  assert.deepEqual(blocks[3].rows, [["Voice", "A | B"], ["Code", "`x|y`"]]);
  assert.deepEqual(blocks[3].align, ["left", "center"]);
  assert.deepEqual(tableCells("| A | B |"), ["A", "B"]);
  assert.equal(pdfText("Café · Montréal — “Review”"), 'Café · Montréal - "Review"');
});
test("executive sample renders real tables, visual roadmap and clickable evidence without raw markup", () => {
  const pdf = createResearchPdf(executiveReport), output = pdf.output();
  assert.match(output, /CONVERSATION AT A GLANCE/);
  assert.match(output, /Current environment/);
  assert.match(output, /Validation needed/);
  assert.match(output, /Evaluation lens/);
  assert.match(output, /Proposed fit is a discussion hypothesis/);
  assert.doesNotMatch(output, /\| :---|### Evaluation|\*\*Align/);
  assert.match(output, /\/Subtype \/Link/);
  assert.ok(pdf.getNumberOfPages() <= 3, "A concise sample must not create a nearly empty source-only page");
  assertTextWithinPage(pdf);
});
test("wide company logos and long account context remain contained with selectable accented text", () => {
  const logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAADCAIAAAAhqtkfAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAEUlEQVR4nGOQ9DHGihhIlgAAFFkOQffMZlUAAAAASUVORK5CYII=";
  const pdf = createResearchPdf({ ...executiveReport,
    companyName: "Montréal Customer Operations and International Service Evaluation",
    audience: "Senior customer service leadership, enterprise platform architects, operational managers and integration owners",
  }, logo);
  assert.match(pdf.output(), /\/Subtype \/Image/);
  assert.ok(pdf.output().includes("Montréal"));
  assertTextWithinPage(pdf);
});
test("large tables repeat headers and split exceptionally tall rows without dropping cell text", () => {
  const rows = Array.from({ length: 65 }, (_, i) => `| Topic ${i} | Confirm evidence for scenario ${i}. [1] |`);
  rows.splice(30, 0, `| Long discussion | ${"Important validation. ".repeat(400)} LAST-CELL-MARKER |`);
  const markdown = `## Current platforms\n| Research topic | Validation detail |\n| --- | --- |\n${rows.join("\n")}`;
  const pdf = createResearchPdf({ ...executiveReport, markdown }), output = pdf.output();
  assert.ok(pdf.getNumberOfPages() > 3);
  assert.ok((output.match(/Research topic/g) ?? []).length > 3);
  assert.match(output, /TABLE CONTINUED/);
  assert.match(output, /Topic 64/);
  assert.match(output, /LAST-CELL-MARKER/);
  assertTextWithinPage(pdf);
});
test("wide tables preserve every field through record-oriented tables", () => {
  const headers = Array.from({ length: 8 }, (_, i) => `Attribute ${i + 1}`);
  const markdown = `## Questions to validate\n| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n| ${headers.map((_, i) => `Value ${i + 1}`).join(" | ")} |`;
  const pdf = createResearchPdf({ ...executiveReport, markdown }), output = pdf.output();
  for (let i = 1; i <= 8; i++) assert.ok(output.includes(`Value ${i}`));
  assert.match(output, /Field/); assert.match(output, /Research detail/);
  assertTextWithinPage(pdf);
});
function assertTextWithinPage(pdf) {
  for (const page of pdf.internal.pages.slice(1)) for (const command of page) {
    for (const match of command.matchAll(/(-?[\d.]+) (-?[\d.]+) Td\b/g)) {
      const x = Number(match[1]), y = 792 - Number(match[2]);
      assert.ok(x >= 40 && x <= 570, `Text x=${x} must stay within report margins`);
      assert.ok(y >= 20 && y <= 772, `Text y=${y} must stay within the page`);
    }
  }
}
test("SSE parser handles split chunks, CRLF, heartbeat, draft and complete", async () => {
  const original = globalThis.fetch;
  const data = `: keep-alive\r\n\r\ndata: ${JSON.stringify({ type: "delta", text: "Draft" })}\r\n\r\ndata: ${JSON.stringify({ type: "complete", report })}\r\n\r\n`;
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) {
    const bytes = new TextEncoder().encode(data);
    for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
    controller.close();
  }}));
  try {
    const events = [];
    const result = await streamResearchReport(report, { signal: new AbortController().signal, onEvent: event => events.push(event.type) });
    assert.equal(result.companyName, report.companyName);
    assert.deepEqual(events, ["delta", "complete"]);
  } finally { globalThis.fetch = original; }
});
test("SSE failures and truncated drafts never become completed reports", async () => {
  const original = globalThis.fetch;
  try {
    for (const payload of [{ type: "delta", text: "Incomplete" }, { type: "error", message: "Live research failed" }]) {
      globalThis.fetch = async () => new Response(`data: ${JSON.stringify(payload)}\n\n`);
      await assert.rejects(streamResearchReport(report, { signal: new AbortController().signal, onEvent() {} }));
    }
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Sign in" }), { status: 401 });
    await assert.rejects(streamResearchReport(report, { signal: new AbortController().signal, onEvent() {} }), error => error.status === 401);
  } finally { globalThis.fetch = original; }
});
