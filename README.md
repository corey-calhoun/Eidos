# Eidos

Eidos is a local-first cybersecurity governance knowledge library: a searchable Rolodex of frameworks, laws, regulations, contract clauses, guidance, standards, criteria, knowledge bases, control catalogs, policies, controls, and GRC concepts.

The product opens on the library. A user can search or browse the catalog, open a plain-language reference record, use an action-oriented Policy Playbook when available, verify publisher and source context, follow related material, and compare references. A relationship view may support exploration later, but it is not the front door and is not required to use the library.

Eidos explains the knowledge landscape and offers practical starter guidance. It does not store checklist completion, collect organization evidence, identify gaps, or assess readiness; those workflows remain Checkpoint's role.

## Current catalog-first MVP

- Built-in, deterministic curated core with 77 records across 12 publisher-aligned material types.
- Universal local search across names, acronyms, descriptions, publishers, applicability, domains, and tags.
- Browse-by-type directories and catalog filters.
- Centralized desktop workspace with a compact filter rail, contained result scrolling, and a centered record dialog so the primary journey stays within one viewport.
- Multi-select industry filtering with distinct Defense/DoD, Government, Healthcare, Financial services, Payment processing, and Education contexts.
- Per-result explanations distinguish direct industry tags from broadly useful cross-industry references.
- Reference cards and detailed record inspection.
- Focused Overview, Playbook, Related, and Source & trust tabs keep dense record content separated and keyboard navigable instead of presenting one long drawer.
- Action-first Policy Playbooks for all 20 built-in policies, including tailoring decisions, implementation approaches, phased starter checklists, likely owners, evidence examples, and review triggers.
- General playbook guidance can be augmented by selected-industry context prompts without asserting legal applicability.
- Policy source and authority metadata remains available in the dedicated Source & trust tab; a persistent authority badge remains visible across every detail section.
- Explicit issuer, version/status, jurisdiction, applicability, and official-source metadata where applicable.
- Related-material navigation that distinguishes official publisher relationships, Eidos-curated context, and unverified candidates.
- Side-by-side comparison for selected governance references.
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

Passing these gates does not authorize production deployment.

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

This MVP is local-only and single-user:

- Vite and Fastify bind to `127.0.0.1`.
- The API restricts Host and browser Origin values.
- Responses include defensive headers, request IDs, and `Cache-Control: no-store`.
- Mutating requests require an approved Origin and JSON media type.
- Request bodies are limited to 64 KiB.

Loopback restrictions are not authentication. Do not proxy, tunnel, publish, or bind Eidos to a LAN address. No production deployment is authorized.

## Documentation

- [Product brief](./docs/PRODUCT_BRIEF.md)
- [Catalog-first acceptance contract](./docs/ACCEPTANCE.md)
- [Curated catalog coverage and review rules](./docs/CATALOG_COVERAGE.md)
- [Operations](./docs/OPERATIONS.md)
- [Security requirements](./docs/SECURITY_REQUIREMENTS.md)
- [Threat model](./docs/THREAT_MODEL.md)

Several architecture and visual-design documents were authored for the preserved assessment-graph prototype. Where they conflict with the catalog-first product brief, the product brief and current implementation take precedence until those historical documents are reconciled.
