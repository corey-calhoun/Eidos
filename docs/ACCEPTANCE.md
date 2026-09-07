# Eidos Local MVP Acceptance

**Status:** Implemented local-MVP release contract
**Scope:** One consultant, one client web application, local-only sample/test data
**Release command:** `npm ci && npm run accept`
**Production authority:** Passing this contract does not authorize deployment. Production still requires Corey's explicit approval and a separate security review.

## 1. Canonical sample contract

A fresh empty database must seed one sample assessment with 13 nodes and 12 relationships. The primary verified assurance path is:

```text
app_acme_orders
  -> risk_admin_compromise
  -> control_admin_mfa
  -> validation_mfa_login
  -> evidence_mfa_test
  -> requirement_asvs_auth
  -> framework_owasp_asvs
```

The sample must also include the non-authoritative side branch:

```text
control_admin_mfa
  -. proposed .-> policy_access_control
```

`edge_control_policy` is a client-asserted proposal. It must remain visibly and semantically distinct from the 11 verified relationships and cannot establish authoritative assurance.

All authoritative non-unknown nodes and all verified relationships require accepted human or deterministic provenance. The proposed side branch must not contain verification metadata that implies acceptance.

## 2. Automated acceptance criteria

### AC-01 — Deterministic assurance rules

**Evidence:** `tests/domain/assurance.test.ts`

Pass when:

- every supported assurance state has explicit deterministic precedence;
- stale, failed, partial, risk-accepted, not-applicable, validated, planned, implemented-unverified, and unknown outcomes are distinguishable;
- AI-proposed and otherwise untrusted inputs cannot establish validated assurance;
- repeated evaluation does not depend on graph layout, locale, or a model response.

### AC-02 — Strict graph and provenance validation

**Evidence:** `tests/domain/graph.test.ts`

Pass when:

- unknown node, edge, provenance, and nested fields fail closed;
- duplicate IDs and dangling relationships are rejected;
- every one of the 20 relationship types has an explicit endpoint matrix;
- nonsensical unlisted endpoint pairs are rejected;
- non-unknown node assurance requires accepted authoritative provenance;
- verified relationships require human or deterministic authority, actor, and verification time;
- client assertions and AI proposals cannot establish verification.

### AC-03 — Canonical sample graph

**Evidence:** `tests/domain/sample-graph.test.ts`

Pass when:

- the canonical IDs and complete application-to-framework path exist;
- the graph contains exactly 13 nodes and 12 relationships;
- `edge_control_policy` is proposed and client-asserted;
- the other 11 relationships are verified;
- graph validation succeeds and summary metrics remain deterministic.

### AC-04 — Deterministic exports and integrity

**Evidence:** `tests/domain/export.test.ts`

Pass when:

- JSON serialization has stable object keys, node ordering, and relationship ordering;
- the caller provides a valid RFC 3339 UTC generation time;
- the SHA-256 digest covers schema version, generation time, and canonical graph content;
- metadata substitution changes the digest;
- the Markdown summary reports assurance and provenance without claiming certification, audit completion, or compliance.

### AC-05 — Secure local persistence

**Evidence:** `tests/server/storage.test.ts`, `tests/server/config.test.ts`

Pass when:

- the graph persists across connections;
- snapshot replacement is atomic and parameterized;
- invalid or unknown input cannot replace committed data;
- foreign keys and strict persisted-data validation are enforced;
- unsupported migration versions and known versions with tampered checksums are rejected;
- `%LOCALAPPDATA%\Eidos\eidos.sqlite` is the Windows default;
- an explicit `EIDOS_DATABASE_PATH` wins and the repository-local path is only a fallback.

### AC-06 — Fail-closed local API

**Evidence:** `tests/server/api.test.ts`

Pass when:

- health, graph, snapshot export, and Markdown export routes return their documented representations;
- API responses include request IDs, no-store behavior, and defensive headers;
- hostile Host and Origin values are rejected;
- unsafe methods without an approved Origin are rejected;
- unsupported media types, malformed bodies, oversized bodies, and unknown request fields fail safely;
- the analysis route returns only `ai_proposed` output with `canVerify: false` and cannot mutate the graph.

