# Eidos API Contracts

> [!IMPORTANT]
> **Historical assessment-prototype API plan.** The catalog-first local MVP exposes `GET /api/catalog`, `GET /api/catalog/compare`, and `GET /api/catalog/:slug`. Assessment routes are disabled by default and exist only behind an explicit test/developer compatibility option. The assessment-oriented `/api/v1` design below is not the current product contract.

**Status:** Historical prototype plan; superseded by the implemented catalog routes
**Base URL:** `http://127.0.0.1:{port}/api/v1`
**Media type:** `application/json; charset=utf-8`
**Related documents:** [ARCHITECTURE.md](./ARCHITECTURE.md), [DATA_MODEL.md](./DATA_MODEL.md)

## 1. Contract principles

1. Endpoints express user intent; there is no generic table CRUD, arbitrary SQL, or arbitrary graph-query endpoint.
2. JSON Schema validation is strict: unknown object properties are rejected unless explicitly documented.
3. Authoritative writes require provenance and emit an audit event in the same transaction.
4. AI endpoints create explanations or proposals only.
5. Assurance fields are server-derived and read-only.
6. All IDs, times, enums, entities, relations, and provenance conform to `DATA_MODEL.md`.
7. API v1 uses additive-compatible evolution only. Removing/renaming fields or changing semantics requires `/api/v2`.

## 2. HTTP conventions

### Required headers

| Header | Use |
|---|---|
| `Accept: application/json` | All API requests; `406` for unsupported values |
| `Content-Type: application/json` | Requests with JSON bodies; `415` otherwise |
| `Origin` | Required for browser state-changing requests; exact local allowlist match |
| `If-Match: "{revision}"` | Updates/deletes/transitions of existing aggregates |
| `Idempotency-Key` | Required where noted; 16–128 visible ASCII characters |
| `X-Request-Id` | Optional client UUID; server generates one if absent |

Every response includes `X-Request-Id`. Mutable aggregate responses include `ETag: "{revision}"`. Collection/query responses include `ETag` based on workspace graph revision and normalized query.

### Success envelope

Single resource:

```json
{
  "data": {},
  "meta": {
    "requestId": "01991a61-02f2-72f1-a439-fac41d044bd3",
    "graphRevision": 42
  }
}
```

Collection:

```json
{
  "data": [],
  "meta": {
    "requestId": "01991a61-02f2-72f1-a439-fac41d044bd3",
    "graphRevision": 42,
    "page": {"limit": 50, "nextCursor": null}
  }
}
```

`graphRevision` is the latest committed workspace audit sequence visible to the response snapshot.

### Error envelope

```json
{
  "error": {
    "code": "RELATION_ENDPOINT_TYPE_INVALID",
    "message": "CONTROL_MITIGATES requires a control source and risk, threat, or vulnerability target.",
    "requestId": "01991a61-02f2-72f1-a439-fac41d044bd3",
    "details": [
      {
        "path": "/type",
        "code": "ENDPOINT_TYPE_MISMATCH",
        "message": "The selected endpoint types are not allowed for this relation type."
      }
    ],
    "retryable": false
  }
}
```

Rules:

- `code` is a stable uppercase machine identifier.
- `message` is safe for display and contains no stack, SQL, local path, secret, or evidence content.
- `details` is an ordered array; `path` is an RFC 6901 JSON Pointer relative to the request body, or an empty string for request-wide errors.
- Multiple validation errors are returned together where safe.
- Unknown exceptions map to `500 INTERNAL_ERROR` with an empty `details` array.

### Status and error codes

