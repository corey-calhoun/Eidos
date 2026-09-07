# Eidos Data Model

> [!IMPORTANT]
> **Historical assessment-prototype model.** The graph entities and SQLite snapshot below describe the preserved `d79fa56` prototype. The current catalog model is implemented and strictly validated in `src/domain/catalog.ts`; [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) and [ACCEPTANCE.md](./ACCEPTANCE.md) govern product direction.

**Status:** Historical prototype contract; not normative for the catalog
**Schema version:** `1.0.0`
**Related documents:** [ARCHITECTURE.md](./ARCHITECTURE.md), [API_CONTRACTS.md](./API_CONTRACTS.md)

## 1. Conventions

- IDs are lowercase UUIDv7 strings in canonical hyphenated form.
- Times are RFC 3339 UTC strings with millisecond precision, for example `2026-09-06T18:30:00.000Z`.
- Durations are positive integer seconds.
- Revisions are positive integers, starting at `1`, incremented once per successful aggregate mutation.
- User-authored display text is Unicode, trimmed, and stored as entered after line-ending normalization. Search normalization is derived and never replaces source text.
- `null` means explicitly absent; omitted fields mean not supplied by a request. Stored records use explicit nullable fields.
- Extensible metadata is prohibited on authoritative records. New fields require a schema migration. Namespaced extension data may be added only through a future explicit contract.
- Soft-deleted aggregates remain addressable through audit/history APIs but are excluded from normal graph and assurance queries.

## 2. Enumerations

### Entity types

```text
business_objective | application | asset | dependency | threat |
vulnerability | risk | control | validation | evidence | requirement
```

`application` is the central assessed web application. `validation` represents a repeatable validation definition; its executions are separate records. `evidence` represents an evidence object and its observation metadata.

### Relation types and valid direction

| Relation type | From | To | Meaning |
|---|---|---|---|
| `OBJECTIVE_DEPENDS_ON_ASSET` | `business_objective` | `asset` or `application` | Objective relies on the target |
| `APPLICATION_USES_ASSET` | `application` | `asset` | Application uses or contains asset |
| `ASSET_DEPENDS_ON` | `asset` or `application` | `dependency` or `asset` | Runtime/operational dependency |
| `THREAT_TARGETS` | `threat` | `application`, `asset`, or `dependency` | Threat acts against target |
| `VULNERABILITY_AFFECTS` | `vulnerability` | `application`, `asset`, or `dependency` | Weakness affects target |
| `THREAT_EXPLOITS` | `threat` | `vulnerability` | Threat can exploit weakness |
| `RISK_ARISES_FROM_THREAT` | `risk` | `threat` | Risk scenario includes threat |
| `RISK_ARISES_FROM_VULNERABILITY` | `risk` | `vulnerability` | Risk scenario includes weakness |
| `RISK_IMPACTS_OBJECTIVE` | `risk` | `business_objective` | Risk impacts objective |
| `CONTROL_MITIGATES` | `control` | `risk`, `threat`, or `vulnerability` | Control reduces target exposure |
| `CONTROL_PROTECTS` | `control` | `application`, `asset`, or `dependency` | Control protects target directly |
| `VALIDATION_CHECKS_CONTROL` | `validation` | `control` | Validation tests control |
| `EVIDENCE_SUPPORTS_VALIDATION` | `evidence` | `validation` | Evidence supports a validation definition/execution |
| `EVIDENCE_SUPPORTS_CONTROL` | `evidence` | `control` | Evidence directly supports control operation |
| `REQUIREMENT_REQUIRES_CONTROL` | `requirement` | `control` | Requirement expects control |
| `REQUIREMENT_ADDRESSES_RISK` | `requirement` | `risk` | Requirement is relevant to risk |
| `ENTITY_REFINES` | same entity type | same entity type | Child refines parent; acyclic |

Direction is semantic and canonical. Clients do not reverse it for presentation. Unsupported endpoint/type combinations are invalid.

### Other enums

```text
verificationStatus = proposed | verified | rejected
authority           = human | deterministic | imported | ai
actorType           = human | system | tool | ai
lifecycleStatus     = draft | active | retired
criticality         = low | medium | high | critical
validationMethod    = manual | automated | hybrid
executionOutcome    = pass | fail | inconclusive | error
assuranceState      = validated | partial | stale | expired | unsupported | failed | not_applicable
riskLevel           = low | medium | high | critical
```

## 3. Common value objects

### Actor

