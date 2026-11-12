import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const source = "../../attached_assets/zendesk-image_1794507682517.png";
const out = "../zcc-depot/public";
const image = sharp(source);
const { data, info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
function bounds(symbolOnly) {
  let left = info.width, top = info.height, right = 0, bottom = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220 && (!symbolOnly || y < info.height * 0.56)) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  const padding = symbolOnly ? 22 : 12;
  return { left: left - padding, top: top - padding, width: right - left + 1 + padding * 2, height: bottom - top + 1 + padding * 2 };
}
await image.clone().extract(bounds(false)).png().toFile(`${out}/brand/zendesk-monochrome.png`);
const symbol = await image.clone().extract(bounds(true)).png().toBuffer();
const icons = await Promise.all([16, 32, 48, 180, 192].map(size => sharp(symbol).resize(size, size, { fit: "contain", background: "#11110D" }).png().toBuffer()));
await writeFile(`${out}/favicon-zendesk-monochrome-32.png`, icons[1]);
await writeFile(`${out}/favicon-zendesk-monochrome-192.png`, icons[4]);
await writeFile(`${out}/apple-touch-icon-monochrome.png`, icons[3]);
const directory = Buffer.alloc(6 + 3 * 16);
directory.writeUInt16LE(1, 2); directory.writeUInt16LE(3, 4);
let offset = directory.length;
for (let i = 0; i < 3; i++) {
  const start = 6 + i * 16, size = [16, 32, 48][i];
  directory[start] = size; directory[start + 1] = size;
  directory.writeUInt16LE(1, start + 4); directory.writeUInt16LE(32, start + 6);
  directory.writeUInt32LE(icons[i].length, start + 8); directory.writeUInt32LE(offset, start + 12);
  offset += icons[i].length;
}
const ico = Buffer.concat([directory, ...icons.slice(0, 3)]);
await writeFile(`${out}/favicon-zendesk-monochrome.ico`, ico);
await writeFile(`${out}/favicon.ico`, ico);
console.log("Prepared the uploaded header artwork and symbol-only favicons.");