| HTTP | Stable codes |
|---:|---|
| 400 | `MALFORMED_JSON`, `INVALID_REQUEST`, `INVALID_CURSOR`, `INVALID_IDEMPOTENCY_KEY` |
| 403 | `ORIGIN_NOT_ALLOWED`, `AUTHORITATIVE_AI_ACTION_FORBIDDEN` |
| 404 | `WORKSPACE_NOT_FOUND`, `ENTITY_NOT_FOUND`, `RELATION_NOT_FOUND`, `EXECUTION_NOT_FOUND`, `PROPOSAL_NOT_FOUND` |
| 406 | `NOT_ACCEPTABLE` |
| 409 | `DUPLICATE_RELATION`, `IDEMPOTENCY_CONFLICT`, `INVALID_STATE_TRANSITION`, `RELATION_ENDPOINT_TYPE_INVALID`, `GRAPH_INVARIANT_VIOLATION` |
| 412 | `REVISION_MISMATCH` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 421 | `HOST_NOT_ALLOWED` |
| 422 | `DOMAIN_VALIDATION_FAILED`, `PROVENANCE_INVALID`, `EVIDENCE_REQUIRED`, `UNVERIFIED_INPUT`, `IMPORT_VALIDATION_FAILED` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR`, `PROJECTION_UNAVAILABLE` |
| 503 | `DATABASE_UNAVAILABLE`, `AI_PROVIDER_UNAVAILABLE`, `WORKSPACE_MIGRATION_REQUIRED` |
| 507 | `STORAGE_CAPACITY_EXCEEDED` |

Validation syntax/type/required-field failures use `400 INVALID_REQUEST`; syntactically valid requests violating domain rules use `409` or `422` as listed.

### Concurrency and idempotency

- `If-Match` contains the quoted integer revision returned by the resource ETag. Missing it on protected writes returns `428 PRECONDITION_REQUIRED`; mismatch returns `412 REVISION_MISMATCH` with `details[0].message` identifying the current revision but not mutating data.
- Idempotency is scoped to `(workspaceId, endpoint intent, Idempotency-Key)` for 24 hours.
- Repeating the same key and canonical request returns the original status/body with `Idempotency-Replayed: true`.
- Reusing a key with a different canonical request returns `409 IDEMPOTENCY_CONFLICT`.

### Pagination and sorting

- Cursor pagination only. `limit` defaults to 50, max 200 unless a graph endpoint declares lower topology limits.
- Cursor is opaque, URL-safe, and bound to the normalized filters/sort and graph revision. A mismatched or malformed cursor returns `400 INVALID_CURSOR`.
- Default entity sort is `(name ASC, id ASC)`. Default audit sort is `(sequence DESC)`.
- Closed `sort` values are endpoint-specific; free-form field names are rejected.

## 3. Provenance input

Authoritative commands embed:

```json
{
  "provenance": {
    "authority": "human",
    "actor": {
      "id": "01991a56-3a28-7b8a-8dd6-b643ecbbd923",
      "type": "human",
      "displayName": "Corey",
      "toolName": null,
      "toolVersion": null
    },
    "source": {
      "kind": "consultant_observation",
      "uri": null,
      "externalId": null,
      "contentSha256": null,
      "observedAt": "2026-09-06T18:30:00.000Z"
    },
    "note": "Confirmed during assessment interview",
    "supersedesId": null
  }
}
```

Clients cannot supply provenance `id`, `workspaceId`, or `assertedAt`; the server assigns them. An AI actor/authority on a command that would establish authoritative truth returns `403 AUTHORITATIVE_AI_ACTION_FORBIDDEN`.

## 4. Health and workspace intent

### `GET /health`

Process liveness only; does not open or mutate a workspace.

`200`:

```json
{"data":{"status":"ok","version":"0.1.0"},"meta":{"requestId":"..."}}
```

### `GET /ready`

Checks database adapter and active workspace schema. Returns `200` with `status: ready` or `503 DATABASE_UNAVAILABLE`/`WORKSPACE_MIGRATION_REQUIRED`.

### `POST /workspaces` — establish an assessment workspace

Request:

```json
{
  "name": "Acme Customer Portal",
  "description": "Assessment of the public customer web application.",
  "application": {
    "name": "Customer Portal",
    "description": "Public customer-facing web app.",
    "criticality": "critical",
    "owner": "Application Engineering",
    "labels": ["internet-facing"],
    "attributes": {
      "environment": "production",
      "baseUrls": ["https://portal.example.test"],
      "dataClassification": "confidential"
    }
  },
  "assurancePolicy": {
    "defaultEvidenceValiditySeconds": 7776000,
    "staleWarningSeconds": 1209600,
    "requireEvidenceForManualValidation": true,
    "requireVerifiedRelations": true,
    "ruleVersion": "1.0.0"
  },
  "provenance": {}
}
```

Creates the workspace and exactly one central application entity atomically. Returns `201`, `Location: /api/v1/workspaces/{workspaceId}`, workspace data, and ETag.

### `GET /workspaces/{workspaceId}`

Returns workspace settings, central application ID, revision, graph counts by entity/relation type, and assurance counts.

### `PATCH /workspaces/{workspaceId}/assurance-policy` — change evaluation policy

Requires `If-Match` and human provenance. Body contains the complete `assurancePolicy` and `provenance`. Returns `200`. A rule version unsupported by the running app returns `422 DOMAIN_VALIDATION_FAILED`. Policy change invalidates/rebuilds projections.

## 5. Entity intents

### `POST /workspaces/{workspaceId}/entities` — record assessment context

Request:

```json
{
  "type": "control",
  "name": "Login rate limiting",
  "description": "Limit repeated authentication attempts.",
  "lifecycleStatus": "active",
  "criticality": "high",
  "owner": "Identity Team",
  "labels": ["authentication"],
  "attributes": {
    "controlKind": "preventive",
    "implementationStatus": "implemented",
    "evidenceValiditySeconds": 7776000
  },
  "provenance": {}
}
```

Returns `201` with entity, computed assurance when applicable, provenance ID, audit sequence, Location, and ETag. The server rejects unknown type-specific attributes.

### `GET /workspaces/{workspaceId}/entities/{entityId}` — inspect an object

Returns:

```json
{
  "data": {
    "entity": {},
    "assurance": null,
    "relationshipCounts": [
      {"type":"CONTROL_MITIGATES","direction":"outgoing","verified":2,"proposed":1}
    ],
    "relatedFindingCount": 1,
    "affectedRequirementCount": 3
  },
  "meta": {"requestId":"...","graphRevision":42}
}
```

Assurance is non-null for controls and requirements and may be requested for objective/risk summaries with `?include=assurance`.

### `PATCH /workspaces/{workspaceId}/entities/{entityId}` — revise assessment context

Requires `If-Match`. Body is JSON Merge Patch semantics over mutable fields plus required `provenance`; `type`, IDs, revisions, timestamps, content hash/object key, and derived fields are immutable. Explicit `null` clears nullable fields. Returns `200` and new ETag.

### `POST /workspaces/{workspaceId}/entities/{entityId}/retire`

Requires `If-Match`; body `{ "reason": "...", "provenance": {} }`. Sets lifecycle to `retired`; does not delete history. Returns `200`.

### `DELETE /workspaces/{workspaceId}/entities/{entityId}`

Intent is **remove an erroneous record**, not cascade deletion. Requires `If-Match` and body `{ "reason": "...", "provenance": {} }`. If active relations reference the entity, returns `409 GRAPH_INVARIANT_VIOLATION` with relation IDs. On success returns `204`; record is soft-deleted.

### `GET /workspaces/{workspaceId}/entities`

Filters: `type` (repeatable), `lifecycleStatus`, `label`, `assuranceState`, `q`, `sort=name|-name|updatedAt|-updatedAt`, `limit`, `cursor`. Search is bounded literal/full-text search, not user-supplied SQL syntax.

## 6. Relationship intents

### `POST /workspaces/{workspaceId}/relationships` — connect assurance context

Request:

```json
{
  "type": "CONTROL_MITIGATES",
  "fromEntityId": "01991a58-e437-75e2-a6cc-cf0766379009",
  "toEntityId": "01991a58-4ac0-71c9-90d0-00a5bd676e58",
  "importance": 4,
  "rationale": "Rate limiting reduces automated credential attacks.",
  "verificationStatus": "verified",
  "provenance": {}
}
```

Returns `201`, Location, and ETag. Endpoint types, workspace ownership, duplicate key, verification authority, and refinement cycles are checked in the transaction.

### `POST /workspaces/{workspaceId}/relationships/{relationId}/verify`

Requires `If-Match` and human/deterministic provenance. Body:

```json
{"rationale":"Confirmed against application design.","provenance":{}}
```

Allowed only from `proposed`; returns `200` with status `verified`, new provenance, and revision.

### `POST /workspaces/{workspaceId}/relationships/{relationId}/reject`

Requires `If-Match` and human provenance. Body contains non-empty `rationale` and `provenance`. Allowed only from `proposed`; returns `200` with `rejected` status. Rejected edges are excluded from normal graph queries.

### `PATCH /workspaces/{workspaceId}/relationships/{relationId}`

Requires `If-Match`; only `importance`, `rationale`, and provenance may be changed. Endpoint/type changes require deleting and recreating the relationship.

### `DELETE /workspaces/{workspaceId}/relationships/{relationId}`

Requires `If-Match` and body reason/provenance. Soft deletes and returns `204`.

## 7. Validation and evidence intents

### `POST /workspaces/{workspaceId}/evidence:prepare` — allocate evidence ingestion

Required `Idempotency-Key`. Request:

```json
{
  "fileName": "rate-limit-results.json",
  "mediaType": "application/json",
  "sizeBytes": 48122,
  "contentSha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "capturedAt": "2026-09-06T18:45:00.000Z",
  "validUntil": null,
  "confidentiality": "confidential"
}
```

Returns `201` with an opaque `ingestionId`, accepted size/hash, and a same-origin upload target. It does not create authoritative evidence.

### `PUT /workspaces/{workspaceId}/evidence-ingestions/{ingestionId}/content`

Uploads bytes with the declared media type and exact `Content-Length`; no JSON envelope. Server streams to a managed temporary object while hashing and enforcing limits. Hash/size mismatch deletes staging content and returns `422 DOMAIN_VALIDATION_FAILED`. Returns `204`.

### `POST /workspaces/{workspaceId}/evidence-ingestions/{ingestionId}/commit`

Required `Idempotency-Key`. Request:

```json
{
  "name": "Rate-limit test output",
  "description": "Results from the approved validation procedure.",
  "owner": "Identity Team",
  "labels": ["authentication"],
  "evidenceKind": "tool_output",
  "provenance": {}
}
```

Verifies staged bytes, atomically moves them into content-addressed storage, creates the evidence entity and audit/provenance records, and returns `201`. Failed database commit removes or safely garbage-collects the unreferenced object. Executable media, path traversal, symlink/reparse-point content, and mismatched declarations are rejected.

### `POST /workspaces/{workspaceId}/validations/{validationEntityId}/executions` — record validation result

Required `Idempotency-Key`. Request:

```json
{
  "outcome": "pass",
  "startedAt": "2026-09-06T18:45:00.000Z",
  "completedAt": "2026-09-06T18:46:12.000Z",
  "validUntil": null,
  "summary": "All configured checks passed.",
  "toolExecutionId": null,
  "evidenceEntityIds": ["01991a5b-6669-7c75-b537-779e67d931cd"],
  "provenance": {}
}
```

Returns `201` with execution, newly evaluated control assurance, and affected requirement summaries. The server derives `validUntil` when null and returns the effective value. Missing evidence or support relations returns `422 EVIDENCE_REQUIRED`/`UNVERIFIED_INPUT`.

### `GET /workspaces/{workspaceId}/validations/{validationEntityId}/executions`

Cursor-paginated, newest completion first. Optional `asOf` is allowed only for historical read/query and must not be in the future.

### `POST /workspaces/{workspaceId}/validation-executions/{executionId}/supersede`

Requires `If-Match` and `Idempotency-Key`. Body uses the execution request schema plus `reason` and provenance whose `supersedesId` points at the earlier provenance. Creates a new immutable execution and returns `201`; it never updates the old row.

### `GET /workspaces/{workspaceId}/evidence/{evidenceId}/content`

Streams bytes only after resolving the managed object key from the workspace database. Headers include exact `Content-Type`, `Content-Length`, `ETag` as content SHA-256, `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, and a restrictive CSP. No range support in v1.

