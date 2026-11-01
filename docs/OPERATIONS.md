# Eidos Local Operations

This runbook covers the active catalog-first, local-only Eidos runtime. It does not authorize or describe production deployment, remote access, LAN exposure, tunneling, or multi-user operation.

## Runtime topology

| Process | Command | Listen address |
|---|---|---|
| Fastify API (development) | `npm run dev:api` | `127.0.0.1:4317` |
| Vite web UI (development) | `npm run dev:web` | `127.0.0.1:4173` |
| Compiled API | `npm run start:api` after `npm run build` | `127.0.0.1:4317` |
| Compiled UI preview | `npm run start:web` after `npm run build` | `127.0.0.1:4173` |

The API and web UI are separate loopback-only processes. The built-in catalog works without an external database, account, telemetry service, AI service, or Internet connection.

## Prerequisites

- Node.js 24 or newer
- npm
- A modern browser

Run commands from:

```bash
cd "E:/Coding Projects/Eidos"
```

Install the locked dependency tree:

```bash
npm ci
```

## Development startup

Start the API in terminal 1:

```bash
npm run dev:api
```

Wait for:

```text
Eidos API listening at http://127.0.0.1:4317
```

Start the UI in terminal 2:

```bash
npm run dev:web
```

Open <http://127.0.0.1:4173>.

The first screen should show the Eidos governance reference library with local search, browse/filter controls, and reference cards.

## Compiled local startup

Build and verify before starting compiled processes:

```bash
npm run accept
```

Then start the compiled API and UI preview in separate terminals:

```bash
npm run start:api
```

```bash
npm run start:web
```

Open <http://127.0.0.1:4173>.

A successful compiled preview is local release evidence only. It is not a production deployment.

## Shutdown

1. Stop using the UI.
2. Press `Ctrl+C` in the web terminal.
3. Press `Ctrl+C` in the API terminal.
4. Verify both listeners are closed:

```bash
netstat -ano | grep -E ':(4173|4317)' | grep LISTENING
```

No output means neither Eidos listener remains active.

If a listener remains:

1. Record the PID from the `LISTENING` row.
2. Confirm its command line belongs to `E:\Coding Projects\Eidos` using Task Manager or Windows process inspection.
3. Terminate only that confirmed Eidos process.
4. Run the listener check again.

Do not bulk-terminate all `node.exe` processes; other projects may be running.

## Runtime checks

With the API running:

```bash
curl -fsS http://127.0.0.1:4317/health
curl -fsS http://127.0.0.1:4317/api/catalog
```

Expected health response:

```json
{"status":"ok","service":"eidos-api"}
```

Representative catalog checks:

```bash
curl -fsS "http://127.0.0.1:4317/api/catalog?q=NIST"
curl -fsS "http://127.0.0.1:4317/api/catalog?type=framework&status=current"
curl -fsS "http://127.0.0.1:4317/api/catalog?industry=defense-industrial-base"
curl -fsS http://127.0.0.1:4317/api/catalog/nist-csf-2-0
```

Use slugs returned by `/api/catalog` rather than inventing record identifiers.

### Defensive boundary checks

Host rejection:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: attacker.example' http://127.0.0.1:4317/api/catalog
```

Expected status: `421`.

Origin rejection:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Origin: https://attacker.example' http://127.0.0.1:4317/api/catalog
```

Expected status: `403`.

Unknown query fields and unsupported filter values must return `400`. Unknown record slugs must return `404`.

## Repository acceptance

Run the complete gate:

```bash
npm run accept
```

This executes, in order:

1. Browser and server TypeScript checks.
2. All Vitest tests.
3. Production web and server builds.
4. Production dependency audit at high severity.

Individual commands:

```bash
npm run typecheck
npm test
npm run build
npm run audit
```

After browser-facing changes, verify the exact freshly built asset in a production preview. A healthy response from a stale Vite process is not current-tree evidence.

## Normal catalog data behavior

- The active catalog is deterministic, validated, and built into the application.
- Normal catalog startup does not initialize SQLite.
- Search, filtering, comparison selection, open-record history, detail tabs, and scroll context are local UI state.
- Eidos does not store organizational completion, evidence, owners, due dates, findings, gaps, readiness, maturity, or compliance status.
- Publisher/source/version/provenance fields are reference metadata and trust anchors; do not replace them with inferred claims.

## Historical assessment compatibility

The preserved assessment-graph code and regression coverage are historical implementation ancestry, not the active product workflow.

