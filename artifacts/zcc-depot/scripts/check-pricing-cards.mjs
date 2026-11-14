import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.pricing-check-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "tsx", contents: `
import React from "react";
import assert from "node:assert/strict";
import {act,create} from "react-test-renderer";
import Pricing from "./src/pages/pricing";
import {pricingGuide} from "../api-server/src/lib/pricingGuide";
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.document={title:"test",querySelector:()=>null};
globalThis.pricingAuth={isAuthenticated:true,isLoading:false,login:()=>{}};
globalThis.pricingQuery={data:pricingGuide,isError:false,isLoading:false,isFetching:false,refetch:()=>{}};
let tree,checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++};
const text=n=>typeof n==="string"?n:(n?.children??[]).map(text).join("");
act(()=>{tree=create(<Pricing/>);});
for(const method of pricingGuide.methods){
 const card=tree.root.findByProps({"data-testid":"section-pricing-"+method.id});
 const cta=tree.root.findByProps({"data-testid":"link-pricing-cta-"+method.id});
 ok(cta.props.href==="https://www.zendesk.com/pricing/contact-center/","official pricing destination");
 ok(cta.props.target==="_blank"&&cta.props.rel.includes("noopener")&&cta.props.rel.includes("noreferrer"),"safe new tab");
 ok(text(cta).includes("opens in a new tab"),"accessible link notice");
 ok(card.props.className.includes("bg-[#FFFFFF]"),"white option card");
 ok(text(card).includes(method.price)&&text(card).includes(method.unit),"original pricing retained");
 ok(text(card).includes(method.summary),"original summary retained");
 for(const detail of method.details)ok(text(card).includes(detail),"original detail retained");
 ok(card.findAllByType("a").some(a=>a.props.href==="#"+method.id),"section permalink retained");
}
for(const scenario of ["signed-out","expired","loading","error"]){
 globalThis.pricingAuth={isAuthenticated:scenario!=="signed-out",isLoading:false,login:()=>{}};
 globalThis.pricingQuery={data:undefined,isError:scenario==="error"||scenario==="expired",error:scenario==="expired"?{status:401}:undefined,isLoading:scenario==="loading",isFetching:false,refetch:()=>{}};
 act(()=>tree.update(<Pricing/>));
 ok(!tree.root.findAllByType("section").some(n=>n.props["data-testid"]?.startsWith("section-pricing-")),"no leaked cards in "+scenario);
 if(scenario==="signed-out"||scenario==="expired")ok(tree.root.findAllByProps({"data-testid":"button-pricing-login"}).length===1,"sign-in action retained");
 if(scenario==="error")ok(tree.root.findAllByProps({"data-testid":"button-pricing-retry"}).length===1,"retry retained");
}
act(()=>tree.unmount());
console.log(checks+" pricing card and access-state checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"),
    jsx: "automatic", external: ["react", "react/jsx-runtime", "react-test-renderer"],
    plugins: [{ name: "pricing-stubs", setup(b) {
      b.onResolve({ filter: /^(@\/components\/(kit|art|section-link)|@workspace\/replit-auth-web|@workspace\/api-client-react)$/ }, a => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, a => ({ loader: "js", contents:
        a.path.endsWith("replit-auth-web") ? 'export const useAuth=()=>globalThis.pricingAuth;'
        : a.path.endsWith("api-client-react") ? 'export const useGetPricingGuide=()=>globalThis.pricingQuery;export const getGetPricingGuideQueryKey=()=>["pricing"];'
        : a.path.endsWith("/kit") ? 'import React from "react";export const PageHero=({children})=>React.createElement("header",null,children);export const Reveal=({children})=>React.createElement("div",null,children);'
        : a.path.endsWith("/section-link") ? 'import React from "react";export const SectionLink=({id,label})=>React.createElement("a",{href:"#"+id},label);'
        : 'export const LaneArt=()=>null;export const StateArt=()=>null;'
      }));
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
    }}], logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
