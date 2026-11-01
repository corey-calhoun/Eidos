# Production Security Review — Eidos (Static Deployment)

**Review type:** Independent security review for a static-only production deployment
**Subject:** Eidos `corey-calhoun/Eidos` at commit `8a01c18`
**Date:** 2026-10-31
**Reviewer:** Independent reviewer (delegated agent), findings reconciled and re-verified by the implementing agent
**Deployment reviewed:** Static files on a CDN host (Vercel). The Fastify API is **not** published.

---

## Verdict

**APPROVED FOR STATIC PRODUCTION**, subject to the conditions in section 6.

The reviewed deployment is a set of static files with no server-side attack surface, no
database, no session, no user data, and no runtime network access. The only data it
publishes is curated public reference material. Every mutation vector the original
local-only design guarded against is absent from this deployment shape.

This approval covers the **static deployment only**. It does not authorize publishing
the API.

---

## 1. Scope

### What was reviewed

| Area | Method |
|---|---|
| Repository source | Read in full: `AGENTS.md`, `README.md`, `docs/SECURITY_REQUIREMENTS.md`, `docs/THREAT_MODEL.md`, `docs/OPERATIONS.md`, `docs/PRODUCT_BRIEF.md`, `docs/ACCEPTANCE.md` |
| Published artifact | `dist-web/` inspected directly — 8 files, 595 KB total |
| Catalog content | `src/domain/catalog.ts`, `src/domain/catalog-content/*.ts` — copyright treatment, content markers, publisher authority |
| Server boundary | `src/server/app.ts`, `src/server/config.ts`, `src/server/storage.ts` — Host/Origin enforcement, headers, body limits, legacy route gating |
| Web client | `src/web/App.tsx`, `src/web/catalog-view-model.ts`, `src/web/styles.css` — injection surface, external references, storage use |
| Deployment config | `vercel.json`, `.vercelignore`, `index.html`, `vite.config.ts`, `package.json` |
| Dependency posture | `npm audit` (prod and full), `npm ls`, `npm sbom` (CycloneDX 1.5, 141 KB) |
| Runtime behavior | App driven in a real browser under the exact production response headers |

### What was executed

45+ distinct verification commands against the real tree and the real build output,
including: artifact scanning for absolute paths, usernames, secrets, `/api` references,
`javascript:` contexts, and external URLs; bundle inspection for `fetch`, `innerHTML`,
`dangerouslySetInnerHTML`, `eval`, `Function(`, `localStorage`, `sessionStorage`,
`cookie`, `serviceWorker`, `worker`, `import(`, `preinit`, and `preload`; catalog content
measurement for description length and quotation density; Vercel build-environment
simulation under `NODE_ENV=production`; and a clean-checkout build.

---

## 2. Findings

Severity reflects impact **in the reviewed deployment shape**. A finding that would be
critical in an API deployment may be informational here, because the vulnerable
component is not published.

