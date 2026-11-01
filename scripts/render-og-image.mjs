#!/usr/bin/env node
/**
 * Regenerate public/og-image.png from public/og-image.svg.
 *
 * The SVG is the source of truth for the social card; the PNG is the
 * rasterized copy served to crawlers. When the brand palette changes, the
 * SVG is edited and this script re-renders the PNG so the two never drift.
 *
 * Usage: node scripts/render-og-image.mjs
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const root = resolve(process.cwd());
const svgPath = join(root, "public", "og-image.svg");
const pngPath = join(root, "public", "og-image.png");

function resolveChromium() {
  if (process.env.EIDOS_CHROMIUM_PATH) return process.env.EIDOS_CHROMIUM_PATH;
  const cacheRoot =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    join(process.env.LOCALAPPDATA ?? homedir(), "ms-playwright");
  if (!existsSync(cacheRoot)) return undefined;
  for (const dir of readdirSync(cacheRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("chromium-"))
    .map((e) => e.name)
    .sort()
    .reverse()) {
    for (const rel of ["chrome-win64/chrome.exe", "chrome-win/chrome.exe"]) {
      const candidate = join(cacheRoot, dir, rel);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

if (!existsSync(svgPath)) {
  console.error(`Missing source SVG: ${svgPath}`);
  process.exit(1);
}

const browser = await chromium.launch({ executablePath: resolveChromium() });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

// Render the SVG alone, with no page chrome or default body margin.
await page.goto(`file://${svgPath.replace(/\\/g, "/")}`);
await page.evaluate(() => {
  // A standalone .svg document has no <body>, so the root <svg> is styled
  // directly rather than through body rules.
  const svg = document.querySelector("svg");
  if (svg) {
    svg.setAttribute("width", "1200");
    svg.setAttribute("height", "630");
    svg.style.display = "block";
  }
});
await page.waitForTimeout(300);

const raw = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

// Quantise to an 8-bit palette PNG. The card is flat-colour artwork, so 256
// colours is visually lossless here and keeps the published asset small --
// a truecolor render of the same artwork is roughly four times larger.
await sharp(raw)
  .png({ palette: true, colours: 256, compressionLevel: 9, effort: 10 })
  .toFile(pngPath);

const size = statSync(pngPath).size;
console.log(`Rendered ${pngPath} (${size} bytes) from ${svgPath}`);
