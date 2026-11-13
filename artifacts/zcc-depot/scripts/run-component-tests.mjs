import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Generated test output lives only in ignored dependency storage and is removed below.
const temporary = await mkdtemp(resolve(packageDir, "node_modules/.component-tests-"));
const entry = resolve(packageDir, "scripts/component-showcase.test.mjs");
const output = resolve(temporary, "showcase.test.cjs");
try {
  await build({
    entryPoints: [entry], outfile: output, bundle: true, platform: "node", format: "cjs",
    jsx: "automatic", loader: { ".css": "empty" },
    external: ["react", "react/*", "react-test-renderer"],
    define: { "import.meta.url": JSON.stringify(pathToFileURL(entry).href) },
    logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [
    "--test", output, resolve(packageDir, "scripts/contact-center-components.test.mjs"),
  ], { cwd: packageDir, stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
