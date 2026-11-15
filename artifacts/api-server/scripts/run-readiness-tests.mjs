import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/api-server");
const require = createRequire(resolve(root, "package.json"));
const dir = await mkdtemp(resolve(root, "node_modules/.readiness-access-"));
try {
  const output = resolve(dir, "checks.mjs");
  await build({ entryPoints: [resolve(root, "scripts/readiness-access.test.mjs")], outfile: output,
    bundle: true, platform: "node", format: "esm", packages: "external",
    plugins: [{ name: "workspace", setup(b) {
      b.onResolve({ filter: /^@workspace\// }, a => ({ path: require.resolve(a.path) }));
      b.onResolve({ filter: /^(?:@|[A-Za-z])/ }, a => ({ path: createRequire(resolve(a.resolveDir || root, "package.json")).resolve(a.path), external: true }));
    } }], logLevel: "warning" });
  process.exitCode = spawnSync(process.execPath, ["--test", output], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
