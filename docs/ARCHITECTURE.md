# Eidos Architecture

**Status:** Accepted baseline for the first complete demonstration
**Decision:** TypeScript modular monolith, local-first, single-user
**Runtime:** Node.js 24
**Related contracts:** [DATA_MODEL.md](./DATA_MODEL.md), [API_CONTRACTS.md](./API_CONTRACTS.md)

## 1. Goals and invariants

Eidos is a local-first Security Assurance Graph for consultants assessing client web applications. The system must preserve the chain:

`business objective -> asset -> dependency -> threat -> vulnerability -> risk -> control -> validation -> evidence -> requirement`

The architecture is governed by these invariants:

1. **Local authority.** The local SQLite database is the authoritative system of record. No cloud service is required for core graph, assurance, search, or export behavior.
2. **Traceable authority.** Every authoritative entity mutation, relationship verification, validation execution, and evidence observation has provenance.
3. **No AI authority.** AI output is explanatory or proposed. It cannot directly create verified relationships, verified findings, validation outcomes, or assurance states.
4. **Deterministic assurance.** Assurance is a pure projection of stored authoritative facts, timestamps, and policy parameters. It is never persisted as user-editable truth.
5. **Repository isolation.** Domain and application modules never import `node:sqlite` or SQL. Persistence is available only through repository and unit-of-work ports.
6. **Intent-oriented transport.** API operations express consultant intent rather than exposing tables or generic graph mutations.
7. **Local attack-surface reduction.** The server binds to loopback only and rejects unapproved `Host` and browser `Origin` values.
8. **One deployable unit.** UI and API are developed as modules but distributed and run as one local application.

## 2. System context

```text
Consultant
   |
   v
React + Vite UI ---- HTTP/JSON ---- Fastify API
   |                                      |
Cytoscape graph                        Application services
                                          |
                              Domain model + assurance engine
                                          |
                              Repository / UnitOfWork ports
                                          |
                              node:sqlite adapter (local file)

Optional local Ollama adapter <---- explanation/proposal port
(never on an authoritative write path)
```

### Trust boundaries

| Boundary | Trust level | Required controls |
|---|---|---|
| Browser to Fastify | Untrusted input | Loopback host/origin enforcement, schema validation, body limits, request IDs |
| Application to SQLite adapter | Trusted application boundary | Parameterized statements, transactions, migrations, repository interfaces |
| File import to application | Untrusted content | Size/type validation, parse limits, no active content, explicit review before commit |
| Application to local LLM | Untrusted output | Fail closed, output marked `proposed`, no authoritative repository access |
| Exported bundle | Sensitive output | Explicit destination, deterministic manifest/checksums, no implicit upload |

## 3. Architectural style

Use a **modular monolith** with ports and adapters. Module boundaries are enforced in TypeScript imports and tested as architectural constraints. Modules communicate through application services and typed ports, not by importing another module's adapter or SQL.

### Logical modules

| Module | Responsibility | Owns |
|---|---|---|
| `workspace` | Client/application workspace lifecycle and policy settings | Workspace aggregate, settings |
| `graph` | Entities, relations, topology queries and focus views | Entity and relation aggregates |
| `assurance` | Validations, evidence observations, deterministic state projection | Validation definitions/executions, evidence links, projection engine |
| `provenance` | Actors, sources, mutation attribution and audit chain | Provenance records, audit events |
| `requirements` | Policies, obligations, mappings and impact traversal | Requirement entities and mappings through graph relations |
| `findings` | Vulnerability/finding lifecycle and risk context | Vulnerability-specific workflow within graph entities |
| `analysis` | Search, explanations and AI proposals | Ephemeral analyses and proposal records only |
| `transfer` | Import/export and backup bundles | Import staging, export manifests |
| `platform` | HTTP host, configuration, clock, IDs, database adapter | Technical adapters; no domain policy |

The graph vocabulary is shared as a small domain kernel. Modules may depend on this kernel and declared ports only.

### Dependency direction

```text
HTTP routes -> application commands/queries -> domain
                                         -> ports
adapters (SQLite, clock, IDs, Ollama) ----^
```

- Domain code has no Fastify, React, SQLite, filesystem, or LLM dependency.
- Application services define transaction boundaries.
- HTTP routes translate wire contracts to commands/queries and domain results to responses.
- SQLite repositories may join tables for efficient reads but must return domain DTOs, not driver rows.

## 4. Runtime topology

### Development

- Vite serves the React application on a configured loopback port.
- Fastify serves `/api/v1` on a separate configured loopback port.
- CORS allows only the exact configured Vite origin.
- Vite proxies API calls where practical so the UI can use a same-origin relative base URL.

### Packaged/local runtime

- Fastify serves the built static UI and `/api/v1` from the same loopback origin.
- Default bind address is `127.0.0.1`, never `0.0.0.0` or a LAN address.
- The launcher chooses or configures a port and opens an exact loopback URL.
- No remote listener, telemetry, or external synchronization is enabled by default.

