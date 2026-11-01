# Eidos

Eidos is a local-first cybersecurity governance knowledge library: a searchable Rolodex of frameworks, laws, regulations, contract clauses, guidance, standards, criteria, knowledge bases, control catalogs, policies, controls, and GRC concepts.

The product opens on the library. A user can search or browse the catalog, open a plain-language reference record, use an action-oriented Policy Playbook when available, verify publisher and source context, follow related material, and compare references. A relationship view may support exploration later, but it is not the front door and is not required to use the library.

Eidos explains the knowledge landscape and offers practical starter guidance. It does not store checklist completion, collect organization evidence, identify gaps, or assess readiness; those workflows remain Checkpoint's role.

## Current catalog-first MVP

- Built-in, deterministic curated core with 79 records across 12 publisher-aligned material types.
- Universal local search across names, acronyms, aliases, stable IDs, slugs, descriptions, publishers, applicability, domains, and tags, with deterministic relevance ordering and visible match reasons.
- Browse-by-type directories plus status, topic, and industry filters with contextual counts and independently removable filter chips.
- Centralized desktop workspace with a compact filter rail, contained result scrolling, and a centered record dialog so the primary journey stays within one viewport.
- Multi-select industry filtering with distinct Defense/DoD, Government, Healthcare, Financial services, Payment processing, and Education contexts.
- Per-result explanations distinguish direct industry tags from broadly useful cross-industry references.
- Reference cards and detailed record inspection.
- Focused Overview, Playbook, Related, and Source & trust tabs keep dense record content separated and keyboard navigable instead of presenting one long drawer.
- Action-first Policy Playbooks for all 20 built-in policies, including tailoring decisions, implementation approaches, phased starter checklists, likely owners, evidence examples, and review triggers.
- General playbook guidance can be augmented by selected-industry context prompts without asserting legal applicability.
- Policy source and authority metadata remains available in the dedicated Source & trust tab; a persistent authority badge remains visible across every detail section.
- Explicit issuer, version/status, jurisdiction, applicability, and official-source metadata where applicable.
- Previous/Next navigation reports position in the current filtered result set without wrapping.
- Related-material navigation distinguishes official publisher relationships, Eidos-curated context, and unverified candidates; a visible Back action restores the prior detail tab and scroll context.
- Side-by-side comparison for selected governance references, with per-item removal from both the selection tray and open comparison.
- Strict Zod validation that rejects malformed records, duplicate identifiers/slugs, dangling relationships, and unsupported fields.
- Loopback-only Fastify API with strict query validation and existing defensive Host, Origin, response-header, and body-size controls.
- No external account, cloud service, telemetry, or AI service is required.

The built-in catalog is a reviewed core, not an exhaustive or automatically current legal library. Every selectable industry has direct coverage; Defense/DoD includes CMMC, DFARS 252.204-7012, and NIST SP 800-171 context, while Government, Healthcare, Financial services, Payment processing, Education, Technology/SaaS, Retail, Small business, and Critical infrastructure retain distinct records. Industry tags and Eidos-curated relationships are orientation aids, not legal-applicability, certification, audit, or compliance determinations. See [`docs/CATALOG_COVERAGE.md`](docs/CATALOG_COVERAGE.md) for inclusion and review rules.

## Prerequisites

- Node.js 24 or newer
- npm
- A modern browser

Run commands from:

```bash
cd "E:/Coding Projects/Eidos"
```

## Install

```bash
npm ci
```

## Run locally

Development mode uses two loopback-only processes.

Terminal 1:

```bash
npm run dev:api
```

Terminal 2:

```bash
npm run dev:web
```

Open <http://127.0.0.1:4173>.

| Service | Address |
|---|---|
| Web UI | `http://127.0.0.1:4173` |
| API | `http://127.0.0.1:4317` |

## Implemented catalog API

Base URL: `http://127.0.0.1:4317`

| Method | Endpoint | Behavior |
|---|---|---|
| `GET` | `/health` | Local API liveness |
| `GET` | `/api/catalog` | List/search records; optional strict `q`, `type`, `status`, and comma-separated `industry` parameters |
| `GET` | `/api/catalog/:slug` | One record plus directly related materials and relationship provenance |
| `GET` | `/api/catalog/compare?slugs=a,b` | Compare two or three selected records without claiming equivalence or compliance |

The earlier assessment routes are disabled in the normal runtime and no assessment SQLite repository is initialized. Historical regression tests can opt into them through `buildServer({ enableLegacyAssessmentApi: true })`; this compatibility switch is not used by `npm run start:api`.

## Verification

```bash
npm run accept
```

This runs:

1. Browser/domain and server/domain TypeScript checks
2. All Vitest tests
3. Production web and server builds
4. Production dependency audit at high severity

