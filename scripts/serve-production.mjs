#!/usr/bin/env node
/**
 * Serve dist-web with the exact production headers from vercel.json.
 *
 * The static preview in the docs does not send these, so a CSP problem
 * would only appear in production. This server applies the real header
 * set so the strict policy can be exercised locally.
 *
 * Usage: node scripts/serve-production.mjs [port]
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const port = Number(process.argv[2] ?? 4318);
const root = join(process.cwd(), "dist-web");

const vercel = JSON.parse(await readFile(join(process.cwd(), "vercel.json"), "utf8"));

/**
 * Convert a Vercel path pattern into a regular expression.
 *
 * Vercel supports `:param` (one path segment) and `*` (any characters, often
 * written as `(.*)`). Both must be translated before the literal parts are
 * escaped -- escaping first would turn the wildcard's parentheses into
 * literals and the rule would never match.
 */
function vercelPathToRegex(source) {
  const parts = source.split("/").map((segment) => {
    if (segment === "*" || segment === "(.*)") return ".*";
    if (segment.startsWith("(") && segment.endsWith(")")) {
      const inner = segment.slice(1, -1);
      // "(.*)" and friends: keep the wildcard semantics.
      if (inner.includes("*")) return inner.replace(/\*/g, ".*");
    }
    if (segment.startsWith(":")) return "[^/]+";
    // Literal segment -- escape regex metacharacters.
    return segment.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  });
  return new RegExp("^" + parts.join("/") + "$");
}

/** Match the vercel.json header rules against a request path. */
function headersFor(pathname) {
  const out = [];
  for (const rule of vercel.headers ?? []) {
    if (vercelPathToRegex(rule.source).test(pathname)) out.push(...rule.headers);
  }
  return out;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  // Contain the served path inside dist-web.
  const target = join(root, normalize(pathname).replace(/^(\.\.[/\\])+/, ""));
  if (!target.startsWith(root)) {
    res.writeHead(403).end("forbidden");
    return;
  }

  // The Vercel insights script is served by the Vercel edge, not by the
  // application. Locally it does not exist and the request 404s, exactly as
  // it would in any non-Vercel deployment -- so the default local runtime
  // collects nothing and makes no analytics request at all.
  //
  // EIDOS_STUB_INSIGHTS=1 serves a minimal stand-in so the CSP check can
  // prove that the script element is permitted by script-src 'self' rather
  // than merely failing to load. It is opt-in because the stub is not the
  // real script and must never be mistaken for production behavior.
  if (process.env.EIDOS_STUB_INSIGHTS === "1" && pathname === "/_vercel/insights/script.js") {
    const stub = `window.__va_stub_loaded=true;`;
    const headers2 = {
      "Content-Type": "text/javascript; charset=utf-8",
      ...Object.fromEntries(headersFor(url.pathname).map((h) => [h.key, h.value])),
    };
    res.writeHead(200, headers2).end(stub);
    return;
  }

  let body;
  let file = target;
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, "index.html");
    body = await readFile(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("not found");
    return;
  }

  const headers = {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    ...Object.fromEntries(headersFor(url.pathname).map((h) => [h.key, h.value])),
  };
  res.writeHead(200, headers).end(body);
}).listen(port, "127.0.0.1", () => {
  console.log(`Eidos production preview with real headers on http://127.0.0.1:${port}`);
});