### Host and origin controls

The HTTP server applies these checks before route handling:

1. Listen only on `127.0.0.1` and optionally `[::1]` when explicitly enabled.
2. Build an allowlist from configured exact authorities, for example `127.0.0.1:4310` and `[::1]:4310`.
3. Reject missing, malformed, userinfo-bearing, or non-allowlisted `Host`/`:authority` with `421 HOST_NOT_ALLOWED`.
4. For browser state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`), require `Origin` and exact-match it against configured local origins; reject `null`, wildcard, suffix, substring, and reflected origins with `403 ORIGIN_NOT_ALLOWED`.
5. For safe methods, reject a present but unapproved `Origin`. Requests without `Origin` remain available to local non-browser clients.
6. CORS responses use a single exact origin, `Vary: Origin`, an explicit method/header list, and no wildcard. Credentials are disabled unless a later authentication decision requires them.
7. Do not trust `X-Forwarded-Host`, `Forwarded`, or proxy headers by default (`trustProxy: false`).
8. Set `Content-Security-Policy`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer` for the UI.

Loopback restrictions reduce exposure but are not authentication. Any future LAN/remote mode requires a separate architecture decision covering authentication, authorization, TLS, CSRF, and multi-user concurrency.

## 5. Data and persistence architecture

### SQLite decision

Use Node.js 24 built-in `node:sqlite` behind repository boundaries. This avoids a third-party native package while retaining embedded ACID persistence. Only the adapter module imports `node:sqlite`.

The initial adapter may use the synchronous API because the application is a local single-user process. Calls must remain short, bounded, and outside render/HTTP serialization work. If profiling shows event-loop stalls, move the unchanged repository port behind a worker-thread adapter; do not leak driver APIs upward.

### Database location and files

- Resolve the data directory through a platform path service; do not place mutable data in the repository or static assets.
- Maintain one database file per workspace.
- Sidecars (`-wal`, `-shm`) belong to the same protected directory.
- Temporary import databases and export staging files are created under the application data directory and atomically renamed.
- File paths are never accepted directly in ordinary graph APIs. Transfer endpoints use a platform file picker integration or an explicitly validated local path contract.

### Connection and pragmas

On every opened workspace database:

- `PRAGMA foreign_keys = ON`
- `PRAGMA journal_mode = WAL`
- `PRAGMA synchronous = FULL` for authoritative writes
- a bounded `busy_timeout`
- schema version checked before repository construction

Never interpolate values or identifiers from requests into SQL. Values use prepared statement parameters. Sort fields and table/column identifiers are selected from closed application maps.

### Transactions

- One intent command is one database transaction.
- A transaction writes aggregate changes, provenance, and audit event together or rolls back all.
- `BEGIN IMMEDIATE` is used for write commands to fail predictably under contention.
- Bulk import stages and validates all records before a single commit or a documented chunked transaction.
- Read queries use a consistent snapshot where several statements produce one response.

### Migrations

- Forward-only, numbered SQL migrations are packaged with the app and checksummed.
- A `schema_migrations` table stores version, checksum, and application version.
- Before migration, close active handles and create a verified backup.
- Migration is transactional when SQLite permits it; a failed migration leaves the prior database usable.
- Opening a database newer than the application fails with `DATABASE_VERSION_UNSUPPORTED`; no downgrade is attempted.

### Backup and recovery

- Produce consistent backups using a SQLite-supported backup operation or a transactionally consistent snapshot, never by copying only the main file while WAL is active.
- Export bundles contain a manifest, schema version, application version, generated timestamp, and SHA-256 checksums.
- Restore/import never overwrites the active workspace in place. Validate into a new file, then switch atomically after explicit confirmation.

### Storage ownership

| Storage object | Authority | Mutable by |
|---|---|---|
| Workspace settings | Authoritative | Workspace application service |
| Entity/relation rows | Authoritative | Graph commands only |
| Validations/evidence observations | Authoritative | Assurance commands only |
| Provenance/audit events | Append-only authority | Transactional provenance service |
| Assurance summaries | Derived cache | Assurance projector only; safely rebuildable |
| AI proposals | Non-authoritative | Analysis module; human may accept through a separate command |
| Search index | Derived | Projection/index adapter; safely rebuildable |

No module may directly update another module's owned tables. Cross-module changes are coordinated by an application command and one unit of work.

## 6. Domain authority and provenance

Every authoritative mutation includes an `actor` and a `source` captured in a provenance record. Provenance is immutable. Corrections append a superseding record and update the aggregate through a new command; history is not rewritten.

Authority classes are:

- `human`: an identified consultant action;
- `deterministic`: an application rule or tool result with a named rule/tool version;
- `imported`: a record imported from an identified artifact, pending or accepted according to import workflow;
- `ai`: always non-authoritative and `proposed`.

A relation is `verified` only when its provenance authority is `human` or `deterministic`. AI may submit a proposal, which creates a `proposed` relation. Accepting a proposal creates a new human provenance record; it never promotes AI provenance in place.