Individual commands:

```bash
npm run typecheck
npm test
npm run build
npm run audit
```

After building, start the compiled processes separately:

```bash
npm run start:api
npm run start:web
```

Stop both processes with `Ctrl+C` in their respective terminals. Confirm shutdown on Windows/Git Bash with:

```bash
netstat -ano | grep -E ':(4173|4317)' | grep LISTENING
```

No output means neither Eidos listener remains active.

## Production deployment

Eidos ships as a **static site**. The web client in `src/web/` is a self-contained
SPA: the catalog is compiled into the JavaScript bundle and the client makes no
network calls at runtime. The Fastify API in `src/server/` is a local
development and integration surface, and it is **not** part of the published
deployment.

```bash
npm ci
npm run accept          # typecheck, tests, build, dependency audit
npm run build:web       # production web bundle -> dist-web/
```

`dist-web/` is the entire deployable artifact. Publish it to a static host
(Vercel, Cloudflare Pages, S3 + CloudFront, or any CDN). The repository ships
`vercel.json` with the build command, output directory, and the response
headers the production deployment uses.

The deployed site carries these headers:

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` | The bundle has no inline scripts, no inline styles, no external fonts, and makes no runtime requests, so every permissive directive can be dropped. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS-only after first contact. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME confusion. |
| `X-Frame-Options` | `DENY` | Prevents framing. |
| `Referrer-Policy` | `no-referrer` | The app reads no referrer data. |
| `Permissions-Policy` | camera, microphone, geolocation, and friends disabled | The app uses none of these. |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` | `same-origin` | No cross-origin resources are loaded. |

`connect-src 'none'` is the important one: it is enforced by the browser, so
even a hypothetical future bug that added a network call would fail loudly
rather than quietly exfiltrating to a third party.

### What the public deployment does not include

- The Fastify API and its routes, including the legacy assessment endpoints.
- `local-data/`, any SQLite database, evidence, or exports — none of these are
  built into `dist-web/`, and all are excluded by `vercelignore` and
  `.gitignore`.
- Any credential, environment file, or secret. The built bundle was verified
  to contain no filesystem paths, API endpoints, or secret-shaped strings.

### The API stays local

The API's Host/Origin allowlist, loopback binding, body-size limit, and
defensive headers are a security boundary for the local runtime. Publishing
the static site does not weaken any of them, because the API is not published
alongside it. Do not relax the allowlist to "make the API work in
production" — the API is not needed by the deployed product.

## Trust and content rules

- Prefer an issuing authority or publisher as the source for third-party records.
- Display version, status, jurisdiction, applicability, and unknowns explicitly rather than guessing.
- Label Eidos-authored policy/control examples and editorial relationships as non-authoritative.
- Do not call a relationship official unless a publisher source supports it.
- Publisher-classified records and official relationship provenance fail closed unless their HTTPS host is registered to the stated issuer or an endpoint publisher.
- Industry tags and comma-separated industry API filters reject unsupported, duplicate, and empty values.
- AI suggestions, if added later, cannot publish or verify records or mappings.
- Link to restricted standards rather than reproducing unlicensed text.
- Do not infer legal applicability or claim compliance.

## Security boundary

The **local API** is local-only and single-user:

- Vite and Fastify bind to `127.0.0.1`.
- The API restricts Host and browser Origin values.
- Responses include defensive headers, request IDs, and `Cache-Control: no-store`.
- Mutating requests require an approved Origin and JSON media type.
- Request bodies are limited to 64 KiB.

Loopback restrictions are not authentication. Any process running as the local
user can attempt loopback requests.

The **published static site** carries no server-side attack surface at all: it
is a set of files served by a CDN, with a strict CSP and no runtime network
access. It contains only public reference material — publisher-attributed
metadata, Eidos-authored editorial material, and links to official sources.

Do not proxy, tunnel, or publish the Fastify API, and do not bind it to a LAN
address. The deployed product does not use it.

## Documentation

- [Product brief](./docs/PRODUCT_BRIEF.md)
- [Catalog-first acceptance contract](./docs/ACCEPTANCE.md)
- [Curated catalog coverage and review rules](./docs/CATALOG_COVERAGE.md)
- [Operations](./docs/OPERATIONS.md)
- [Security requirements](./docs/SECURITY_REQUIREMENTS.md)
- [Threat model](./docs/THREAT_MODEL.md)
- [Production security review](./docs/PRODUCTION_SECURITY_REVIEW.md)

Several architecture and visual-design documents were authored for the preserved assessment-graph prototype. Where they conflict with the catalog-first product brief, the product brief and current implementation take precedence until those historical documents are reconciled.
