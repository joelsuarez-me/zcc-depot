import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";

const sharp = createRequire(new URL("../../api-server/package.json", import.meta.url))("sharp");
const publicDir = new URL("../public/", import.meta.url);
const input = new URL("brand/zendesk-monochrome.png", publicDir);
const background = "#11110d";

// Keep the existing artwork intact and add a safe area for rounded frames.
await sharp(input.pathname)
  .extend({ top: 48, bottom: 48, left: 48, right: 48, background })
  .png()
  .toFile(new URL("brand/zendesk-monochrome-padded.png", publicDir).pathname);

async function icon(size) {
  const art = await sharp(input.pathname)
    .resize({ width: Math.round(size * 0.72), height: Math.round(size * 0.72), fit: "inside" })
    .png()
    .toBuffer();
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="white"/></svg>`);
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toBuffer()
    .then(buffer => sharp(buffer).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer());
}

for (const size of [32, 192]) {
  await writeFile(new URL(`favicon-zendesk-monochrome-padded-${size}.png`, publicDir), await icon(size));
}
await writeFile(new URL("apple-touch-icon-monochrome-padded.png", publicDir), await icon(180));

const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(icon));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header[entry] = size === 256 ? 0 : size;
  header[entry + 1] = size === 256 ? 0 : size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
});
const ico = Buffer.concat([header, ...images]);
await writeFile(new URL("favicon-zendesk-monochrome-padded.ico", publicDir), ico);
await writeFile(new URL("favicon.ico", publicDir), ico);
console.log("Generated padded header artwork and six-size favicon.");
