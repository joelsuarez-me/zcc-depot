import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.feature-experience-"));
try {
  await build({
    entryPoints: [resolve(root, "scripts/feature-experience.check.tsx")],
    bundle: true, platform: "node", format: "cjs",
    outfile: resolve(dir, "checks.cjs"), jsx: "automatic",
    define: { "import.meta.env.BASE_URL": '"/"' },
    external: ["react", "react/jsx-runtime", "react-test-renderer"],
    loader: { ".css": "empty" },
    plugins: [{ name: "feature-ui-test-boundaries", setup(b) {
      b.onResolve({ filter: /^framer-motion$/ }, (a) => ({ path: a.path, namespace: "feature-test" }));
      b.onResolve({ filter: /^\.\/feature-detail$/ }, (a) => ({ path: a.path, namespace: "feature-test" }));
      b.onResolve({ filter: /^@\/(?:lib\/depot-mode|hooks\/use-presenter-content)$/ }, (a) => ({ path: a.path, namespace: "feature-test" }));
      b.onLoad({ filter: /.*/, namespace: "feature-test" }, (a) => ({
        loader: "js",
        contents: a.path === "framer-motion"
          ? 'import React from "react";export const useReducedMotion=()=>true;export const AnimatePresence=({children})=>children;export const motion={div:({children,initial,animate,exit,transition,layout,...p})=>React.createElement("div",p,children)};'
          : a.path === "./feature-detail"
          ? 'import React from "react";export const FeatureDetail=(p)=>React.createElement("aside",{"data-testid":"detail-stub",...p},p.feature?.title??"");'
          : a.path.includes("depot-mode")
          ? 'export const useDepot=()=>globalThis.__featureTestDepot;'
          : 'export const usePresenterContent=()=>{globalThis.__featureQueryCalls++;return globalThis.__featureNotesQuery;};',
      }));
    }}], logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
