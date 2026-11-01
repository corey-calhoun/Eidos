#!/usr/bin/env node
/**
 * Eidos portfolio screenshot capture.
 *
 * Drives the production static build in a real browser and captures the
 * screens used on the Digital Sentry portfolio page. Runs against the
 * built dist-web output served over HTTP -- never the dev server -- so
 * what is captured is what ships.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs <baseUrl> <outputDir>
 */

import { chromium } from "playwright";
import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4318";
const outputDir = process.argv[3] ?? "test-results/portfolio";

/**
 * Resolve a usable Chromium.
 *
 * Playwright's pinned browser revision may not be downloaded in this
 * environment. Any recent chromium-* build in the local Playwright cache
 * is fine for screenshots, so prefer one over failing on a missing revision.
 */
async function resolveChromium() {
  if (process.env.EIDOS_CHROMIUM_PATH) return process.env.EIDOS_CHROMIUM_PATH;

  const cacheRoot =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    join(process.env.LOCALAPPDATA ?? homedir(), "ms-playwright");

  if (!existsSync(cacheRoot)) return undefined;

  const entries = await readdir(cacheRoot, { withFileTypes: true });
  const chromiumDirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith("chromium-"))
    .map((e) => e.name)
    .sort()
    .reverse();

  for (const dir of chromiumDirs) {
    for (const rel of [
      "chrome-win64/chrome.exe",
      "chrome-win/chrome.exe",
      "chrome-linux/chrome",
      "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ]) {
      const candidate = join(cacheRoot, dir, rel);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** Wait until the catalog has actually rendered cards. */
async function waitForCatalog(page) {
  await page.waitForSelector(".record-card, .workspace-intro", { timeout: 20000 });
  await page.waitForTimeout(400);
}

/** Open a record detail dialog and wait for its tabs. */
async function openRecord(page, slug) {
  await page.goto(`${baseUrl}/?record=${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".detail-tabs", { timeout: 20000 });
  await page.waitForTimeout(400);
}

/** Click a record detail tab by its data-record-section value. */
async function selectTab(page, sectionId) {
  const tab = page.locator(`[data-record-section="${sectionId}"]`);
  if ((await tab.count()) === 0) return false;
  await tab.first().click();
  await page.waitForTimeout(450);
  return true;
}

const shots = [
  {
    name: "01-library-front-door",
    description: "Catalog front door: search, industry/topic/type facets, reference cards.",
    viewport: DESKTOP,
    async run(page) {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await waitForCatalog(page);
    },
  },
  {
    name: "02-record-detail-overview",
    description: "Record detail: plain-English summary, authority badge, metadata.",
    viewport: DESKTOP,
    async run(page) {
      await openRecord(page, "nist-csf-2-0");
      await selectTab(page, "overview");
    },
  },
  {
    name: "03-policy-playbook",
    description: "Policy Playbook tab: tailoring decisions, implementation, starter checklist.",
    viewport: DESKTOP,
    async run(page) {
      await openRecord(page, "information-security-governance-policy");
      const opened = await selectTab(page, "playbook");
      if (!opened) throw new Error("policy playbook tab not present for information-security-governance-policy");
      // Expand the playbook's collapsed sections so the shot shows substance
      // rather than an empty panel.
      const sections = page.locator(".detail-body details");
      const count = await sections.count();
      for (let i = 0; i < count; i++) {
        const section = sections.nth(i);
        if (!(await section.evaluate((el) => el.open))) {
          await section.locator("summary").click();
          await page.waitForTimeout(150);
        }
      }
      await page.waitForTimeout(400);
    },
  },
  {
    name: "04-source-and-trust",
    description: "Source & trust tab: publisher, version, jurisdiction, official source.",
    viewport: DESKTOP,
    async run(page) {
      await openRecord(page, "nist-csf-2-0");
      const opened = await selectTab(page, "source");
      if (!opened) throw new Error("source tab not present");
    },
  },
  {
    name: "05-industry-filtering",
    description: "Industry context filtering: Defense/DoD with direct-match explanation.",
    viewport: DESKTOP,
    async run(page) {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await waitForCatalog(page);
      // Industry filters live inside a collapsed <details> disclosure.
      const group = page.locator(".industry-filter");
      if ((await group.count()) > 0) {
        const details = group.first();
        if (!(await details.evaluate((el) => el.open))) {
          await details.locator("summary").click();
          await page.waitForTimeout(300);
        }
      }
      const defense = page.locator(".industry-options button", { hasText: /defense/i }).first();
      if ((await defense.count()) === 0) throw new Error("defense industry control not found");
      await defense.click();
      await page.waitForTimeout(700);
    },
  },
  {
    name: "06-comparison",
    description: "Side-by-side comparison of two selected references.",
    viewport: DESKTOP,
    async run(page) {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await waitForCatalog(page);
      const boxes = page.locator(".compare-check input[type=checkbox]");
      const count = await boxes.count();
      if (count < 2) throw new Error(`expected at least 2 comparable records, found ${count}`);
      await boxes.nth(0).click();
      await page.waitForTimeout(200);
      await boxes.nth(1).click();
      await page.waitForTimeout(500);
      const open = page.locator(".comparison-bar button", { hasText: /^compare/i }).first();
      if ((await open.count()) === 0) throw new Error("compare action not found in comparison bar");
      await open.click();
      await page.waitForTimeout(800);
    },
  },
  {
    name: "07-mobile-library",
    description: "Mobile library view at 390px with the Refine disclosure.",
    viewport: MOBILE,
    async run(page) {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await waitForCatalog(page);
    },
  },
  {
    name: "08-mobile-record-detail",
    description: "Mobile record detail at 390px.",
    viewport: MOBILE,
    async run(page) {
      await openRecord(page, "nist-csf-2-0");
      await selectTab(page, "overview");
    },
  },
];

const errors = [];

const browser = await chromium.launch({
  executablePath: await resolveChromium(),
});
await mkdir(outputDir, { recursive: true });

for (const shot of shots) {
  const context = await browser.newContext({
    viewport: shot.viewport,
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`${shot.name}: console ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`${shot.name}: pageerror ${err.message}`));

  try {
    await shot.run(page);
    const path = join(outputDir, `${shot.name}.png`);
    await page.screenshot({ path, fullPage: false });
    console.log(`captured ${shot.name} -> ${path}`);
  } catch (error) {
    errors.push(`${shot.name}: ${error.message}`);
    console.error(`FAILED ${shot.name}: ${error.message}`);
  }
  await context.close();
}

await browser.close();

if (errors.length > 0) {
  console.error("\nCapture errors:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${shots.length} screenshots captured with no console or page errors.`);
}
