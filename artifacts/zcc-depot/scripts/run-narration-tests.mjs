import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(resolve(root, "node_modules/.narration-tests-"));
try {
  const output = resolve(temp, "narration-preferences.test.cjs");
  await build({
    entryPoints: [resolve(root, "scripts/narration-preferences.test.mjs")], outfile: output,
    bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/*", "react-test-renderer"],
    plugins: [{ name: "narration-services", setup(builder) {
      builder.onResolve({ filter: /^@workspace\/(?:api-client-react|replit-auth-web)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        contents: args.path.endsWith("replit-auth-web")
          ? `export const useAuth=()=>globalThis.__narrationAuth;`
          : `export const getDemoNarrationPreferences=(...a)=>globalThis.__narrationApi.get(...a);
export const saveDemoNarrationPreferences=(...a)=>globalThis.__narrationApi.save(...a);
export const createDemoSpeech=(...a)=>globalThis.__narrationApi.speech(...a);
export const getGetDemoVoicesQueryKey=()=>["voices"];
export const useGetDemoVoices=()=>globalThis.__narrationAuth.isAuthenticated ? globalThis.__narrationCatalog : {};`,
        loader: "js",
      }));
    } }], logLevel: "warning",
  });
  const result = spawnSync(process.execPath, ["--test", output], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally { await rm(temp, { recursive: true, force: true }); }