## 8. Graph and assurance query intents

### `GET /workspaces/{workspaceId}/graph`

Returns a bounded overview. Filters: `entityType`, `relationType`, `verificationStatus=verified|proposed`, `assuranceState`, and cursor. Default excludes rejected/deleted records and includes both verified and proposed edges with explicit status.

```json
{
  "data": {
    "nodes": [{"entity":{},"assurance":null}],
    "edges": [{"relation":{}}]
  },
  "meta": {
    "requestId":"...",
    "graphRevision":42,
    "page":{"nodeLimit":500,"edgeLimit":1000,"nextCursor":null}
  }
}
```

### `GET /workspaces/{workspaceId}/graph/focus/{entityId}`

Intent: preserve a selected object while reducing unrelated context. Query:

- `category`: optional relation type;
- `direction`: `incoming|outgoing|both`, default `both`;
- `depth`: integer `1..3`, default `1`;
- `verificationStatus`: repeatable, default `verified,proposed`;
- `nodeLimit`: default/max 500;
- `edgeLimit`: default/max 1,000.

Returns selected node, focused nodes/edges, relationship counts by category/status/direction, omitted counts, and deterministic breadcrumbs to the central application. Traversal is cycle-safe and stable-sorted by hop, relation type, entity name, then ID. If limits truncate results, `meta.truncated = true`; the server never silently omits without counts.

