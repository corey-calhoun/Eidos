# Eidos Repository Instructions

## Mission

Eidos is a local-first Security Assurance Graph for an independent security consultant assessing one client web application at a time. Preserve the traceable chain:

`business objective → application/asset/dependency → threat or vulnerability → risk → control → validation → evidence → requirement/framework`

The graph is the primary reasoning surface. Changes must preserve orientation, provenance, deterministic assurance, and evidence-backed reporting.

## Working Context

- Repository root: `E:\Coding Projects\Eidos`
- Canonical project-state note: `E:\Notes\Obsidian\04 Projects\Eidos.md`
- Start Hermes sessions from this repository root so Git, relative paths, and this file are discovered.
- Technical truth belongs in the repository. Keep the Obsidian note concise and synchronized with verified status, decisions, blockers, links, and next actions.

## Architecture

- Strict TypeScript modular monolith.
- React 19 and Vite for the local graph client.
- Cytoscape.js for graph rendering.
- Fastify for the loopback API.
- Zod for strict trust-boundary validation.
- Node `node:sqlite` for local persistence.
- Vitest for automated verification.
- The runtime remains local-only unless Corey explicitly approves production work.

## Trust and Security Invariants

1. Preserve the trust flow: observed evidence → normalized entities/relationships → deterministic graph → optional AI explanation or candidate analysis.
2. Never represent AI-inferred evidence, relationships, or assurance as authoritative.
3. Authoritative non-unknown node assurance requires accepted human or deterministic provenance.
4. Verified relationships require accepted human or deterministic provenance, an actor, and a verification timestamp.
5. Unknown fields, dangling edges, unsupported relationship endpoint pairs, malformed persisted data, and incompatible migration metadata must fail closed.
6. Assurance is deterministic. Do not replace explicit rules with questionnaires, model inference, or opaque scores.
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

Then verify health, graph retrieval, security rejection paths, the baseline graph, and a deep-linked detail drawer. Record residual risks honestly. Passing tests do not authorize production deployment.

## Documentation

- `README.md` is the implementation-accurate entry point.
- `docs/OPERATIONS.md` governs startup, shutdown, backup, restore, and runtime handling.
- `docs/SECURITY_REQUIREMENTS.md` and `docs/THREAT_MODEL.md` define security obligations.
- `docs/ACCEPTANCE.md` and `docs/TEST_STRATEGY.md` define release evidence.
- Normative architecture and `/api/v1` documents may describe future behavior; do not claim planned endpoints are implemented.
- Update `E:\Notes\Obsidian\04 Projects\Eidos.md` after meaningful verified changes.
