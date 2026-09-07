# Eidos

Eidos is a local-first Security Assurance Graph for security consultants reviewing a client web application. The current MVP demonstrates how application context, risks, controls, validation activities, evidence, requirements, and provenance can be inspected as one connected graph.

The implemented sample follows this assurance path:

`application -> risk -> control -> validation activity -> evidence -> requirement -> framework`

## Current MVP

- Seeds one built-in Acme Orders assessment into a local SQLite database on first API startup.
- Renders the graph with Cytoscape.js and provides an accessible relationship table.
- Supports node selection, a details drawer, selection history, fit/zoom controls, keyboard navigation, search, and filters for entity type, assurance state, and relationship authority.
- Shows current-view metrics and provenance references from the loaded graph.
- Evaluates assurance deterministically in the domain layer; AI-proposed or unverified input cannot establish authoritative assurance.
- Returns a static, explicitly non-authoritative analysis proposal for a validated question. No model or external AI service is called.
- Exports the current filtered browser view as JSON.
- Exposes read-only full-graph JSON and Markdown assurance exports from the API.
- Falls back to bundled sample data in the browser if the API cannot be reached; the UI labels this **Local sample mode** rather than live local data.

## Prerequisites

- Node.js **24 or newer** (required by `package.json` and `node:sqlite`)
- npm and a terminal; npm 11 is used by the current development environment
- A modern browser

Commands below must be run from the repository root:

```bash
cd "E:/Coding Projects/Eidos"
```

## Install

Install the exact dependency versions from `package-lock.json`:

```bash
npm ci
```

The checked-in `.npmrc` disables dependency lifecycle scripts and automatic install-time audits. Run the explicit audit command when required.

## Run locally (two terminals)

Eidos currently uses separate development servers. Start the API first.

**Terminal 1 — API**

```bash
cd "E:/Coding Projects/Eidos"
npm run dev:api
```

**Terminal 2 — web UI**

```bash
cd "E:/Coding Projects/Eidos"
npm run dev:web
```

Open <http://127.0.0.1:4173>. The UI calls the API at `http://127.0.0.1:4317`.

| Service | Address | Notes |
|---|---|---|
| Vite web UI | `http://127.0.0.1:4173` | Fixed port; startup fails if occupied |
| Fastify API | `http://127.0.0.1:4317` | Fixed loopback address and port |

On Windows, the default database path is `%LOCALAPPDATA%\Eidos\eidos.sqlite`. If `LOCALAPPDATA` is unavailable, Eidos falls back to `<current working directory>/local-data/eidos.sqlite`. Override either default with an absolute path before starting the API, for example in Git Bash:

```bash
EIDOS_DATABASE_PATH="E:/Private Eidos Data/client.sqlite" npm run dev:api
```

The parent directory is created automatically. On an empty database, the API writes the sample graph. See [Operations](./docs/OPERATIONS.md) before copying, restoring, or deleting local data.

## Test and build

```bash
npm run accept
# or run individual gates:
npm run typecheck
npm test
npm run test:watch
npm run build
npm run audit
```

- `npm run accept` runs type checks, all tests, the production build, and the production dependency audit in release order.
- `npm run typecheck` checks browser/domain code and server/domain code without emitting files.
- `npm test` runs all discovered Vitest files once.
- `npm run test:watch` starts interactive Vitest watch mode.
- `npm run build` type-checks, writes the web build to `dist-web/`, and writes the compiled API/domain modules to `dist-server/`.
- `npm run audit` checks production dependencies for high-or-critical npm advisories.

After `npm run build`, start the compiled API and compiled UI preview in separate terminals:

```bash
npm run start:api
npm run start:web
```

There is currently no packaged single-process application. Both compiled processes bind to loopback only.

## Implemented HTTP surface

Base URL: `http://127.0.0.1:4317`

