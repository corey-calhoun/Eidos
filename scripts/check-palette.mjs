#!/usr/bin/env node
/**
 * Validate a candidate Eidos palette for WCAG contrast.
 *
 * The palette lives in src/web/styles.css as custom properties, but several
 * rules hard-code derived colors. This script models the palette the way the
 * browser will actually paint it:
 *
 *   - plain colors against the surface they sit on
 *   - alpha colors composited over that surface
 *   - color-mix(in srgb, X N%, transparent) badges over the card surface
 *
 * Usage: node scripts/check-palette.mjs
 */

const srgb = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function hexToRgb(hex) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite a foreground hex at `alpha` over a background hex. */
function over(fgHex, alpha, bgHex) {
  const f = hexToRgb(fgHex);
  const b = hexToRgb(bgHex);
  const mix = (x, y) => Math.round(x * alpha + y * (1 - alpha));
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(f.r, b.r))}${toHex(mix(f.g, b.g))}${toHex(mix(f.b, b.b))}`;
}

/**
 * color-mix(in srgb, accent P%, transparent) over `bg`.
 * Mixing with transparent in srgb yields the accent at P% alpha.
 */
function mixTransparent(accentHex, pct, bgHex) {
  return over(accentHex, pct / 100, bgHex);
}

// ---------------------------------------------------------------------------
// Candidate palette
// ---------------------------------------------------------------------------

const P = {
  // Surfaces — warm dark grey / black
  canvas: "#0b0a09",
  panel: "#131110",
  surface: "#1a1715",
  surfaceRaised: "#221e1b",

  // Text — warm white and warm greys
  text: "#f7f5f2",
  textSecondary: "#c9c3bb",
  muted: "#a49c92",
  quiet: "#928779",

  // Accent — amber
  accent: "#d99436",
  accentHover: "#eaa646",
  onAccent: "#1c1305", // dark text on amber fills

  // Type badges — warm earth ramp
  badge: {
    framework: "#d9a441",
    regulation: "#c9773f",
    standard: "#b8894a",
    control_catalog: "#d6b06a",
    policy: "#c47d3e",
    control: "#93964f",
    concept: "#a89f8d",
    law: "#c98a72",
    contract_clause: "#d0a878",
    guidance: "#b9864f",
    criteria: "#c2ac72",
    knowledge_base: "#9b948a",
  },
};

// ---------------------------------------------------------------------------
// Surfaces each color is painted on
// ---------------------------------------------------------------------------

const CARD = P.surface;          // .record-card background is accent-tinted white alpha over canvas
const TOOLBAR = over("#ffffff", 0.012, P.canvas);

const checks = [];
function req(label, fg, bg, min, note = "") {
  const ratio = contrast(fg, bg);
  checks.push({ label, fg, bg, min, ratio, note, pass: ratio >= min });
}

// --- Primary text on each surface ---
req("text on canvas", P.text, P.canvas, 4.5);
req("text on panel", P.text, P.panel, 4.5);
req("text on surface", P.text, P.surface, 4.5);
req("text on surface-raised", P.text, P.surfaceRaised, 4.5);

req("text-secondary on canvas", P.textSecondary, P.canvas, 4.5);
req("text-secondary on panel", P.textSecondary, P.panel, 4.5);
req("text-secondary on surface", P.textSecondary, P.surface, 4.5);
req("text-secondary on surface-raised", P.textSecondary, P.surfaceRaised, 4.5);

req("muted on canvas", P.muted, P.canvas, 4.5);
req("muted on panel", P.muted, P.panel, 4.5);
req("muted on surface", P.muted, P.surface, 4.5);
req("muted on surface-raised", P.muted, P.surfaceRaised, 4.5);

// `quiet` is 9px muted metadata — hold it to the same 4.5 as body text.
req("quiet on canvas", P.quiet, P.canvas, 4.5);
req("quiet on panel", P.quiet, P.panel, 4.5);
req("quiet on surface", P.quiet, P.surface, 4.5);
req("quiet on surface-raised", P.quiet, P.surfaceRaised, 4.5);

// --- Accent used as text ---
req("accent on canvas", P.accent, P.canvas, 4.5);
req("accent on panel", P.accent, P.panel, 4.5);
req("accent on surface", P.accent, P.surface, 4.5);
req("accent on surface-raised", P.accent, P.surfaceRaised, 4.5);
req("accent-hover on canvas", P.accentHover, P.canvas, 4.5);
req("accent-hover on surface", P.accentHover, P.surface, 4.5);

// --- Accent used as a fill with dark text on top ---
req("on-accent text on accent fill", P.onAccent, P.accent, 4.5);
req("on-accent text on accent-hover fill", P.onAccent, P.accentHover, 4.5);

// --- Accent-soft surface (accent at 12% over the surface) with accent text ---
const soft = mixTransparent(P.accent, 12, P.surface);
req("accent on accent-soft surface", P.accent, soft, 4.5);

// --- Active filter chips: accent-soft over surface, accent text ---
const chipBg = mixTransparent(P.accent, 12, P.canvas);
req("accent on active chip", P.accent, chipBg, 4.5);

// --- The rail legal notice ---
// It is 9px text on the filter rail, whose background is rgba(19,17,16,.82)
// composited over the canvas. Model that composition rather than guessing.
const railBg = over("#131110", 0.82, P.canvas);
req("quiet on filter rail", P.quiet, railBg, 4.5, "rail legal notice");

// --- Type badges: accent text on a 9% tint of itself over the card ---
for (const [name, hex] of Object.entries(P.badge)) {
  const badgeBg = mixTransparent(hex, 9, CARD);
  req(`badge ${name} on its tint`, hex, badgeBg, 4.5);
}

// --- Type badges as text directly on the card (comparison panel headings) ---
for (const [name, hex] of Object.entries(P.badge)) {
  req(`badge ${name} on card`, hex, CARD, 4.5);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const failures = checks.filter((c) => !c.pass);
const groups = new Map();
for (const c of checks) {
  const key = c.label.split(" on ")[0];
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(c);
}

console.log("PALETTE CONTRAST CHECK\n");
for (const [key, list] of groups) {
  const worst = list.reduce((a, b) => (a.ratio < b.ratio ? a : b));
  const mark = list.every((c) => c.pass) ? "PASS" : "FAIL";
  console.log(
    `  ${mark}  ${key.padEnd(34)} worst ${worst.ratio.toFixed(2)}:1 (needs ${worst.min}:1)`,
  );
}

if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) {
    console.log(
      `  ${f.label} — ${f.ratio.toFixed(2)}:1 < ${f.min}:1  (${f.fg} on ${f.bg})`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(`\nAll ${checks.length} contrast checks pass.`);
}