### `GET /workspaces/{workspaceId}/assurance/{entityId}`

Returns the normative projection shape from `DATA_MODEL.md`. Optional `asOf` supports historical evaluation but is capped at current server time. Optional `ruleVersion` must be installed. It uses the committed snapshot identified by `graphRevision`; response includes all reason/input IDs.

### `POST /workspaces/{workspaceId}/impact-analysis` — assess obligation impact

Request:

```json
{
  "startingEntityIds": ["01991a58-4ac0-71c9-90d0-00a5bd676e58"],
  "includeStates": ["failed","unsupported","expired","partial","stale"],
  "maxDepth": 8
}
```

Read-only despite POST because the bounded structured query may exceed safe query-string size. Returns affected objectives, risks, controls, validations, evidence, and requirements with explicit verified relation paths and assurance reasons. It never traverses proposed/rejected edges. Maximum 20 starting IDs and depth 8.

### `GET /workspaces/{workspaceId}/audit-events`

Filters: `aggregateId`, `intent`, `actorId`, `afterSequence`, `limit`, `cursor`. Returns redacted immutable events. It never returns evidence content, local paths, SQL, or full prompts.

## 9. AI analysis and proposal intents

### `POST /workspaces/{workspaceId}/analyses:explain`

Required `Idempotency-Key`. Request:

