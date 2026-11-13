import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { collectResources, checkResources, exitCode, formatReport } from "./resource-links.mjs";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function loadInventory() {
  // Compile the actual TypeScript data, including helper-built URLs; do not maintain a second link list.
  const { outputFiles } = await build({
    stdin: {
      contents: `import { LINKS, RESOURCES, COMPONENT_DOCUMENTATION } from "./src/data/content.ts";
import { COMPONENT_GUIDE_URL, APP_GUIDE_URL } from "./src/data/contact-center-components.ts";
import { componentDocumentation } from "./src/lib/component-documentation.ts";
export { LINKS, RESOURCES, COMPONENT_DOCUMENTATION, COMPONENT_GUIDE_URL, APP_GUIDE_URL, componentDocumentation };`,
      resolveDir: packageDir, loader: "ts",
    },
    bundle: true, write: false, platform: "node", format: "esm", logLevel: "silent",
  });
  const data = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
  return collectResources(data, { COMPONENT_GUIDE_URL: data.COMPONENT_GUIDE_URL, APP_GUIDE_URL: data.APP_GUIDE_URL }, data.componentDocumentation);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--json", "--list", "--help"].includes(arg))) {
    throw new Error("Unknown option. Use --help.");
  }
  if (args.includes("--help")) {
    console.log("Check public documentation: pnpm --filter @workspace/zcc-depot check:resource-links [--json] [--list]\n--list: inventory only, no network requests. --json: structured report.\nExits: 0 healthy (or moved), 1 missing/failed, 2 inconclusive or setup error.");
    return;
  }
  const inventory = await loadInventory();
  if (!inventory.resources.length) throw new Error("No public documentation URLs found; refusing an empty check.");
  if (args.includes("--list")) {
    console.log(JSON.stringify(inventory, null, 2));
    return;
  }
  const results = await checkResources(inventory.resources);
  const report = { checkedAt: new Date().toISOString(), results, excluded: inventory.excluded };
  console.log(args.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exitCode = exitCode(results);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`Resource link check could not run: ${error.message}`);
    process.exitCode = 2;
  });
}