- Normal `npm run start:api` leaves assessment, assurance-export, and analysis-proposal routes disabled.
- Historical tests may opt in with `buildServer({ enableLegacyAssessmentApi: true })`.
- Do not create, copy, restore, or operate an assessment SQLite database as part of normal catalog startup.
- Where older architecture, data-model, API, visual, or test documents conflict with the catalog-first product, `README.md`, `docs/PRODUCT_BRIEF.md`, `docs/ACCEPTANCE.md`, and the current implementation take precedence.

## Troubleshooting

### Port 4173 or 4317 is already in use

```bash
netstat -ano | grep -E ':(4173|4317)'
```

Identify the `LISTENING` PID and confirm ownership before stopping it. Both ports are fixed in the current local configuration; changing only a CLI port can break the API URL or Host/Origin restrictions.

### The UI opens but data is unexpected

- Confirm the browser URL is exactly `http://127.0.0.1:4173` or `http://localhost:4173`.
- Confirm the API health endpoint responds on 4317 when testing API-backed behavior.
- Run `npm run build` and confirm the preview HTML references the newly generated hashed JavaScript asset.
- Hard-refresh the browser after rebuilding.
- Run `npm run accept` before treating the current tree as verified.

### Build succeeds but no page appears on port 4317

This is expected. Port 4317 serves the API, not the web application. Start `npm run start:web` separately and open port 4173.

### A catalog request returns 400

The API validates query names and values strictly. Check `q`, `type`, `status`, and comma-separated `industry` parameters. Unsupported, duplicate, empty, or unknown values fail closed.

### A record link returns 404

Use the exact public slug returned by `/api/catalog`. Unknown or obsolete slugs intentionally produce a safe not-found response.

## Production deployment

Eidos deploys as a **static site**. `dist-web/` is the entire artifact.

Why static: the web client in `src/web/` makes no runtime network calls. The
catalog is compiled into the JavaScript bundle, so the browser needs only the
HTML, one JS file, and one CSS file. There is no database, no session, no
server-side rendering, and no API dependency in the published product.

```bash
npm ci
npm run accept      # typecheck, tests, both builds, dependency audit
npm run build:web   # -> dist-web/
```

`vercel.json` in the repository root declares the build command, the output
directory (`dist-web`), and the production response headers. Deploy by
connecting the repository to a static host and letting it run `npm run build:web`,
or by uploading `dist-web/` directly to any static host.

### What is deployed

- `dist-web/index.html`
- `dist-web/assets/*` — content-hashed JS and CSS
- `dist-web/favicon.svg`, `og-image.png`, `og-image.svg`, `robots.txt`, `sitemap.xml`

### What is never deployed

- The Fastify API and all its routes.
- `local-data/`, SQLite databases, evidence, exports, uploads — excluded by
  `.gitignore` and `vercelignore`, and not part of the build output.
- Environment files, credentials, or secrets. None exist in the repository,
  and the built bundle was verified to contain no filesystem paths, API
  endpoints, or secret-shaped strings.

### Response headers

Configured in `vercel.json`. The CSP is the strictest useful form for this
bundle: no inline scripts, no inline styles, no external fonts, and no runtime
network access, so `connect-src 'none'` and `default-src 'none'` are accurate
rather than aspirational. The browser enforces them.

### The API is not part of the deployment

`src/server/` remains a local development and integration surface. Its
Host/Origin allowlist, loopback binding, 64 KiB body limit, and defensive
headers are unchanged by deploying the static site. Do not relax them to make
the API reachable in production — the deployed product does not call it.

### Local runtime remains local

The local API and UI still bind to `127.0.0.1` only. Run them with
`npm run start:api` and `npm run start:web` for local work; stop them with
`Ctrl+C` and verify the listeners are closed as described above.

### Screenshots

Portfolio screenshots are captured from the production build, not the dev
server:

```bash
npm run build:web
npx serve -l 4318 dist-web          # or any static server
node scripts/capture-screenshots.mjs http://127.0.0.1:4318 test-results/portfolio
```

The capture fails loudly if a screen cannot be reached or if the browser logs
a console or page error, so a broken screenshot is a failed run rather than a
silent bad asset.

## Not production-safe

The **API** is not production-safe and must not be published. The following
remain true for any hosted or multi-user use of the API:

- authentication and authorization;
- tenant/workspace isolation;
- hosted secrets management and encryption architecture;
- TLS and hardened deployment configuration;
- production service supervision, monitoring, alerting, and rate limiting;
- collaborative persistence, migrations, backups, and restore tooling.

The published static site does not use the API, has no user data, stores no
state, and requires none of the above. Publishing the static site does not
change any of these API limitations — it sidesteps them entirely.