### AC-07 — Graph view-model equivalence

**Evidence:** `tests/web/graph-view-model.test.ts`

Pass when:

- node and relationship filters produce the same scope for the graph and accessible relationship list;
- assurance metrics reflect the visible scope;
- verified, proposed, and unknown relationship states map to distinct display semantics;
- selecting an entity shows only its actual relationships.

### AC-08 — Orientation-preserving graph layout

**Evidence:** `tests/web/graph-runtime.test.ts`

Pass when:

- semantic node families occupy stable left-to-right columns;
- the canonical assurance path moves toward evidence and requirements;
- initial node positions are deterministic and non-overlapping;
- positions derive from the full graph so filters do not move surviving nodes;
- the viewport fits after graph initialization.

### AC-09 — Navigation and deep links

**Evidence:** `tests/web/graph-navigation.test.ts`

Pass when:

- selection history moves backward and forward without losing order;
- history is bounded;
- valid `?entity=<id>` selections restore after graph load;
- unknown or missing IDs return to the safe root state.

### AC-10 — Release command

**Evidence:** `package.json`

`npm run accept` must execute, in order:

1. Browser/domain and server/domain TypeScript checks.
2. All discovered Vitest tests.
3. Production web and server builds.
4. Production dependency audit at high severity.

Every command must exit `0`. Build outputs must remain uncommitted.

## 3. Runtime and human acceptance criteria

These checks use the compiled artifacts after `npm run build`:

```bash
npm run start:api
npm run start:web
```

### AC-11 — Local runtime and security boundary

Pass when:

- API listens only on `127.0.0.1:4317`;
- compiled UI preview listens only on `127.0.0.1:4173`;
- `/health` returns `{"status":"ok","service":"eidos-api"}`;
- `/api/graph` returns the valid persisted sample;
- hostile Host returns `421`;
- hostile or missing Origin on an unsafe request returns `403`;
- unsupported `text/plain` POST returns `415`;
- a trusted JSON proposal request returns `200`, `ai_proposed`, and `canVerify: false`;
- active data is outside the repository unless an explicit test path is supplied.

### AC-12 — Visual and interaction review

Pass when an independent reviewer confirms:

- all sample entities are visible without material node overlap or release-blocking clipping;
- the assurance flow is readable left-to-right;
- verified and proposed relationships are visually distinguishable;
- a valid deep link selects the correct entity and opens the matching detail drawer;
- entity provenance shows authority, source, observation time, and verification details when present;
- the graph remains visible behind the drawer;
- keyboard graph entry, Escape close, and focus-return behavior are implemented without a keyboard trap;
- reduced-motion styling does not remove function;
- the non-graph relationship representation remains available.

Automated unit coverage supports these checks, but screenshot review does not replace a future screen-reader and browser-automation pass.

## 4. Release evidence record

A local-MVP baseline is accepted only when the release record contains:

- exact test-file and test counts;
- typecheck, build, and audit outcomes;
- secret-scan outcome;
- loopback socket evidence;
- runtime security response codes;
- baseline and deep-link screenshots;
- clean Git status and commit identifier;
- synchronized `E:\Notes\Obsidian\04 Projects\Eidos.md` status.

## 5. Deferred production gates

The following are intentionally outside this local MVP and become mandatory before any production proposal:

- authenticated users, authorization, anti-forgery controls, and tenant/workspace isolation;
- real graph/evidence mutation endpoints with concurrency, idempotency, and append-only audit history;
- evidence-file ingestion, integrity, retention, and secure deletion;
- supported import/restore, ordered forward migrations, backup verification, and rollback automation;
- hardened single-process or desktop packaging rather than Vite preview;
- TLS and configurable deployment topology;
- rate limiting, monitoring, structured security logs, service supervision, and incident response;
- SBOM, provenance-attested release artifacts, and production dependency policy;
- Playwright end-to-end tests, automated accessibility scans, Windows screen-reader verification, 200% zoom review, and full keyboard journey evidence;
- external penetration testing and explicit human deployment authorization.
