#!/usr/bin/env node
/**
 * Verify Vercel Analytics loads and beacons under the production CSP.
 *
 * The strict CSP has no 'unsafe-inline' and no 'unsafe-eval', and the
 * analytics script is injected as a same-origin <script src>. This checks
 * that the CSP actually permits it, rather than assuming.
 *
 * Start the server with EIDOS_STUB_INSIGHTS=1 so the insights path serves a
 * stand-in script instead of 404ing -- that is what lets this check prove
 * the script is ALLOWED by the policy rather than simply absent.
 *
 * Usage: EIDOS_STUB_INSIGHTS=1 node scripts/serve-production.mjs <port>
 *        node scripts/verify-analytics.mjs <baseUrl>
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

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail });
}

const browser = await chromium.launch({ executablePath: await resolveChromium() });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const cspViolations = [];
const consoleErrors = [];
const pageErrors = [];
const requests = [];

page.on("console", (m) => {
  const t = m.text();
  if (/Content Security Policy|Refused to/i.test(t)) cspViolations.push(t);
  if (m.type() === "error" && !/favicon/i.test(t)) consoleErrors.push(t);
});
page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("request", (r) => requests.push(r.url()));
page.on("requestfailed", (r) =>
  consoleErrors.push(`request failed: ${r.url()} (${r.failure()?.errorText})`),
);

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForSelector(".record-card", { timeout: 20000 });
await page.waitForTimeout(2500);

// 1. The analytics <script> element was injected.
const scriptSrc = await page.evaluate(() => {
  const el = document.querySelector('script[src*="insights"]');
  return el ? el.getAttribute("src") : null;
});
check("analytics script element injected", scriptSrc !== null, scriptSrc ?? "not found");
check(
  "analytics script is same-origin",
  scriptSrc !== null && scriptSrc.startsWith("/"),
  scriptSrc ?? "-",
);

// 2. It actually loaded (not blocked by CSP).
const loaded = await page.evaluate(() => window.__va_stub_loaded === true);
check("analytics script loaded (not CSP-blocked)", loaded, loaded ? "executed" : "did not execute");

// 3. The window.va queue was initialized.
const queueReady = await page.evaluate(() => typeof window.va === "function");
check("window.va queue initialized", queueReady, queueReady ? "function" : "missing");

// 4. It did NOT go to a third-party origin.
const external = requests.filter(
  (u) => !u.startsWith(baseUrl) && !u.startsWith("http://127.0.0.1") && !u.startsWith("https://127.0.0.1"),
);
check(
  "no third-party requests",
  external.length === 0,
  external.length ? external.join(", ") : "none",
);

// 5. The app still works.
const cards = await page.locator(".record-card").count();
check("catalog still renders", cards > 0, `${cards} cards`);

await browser.close();

console.log("ANALYTICS + CSP VERIFICATION\n");
for (const c of checks) {
  console.log(`  ${c.pass ? "PASS" : "FAIL"}  ${c.name} -- ${c.detail}`);
}
console.log(`\nCSP violations: ${cspViolations.length ? cspViolations.join(" | ") : "none"}`);
console.log(`Page errors:    ${pageErrors.length ? pageErrors.join(" | ") : "none"}`);
console.log(`Console errors: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);

const failed = checks.filter((c) => !c.pass).length;
if (failed > 0 || cspViolations.length > 0 || pageErrors.length > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll analytics checks passed under the production CSP.");
}
