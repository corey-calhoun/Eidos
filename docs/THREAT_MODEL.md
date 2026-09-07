# Initial Threat Model

## Protected assets

- Client scope and engagement metadata
- Application architecture and dependency information
- Security findings and consultant notes
- Graph entities, relationships, confidence, and lifecycle state
- Validation results and assurance calculations
- Evidence provenance, hashes, timestamps, and sources
- Policies and framework mappings
- Exports and reports
- Audit history

## Threat actors

- Malicious or compromised client-supplied content
- Unauthorized local user
- Hostile website targeting a loopback service
- Compromised dependency or build tool
- Prompt injection embedded in imported content
- Accidental consultant error
- Future cross-tenant attacker

## Principal threats

| Threat | Impact | Initial treatment |
|---|---|---|
| Invalid graph import | Misleading assurance conclusions | Strict schema and semantic validation; fail closed |
| Stored script content | Local session compromise | Text-only rendering and contextual encoding |
| AI authority confusion | False verified assurance | Separate proposal and verified states; human verification required |
| Evidence tampering | Unsupported assurance claim | Hash evidence and bind hash to provenance and audit history |
| Loopback API abuse | Unauthorized local changes | Loopback binding, Host/Origin checks, restrictive CORS, state-change protection |
| Path traversal in evidence import | Arbitrary file access or overwrite | Generated names, canonical managed root, traversal and symlink rejection |
| Sensitive-data leakage | Client confidentiality breach | Local-first storage, no telemetry by default, log redaction, Git exclusions |
| Dependency compromise | Developer or runtime compromise | Exact versions, disabled lifecycle scripts, audit, SBOM, minimal dependencies |
| Cross-workspace access | Client data exposure | Workspace-scoped authorization before multi-workspace or hosted use |
| Stale evidence | Incorrect assurance status | Explicit review date and deterministic stale state |

## Security invariants

- A proposal is never equivalent to a verified relationship.
- An assurance result is derived, not directly assigned.
- Every authoritative relationship has provenance.
- Every evidence-backed claim identifies its evidence and verification actor.
- Identical trusted inputs produce an identical assurance result.
- Invalid or ambiguous input cannot partially mutate authoritative state.
