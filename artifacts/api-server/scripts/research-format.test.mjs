import assert from "node:assert/strict";
import { test } from "node:test";
import { REPORT_HEADINGS, buildResearchPrompt, canonicalizeReportHeadings, validateReportOutline } from "../src/lib/demo-research/report-format.ts";

const draft = REPORT_HEADINGS.map(title => `## ${title}\nEvidence or an explicit unknown.`).join("\n\n");
test("research uses the five agenda headings, in order, without numbering", () => {
  assert.deepEqual(REPORT_HEADINGS, ["Company and objective", "Current platforms", "Today’s conversation", "Questions to validate", "Desired outcomes"]);
  assert.doesNotThrow(() => validateReportOutline(draft));
  assert.doesNotThrow(() => validateReportOutline(draft.replace("Today’s", "Today's")));
});
test("missing, empty, duplicate, extra and reordered sections cannot become complete reports", () => {
  for (const invalid of [
    draft.replace("## Current platforms", "## Installed stack"),
    draft + "\n\n## Sources\nInvented source",
    draft + "\n\n## Company and objective\nDuplicate",
    REPORT_HEADINGS.slice().reverse().map(title => `## ${title}\nText`).join("\n"),
    draft.replace("## Current platforms\nEvidence or an explicit unknown.", "## Current platforms\n"),
  ]) assert.throws(() => validateReportOutline(invalid), /agenda section/);
});
test("canonical formatting preserves inline citations and the authoritative Sources section", () => {
  const normalized = canonicalizeReportHeadings(draft.replace("Today’s", "Today's") + "\n[1](https://example.com/)\n\n## Sources\n1. Publisher");
  assert.match(normalized, /## Today’s conversation/);
  assert.match(normalized, /\[1\]\(https:\/\/example\.com\/\)/);
  assert.match(normalized, /## Sources/);
});
test("prompt requires current evidence, unknowns, safe product boundaries and no fabricated sources", () => {
  const prompt = buildResearchPrompt({ companyName: "Example", audience: "Architects" }, "2026-11-12");
  for (const title of REPORT_HEADINGS) assert.ok(prompt.includes(`## ${title}`));
  assert.match(prompt, /Google Search NOW/);
  assert.match(prompt, /Unknown \/ to validate/);
  assert.match(prompt, /separately configured Zendesk QA/);
  assert.match(prompt, /does not imply one routing engine/);
  assert.match(prompt, /Do not include.*source URLs/);
});