| ID | Severity | Finding | Evidence | Required action |
|---|---|---|---|---|
| F-1 | Informational | The published artifact is a pure static SPA. No API routes, no server code, no database, no evidence files. | `dist-web/` contains exactly: `index.html`, `assets/index-*.js`, `assets/index-*.css`, `favicon.svg`, `og-image.png`, `og-image.svg`, `robots.txt`, `sitemap.xml`. Zero matches for `/api/graph`, `/api/exports`, `/api/analysis`, `*.sqlite`, `*.db`, `.env`. | None. |
| F-2 | Informational | No secrets, credentials, tokens, or absolute filesystem paths in the published bundle. | Bundle scanned for API-key/secret/password/bearer/authorization patterns, `C:\`/`E:\`/`/Users/` paths, emails, and IP-like literals — all zero or benign (matches were policy vocabulary such as "secrets management"). | None. |
| F-3 | Informational | No runtime network access. The client makes zero `fetch`/`axios`/`XMLHttpRequest` calls; the catalog is compiled into the bundle. | `grep -rn "fetch\|axios\|XMLHttpRequest\|EventSource" src/web/` → no matches. Browser resource-timing under the production headers confirmed zero cross-origin requests. | None. This is what makes `connect-src 'none'` enforceable rather than aspirational. |
| F-4 | Informational | No injection surface. No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval` in application code. | `grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(" src/` → no matches in application source. Bundle `innerHTML` occurrences are React DOM internals (setting `textContent`/`__html` on React-managed nodes), not string-to-DOM sinks. | None. |
| F-5 | Informational | No browser storage, cookies, workers, or service workers. No persistent client-side state. | Bundle scan for `localStorage`, `sessionStorage`, `cookie`, `serviceWorker`, `Worker` → zero matches. | None. |
| F-6 | Informational | Third-party content is Eidos-authored prose, not reproduced standards text. | Longest publisher description is 617 characters (HIPAA Security Rule), max generic summary 154 characters, max applicability 262 characters. Zero publisher records contain a URL inside `description`. Every publisher record carries `contentMarker: "paraphrase"` and `copyrightTreatment: "metadata_summary_link"`; every Eidos-authored record carries `contentMarker: "editorial"` and `copyrightTreatment: "eidos_original"`. Schema enforces the pairing (catalog.ts:193, catalog.ts:204). | None. Restricted standards are linked, not reproduced. |
| F-7 | Low | `playwright` dev dependency was pinned to 1.55.0, which is affected by a high-severity advisory (browser download without SSL certificate authenticity verification). Dev-only, never shipped, but it is an unverified trust path on a developer machine. | `npm audit` reported `playwright <1.55.1` — Severity: high. | **RESOLVED 2026-10-31** — bumped to 1.55.1. `npm audit` now reports 0 vulnerabilities across the full tree including dev. |
| F-8 | Low | `vitest` 5.0.0 affected by a moderate advisory (code injection via unauthenticated manual mock registration; Windows backslash traversal bypass in `@vitest/mocker`). Dev-only. | `npm audit` reported `vitest 5.0.0-beta.1 - 5.0.2` and `@vitest/mocker` — Severity: moderate. | **RESOLVED 2026-10-31** — bumped to 5.0.5. `npm audit` now reports 0 vulnerabilities. |
| F-9 | Informational | Legacy assessment routes are correctly excluded from the published artifact. | `enableLegacyAssessmentApi` gates `/api/graph`, `/api/exports/*`, and `/api/analysis/proposals`; the default runtime leaves them 404. No matching route strings appear in `dist-web`. | None. |
| F-10 | Informational | `cytoscape` and `cytoscape-fcose` are installed but not shipped. | `grep -c -i "cytoscape" dist-web/assets/*.js` → 0. Tree-shaken out because no bundle path imports them. | None. |
| F-11 | Informational | Build environment omits dev dependencies under `NODE_ENV=production`, which would break `npm run build:web`. | Reproduced: with `NODE_ENV=production npm ci --omit=dev`, `vite` and `tsc` are absent and the build fails with `tsc' is not recognized`. | **RESOLVED 2026-10-31** — `installCommand` set to `npm ci --include=dev`, then verified by a clean-checkout build under `NODE_ENV=production`. |
| F-12 | Low | The deployment ignore file was named `vercelignore` without the leading dot. Vercel only reads `.vercelignore`, so the unprefixed name was silently ignored and nothing would have been excluded from the upload. | Confirmed against Vercel's deployment documentation: the file must be `.vercelignore`. The unprefixed file was present and correct in content — it simply would never have been read. | **RESOLVED 2026-10-31** — renamed via `git mv` to `.vercelignore`. |
| F-13 | Informational | The API's security controls are unchanged by this deployment. | `src/server/app.ts` retains loopback binding, the Host allowlist (`421` on mismatch), the Origin allowlist (`403` on mismatch), `Content-Security-Policy: default-src 'none'` on API responses, `X-Frame-Options: DENY`, `nosniff`, `no-referrer`, `Permissions-Policy`, 64 KiB body limit, and the mutating-request Origin and JSON media-type requirements. | None. The API is not published, so none of these controls were relaxed to make the deployment work. |
| F-14 | Informational | The published CSP is stricter than the site's own, and is honest about the bundle. | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests`. No `unsafe-inline`, no `unsafe-eval`. The bundle contains no inline scripts, no inline styles, no external fonts, and no runtime requests — verified. | None. |

---

## 3. Verification of the critical claims

Each claim below was tested rather than reasoned about.

### 3.1 The application works under the exact production headers

The strict CSP only exists in production, so the artifact was served with the real
`vercel.json` header set and driven in a real browser:

```
PASS  catalog renders cards -- 79 cards
PASS  page has a heading -- Find the right guidance without digging.
PASS  search filters results -- 4 of 79 after searching "NIST CSF"
PASS  record detail opens with tabs -- 3 tabs
PASS  detail tab switches -- source panel present
PASS  detail body has content -- 675 chars
PASS  no external resource requests -- none

CSP violations: none
Page errors:    none
Console errors: none
```

Reproducible with:

```bash
npm run build:web
node scripts/serve-production.mjs 4319
node scripts/verify-production-csp.mjs http://127.0.0.1:4319
```

### 3.2 React's JIT probe under a no-`unsafe-eval` policy

The bundle contains one `Function('')` call — React's feature detection for whether
`eval` is available, used to choose its JIT compiler. Under a CSP without
`unsafe-eval` this throws and React falls back to its interpreter.

This is a **performance** characteristic, not a functional one, and it was confirmed
by test rather than assumed: search, filtering, record detail, tab switching, and
comparison all work under the strict policy, with no page errors. The trade-off is
accepted deliberately — the stricter policy is worth more than the interpreter.

### 3.3 The published artifact contains nothing it should not

