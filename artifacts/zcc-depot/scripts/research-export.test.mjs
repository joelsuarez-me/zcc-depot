import assert from "node:assert/strict";
import { test } from "node:test";
import { createResearchPdf, researchPdfFilename } from "../src/lib/research-pdf.ts";
import { streamResearchReport } from "../src/lib/research-stream.ts";
import { RESEARCH_AGENDA_HEADINGS } from "../src/lib/research-agenda.ts";
const report = {
  companyName: "Example Company", companyWebsite: "https://example.com/", region: "North America", audience: "Platform architects",
  researchedAt: "2026-11-12T12:00:00.000Z",
  markdown: RESEARCH_AGENDA_HEADINGS.map(title => `## ${title}\n${"Evidence-based research with an explicit Unknown. [1](https://example.com/) ".repeat(20)}`).join("\n\n") + "\n\n## Sources\nThe structured sources are exported below.",
  sources: [{ id: 1, title: "Official example source", publisher: "example.com", url: "https://example.com/a/very/long/source/url", accessedAt: "2026-11-12" }],
};
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
