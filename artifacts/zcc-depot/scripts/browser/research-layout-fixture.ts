import type { Page } from "@playwright/test";

// Deliberately synthetic, browser-local responses. No server session or records
// are created, and no research/provider calls are permitted by this fixture.
export const reportId = "00000000-0000-4000-8000-000000000019";
const fields = {
  companyName: "Browser Layout Fixture",
  companyWebsite: "https://example.com",
  region: "Global",
  audience: "Architecture and customer experience leaders",
};
const date = "2026-01-01T12:00:00.000Z";
const headings = [
  "Company and objective", "Current platforms", "Today’s conversation",
  "Questions to validate", "Desired outcomes", "Sources",
];
const markdown = headings.map((heading, i) =>
  `## ${heading}\n\n${i === 5
    ? "[1] [Example source](https://example.com)"
    : `**Layout fixture only — not real company research.**\n\n${Array.from({ length: 3 }, () =>
      "- Validate routing, accessibility and reporting with the architecture team. This deliberately long content exercises report wrapping on narrow phones. [1]").join("\n")}`}`
).join("\n\n");

export async function installResearchLayoutFixture(page: Page) {
  const unexpected: string[] = [];
  await page.route("**/api/**", async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const json = (body: unknown) => route.fulfill({ json: body });
    if (request.method() === "GET") {
      if (pathname === "/api/auth/user") return json({ user: {
        id: "browser-layout-fixture", email: "layout@example.invalid",
        firstName: "Layout", lastName: "Fixture", profileImageUrl: null,
      } });
      if (pathname === "/api/demo-research/saved") return json([{
        id: reportId, ...fields, savedAt: date, researchedAt: date, agendaId: null,
      }]);
      if (pathname === `/api/demo-research/saved/${reportId}`) return json({
        id: reportId, fields, savedAt: date, agendaId: null,
        company: { ...fields, logoUrl: null, logoSourceUrl: null, note: "Browser layout fixture" },
        report: { ...fields, markdown, researchedAt: date, sources: [{
          id: 1, title: "Example source", url: "https://example.com",
          publisher: "Fixture", accessedAt: date,
        }] },
        logoNote: "Browser-only fixture; authentication and provider access have not been tested.",
      });
    }
    unexpected.push(`${request.method()} ${pathname}`);
    return route.fulfill({ status: 501, json: { error: "Not allowed by browser-only layout fixture" } });
  });
  return unexpected;
}