```
dist-web/index.html
dist-web/assets/index-DoxmD6r-.js
dist-web/assets/index-F9C_9cK_.css
dist-web/favicon.svg
dist-web/og-image.png
dist-web/og-image.svg
dist-web/robots.txt
dist-web/sitemap.xml
```

No source maps (`.map` files: 0). No dynamic imports (`import(`: 0). No `modulepreload`
links. No `preinit`/`preload` usage.

---

## 4. Residual risks

These remain true after all remediation. They are accepted for the static deployment.

| Risk | Assessment |
|---|---|
| **Catalog currency.** The catalog is a curated snapshot, not a live feed. A framework or regulation may be revised after the snapshot date. | Accepted and mitigated in-product: every record displays version, status, effective date, and the editorial review date, and links to the official publisher source. The README states plainly that the catalog is "a reviewed core, not an exhaustive or automatically current legal library." This is a content-currency risk, not a security risk. |
| **No monitoring or alerting on the deployed artifact.** A compromised CDN or misconfigured header would not raise an alert. | Accepted. The artifact is static, read-only, contains no secrets and no user data, and the blast radius of compromise is limited to serving altered public reference content. Detection would come from content review and periodic re-verification. |
| **No rollback mechanism beyond Vercel's own.** Each deploy replaces the artifact; there is no prior-version restore path configured. | Accepted. Rollback is a Vercel dashboard action, and the artifact is reproducible from git with `npm ci && npm run build:web`. |
| **Third-party CDN and DNS are outside this review's scope.** Vercel's own security posture, TLS configuration, and the DNS provider's controls were not assessed. | Out of scope. Referenced here so it is not silently assumed. |
| **The `npm ci --include=dev` install command widens the build-time install surface.** Dev dependencies are installed during the Vercel build, so a compromised dev dependency could execute at build time. | Mitigated by `.npmrc` `ignore-scripts=true` (blocks install-time lifecycle scripts, the main supply-chain vector) and exact version pinning on every dependency. Accepted as the standard trade-off for a build that needs `vite` and `typescript`. |
| **Content accuracy errors.** A summary could misstate a requirement. | Mitigated by content markers, editorial review metadata, prominent disclaimers, and linking rather than reproducing source text. Inherent to any reference catalog. |
| **No automated accessibility/responsive regression suite.** The browser acceptance journeys were manual. | Accepted for now; tracked as a quality to-do. The strict CSP and interaction verification scripts partially cover this ground. |

---

## 5. What was explicitly NOT approved

This review does **not** authorize publishing the Fastify API, and does not authorize
any of the following, which remain unimplemented for the API:

- authentication and authorization
- tenant/workspace isolation
- hosted secrets management and encryption architecture
- TLS termination and hardened deployment configuration for the API
- production supervision, monitoring, alerting, and rate limiting
- collaborative persistence, migrations, backups, and restore tooling
- multi-user operation

The API's loopback binding, Host allowlist, Origin allowlist, and body-size limit are a
security boundary that **must not be relaxed** to make the API reachable in production.
The deployed product does not call the API, so there is no reason to relax it.

---

## 6. Required conditions

1. **Publish only `dist-web/`.** Do not deploy the Fastify API, the `dist-server/`
   output, or any `local-data/` directory alongside it.
2. **Keep the CSP as written.** Do not add `unsafe-inline` or `unsafe-eval` to make a
   future change work — the strict policy is load-bearing, and `connect-src 'none'` is
   the control that makes an accidental future network call fail loudly.
3. **Keep `.vercelignore` intact and correctly named.** Its current absence of effect
   would silently upload the API sources, tests, and local data.
4. **Re-run `npm run accept` and `scripts/verify-production-csp.mjs` after any change
   that touches `src/web/`, `vercel.json`, or the dependency tree.** A green dev server
   is not evidence; the strict policy exists only in production.
5. **Re-run the full `npm audit`, not just the production subset.** The `--omit=dev`
   gate in `npm run accept` will not catch a dev-dependency advisory (F-7 and F-8
   both sat in that gap).
6. **Create the deployment through the Vercel dashboard from the repository**, using
   framework "Other", build command `npm run build:web`, and output directory
   `dist-web`. After the first deploy, verify the live response carries the expected
   headers rather than assuming the configuration was applied.

---

## 7. Reviewer's note on independence

The substantive investigation was performed by an independent reviewer that read the
repository and the built artifact directly and executed 45+ verification commands
against them. That reviewer was interrupted before composing this document, so its
evidence was reconciled and re-verified by the implementing agent against the current
tree at `8a01c18`.

Every claim in sections 2 and 3 was re-executed against the tree as it now stands.
Findings F-7, F-8, F-11, and F-12 were **introduced or discovered during that
review** and were fixed as a direct result. The reviewer independently reached the
same architectural conclusion — that the static deployment shape avoids the API's
security boundary entirely — before the interruption.

The honest limitation: this document was composed by the implementing agent from an
independent reviewer's evidence. A reviewer who could not be interrupted would be the
stronger control, and this should not be read as a fully independent sign-off.
