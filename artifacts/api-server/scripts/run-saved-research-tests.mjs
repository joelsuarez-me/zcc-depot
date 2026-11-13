import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const temp = await mkdtemp(resolve(root, "node_modules/.saved-research-tests-"));
try {
  const output = resolve(temp, "saved-research.test.mjs");
  await build({
    entryPoints: [resolve(root, "scripts/saved-research.test.mjs")], outfile: output,
    bundle: true, platform: "node", format: "esm", packages: "external",
    plugins: [{ name: "workspace-source", setup(builder) {
      builder.onResolve({ filter: /^@workspace\// }, args => ({ path: require.resolve(args.path) }));
      // pnpm keeps each workspace's dependencies beside that workspace, not beside this test bundle.
      builder.onResolve({ filter: /^(?:@|[A-Za-z])/ }, args => ({
        path: createRequire(resolve(args.resolveDir || root, "package.json")).resolve(args.path), external: true,
      }));
    } }], logLevel: "warning",
  });
  const result = spawnSync(process.execPath, ["--test", output], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally { await rm(temp, { recursive: true, force: true }); }