```json
{
  "id": "01991a56-3a28-7b8a-8dd6-b643ecbbd923",
  "type": "human",
  "displayName": "Corey",
  "toolName": null,
  "toolVersion": null
}
```

Rules:

- `displayName`: 1–120 characters.
- `toolName` and `toolVersion` are required for `tool`, `system`, or `ai` actors and null for human actors unless a human acted through a named client.
- An AI actor can only produce provenance with `authority: "ai"`.

### Source reference

```json
{
  "kind": "consultant_observation",
  "uri": null,
  "externalId": null,
  "contentSha256": null,
  "observedAt": "2026-09-06T18:30:00.000Z"
}
```

`kind` is one of:

```text
consultant_observation | tool_execution | imported_artifact |
evidence_object | deterministic_rule | ai_generation
```

Rules:

- `uri` is an absolute `https`, `http`, or `urn` URI, max 2,048 characters; local filesystem paths are not exposed here.
- `externalId` is max 256 characters.
- `contentSha256`, when present, is exactly 64 lowercase hexadecimal characters.
- `observedAt` is required and cannot be more than five minutes in the future relative to command receipt.
- `tool_execution` requires an external execution identifier or content hash.
- `imported_artifact` and `evidence_object` require `contentSha256`.

### Provenance

```json
{
  "id": "01991a56-6c54-7c31-9a01-7fe5df23b694",
  "workspaceId": "01991a55-f879-7c7c-ae1a-12ad5f84ce42",
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
  "assertedAt": "2026-09-06T18:31:04.000Z",
  "note": "Confirmed in architecture interview",
  "supersedesId": null
}
```

Rules:

- Immutable and append-only.
- `note`: nullable, max 2,000 characters.
- `assertedAt` is assigned by the server clock.
- `authority: ai` requires actor type and source kind `ai`/`ai_generation`.
- `authority: deterministic` requires a system/tool actor and `deterministic_rule` or `tool_execution` source.
- `supersedesId`, when present, refers to older provenance in the same workspace; cycles are invalid.
- Imported facts are not considered authoritative for assurance until an explicit acceptance command creates human or deterministic provenance.

## 4. Core records

### Workspace

```json
{
  "id": "01991a55-f879-7c7c-ae1a-12ad5f84ce42",
  "name": "Acme Customer Portal",
  "description": "Assessment of the public customer web application.",
  "applicationEntityId": "01991a57-064e-74cf-87ec-52986a56a68e",
  "assurancePolicy": {
    "defaultEvidenceValiditySeconds": 7776000,
    "staleWarningSeconds": 1209600,
    "requireEvidenceForManualValidation": true,
    "requireVerifiedRelations": true,
    "ruleVersion": "1.0.0"
  },
  "revision": 1,
  "createdAt": "2026-09-06T18:30:00.000Z",
  "updatedAt": "2026-09-06T18:30:00.000Z"
}
```

Rules:

- `name`: 1–160 characters; `description`: 0–4,000.
- Exactly one active `application` entity is referenced by `applicationEntityId` after workspace setup.
- Durations range from 3,600 to 31,536,000 seconds.
- `staleWarningSeconds` must be less than the applicable validity duration.
- Workspace policy revisions trigger rebuild of assurance projections.

### Entity

```json
{
  "id": "01991a57-064e-74cf-87ec-52986a56a68e",
  "workspaceId": "01991a55-f879-7c7c-ae1a-12ad5f84ce42",
  "type": "application",
  "name": "Customer Portal",
  "description": "Public web application used by customers.",
  "lifecycleStatus": "active",
  "criticality": "critical",
  "owner": "Application Engineering",
  "labels": ["internet-facing", "tier-1"],
  "attributes": {},
  "provenanceId": "01991a56-6c54-7c31-9a01-7fe5df23b694",
  "revision": 1,
  "createdAt": "2026-09-06T18:31:04.000Z",
  "updatedAt": "2026-09-06T18:31:04.000Z",
  "deletedAt": null
}
```

Common rules:

- `name`: 1–200; `description`: 0–10,000; `owner`: nullable, max 200.
- `labels`: at most 20 unique lowercase labels matching `^[a-z0-9][a-z0-9._-]{0,62}$`, sorted lexically in canonical responses.
- `attributes` must exactly match the type-specific schema below; unknown keys are rejected.
- A deleted entity cannot be the endpoint of a new relation.
- Entity type is immutable. Correct a wrong type by superseding/deleting and recreating.

Type-specific `attributes`:

