#!/usr/bin/env node
/**
 * Verify the app works under the exact production CSP.
 *
 * The strict policy has no 'unsafe-inline' and no 'unsafe-eval', which
 * means React's JIT feature detection (Function('')) throws and falls
 * back to the interpreter. That must degrade performance only -- never
 * break rendering or interaction.
 *
 * Usage: node scripts/verify-production-csp.mjs <baseUrl>
 */

import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4319";

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
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const cspViolations = [];
const pageErrors = [];

page.on("console", (msg) => {
  const text = msg.text();
  if (msg.type() === "error") consoleErrors.push(text);
  if (/Content Security Policy|Refused to/i.test(text)) cspViolations.push(text);
});
page.on("pageerror", (err) => pageErrors.push(err.message));

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail });
}

// 1. Load and render the catalog.
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForSelector(".record-card", { timeout: 20000 });
await page.waitForTimeout(600);

const cardCount = await page.locator(".record-card").count();
check("catalog renders cards", cardCount > 0, `${cardCount} cards`);

const heading = await page.locator("h1").innerText();
check("page has a heading", heading.length > 0, heading);

// 2. Search works (proves React event handlers survived the CSP).
await page.locator('input[type="search"], input[placeholder*="Search" i]').first().fill("NIST CSF");
await page.waitForTimeout(700);
const searchResults = await page.locator(".record-card").count();
check("search filters results", searchResults > 0 && searchResults < cardCount,
  `${searchResults} of ${cardCount} after searching "NIST CSF"`);

// 3. A record detail dialog opens (proves click handlers + focus trap work).
await page.locator(".record-title-button").first().click();
await page.waitForSelector(".detail-tabs", { timeout: 10000 });
await page.waitForTimeout(500);
const tabs = await page.locator("[data-record-section]").count();
check("record detail opens with tabs", tabs > 0, `${tabs} tabs`);

// 4. Tab switching works.
await page.locator('[data-record-section="source"]').click();
await page.waitForTimeout(500);
const sourcePanel = await page.locator("#record-panel-source").count();
check("detail tab switches", sourcePanel > 0, "source panel present");

// 5. The detail body actually has content (not an empty CSP-broken render).
const detailText = await page.locator(".detail-body").innerText();
check("detail body has content", detailText.trim().length > 100, `${detailText.trim().length} chars`);

// 6. No network calls at runtime (connect-src 'none' would block them anyway).
const external = await page.evaluate(() =>
  performance.getEntriesByType("resource")
    .map((e) => e.name)
    .filter((n) => !n.startsWith(location.origin)),
);
check("no external resource requests", external.length === 0, external.join(", ") || "none");

await browser.close();

console.log("CSP VERIFICATION\n");
for (const c of checks) {
  console.log(`  ${c.pass ? "PASS" : "FAIL"}  ${c.name} -- ${c.detail}`);
}
console.log(`\nCSP violations: ${cspViolations.length ? cspViolations.join(" | ") : "none"}`);
console.log(`Page errors:    ${pageErrors.length ? pageErrors.join(" | ") : "none"}`);
console.log(`Console errors: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);

const failed = checks.filter((c) => !c.pass).length;
if (failed > 0 || cspViolations.length > 0 || pageErrors.length > 0) {
  console.error(`\n${failed} functional check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll checks passed under the production CSP.");
}
