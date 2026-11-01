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
| Sensitive-data leakage | Client confidentiality breach | Local-first storage, no telemetry in the local/offline runtime, log redaction, Git exclusions. The hosted deployment adds first-party, cookie-free, aggregate-only analytics on the hosting platform |
| Dependency compromise | Developer or runtime compromise | Exact versions, disabled lifecycle scripts, audit, SBOM, minimal dependencies |
| Cross-workspace access | Client data exposure | Workspace-scoped authorization before multi-workspace or hosted use |
| Stale evidence | Incorrect assurance status | Explicit review date and deterministic stale state |

## Hosted deployment trust boundary

The published Vercel deployment adds one processor to the boundary: Vercel
Web Analytics. It is the hosting platform, so it is a first-party processor
rather than an external analytics vendor, but the boundary is stated
explicitly rather than assumed.

- **What crosses it.** The page URL and SDK identifiers. The referrer field
  arrives empty because the deployment sends `Referrer-Policy: no-referrer`.
- **What does not.** No catalog content, no query parameters carrying record
  identifiers beyond the URL itself, no account data, no client-assessment
  content, and no form input.
- **What is stored.** No cookie and no persistent browser identifier. Visitors
  are identified by a hash derived from the request that resets daily and
  cannot be linked across days or across sites, so no cross-site profile is
  built.
- **Where it can reach.** Only the site's own origin. The script is served
  same-origin at `/_vercel/insights/script.js` and beacons to
  `/_vercel/insights/view`. The published CSP's `connect-src 'self'` blocks
  every cross-origin destination.
- **What changes if the platform changes.** If the deployment moves off
  Vercel, or Vercel's analytics is disabled, the script path returns 404 and
  nothing is collected — the behavior degrades to the local runtime's.

The local and packaged runtime sits outside this boundary entirely: the
analytics path does not exist there, so no request is made and nothing is
collected.

## Security invariants

- A proposal is never equivalent to a verified relationship.
- An assurance result is derived, not directly assigned.
- Every authoritative relationship has provenance.
- Every evidence-backed claim identifies its evidence and verification actor.
- No client data, catalog content, or assessment content is ever sent to an analytics endpoint.
- Analytics, if enabled, is confined to the site's own origin by the published CSP.
- Identical trusted inputs produce an identical assurance result.
- Invalid or ambiguous input cannot partially mutate authoritative state.
