import assert from "node:assert/strict";
import { test } from "node:test";
import { RESEARCH_AGENDA_HEADINGS, splitResearchAgenda } from "../src/lib/research-agenda.ts";

test("report cards follow the agenda headings and retain citation markup", () => {
  const markdown = RESEARCH_AGENDA_HEADINGS.map(title => `## ${title}\nParagraph [1](https://example.com/a).`).join("\n\n") + "\n\n## Sources\n1. [Publisher](https://example.com/a)";
  const sections = splitResearchAgenda(markdown);
  assert.deepEqual(sections.map(section => section.title), [...RESEARCH_AGENDA_HEADINGS, "Sources"]);
  assert.ok(sections.every(section => section.markdown.includes("https://example.com/a")));
  assert.equal(new Set(sections.map(section => section.id)).size, 6);
});
test("streaming fragments, empty headings, preambles and CRLF are not dropped", () => {
  assert.deepEqual(splitResearchAgenda(""), []);
  assert.equal(splitResearchAgenda("Still researching…")[0].markdown, "Still researching…");
  const sections = splitResearchAgenda("Draft preamble\r\n## Company and objective\r\nPartial text\r\n## Current platforms\r\n");
  assert.deepEqual(sections.map(section => section.title), ["Research draft", "Company and objective", "Current platforms"]);
  assert.equal(sections[2].markdown, "");
});
test("nested headings and ordered steps do not consume ordinary content", () => {
  const sections = splitResearchAgenda("## Today's conversation\n### Focus\n1. Confirm priorities\n2. Walk through the configured experience\n");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].title, "Today’s conversation");
  assert.match(sections[0].markdown, /### Focus/);
  assert.match(sections[0].markdown, /2\. Walk/);
});
