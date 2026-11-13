import { build } from "esbuild";
import { readFile, writeFile, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectSource } from "./industry-source-health.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = resolve(root, "src/data/verticals/review-ledger.json");
const { outputFiles } = await build({
  stdin: { contents: 'export {USE_CASES,USE_CASE_SOURCES} from "./src/data/verticals/index.ts"; export * from "./src/data/verticals/review.ts";', resolveDir: root, loader: "ts" },
  bundle: true, write: false, platform: "node", format: "esm", logLevel: "silent",
});
const data = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
const args = process.argv.slice(2), ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
const now = new Date();
function report() {
  return {
    checkedAt: ledger.checkedAt,
    sources: data.USE_CASE_SOURCES.map(source => ({ id: source.id, title: source.title, url: source.url, ...data.sourceReviewState(source, ledger, now), checkedAt: ledger.sourceChecks[source.id]?.checkedAt ?? null, reviewedAt: ledger.sourceReviews[source.id]?.reviewedAt ?? null })),
    scenarios: data.USE_CASES.map(useCase => ({ id: useCase.id, title: useCase.title, ...data.scenarioReviewState(useCase, data.USE_CASE_SOURCES, ledger, now), reviewedAt: ledger.scenarioReviews[useCase.id]?.reviewedAt ?? null })),
  };
}
async function save() {
  const temporary = `${ledgerPath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(ledger, null, 2)}\n`);
  await rename(temporary, ledgerPath);
}
try {
  if (args.length === 1 && args[0] === "--check") {
    for (const source of data.USE_CASE_SOURCES) ledger.sourceChecks[source.id] = await inspectSource(source, ledger.sourceChecks[source.id], { now });
    ledger.checkedAt = now.toISOString();
    await save();
  } else if (args.length === 3 && ["--review-source", "--review-scenario"].includes(args[0]) && args[2] === "--confirm-reviewed") {
    if (args[0] === "--review-source") {
      const source = data.USE_CASE_SOURCES.find(s => s.id === args[1]);
      if (!source) throw new Error("Unknown source ID. Use --report to list current IDs.");
      ledger.sourceReviews[source.id] = data.acknowledgeSourceReview(source, ledger, now);
    } else {
      const useCase = data.USE_CASES.find(u => u.id === args[1]);
      if (!useCase) throw new Error("Unknown scenario ID. Use --report to list current IDs.");
      ledger.scenarioReviews[useCase.id] = { signature: data.scenarioReviewSignature(useCase, data.USE_CASE_SOURCES), reviewedAt: now.toISOString() };
    }
    await save();
  } else if (!(args.length === 1 && args[0] === "--report")) {
    throw new Error("Usage: review:industry --check | --report | --review-source <id> --confirm-reviewed | --review-scenario <id> --confirm-reviewed. Recording a review is an explicit human editorial action, not an automated approval.");
  }
  const output = report(); console.log(JSON.stringify(output, null, 2));
  process.exitCode = output.sources.some(s => s.needsReview) || output.scenarios.some(s => s.needsReview) ? 1 : 0;
} catch (error) { console.error(error.message); process.exitCode = 2; }