```json
{
  "question": "Why is login assurance stale?",
  "contextEntityIds": ["01991a58-e437-75e2-a6cc-cf0766379009"],
  "includeEvidenceExcerpts": false
}
```

Returns `200`:

```json
{
  "data": {
    "answer": "The latest supporting evidence is within its stale-warning window.",
    "citations": [{"entityId":"...","projectionInputId":"..."}],
    "authority":"ai",
    "disclaimer":"AI-generated explanation; not an authoritative assurance record.",
    "model":"qwen2.5-coder:14b"
  },
  "meta":{"requestId":"...","graphRevision":42}
}
```

The application supplies structured, size-bounded context; the model cannot query repositories or write records. Invalid/nonexistent citations are removed and disclosed. Provider unavailable returns `503 AI_PROVIDER_UNAVAILABLE`; deterministic assurance remains available.

### `POST /workspaces/{workspaceId}/proposals:relationships`

Required `Idempotency-Key`. Body contains `contextEntityIds` (1–20) and optional `instruction` (max 1,000). Creates only pending proposal records with AI provenance and returns `201`. Proposed payloads must pass basic schema/endpoint checks but remain unverified.

### `GET /workspaces/{workspaceId}/proposals`

Filters: `status`, `kind`, `contextEntityId`, pagination. Pending first, then creation time.

