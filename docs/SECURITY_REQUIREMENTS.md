# Security Requirements

## Security objective

Protect sensitive client-assessment information and preserve the integrity of every assurance claim, relationship, validation, and evidence artifact.

## Trust boundaries

- Browser interface to local API
- Local API to persistence repository
- Imported files and graph documents to trusted domain state
- Evidence metadata to evidence files
- Optional future AI provider to authoritative application data
- Local development environment to future hosted production

## Mandatory requirements

1. Bind local services to loopback by default.
2. Validate Host and Origin values and use a restrictive CORS allowlist.
3. Apply strict schemas, length limits, count limits, and canonicalization at every external boundary.
4. Reject unknown entity types, relationship types, invalid directions, dangling references, and unsupported assurance states.
5. Require provenance for authoritative relationships and findings.
6. Prevent AI output from creating or modifying verified state.
7. Render all imported text as untrusted content and avoid active HTML.
8. Use generated identifiers and managed paths for future evidence files; reject traversal, absolute paths, device names, symlinks, unsupported types, oversized files, and archive expansion abuse.
9. Use parameterized persistence and atomic state changes.
10. Record append-oriented audit events for authoritative changes.
11. Keep secrets, client data, evidence, exports, local databases, and logs containing sensitive data out of Git.
12. Produce a software bill of materials and review dependency vulnerabilities before production release.
13. Do not claim encryption at rest when relying only on local filesystem permissions.
14. Require an explicit production security review before changing from local-only to hosted operation.

## Initial abuse cases

- A malformed import creates an invalid or misleading graph.
- A crafted node label executes script in the browser.
- A proposed AI mapping is mistaken for a verified relationship.
- Evidence bytes change while metadata and assurance remain trusted.
- A relationship is created in an invalid direction or between incompatible entities.
- A localhost API is accessed by a hostile website through permissive CORS or origin handling.
- Sensitive client data appears in logs, source control, exports, or AI prompts.
- A future multi-workspace API exposes one client's data to another.

## Release blockers

- Verified state can be produced without trusted provenance.
- Imported or displayed content can execute active code.
- Invalid graph relationships are accepted.
- Local API accepts untrusted origins or non-loopback exposure by default.
- Evidence can be modified without detection once evidence storage is implemented.
- Critical or high dependency vulnerabilities remain unresolved without Corey's documented risk acceptance.
- Production deployment occurs without authentication, authorization, tenant-isolation review, secrets management, backup, monitoring, and rollback verification.