Audit events store intent, aggregate identifiers, actor, provenance identifier, timestamp, and a canonical before/after change summary. Secrets, full evidence contents, and raw LLM prompts are excluded.

## 7. Deterministic assurance engine

Assurance is computed, not authored. Inputs are the authoritative graph snapshot, validation executions, evidence observations, policy settings, and a caller-supplied or server clock timestamp (`asOf`). The engine is a pure versioned function:

```text
assurance = evaluate(snapshot, policy, asOf, ruleVersion)
```

The normative states and precedence are defined in `DATA_MODEL.md`. Key rules:

1. Ignore deleted, proposed, rejected, and unverified facts.
2. A control with any current failed required validation is `failed`.
3. Otherwise, missing required mappings, executions, or evidence is `unsupported`.
4. Otherwise, expired inputs are `expired`, near-expiry inputs are `stale`, and incomplete optional coverage is `partial`.
5. Only complete, current, passing required validation and evidence can produce `validated`.
6. Requirement assurance is the worst deterministic state of in-scope supporting controls, with explicit `not_applicable` handled separately.
7. Risk residual posture is a derived explanation of linked control assurance; it does not silently change the authored risk rating.

Every projection returns `state`, `reasonCodes`, `inputIds`, `evaluatedAt`, and `ruleVersion`. The same committed snapshot, policy, `asOf`, and rule version must produce byte-equivalent canonical results.

## 8. API architecture

- Base path: `/api/v1`.
- JSON uses UTF-8 and `application/json`.
- Routes are grouped by consultant intent: establish context, connect assurance, record validation, attach evidence, review proposals, focus graph, assess impact, and transfer workspace.
- Generic CRUD and arbitrary SQL/graph query endpoints are prohibited.
- JSON Schema is the wire-contract source used by Fastify for request and response validation.
- Domain validation remains in application/domain layers; HTTP validation is not a substitute.
- Errors follow the stable envelope in `API_CONTRACTS.md`.
- Writes require `If-Match` with the aggregate revision unless the endpoint creates a new aggregate.
- Commands support an `Idempotency-Key` where retries could duplicate an action or file operation.

## 9. Frontend integration

React owns interface state; Cytoscape owns graph rendering only. The UI consumes server-provided graph DTOs and assurance projections and does not reimplement assurance rules.

- Full graph and focused graph are query projections, not distinct sources of truth.
- Edge `verificationStatus` maps to solid/dotted visual treatment.
- Assurance `state` maps to color plus icon/text/pattern; color is never the sole signal.
- Selection, focus history, and drawer state may remain ephemeral in the UI.
- Stable IDs preserve selected nodes across query refreshes.
- A list/table representation uses the same focused-graph response for keyboard and screen-reader access.

## 10. Operational limits

Initial limits are configurable but enforced server-side:

| Limit | Baseline |
|---|---:|
| JSON request body | 1 MiB |
| Evidence metadata request | 256 KiB |
| Imported bundle | 250 MiB |
| Graph query page size | 500 nodes / 1,000 edges |
| Search query length | 256 Unicode code points |
| Batch command items | 100 |
| LLM context payload | 100 KiB of redacted text |

Binary evidence is not embedded in JSON or graph rows. It is content-addressed in a managed evidence directory; SQLite stores metadata, checksum, media type, size, and relative managed-object key. Path traversal, symlinks/reparse points, and executable active content are rejected by the evidence adapter.

## 11. Failure behavior

- SQLite or migration errors fail closed; no in-memory shadow write is reported as success.
- Ollama unavailability affects only AI analysis/proposals and returns `503 AI_PROVIDER_UNAVAILABLE`; core use continues.
- If audit/provenance persistence fails, the authoritative mutation rolls back.
- If assurance projection fails, writes remain committed only when projection is rebuildable and the response states projection unavailability; no fabricated state is returned.
- Unexpected errors expose a request ID, not stack traces, SQL, paths, or evidence contents.

## 12. Testing and verification boundaries

Required architectural tests:

1. Domain/application packages cannot import Fastify, React, Cytoscape, filesystem, or `node:sqlite`.
2. Only the SQLite adapter imports `node:sqlite`.
3. Every write command atomically creates provenance and audit records.
4. AI provenance cannot satisfy authoritative relation or assurance inputs.
5. Assurance fixture results are deterministic across repeated runs and database reloads.
6. Host and Origin rejection is verified before route behavior.
7. Migrations are tested from every supported schema version and against a newer unsupported version.
8. Backup restore is checksum-verified and opens to the expected graph revision.
9. API request and response examples validate against shared JSON Schemas.

## 13. Deferred decisions

The following are explicitly out of scope for the initial local-first demonstration and require new decisions:

- remote access and authentication;
- multi-user collaboration and merge/conflict resolution;
- cloud synchronization;
- plugin execution;
- arbitrary user-authored assurance code;
- automatic external scanning;
- AI-generated authoritative findings;
- distributed services or a separate graph database.
