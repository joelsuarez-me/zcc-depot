import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(resolve(root, "node_modules/.shortlist-tests-"));
try {
  const output = resolve(temp, "shortlists.test.cjs");
  await build({
    entryPoints: [resolve(root, "scripts/shortlists.test.mjs")], outfile: output,
    bundle: true, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react-test-renderer"], logLevel: "warning",
    plugins: [{ name: "shortlist-doubles", setup(builder) {
      builder.onResolve({ filter: /^(@workspace\/api-client-react|@tanstack\/react-query|@\/lib\/depot-mode|@\/components\/presenter)$/ }, args => ({ path: args.path, namespace: "double" }));
      builder.onLoad({ filter: /.*/, namespace: "double" }, ({ path }) => ({
        loader: "jsx",
        contents: path === "@workspace/api-client-react" ? `
          export class ApiError extends Error {}
          export const PublicScenarioId={'financial-services-banking-routing':'financial-services-banking-routing','pharma-life-sciences-adverse-event':'pharma-life-sciences-adverse-event'};
          export const getListUseCaseShortlistsQueryKey=()=>['shortlists'];
          export const useListUseCaseShortlists=()=>globalThis.__shortlists.list;
          export const getUseCaseShortlist=(id)=>globalThis.__shortlists.get(id);
          export const createUseCaseShortlist=(data)=>globalThis.__shortlists.create(data);
          export const updateUseCaseShortlist=(id,data)=>globalThis.__shortlists.update(id,data);
          export const deleteUseCaseShortlist=(id,data)=>globalThis.__shortlists.delete(id,data);`
          : path === "@tanstack/react-query" ? "export const useQueryClient=()=>({invalidateQueries:async()=>{globalThis.__shortlists.invalidations++}});"
          : path === "@/lib/depot-mode" ? "export const useDepot=()=>({isPresenter:globalThis.__shortlists.authorized,auth:{user:{id:'test'},isAuthenticated:globalThis.__shortlists.authorized}});"
          : "export const PresenterGate=({children})=>globalThis.__shortlists.authorized?children:null;",
      }));
    } }],
  });
  process.exitCode = spawnSync(process.execPath, ["--test", output], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(temp, { recursive: true, force: true }); }