| Method | Endpoint | Implemented behavior |
|---|---|---|
| `GET` | `/health` | Process liveness: `{ "status": "ok", "service": "eidos-api" }` |
| `GET` | `/api/graph` | Validated persisted graph plus basic counts |
| `GET` | `/api/exports/snapshot` | Canonical, versioned graph JSON with a SHA-256 envelope digest |
| `GET` | `/api/exports/summary` | Consultant-facing Markdown summary with no compliance claim |
| `POST` | `/api/analysis/proposals` | Validates `{ "question": "..." }` and returns a fixed non-authoritative proposal |

Example exports:

```bash
curl -fsS http://127.0.0.1:4317/api/exports/snapshot -o eidos-snapshot.json
curl -fsS http://127.0.0.1:4317/api/exports/summary -o eidos-summary.md
```

These endpoints do not implement the much larger aspirational `/api/v1` contract in `docs/API_CONTRACTS.md`.

## Security boundary

The implemented runtime is **local-only and single-user**:

- Vite and Fastify bind to IPv4 loopback (`127.0.0.1`) on fixed ports.
- The API accepts only the configured local `Host` values and rejects a supplied browser `Origin` unless it is exactly `http://127.0.0.1:4173` or `http://localhost:4173`.
- API responses receive a request ID, defensive content/security headers, and `Cache-Control: no-store`.
- Fastify limits request bodies to 64 KiB and the proposal request uses a strict schema.
- Authoritative node assurance and verified graph relationships require accepted human or deterministic provenance with a verification actor and timestamp.
- Analysis output is marked `ai_proposed` and cannot verify or mutate assurance state.

Loopback and origin checks are **not authentication**. The database and exports are **not encrypted by Eidos**. Protect them with OS account permissions and disk encryption, and do not place client data in Git. Do not expose port 4317 through a proxy, tunnel, firewall rule, container port mapping, or LAN bind.

## Current limitations

- The persisted graph is seeded sample data; there are no graph, workspace, evidence, import, restore, or user-editing endpoints.
- Assurance values displayed by the MVP are stored on graph nodes. The standalone deterministic evaluator is implemented and tested but is not wired to a mutation workflow.
- The analysis endpoint returns a fixed proposal; it does not invoke AI.
- There is no authentication, authorization, encryption-at-rest layer, tenant isolation, hosted mode, cloud sync, telemetry, automatic scanning, or multi-user concurrency support.
- API and UI ports are fixed, and the browser API URL is compiled as `http://127.0.0.1:4317`.
- `npm run start:api` and `npm run start:web` are separate loopback processes; there is no single-process package.
- API exports are downloads of the current graph, not restorable database backups. No import endpoint exists.
- The normative architecture and `/api/v1` contract documents describe planned behavior beyond this MVP; use the implemented endpoint table above for current operations.

This MVP is not production-safe. See [Operations: Not production-safe](./docs/OPERATIONS.md#not-production-safe).

## Documentation map

- [Operations](./docs/OPERATIONS.md) — startup, shutdown, data handling, verification, and troubleshooting for the implemented MVP
- [Stack decision](./docs/STACK_DECISION.md) — selected technologies and module boundary
- [Architecture](./docs/ARCHITECTURE.md) — accepted target architecture; portions remain unimplemented
- [Data model](./docs/DATA_MODEL.md) — target domain model and assurance semantics
- [API contracts](./docs/API_CONTRACTS.md) — normative target `/api/v1` contract, not the current route inventory
- [Security requirements](./docs/SECURITY_REQUIREMENTS.md) and [threat model](./docs/THREAT_MODEL.md) — required controls and risks, including future work
- [Product brief](./docs/PRODUCT_BRIEF.md) — product intent
- [Test strategy](./docs/TEST_STRATEGY.md) and [acceptance criteria](./docs/ACCEPTANCE.md) — proposed release gates, not all currently implemented
- [Design system](./docs/DESIGN_SYSTEM.md), [visual grammar](./docs/VISUAL_GRAMMAR.md), [motion specification](./docs/MOTION_SPECIFICATION.md), and [visual reference](./docs/VISUAL_REFERENCE.md) — UI guidance