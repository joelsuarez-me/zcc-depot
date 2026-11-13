import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(resolve(root, "node_modules/.vertical-tests-"));
try {
  const entry = resolve(root, "scripts/vertical-use-cases.test.mjs"), output = resolve(temp, "vertical.test.cjs");
  await build({
    entryPoints: [entry], outfile: output, bundle: true, format: "cjs", platform: "node", jsx: "automatic",
    loader: { ".css": "empty" }, external: ["react", "react-test-renderer", "lucide-react"],
    define: { "import.meta.url": JSON.stringify(pathToFileURL(entry).href), "import.meta.env.BASE_URL": '"/"' },
    plugins: [{
      name: "vertical-dom-independent-components",
      setup(builder) {
        builder.onResolve({ filter: /^(@\/components\/kit|@\/hooks\/use-toast|framer-motion)$/ }, args => ({ path: args.path, namespace: "vertical-double" }));
        builder.onLoad({ filter: /.*/, namespace: "vertical-double" }, ({ path }) => ({
          loader: "jsx",
          contents: path === "@/components/kit"
            ? 'import React from "react"; export const PageHero=({eyebrow,title,lede})=><header><p>{eyebrow}</p><h1>{title}</h1><p>{lede}</p></header>; export const Ext=({href,children,testId,...p})=><a href={href} data-testid={testId} {...p}>{children}</a>;'
            : path === "@/hooks/use-toast"
              ? 'export const useToast=()=>({toast:(value)=>globalThis.__verticalToasts.push(value)});'
              : 'import React from "react";const cache={};export const motion=new Proxy({}, {get:(_,tag)=>cache[tag]??(cache[tag]=React.forwardRef(({children,initial,animate,exit,transition,layout,...p},ref)=>React.createElement(tag,{...p,ref},children)))});export const AnimatePresence=({children})=>children;export const useReducedMotion=()=>!!globalThis.__reduceVerticalMotion;',
        }));
      },
    }], logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, ["--test", output], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(temp, { recursive: true, force: true }); }
