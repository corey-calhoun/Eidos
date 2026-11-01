
import sharp from "sharp";
import { readdir, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";

const src = process.argv[2];
const dst = process.argv[3];
const MAX_W = 1920;

await mkdir(dst, { recursive: true });

const files = (await readdir(src)).filter((f) => f.endsWith(".png")).sort();
let before = 0, after = 0;

for (const f of files) {
  const s = join(src, f);
  const d = join(dst, f);
  const b = (await stat(s)).size;
  await sharp(s)
    .resize({ width: MAX_W, withoutEnlargement: true })
    .png({ palette: true, colours: 256, compressionLevel: 9, effort: 10 })
    .toFile(d);
  const a = (await stat(d)).size;
  before += b; after += a;
  console.log(`  ${f.padEnd(34)} ${String(b).padStart(7)} -> ${String(a).padStart(7)} bytes`);
}
console.log(`\n  total ${before} -> ${after} bytes`);
