import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResearchAgendaCards } from "../src/components/research-agenda-cards.tsx";
import { RESEARCH_AGENDA_HEADINGS } from "../src/lib/research-agenda.ts";

test("read-only cards show the full agenda, escaped company text and working citations", () => {
  const markdown = RESEARCH_AGENDA_HEADINGS.map(title => `## ${title}\nEvidence [1](https://example.com/source).`).join("\n\n") + "\n\n## Sources\n1. [Official source](https://example.com/source)";
  const html = renderToStaticMarkup(createElement(ResearchAgendaCards, { markdown, companyName: "Example <Company>" }));
  assert.equal((html.match(/data-testid="report-agenda-section"/g) ?? []).length, 6);
  for (const heading of RESEARCH_AGENDA_HEADINGS) assert.ok(html.includes(heading));
  assert.match(html, /Company name/);
  assert.match(html, /Objective/);
  assert.match(html, /Example &lt;Company&gt;/);
  assert.match(html, /href="https:\/\/example.com\/source"/);
  assert.match(html, /target="_blank"/);
  assert.doesNotMatch(html, /<input|<textarea/);
});
test("an incomplete report remains visible and unsafe markup cannot become a link", () => {
  const html = renderToStaticMarkup(createElement(ResearchAgendaCards, {
    markdown: "Partial research [unsafe](javascript:alert(1))\n\n## Current platforms\n",
    companyName: "Example", streaming: true,
  }));
  assert.match(html, /Research draft/);
  assert.match(html, /Partial research/);
  assert.match(html, /Researching…/);
  assert.doesNotMatch(html, /href="javascript:/);
});
