import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.compete-pdf-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "ts", contents: `
import assert from "node:assert/strict";
import {writeFileSync} from "node:fs";
import {competeBriefContent,createCompeteBriefPdf,competeBriefFilename} from "./src/lib/compete-brief-pdf";
import {competeFive9} from "../api-server/src/lib/competeFive9";
import {briefTopicVisual} from "./src/lib/brief-pdf-illustration";
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const date=new Date(2026,10,15,12),url="https://example.test/resources/compete/five9";
ok(competeBriefFilename("Five9",date)==="ZCC-Brief-Zendesk-vs-Five9-2026-11-15.pdf","safe dated PDF filename");
const content=competeBriefContent(competeFive9,url);
ok(content.internal,"internal classification retained");
ok(!content.interactive,"full export not selected-tab snapshot");
ok(content.sources.length===competeFive9.sources.length,"all sources retained");
for(const theme of competeFive9.themes){
 ok(content.blocks.some(b=>b.kind==="heading"&&b.text===theme.title),"all themes included: "+theme.id);
 ok(content.blocks.some(b=>b.kind==="table"&&b.rows.some(r=>r.includes(theme.zendesk)&&r.includes(theme.five9))),"comparison included: "+theme.id);
}
for(const objection of competeFive9.objections)ok(content.blocks.some(b=>"text" in b&&b.text===objection.response),"collapsed objection included: "+objection.id);
for(const qualification of competeFive9.guardrails)ok(content.qualifications.includes(qualification),"qualification retained");
ok(briefTopicVisual(content.title,content.page).key==="comparison","topic-aligned illustration");
const doc=createCompeteBriefPdf(competeFive9,url,date),pdf=doc.output();
ok(doc.getNumberOfPages()>=3&&doc.getNumberOfPages()<20,"complete readable brief is paginated");
for(const text of ["COMPETITIVE BRIEF","CONCEPT ILLUSTRATION","SOURCE NOTES","Objection responses","Important qualifications"])ok(pdf.includes(text),"executive format: "+text);
ok(!pdf.includes("Continue exploring"),"no removed exploring section");
for(const source of competeFive9.sources)ok(pdf.includes(source.url),"clickable source: "+source.id);
writeFileSync("/tmp/zcc-five9-competitive-brief.pdf",Buffer.from(doc.output("arraybuffer")));
console.log(checks+" Compete PDF format and completeness checks passed ("+doc.getNumberOfPages()+" pages)");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"), logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit", timeout: 30000 }).status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
