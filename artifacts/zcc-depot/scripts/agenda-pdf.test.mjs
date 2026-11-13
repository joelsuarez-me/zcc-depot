import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createAgendaPdf, agendaPdfFilename } from "../src/lib/agenda-pdf.ts";

export const agendaFixture = {
  id: "11111111-1111-4111-8111-111111111111", company: "Example Company",
  description: "**Evaluation goal:** Align on customer priorities. [1]",
  currentState: "| Area | Status |\n| --- | --- |\n| Voice | To validate |",
  conversation: "1. Confirm requirements\n2. Review relevant journeys",
  problems: "- Validate integration ownership. [1]",
  outcomes: "- Agree on next steps.\n\nSources used to prepare this agenda\n[1] Official source (https://example.com/reference)",
  logoPath: null, createdAt: "2026-11-13T12:00:00Z", updatedAt: "2026-11-13T13:00:00Z",
};
test("saved agenda PDF uses the executive layout without fabricating research metadata", () => {
  const pdf = createAgendaPdf(agendaFixture), output = pdf.output();
  assert.match(output, /^%PDF-/);
  for (const heading of ["Company and objective", "Current platforms", "Today's conversation", "Questions to validate", "Desired outcomes", "Sources"]) {
    assert.ok(output.includes(heading), heading);
  }
  assert.match(output, /DEMO AGENDA/);
  assert.match(output, /SAVED WORKSHOP BRIEF/);
  assert.match(output, /Evaluation goal:/);
  assert.match(output, /\/Subtype \/Link/);
  assert.match(output, /https:\/\/example\.com\/reference/);
  assert.doesNotMatch(output, /AI-generated preparation|DEMO RESEARCH BRIEF|Current platforms\\n\|/);
  assert.equal(agendaPdfFilename(agendaFixture, new Date(2026, 10, 13, 9)), "Demo-Agenda-Example Company-2026-11-13.pdf");
});
test("agenda filenames use the current local date and preserve customer capitalization", () => {
  const now = new Date(2026, 11, 2, 0, 5);
  assert.equal(agendaPdfFilename({ ...agendaFixture, company: "Morningstar", updatedAt: "2025-01-01T00:00:00Z" }, now), "Demo-Agenda-Morningstar-2026-12-02.pdf");
  assert.equal(agendaPdfFilename({ ...agendaFixture, company: "  ACME / North: West?  " }, now), "Demo-Agenda-ACME - North- West--2026-12-02.pdf");
});
test("Print PDF stays visible for drafts but requires a saved agenda and blocks unsaved changes", () => {
  const page = readFileSync(new URL("../src/pages/agenda.tsx", import.meta.url), "utf8");
  const action = readFileSync(new URL("../src/components/agenda-pdf-action.tsx", import.meta.url), "utf8");
  assert.equal((page.match(/<AgendaPdfAction agenda=\{selectedId && !creating \? activeAgenda : undefined\}/g) ?? []).length, 2);
  assert.match(action, /disabled=\{!agenda \|\| dirty \|\| busy \|\| preparing\}/);
  assert.match(action, /Save agenda to enable PDF export/);
  assert.match(action, /Save your changes to enable Print PDF/);
  assert.match(action, /doc\.autoPrint\(\)/);
  assert.match(action, /URL\.revokeObjectURL/);
  assert.doesNotMatch(action, /import\s*\(/);
});
