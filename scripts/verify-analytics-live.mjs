#!/usr/bin/env node
/**
 * Verify Vercel Analytics works end-to-end on a LIVE Vercel deployment.
 *
 * This is the production counterpart to verify-analytics.mjs: it proves the
 * real /_vercel/insights/script.js loads, that it is permitted by the
 * published CSP, that it beacons to a same-origin endpoint, and that no
 * request leaves the site's origin.
 *
 * Usage: node scripts/verify-analytics-live.mjs <baseUrl>
 */

import { chromium } from "playwright";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const baseUrl = (process.argv[2] ?? "https://snappy-carbon-rdesgug-digitalsentry.vercel.app").replace(/\/$/, "");

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

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });

const origin = new URL(baseUrl).origin;
const browser = await chromium.launch({ executablePath: resolveChromium() });

// Vercel's insights script deliberately refuses to run under automation:
// it checks `navigator.webdriver` and a "Headless" user-agent token and
// returns early. That is correct bot filtering, not a broken beacon --
// but it means an automated check must present as an ordinary browser.
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
});
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
});
const page = await context.newPage();

const cspViolations = [];
const consoleErrors = [];
const pageErrors = [];
const requests = [];
const responses = [];

page.on("console", (m) => {
  const t = m.text();
  if (/Content Security Policy|Refused to/i.test(t)) cspViolations.push(t);
  if (m.type() === "error" && !/favicon/i.test(t)) consoleErrors.push(t);
});
page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("request", (r) => requests.push({ url: r.url(), method: r.method() }));
page.on("response", (r) => responses.push({ url: r.url(), status: r.status() }));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForSelector(".record-card", { timeout: 25000 });
// Give the insights script time to load and flush its first beacon.
await page.waitForTimeout(4000);

const scriptSrc = await page.evaluate(() => {
  const el = document.querySelector('script[src*="insights"]');
  return el ? el.getAttribute("src") : null;
});
check("insights <script> injected", scriptSrc !== null, scriptSrc ?? "not found");
check("insights script is same-origin", scriptSrc !== null && scriptSrc.startsWith("/"), scriptSrc ?? "-");

const scriptResponse = responses.find((r) => r.url.includes("/_vercel/insights/script.js"));
check(
  "insights script fetched successfully",
  scriptResponse?.status === 200,
  scriptResponse ? `HTTP ${scriptResponse.status}` : "no request seen",
);

// The beacon: a POST to /_vercel/insights/view
const beacons = requests.filter(
  (r) => r.url.includes("/_vercel/insights/") && r.method === "POST",
);
check("beacon POST issued", beacons.length > 0, beacons.length ? beacons[0].url : "none seen");

// Nothing left the origin.
const external = requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith("data:"));
check(
  "no cross-origin requests",
  external.length === 0,
  external.length ? external.map((r) => r.url).join(", ") : "none",
);

const cards = await page.locator(".record-card").count();
check("catalog renders", cards > 0, `${cards} cards`);

await browser.close();

console.log(`LIVE ANALYTICS VERIFICATION — ${baseUrl}\n`);
for (const c of checks) {
  console.log(`  ${c.pass ? "PASS" : "FAIL"}  ${c.name} -- ${c.detail}`);
}
console.log(`\nCSP violations: ${cspViolations.length ? cspViolations.join(" | ") : "none"}`);
console.log(`Page errors:    ${pageErrors.length ? pageErrors.join(" | ") : "none"}`);
console.log(`Console errors: ${consoleErrors.length ? consoleErrors.join(" | ") : "none"}`);

if (checks.some((c) => !c.pass) || cspViolations.length || pageErrors.length) {
  console.error("\nFAILED");
  process.exitCode = 1;
} else {
  console.log("\nLive analytics verified against the published CSP.");
}
