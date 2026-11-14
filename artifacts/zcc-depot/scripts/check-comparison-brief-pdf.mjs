import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("artifacts/zcc-depot");
const dir = await mkdtemp(resolve(root, "node_modules/.comparison-pdf-check-"));
try {
  await build({
    stdin: { resolveDir: root, loader: "ts", contents: `
import assert from "node:assert/strict";
import {createComparisonBriefPdf,comparisonBriefFilename} from "./src/lib/comparison-brief-pdf";
import {FIT_SIGNALS} from "./src/data/voice-comparison";
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++};
const date=new Date(2026,10,14,12);
ok(comparisonBriefFilename(date)==="Zendesk-Voice-vs-Contact-Center-Brief-2026-11-14.pdf","dated safe filename");
ok(comparisonBriefFilename(new Date(2027,0,2))==="Zendesk-Voice-vs-Contact-Center-Brief-2027-01-02.pdf","month and day padded");
for(let mask=0;mask<(1<<FIT_SIGNALS.length);mask++){
 const selected=FIT_SIGNALS.filter((_,i)=>mask&(1<<i)).map(signal=>signal.id);
 const doc=createComparisonBriefPdf(selected,date);
 ok(doc.getNumberOfPages()===2,"two-page summary for fit combination "+mask);
 if(mask===0||mask===127){
  const pdf=doc.output();
  for(const heading of ["SOLUTION BRIEF","Choose for the workflow","Compare the essentials","Fit guide snapshot","Discovery and next steps","Verify before a decision","Page 1 of 2","Page 2 of 2"]){
   ok(pdf.includes(heading),"PDF contains "+heading);
  }
  for(const url of ["https://www.zendesk.com/service/voice/","https://www.zendesk.com/service/contact-center/","https://www.zendesk.com/pricing/contact-center/"]){
   ok(pdf.includes(url),"clickable official source "+url);
  }
  ok(!/commission|40% discount|INTERNAL ONLY/i.test(pdf),"no restricted offers");
 }
}
console.log(checks+" comparison brief PDF checks passed");
` },
    bundle: true, platform: "node", format: "cjs", outfile: resolve(dir, "checks.cjs"), logLevel: "warning",
  });
  process.exitCode = spawnSync(process.execPath, [resolve(dir, "checks.cjs")], { cwd: root, stdio: "inherit" }).status ?? 1;
} finally { await rm(dir, { recursive: true, force: true }); }
