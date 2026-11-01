import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const url = process.argv[2];
const out = process.argv[3] ?? "test-results/live-deployment.png";
if (!url) {
  console.error("usage: node scripts/shoot-live.mjs <url> [outPath]");
  process.exit(1);
}

async function resolveChromium() {
  if (process.env.EIDOS_CHROMIUM_PATH) return process.env.EIDOS_CHROMIUM_PATH;
  const cacheRoot =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    join(process.env.LOCALAPPDATA ?? homedir(), "ms-playwright");
  if (!existsSync(cacheRoot)) return undefined;
  const entries = await readdir(cacheRoot, { withFileTypes: true });
  for (const dir of entries
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

const browser = await chromium.launch({ executablePath: await resolveChromium() });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".record-card", { timeout: 20000 });
await page.waitForTimeout(800);

const cards = await page.locator(".record-card").count();
await page.screenshot({ path: out });
console.log(`cards=${cards}`);
console.log(`console errors: ${errors.length ? errors.join(" | ") : "none"}`);
console.log(`saved ${out}`);

await browser.close();
