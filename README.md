# Eidos

Eidos is a local-first cybersecurity governance knowledge library: a searchable Rolodex of frameworks, regulations, standards, control catalogs, policies, controls, and GRC concepts.

The product opens on the library. A user can search or browse the catalog, open a plain-language reference record, check its publisher and source, understand version and applicability context, follow related material, and compare references. A relationship view may support exploration later, but it is not the front door and is not required to use the library.

Eidos explains the knowledge landscape. It does not assess an organization's readiness; that remains Checkpoint's role.

## Current catalog-first MVP

- Built-in, deterministic catalog with representative framework, regulation, standard, control-catalog, policy, control, and GRC-concept records.
- Universal local search across names, acronyms, descriptions, publishers, applicability, domains, and tags.
- Browse-by-type directories and catalog filters.
- Multi-select industry filtering with distinct Defense/DoD, Government, Healthcare, Financial services, Payment processing, and Education contexts.
- Per-result explanations distinguish direct industry tags from broadly useful cross-industry references.
- Reference cards and detailed record inspection.
- Explicit issuer, version/status, jurisdiction, applicability, and official-source metadata where applicable.
- Related-material navigation that distinguishes official publisher relationships, Eidos-curated context, and unverified candidates.
- Side-by-side comparison for selected governance references.
- Strict Zod validation that rejects malformed records, duplicate identifiers/slugs, dangling relationships, and unsupported fields.
- Loopback-only Fastify API with strict query validation and existing defensive Host, Origin, response-header, and body-size controls.
- No external account, cloud service, telemetry, or AI service is required.

The built-in catalog is representative, not comprehensive. Government includes a source-verified NIST SP 800-53 record; Healthcare includes HIPAA; Financial services/payment processing include PCI DSS context. The Defense/DoD selector currently provides cross-industry starting references rather than dedicated CMMC/DFARS coverage. Eidos is educational and operational reference material—not legal advice, an audit, certification, or a determination that a law applies to a particular organization.

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
- [Operations](./docs/OPERATIONS.md)
- [Security requirements](./docs/SECURITY_REQUIREMENTS.md)
- [Threat model](./docs/THREAT_MODEL.md)

Several architecture and visual-design documents were authored for the preserved assessment-graph prototype. Where they conflict with the catalog-first product brief, the product brief and current implementation take precedence until those historical documents are reconciled.