### `POST /workspaces/{workspaceId}/proposals/{proposalId}/accept`

Requires human provenance and `Idempotency-Key`. Revalidates against the current graph, creates a new verified relation with human provenance, marks proposal accepted, and returns `201` with both IDs. The AI provenance is retained on the proposal only.

### `POST /workspaces/{workspaceId}/proposals/{proposalId}/reject`

Requires human provenance and a non-empty reason. Marks proposal rejected; returns `200`. It creates no graph relationship.

## 10. Transfer intents

### `POST /workspaces/{workspaceId}/exports` — create a portable backup

Required `Idempotency-Key`. Request:

```json
{"includeEvidence":true,"destinationToken":"opaque-picker-token"}
```

`destinationToken` is issued by a trusted local picker integration and cannot be an arbitrary web-supplied path. Returns `202` with `operationId`. Export is a consistent snapshot with manifest/schema/app versions and SHA-256 checksums.

### `POST /imports:inspect`

Required `Idempotency-Key`. Body uses an opaque picker token. Returns `200` with manifest, checksum/schema validation, counts, warnings, and a short-lived `importToken`. No active workspace changes occur.

### `POST /imports/{importToken}:commit`

Required `Idempotency-Key`, explicit `expectedManifestSha256`, and human provenance. Validates again, writes to a new workspace database, then makes it available. Returns `201`. It never overwrites an active workspace.

### `GET /operations/{operationId}`

Returns `pending|running|succeeded|failed`, safe progress fields, and result/error. Operation logs follow the same redaction rules as API errors.

## 11. Local-host security contract

Before body parsing and route dispatch:

- Listener is loopback-only.
- Allowed hosts are exact configured `host:port` authorities. `localhost` is not treated as equivalent unless explicitly configured.
- Missing/malformed/unapproved Host returns `421 HOST_NOT_ALLOWED`.
- State-changing browser requests require an exact allowed Origin. `Origin: null`, wildcard, regex/suffix matches, and reflected values are forbidden.
- A present disallowed Origin on a safe request returns `403 ORIGIN_NOT_ALLOWED`.
- `trustProxy` is false and forwarded host/origin headers are ignored.
- CORS sends one exact origin and `Vary: Origin`; allowed methods are `GET, POST, PUT, PATCH, DELETE, OPTIONS`; allowed headers are `Accept, Content-Type, If-Match, Idempotency-Key, X-Request-Id`.
- Preflight requests are subjected to Host and Origin checks and do not reveal route metadata to disallowed origins.
- JSON and upload body limits apply before allocation; compressed request bodies are disabled in v1.
- The API never returns local absolute paths.

## 12. Contract verification

Release gates must verify:

1. Every documented JSON example validates against the versioned request/response schema.
2. Every route rejects additional properties and invalid enums/IDs/timestamps.
3. Every existing-resource mutation enforces `If-Match` before state change.
4. Idempotent replay and conflicting-key behavior are tested.
5. Every authoritative command persists aggregate, provenance, and audit event atomically.
6. AI authority is rejected from authoritative endpoints and accepted proposals gain new human provenance.
7. Assurance API fixtures match the deterministic rules and precedence in `DATA_MODEL.md`.
8. Host/Origin tests cover IPv4, optional IPv6, DNS-rebinding hosts, `null` origin, malformed authority, preflight, and absent Origin from a local CLI.
9. Evidence ingestion verifies hash/size and cannot escape managed storage.
10. Graph truncation, counts, ordering, and cursors are deterministic at a fixed graph revision.
