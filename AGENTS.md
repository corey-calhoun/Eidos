# Eidos Repository Instructions

## Mission

Eidos is a local-first, catalog-first cybersecurity governance knowledge library: a searchable Rolodex of frameworks, regulations, standards, control catalogs, policies, controls, and GRC concepts.

The primary user journey is:

`search or browse → understand a reference record → use an actionable policy playbook when available → inspect source/version/applicability → follow related materials → optionally compare or visualize relationships`

The catalog and record detail experience are the primary reasoning surfaces. A relationship graph may support exploration, but it must never displace the searchable library as the product front door. Eidos explains the cybersecurity governance landscape; Checkpoint separately assesses an organization's readiness against that landscape.

## Working Context

- Repository root: `E:\Coding Projects\Eidos`
- Canonical project-state note: `E:\Notes\Obsidian\04 Projects\Eidos.md`
- Start Hermes sessions from this repository root so Git, relative paths, and this file are discovered.
- Technical truth belongs in the repository. Keep the Obsidian note concise and synchronized with verified status, decisions, blockers, links, and next actions.

## Architecture

- Strict TypeScript modular monolith.
- React 19 and Vite for the local catalog client.
- Cytoscape.js remains installed only for the preserved historical graph implementation and a possible future optional relationship map.
- Fastify for the loopback API.
- Zod for strict trust-boundary validation.
- The current built-in catalog is deterministic and read-only; normal catalog startup does not initialize SQLite. Node `node:sqlite` remains in the preserved historical implementation.
- Vitest for automated verification.
- The runtime remains local-only unless Corey explicitly approves production work.

## Trust and Security Invariants

1. Preserve the trust flow: authoritative source material → normalized catalog records → explicit relationships → optional AI explanation or candidate analysis.
2. Never represent AI-inferred content, relationships, or compliance conclusions as authoritative.
3. Publisher records require an official source, citation, paraphrase marker, copyright treatment, and editorial review metadata. Eidos-authored material must remain visibly editorial.
4. Every relationship requires a plain-language rationale, review metadata, and explicit authority. Official relationships require authoritative publisher provenance and publisher-classified endpoints.
5. Unknown fields, duplicate identifiers, dangling relationships, malformed catalog data, and incompatible persisted historical data must fail closed.
6. Eidos explains governance knowledge; it does not calculate or assert organizational compliance or readiness. Policy playbooks may tailor starter guidance to a selected context, but they must not store completion state, evidence, findings, gaps, or scores.
7. Preserve loopback binding, Host/Origin restrictions, defensive response headers, body limits, and non-authoritative AI responses.
8. Never commit client assessment data, evidence, exports, database files or sidecars, environment files, credentials, or secrets.
9. Do not deploy, expose ports to a LAN, proxy, tunnel, or publish Eidos without explicit approval and a separate production security review.

## Change Controls

Do not add or remove dependencies, alter authentication or authorization, change database schemas, rename public routes, or delete files without explicit approval.

Before changing behavior:

1. Read the relevant implementation and contract documents.
2. Identify security and operational impact.
3. Prefer a small reversible change.
4. Use test-driven development where practical: RED → smallest implementation → GREEN.
5. Do not silently convert inferred preferences into consequential product facts.
6. Treat delegated-agent reports as leads; independently inspect and verify the current tree.

## Required Team and Review

Every substantial workstream must account for:

- Product Manager
- Software Architect
- Polyglot Developer
- QA Automation Engineer
- Independent Application Security Engineer

Supporting specialists should be added when relevant: UI/UX, frontend, backend/API, documentation, and DevSecOps/release. Security is shared, but the independent Application Security Engineer must review architecture and implementation rather than approve its own work.

Corey's standing requirement:

> “We need a security specialist as well as all of our projects should adhere to top security practices and implmentation since i'm a cybersecurity professional in real life”

## Verification and Release

Run from the repository root:

```bash
npm run accept
```

This must pass before a baseline or release commit. It runs both TypeScript checks, all Vitest tests, the production build, and the production dependency audit.

For runtime verification, start separate loopback processes:

```bash
npm run start:api
npm run start:web
```

Then verify health, catalog retrieval, security rejection paths, search/browse, direct and invalid deep links, record-detail focus/restoration, related-record browser history, visible relationship rationale, and comparison. Record residual risks honestly. Passing tests do not authorize production deployment.

## Documentation

- `README.md` is the implementation-accurate entry point.
- `docs/OPERATIONS.md` governs startup, shutdown, backup, restore, and runtime handling.
- `docs/SECURITY_REQUIREMENTS.md` and `docs/THREAT_MODEL.md` define security obligations.
- `docs/ACCEPTANCE.md` and `docs/TEST_STRATEGY.md` define release evidence.
- Normative architecture and `/api/v1` documents may describe future behavior; do not claim planned endpoints are implemented.
- Update `E:\Notes\Obsidian\04 Projects\Eidos.md` after meaningful verified changes.
