// Manual smoke test: two billable Gemini requests, with real search and no saved app data.
import { writeFile } from "node:fs/promises";
import { resolveCompany } from "../src/lib/demo-research/company.ts";
import { generateReport } from "../src/lib/demo-research/report.ts";

const signal = AbortSignal.timeout(200_000);
const company = await resolveCompany({ companyName: "Zendesk" }, "manual-research-smoke", signal);
console.log(JSON.stringify({ phase: "company", website: company.companyWebsite, hasLogo: !!company.logoUrl }));
let chunks = 0;
const report = await generateReport({
  companyName: "Zendesk", companyWebsite: company.companyWebsite,
  region: "North America", audience: "Platform architects preparing a contact center demo",
}, signal, () => { chunks++; });
await writeFile("/tmp/zcc-demo-research-smoke.json", JSON.stringify(report));
console.log(JSON.stringify({ phase: "report", characters: report.markdown.length, sourceCount: report.sources.length, chunks, hasSourcesSection: report.markdown.includes("## 8. Sources") }));
