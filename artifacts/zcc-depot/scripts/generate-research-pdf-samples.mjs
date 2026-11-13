import { build } from "esbuild";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { executiveReport } from "./fixtures/executive-research.mjs";

// Generated output is excluded from Git and deployment by both ignore files.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(root, "../../generated-artifacts/pdf-review");
const temp = await mkdtemp(resolve(root, "node_modules/.pdf-samples-"));
try {
  const modulePath = resolve(temp, "exporter.mjs");
  await build({ entryPoints: [resolve(root, "src/lib/research-pdf.ts")], outfile: modulePath,
    bundle: true, platform: "node", format: "esm", external: ["jspdf"], logLevel: "warning" });
  const { createResearchPdf } = await import(pathToFileURL(modulePath).href);
  const agendaModulePath = resolve(temp, "agenda-exporter.mjs");
  await build({ entryPoints: [resolve(root, "src/lib/agenda-pdf.ts")], outfile: agendaModulePath,
    bundle: true, platform: "node", format: "esm", external: ["jspdf"], logLevel: "warning" });
  const { createAgendaPdf, agendaPdfFilename } = await import(pathToFileURL(agendaModulePath).href);
  await mkdir(destination, { recursive: true });
  const logo = process.argv[2] ? `data:image/png;base64,${(await readFile(resolve(process.argv[2]))).toString("base64")}` : undefined;
  const samples = [
    ["executive-sample.pdf", executiveReport, logo],
    ["executive-no-logo.pdf", executiveReport],
    ["executive-pagination-stress.pdf", {
      ...executiveReport,
      markdown: executiveReport.markdown.replace("## Current platforms", `## Current platforms\n| Evaluation topic | Evidence and validation |\n| --- | --- |\n${
        Array.from({ length: 55 }, (_, i) => `| Scenario ${i + 1} | Validate the configured journey, system ownership and missing evidence before making a recommendation. [1] |`).join("\n")
      }\n\n| Extended question | Detail |\n| --- | --- |\n| Long row | ${"Preserve this validation detail. ".repeat(300)} FINAL-CELL-EVIDENCE |\n\n`),
    }],
  ];
  for (const [name, report, image] of samples) {
    const pdf = createResearchPdf(report, image);
    await writeFile(resolve(destination, name), Buffer.from(pdf.output("arraybuffer")));
    console.log(`${name}: ${pdf.getNumberOfPages()} pages`);
  }
  const parts = executiveReport.markdown.split(/^## .+\n/gm).slice(1);
  const agenda = {
    id: "11111111-1111-4111-8111-111111111111", company: executiveReport.companyName,
    description: parts[0], currentState: parts[1], conversation: parts[2], problems: parts[3], outcomes: parts[4],
    createdAt: executiveReport.researchedAt, updatedAt: executiveReport.researchedAt, logoPath: null,
  };
  const agendaPdf = createAgendaPdf(agenda, logo);
  await writeFile(resolve(destination, "executive-agenda-sample.pdf"), Buffer.from(agendaPdf.output("arraybuffer")));
  const namedFile = agendaPdfFilename(agenda);
  await writeFile(resolve(destination, namedFile), Buffer.from(agendaPdf.output("arraybuffer")));
  console.log(`executive-agenda-sample.pdf: ${agendaPdf.getNumberOfPages()} pages`);
  console.log(`Named agenda sample: ${namedFile}`);
} finally { await rm(temp, { recursive: true, force: true }); }
