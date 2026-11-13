import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(resolve(root, "node_modules/.industry-review-tests-"));
try {
  const outfile = resolve(temp, "review.test.cjs");
  await build({ entryPoints: [resolve(root, "scripts/industry-review.test.mjs")], outfile, bundle: true, platform: "node", format: "cjs", jsx: "automatic", external: ["react", "react-dom/server"], logLevel: "warning" });
  process.exitCode = spawnSync(process.execPath, ["--test", outfile], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(temp, { recursive: true, force: true }); }
