import { readFile, writeFile } from "node:fs/promises";
import { ObjectStorageService } from "../src/lib/objectStorage.ts";
const storage = new ObjectStorageService();
const folder = "../../generated-artifacts/pitch-deck";
const manifestFile = `${folder}/storage-manifest.json`;
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestFile, "utf8")); } catch { /* First upload. */ }
for (const [filename, type] of [["zendesk-product-deep-dive.pdf", "application/pdf"], ...Array.from({ length: 13 }, (_, i) => [`slide-${35 + i}.jpg`, "image/jpeg"])]) {
  if (manifest[filename]) continue;
  const url = await storage.getObjectEntityUploadURL();
  const response = await fetch(url, { method: "PUT", headers: { "Content-Type": type }, body: await readFile(`${folder}/${filename}`) });
  if (!response.ok) throw new Error(`App Storage upload failed (${response.status})`);
  manifest[filename] = storage.normalizeObjectEntityPath(url);
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
}
console.log(JSON.stringify(manifest));
