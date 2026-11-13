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
const voiceOutput = resolve(temporary, "voice-controls.test.cjs");
const researchOutput = resolve(temporary, "research-library.test.cjs");
try {
  await build({
    entryPoints: [entry], outfile: output, bundle: true, platform: "node", format: "cjs",
    jsx: "automatic", loader: { ".css": "empty" },
    external: ["react", "react/*", "react-test-renderer"],
    define: { "import.meta.url": JSON.stringify(pathToFileURL(entry).href) },
    logLevel: "warning",
  });
  await build({
    entryPoints: [resolve(packageDir, "scripts/voice-controls.test.mjs")],
    outfile: voiceOutput, bundle: true, platform: "node", format: "cjs",
    jsx: "automatic", loader: { ".css": "empty" },
    external: ["react", "react/*", "react-test-renderer"],
    plugins: [{
      name: "voice-controls-test-context",
      setup(builder) {
        builder.onResolve({ filter: /^\.\/narration-provider$/ }, () => ({ path: "voice-test-context", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: `export const VOICE_ROLES=[{id:"caller",label:"Caller"},{id:"ai-agent",label:"AI Agent"},{id:"human-agent",label:"Human Agent"},{id:"narrator",label:"Narrator"}]; export function useNarration(){return globalThis.__voiceTestNarration;}`,
          loader: "js",
        }));
      },
    }],
    logLevel: "warning",
  });
  await build({
    entryPoints: [resolve(packageDir, "scripts/research-library.test.mjs")],
    outfile: researchOutput, bundle: true, platform: "node", format: "cjs",
    external: ["react", "react/*", "react-test-renderer"],
    define: { "import.meta.env.BASE_URL": JSON.stringify("/") },
    plugins: [{ name: "research-test-api", setup(builder) {
      builder.onResolve({ filter: /^@workspace\/api-client-react$/ }, () => ({ path: "api", namespace: "research-fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "research-fixture" }, () => ({
        contents: `export const listResearchReports=(...a)=>globalThis.__researchApi.list(...a);
export const getSavedResearchReport=(...a)=>globalThis.__researchApi.get(...a);
export const saveResearchReport=(...a)=>globalThis.__researchApi.save(...a);
export const convertResearchReportToAgenda=(...a)=>globalThis.__researchApi.convert(...a);`,
        loader: "js",
      }));
    } }],
    logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [
    "--test", output, voiceOutput, researchOutput, resolve(packageDir, "scripts/voice-preview.test.mjs"),
    resolve(packageDir, "scripts/contact-center-components.test.mjs"),
  ], { cwd: packageDir, stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