| Type | Exact fields |
|---|---|
| `business_objective` | `successMeasure: string|null`, `priority: 1..5` |
| `application` | `environment: development|test|staging|production`, `baseUrls: https URL[]`, `dataClassification: public|internal|confidential|restricted` |
| `asset` | `assetKind: data|service|identity|endpoint|infrastructure|process`, `identifier: string|null`, `dataClassification: public|internal|confidential|restricted|null` |
| `dependency` | `dependencyKind: software|service|infrastructure|vendor|human`, `supplier: string|null`, `version: string|null` |
| `threat` | `category: string`, `threatActor: string|null`, `likelihood: 1..5` |
| `vulnerability` | `identifier: string|null`, `severity: low|medium|high|critical`, `status: open|accepted|remediated|false_positive`, `discoveredAt: timestamp`, `remediatedAt: timestamp|null` |
| `risk` | `likelihood: 1..5`, `impact: 1..5`, `inherentLevel: riskLevel`, `residualLevel: riskLevel|null`, `treatment: mitigate|accept|avoid|transfer|undecided` |
| `control` | `controlKind: preventive|detective|corrective|compensating`, `implementationStatus: planned|partial|implemented|not_applicable`, `evidenceValiditySeconds: integer|null` |
| `validation` | `method: validationMethod`, `procedure: string`, `cadenceSeconds: integer|null`, `required: boolean` |
| `evidence` | `evidenceKind: document|screenshot|log|report|attestation|tool_output`, `mediaType: string`, `contentSha256: string`, `sizeBytes: integer`, `objectKey: string`, `capturedAt: timestamp`, `validUntil: timestamp|null`, `confidentiality: internal|confidential|restricted` |
| `requirement` | `framework: string`, `reference: string`, `version: string|null`, `applicability: applicable|not_applicable|undetermined`, `applicabilityRationale: string|null` |

Additional constraints:

- Risk `inherentLevel` must equal the configured 5x5 matrix result for likelihood and impact at write time; the server computes it and rejects a conflicting supplied value.
- `residualLevel` is a consultant-authored assessment, not automatically overwritten by assurance.
- A remediated vulnerability requires `remediatedAt`; other statuses require it to be null.
- Evidence `objectKey` is server-generated, relative, opaque, and never a user filesystem path.
- Evidence content is immutable. Replacing bytes creates a new evidence entity/hash.
- A `not_applicable` requirement requires a non-empty rationale and human provenance.

### Relation

```json
{
  "id": "01991a59-a936-78dd-a8a5-71db08947651",
  "workspaceId": "01991a55-f879-7c7c-ae1a-12ad5f84ce42",
  "type": "CONTROL_MITIGATES",
  "fromEntityId": "01991a58-e437-75e2-a6cc-cf0766379009",
  "toEntityId": "01991a58-4ac0-71c9-90d0-00a5bd676e58",
  "verificationStatus": "verified",
  "importance": 4,
  "rationale": "Rate limiting reduces automated credential attacks.",
  "provenanceId": "01991a56-6c54-7c31-9a01-7fe5df23b694",
  "revision": 1,
  "createdAt": "2026-09-06T18:40:00.000Z",
  "updatedAt": "2026-09-06T18:40:00.000Z",
  "deletedAt": null
}
```

Rules:

- `importance`: integer 1–5; `rationale`: 1–4,000.
- Endpoints must exist, be active, and belong to the same workspace.
- Relation type and endpoint types must match the closed table above.
- Unique active relation key: `(workspaceId, type, fromEntityId, toEntityId)`.
- Self-relations are forbidden except `ENTITY_REFINES`; refinement must remain acyclic.
- `verified` requires human or deterministic provenance.
- `proposed` permits AI/imported provenance but is excluded from authoritative assurance.
- `rejected` requires human provenance and a rationale; it remains in history but not the active graph.
- Verification is a command that creates new provenance and increments revision; it does not replace the original provenance record.

### Validation execution

```json
{
  "id": "01991a5a-7f1b-7834-b6ae-ea0114f2b32a",
  "workspaceId": "01991a55-f879-7c7c-ae1a-12ad5f84ce42",
  "validationEntityId": "01991a59-cb63-77b0-b183-69f3e4a54773",
  "outcome": "pass",
  "startedAt": "2026-09-06T18:45:00.000Z",
  "completedAt": "2026-09-06T18:46:12.000Z",
  "validUntil": "2026-12-05T18:46:12.000Z",
  "summary": "All configured rate-limit checks passed.",
  "toolExecutionId": null,
  "evidenceEntityIds": ["01991a5b-6669-7c75-b537-779e67d931cd"],
  "provenanceId": "01991a56-6c54-7c31-9a01-7fe5df23b694",
  "revision": 1,
  "createdAt": "2026-09-06T18:46:20.000Z"
}
```

