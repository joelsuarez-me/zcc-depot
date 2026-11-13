import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(resolve(root, "node_modules/.research-export-tests-"));
try {
  const outputs = [];
  for (const file of ["research-export.test.mjs", "research-agenda.test.mjs", "agenda-pdf.test.mjs"]) {
    const entry = resolve(root, "scripts", file), output = resolve(temp, file);
    await build({ entryPoints: [entry], outfile: output, bundle: true, platform: "node", format: "esm",
      external: ["jspdf", "react", "@tanstack/react-query"],
      define: { "import.meta.url": JSON.stringify(pathToFileURL(entry).href) }, logLevel: "warning" });
    outputs.push(output);
  }
  const actionOutput = resolve(temp, "agenda-pdf-action.test.cjs");
  await build({
    entryPoints: [resolve(root, "scripts/agenda-pdf-action.test.mjs")], outfile: actionOutput,
    bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react-test-renderer", "lucide-react"],
    plugins: [{
      name: "pdf-action-test-double",
      setup(builder) {
        builder.onResolve({ filter: /^@\/lib\/agenda-pdf$/ }, () => ({ path: "pdf-action-test-double", namespace: "pdf-double" }));
        builder.onLoad({ filter: /.*/, namespace: "pdf-double" }, () => ({
          contents: "export const agendaPdfFilename=(...a)=>globalThis.__agendaPdf.filename(...a); export const createAgendaPdf=(...a)=>globalThis.__agendaPdf.create(...a);",
          loader: "js",
        }));
      },
    }], logLevel: "warning",
  });
  outputs.push(actionOutput);
  const result = spawnSync(process.execPath, ["--test", ...outputs], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally { await rm(temp, { recursive: true, force: true }); }