Rules:

- Execution is immutable after recording. Correction creates a superseding execution and provenance; the earlier execution remains auditable.
- `completedAt >= startedAt`; duration may not exceed seven days.
- `validUntil > completedAt` and is bounded by validation cadence/control validity policy. If omitted, server derives it from the narrowest applicable policy.
- `summary`: 1–10,000.
- `pass` or `fail` requires human or deterministic provenance. AI may only propose a draft interpretation outside this record.
- Automated/hybrid execution requires `toolExecutionId`, system/tool provenance, and at least one evidence object.
- Manual pass requires evidence when workspace policy says so.
- Every evidence ID must be an active evidence entity in the workspace and connected to the validation or checked control by a verified support relation.

### Proposal

```json
{
  "id": "01991a5c-0447-7a28-bdca-2f17210d9e60",
  "workspaceId": "01991a55-f879-7c7c-ae1a-12ad5f84ce42",
  "kind": "relation",
  "payload": {
    "type": "CONTROL_MITIGATES",
    "fromEntityId": "01991a58-e437-75e2-a6cc-cf0766379009",
    "toEntityId": "01991a58-4ac0-71c9-90d0-00a5bd676e58",
    "importance": 3,
    "rationale": "Suggested from available context."
  },
  "status": "pending",
  "model": "qwen2.5-coder:14b",
  "promptTemplateVersion": "relation-suggestion/1.0.0",
  "provenanceId": "01991a5c-44f4-71d3-aa4c-2665adf74c30",
  "reviewedByProvenanceId": null,
  "createdAt": "2026-09-06T18:50:00.000Z",
  "reviewedAt": null
}
```

Rules:

- `kind`: `relation | explanation`; `status`: `pending | accepted | rejected | expired`.
- Proposal provenance is always AI and never an assurance input.
- Accepting a relation proposal validates current endpoints and creates a separate verified relation with new human provenance.
- Rejection records human provenance and does not create a relation.
- Prompt/context contents are not retained by default; only model/template identity and selected input IDs are retained in audit-safe metadata.

## 5. Deterministic assurance contract

### Inputs

For each control, evaluation considers only active records at `asOf`:

1. verified `VALIDATION_CHECKS_CONTROL` relations whose validation entity is active and `required = true`;
2. the latest non-superseded execution completed on or before `asOf` for each required validation;
3. evidence referenced by that execution and connected through a verified support relation;
4. the control's implementation status and applicable workspace freshness policy.

Proposed/rejected relations, AI provenance, deleted records, future executions, and imported records not explicitly accepted are ignored.

### Time boundaries

For an execution/evidence input:

- **expired** when `asOf >= validUntil`;
- **stale** when `validUntil - staleWarningSeconds <= asOf < validUntil`;
- **current** when `asOf < validUntil - staleWarningSeconds`.

If evidence has no `validUntil`, derive `capturedAt + control.evidenceValiditySeconds`, else `capturedAt + workspace.defaultEvidenceValiditySeconds`. The server stores the effective boundary in the projection explanation.

### Control state precedence

Evaluate top to bottom; the first matching rule wins:

| Priority | State | Deterministic condition | Reason code |
|---:|---|---|---|
| 1 | `not_applicable` | Control implementation is `not_applicable` with human provenance and all applicable linked requirements accept that disposition | `CONTROL_NOT_APPLICABLE` |
| 2 | `failed` | Any latest required execution has outcome `fail` | `REQUIRED_VALIDATION_FAILED` |
| 3 | `unsupported` | Control is not `implemented`, has no required validation, a required validation has no execution, required evidence is absent, or an input lacks authoritative provenance/verified relation | `CONTROL_NOT_IMPLEMENTED`, `NO_REQUIRED_VALIDATION`, `MISSING_EXECUTION`, `MISSING_EVIDENCE`, or `UNVERIFIED_INPUT` |
| 4 | `expired` | Any required latest passing execution or required evidence is expired | `ASSURANCE_INPUT_EXPIRED` |
| 5 | `partial` | Any latest required execution is `inconclusive`/`error`, or some non-required validation coverage is missing while all required checks otherwise pass | `INCONCLUSIVE_EXECUTION`, `EXECUTION_ERROR`, or `OPTIONAL_COVERAGE_MISSING` |
| 6 | `stale` | Any required latest passing execution or evidence is stale | `ASSURANCE_INPUT_STALE` |
| 7 | `validated` | Control is implemented; every required validation has a latest authoritative pass; all required evidence exists, is verified, and is current | `ALL_REQUIRED_CHECKS_CURRENT` |

A validation definition with `required = false` cannot cause `failed`, `unsupported`, `expired`, or `stale`; it can only distinguish `validated` from `partial` when optional coverage has previously been declared for that control.

### Requirement state

- `not_applicable`: requirement applicability is human-verified `not_applicable` with rationale.
- `unsupported`: applicable/undetermined requirement has no verified `REQUIREMENT_REQUIRES_CONTROL` relation.
- Otherwise evaluate all linked in-scope controls and choose the worst state by this total order:

```text
failed > unsupported > expired > partial > stale > validated
```

`not_applicable` controls are omitted. If all linked controls are `not_applicable`, requirement is `unsupported` unless the requirement itself is `not_applicable`.

### Objective and risk summaries

These are explanatory projections, not authored aggregate state:

- A risk summary considers controls connected by verified `CONTROL_MITIGATES` relations and reports their state counts plus the worst state. No controls means `unsupported`.
- An objective summary traverses only verified relations from objective to impacted risks and reports state counts. Traversal is cycle-safe and bounded by the allowed semantic paths.
- Authored `residualLevel` is displayed alongside, never recalculated or overwritten.

### Projection shape

```json
{
  "subjectId": "01991a58-e437-75e2-a6cc-cf0766379009",
  "subjectType": "control",
  "state": "stale",
  "reasonCodes": ["ASSURANCE_INPUT_STALE"],
  "inputIds": ["01991a5a-7f1b-7834-b6ae-ea0114f2b32a", "01991a5b-6669-7c75-b537-779e67d931cd"],
  "effectiveBoundaries": [{"inputId": "01991a5b-6669-7c75-b537-779e67d931cd", "validUntil": "2026-09-20T00:00:00.000Z"}],
  "evaluatedAt": "2026-09-06T19:00:00.000Z",
  "ruleVersion": "1.0.0",
  "graphRevision": 42
}
```

`reasonCodes` and `inputIds` are unique and lexically sorted. Canonical JSON serialization sorts object keys for hashes/fixtures. Projection caches are keyed by `(workspaceId, subjectId, graphRevision, policyRevision, asOfBucket, ruleVersion)` and are disposable.

## 6. Relational persistence schema

The repository adapter maps domain records to normalized tables:

- `workspaces`
- `entities`
- `entity_attributes` (canonical JSON constrained by domain schema)
- `relations`
- `validation_executions`
- `validation_execution_evidence`
- `provenance`
- `actors`
- `proposals`
- `audit_events`
- `assurance_projection_cache`
- `schema_migrations`

Required database constraints/indexes:

- foreign keys include `workspace_id` in parent uniqueness so cross-workspace references cannot be represented;
- unique active relation tuple via a partial unique index where `deleted_at IS NULL`;
- unique evidence `content_sha256` per workspace while allowing several semantic references to one managed object;
- indexes on entity `(workspace_id, type, lifecycle_status)`, relation endpoints/status/type, execution `(validation_entity_id, completed_at DESC)`, and evidence hash;
- `CHECK` constraints for closed enums, revision positivity, importance/rating bounds, timestamp ordering, and hash format;
- audit/provenance rows have no update/delete repository methods;
- application-level validation remains mandatory because SQLite constraints do not encode the complete relation matrix or assurance policy.

Canonical JSON is used only for bounded type-specific attributes and event summaries. Graph topology and queryable identifiers are never hidden in JSON blobs.

## 7. Audit event

```json
{
  "id": "01991a5d-30ea-796d-bef4-57a8c0806820",
  "workspaceId": "01991a55-f879-7c7c-ae1a-12ad5f84ce42",
  "sequence": 42,
  "intent": "record-validation-execution",
  "aggregateType": "validation_execution",
  "aggregateId": "01991a5a-7f1b-7834-b6ae-ea0114f2b32a",
  "aggregateRevision": 1,
  "actorId": "01991a56-3a28-7b8a-8dd6-b643ecbbd923",
  "provenanceId": "01991a56-6c54-7c31-9a01-7fe5df23b694",
  "change": {"outcome": {"before": null, "after": "pass"}},
  "occurredAt": "2026-09-06T18:46:20.000Z"
}
```

`sequence` is monotonically increasing per workspace and is the graph revision exposed to clients. Audit events are append-only. The change object contains field-level values for non-sensitive metadata; evidence bytes, secrets, local paths, and full AI prompts are excluded.
