# Eidos First Vertical Slice Test Strategy

**Owner:** Principal QA Automation Engineer
**Status:** Proposed release-gate contract
**Scope:** First complete vertical slice
**Related documents:** `README.md`, `docs/VISUAL_REFERENCE.md`, `docs/TEAM.json`, `docs/ACCEPTANCE.md`

## 1. Purpose

This strategy defines independent verification for the first Eidos vertical slice: a local-first Security Assurance Graph that loads one sample client web application and lets a consultant follow an authoritative, provenance-aware chain:

`application -> risk -> control -> validation -> evidence -> requirement`

The release is acceptable only when executable tests and retained artifacts demonstrate the behavior. Agent reports, screenshots without assertions, and implementation-team statements are not acceptance evidence. Production remains subject to human approval as required by `docs/TEAM.json`.

## 2. Quality objectives

The slice must prove that:

1. The sample client application loads into a usable graph and non-graph representation.
2. A user can navigate the complete required chain without losing context.
3. Selection, category drill-down, detail inspection, and return navigation preserve orientation.
4. Every authoritative node, edge, and assurance result exposes provenance.
5. Assurance is deterministic for identical graph data and an explicitly fixed evaluation time.
6. Structurally or semantically invalid graph data is rejected atomically and produces actionable errors.
7. AI output can explain or propose, but cannot create verified relationships, findings, evidence, or assurance states.
8. Keyboard-only and reduced-motion experiences provide equivalent access to the slice.
9. The API fails closed, accepts only intended local callers, and does not expose the service beyond loopback.

## 3. Scope boundaries

### In scope

- One canonical sample client web application fixture.
- Required graph entities and relationships for the six-hop chain.
- Graph rendering plus an accessible non-graph relationship representation.
- Provenance, relationship verification state, evidence freshness, and assurance display.
- Deterministic graph validation and assurance evaluation.
- Selection, drill-down, drawer, back/return, keyboard, and reduced-motion behavior.
- API schema validation, authorization/anti-forgery controls appropriate to the chosen local architecture, and loopback binding.
- Built production artifact and runtime smoke behavior.

### Out of scope for this slice

- Multi-client tenancy, collaboration, cloud deployment, production data migration, or mobile-native clients.
- Assessing whether an AI summary is stylistically good.
- Exhaustive browser/device coverage beyond the release matrix below.
- Load testing beyond a responsive canonical fixture and basic abuse limits.

Out-of-scope functionality must not weaken an in-scope authority or security boundary.

## 4. Test oracle and canonical fixture

The implementation team must provide a version-controlled fixture named `tests/fixtures/sample-client.json` and a negative-fixture directory `tests/fixtures/invalid/`. The canonical fixture must use stable IDs and include at least:

- one application: `app_acme_orders`;
- one risk linked from that application;
- one control linked from that risk;
- one validation linked from that control;
- one evidence record linked from that validation;
- one requirement linked from that evidence;
- provenance on every authoritative node and verified edge;
- at least one proposed/unverified edge for visual and authority-boundary tests;
- an explicitly fixed `evaluationAsOf` value and expected assurance result(s).

Expected values belong in the fixture or a separate version-controlled oracle, not in production implementation code. Tests must never depend on the wall clock, random layout seeds, locale, insertion order, network access, or a live AI model. If layout randomness is required, use a fixed seed.

Negative fixtures must independently cover duplicate IDs, dangling endpoints, unknown node/edge types, a missing required provenance field, an invalid provenance reference, an impossible status transition, malformed dates, AI-attributed verified state, and unknown properties where the schema is closed.

## 5. Test levels

| Level | Purpose | Primary tooling | Required examples |
|---|---|---|---|
| Static/schema | Reject malformed contracts before runtime | TypeScript typecheck, JSON Schema or equivalent validator | fixture schema, closed enums, required provenance, API request/response shape |
| Unit | Verify isolated deterministic rules | Vitest | graph invariants, provenance rules, assurance truth table, fixed-time freshness, AI authority guard, selection reducer/history |
| Component | Verify UI semantics and states without a full service | Vitest + DOM Testing Library | node/edge meaning, detail drawer, provenance presentation, non-color status, focus behavior, reduced-motion branch |
| Integration/API | Verify persistence and service boundaries | Vitest against isolated test service/store | atomic import, rejection errors, authoritative writes, AI proposal isolation, local caller checks, no partial persistence |
| End-to-end | Verify consultant journeys in a built application | Playwright | load sample, navigate full chain, drill down, return, keyboard-only flow, accessible relationship view |
| Security/runtime | Verify the built process and its network exposure | Vitest runtime harness plus OS socket inspection | loopback bind, hostile Host/Origin, unauthenticated mutation, methods/content types, response leakage, external dependency denial |
| Exploratory/accessibility | Independently challenge usability and semantics | Playwright accessibility scan plus human review | zoom, screen reader labels, dense graph orientation, animation comfort, non-color cues |

Unit and integration suites should use deterministic in-memory or temporary stores. No test may use a developer's real Eidos data directory.

## 6. Risk-focused coverage

### 6.1 Graph integrity

Validate data before any persistence or rendering. Import is all-or-nothing. Referential integrity, legal relationship types, uniqueness, provenance, and authority constraints are server-side rules; client validation alone is insufficient. Error responses identify a stable error code and JSON path without leaking stack traces or filesystem locations.

### 6.2 Provenance and authority

For every authoritative record, tests assert a visible source type, source identifier, acquisition/recorded time, and actor or deterministic mechanism. Verified edges use the documented solid treatment; proposed edges use the documented dotted treatment and explicit text/icon semantics. UI and API tests must prove that changing visual fields or sending a forged client payload cannot upgrade a proposal to verified.

### 6.3 Deterministic assurance

Define a versioned assurance contract as a pure evaluation over validated graph data plus `evaluationAsOf`. Test its complete truth table, precedence rules, missing-data behavior, and boundary timestamps. Assert:

- the same canonical input produces byte-equivalent normalized output across 100 evaluations;
- node/edge insertion order does not affect output;
- locale and process timezone do not affect output;
- restart and persisted reload do not affect output;
- a changed result identifies the authoritative inputs/rule version responsible;
- AI-generated text or availability never affects the result.

### 6.4 Interaction and orientation

Assert that the selected node stays visible during drill-down, unrelated context fades or repositions rather than replacing the scene, relationship counts match the fixture, the drawer does not replace the graph, and Back/Close returns to the exact prior selection and focus target. Avoid pixel-perfect layout assertions; test semantic state, accessible names, stable data attributes, and bounded geometry only where orientation requires it.

### 6.5 Accessibility and motion

Keyboard tests cover Tab/Shift+Tab, arrow-key movement where a composite widget is used, Enter/Space activation, Escape/Back return, visible focus, and no keyboard trap. The selected relationship chain must be available in a semantic list/table/tree outside the canvas/SVG visualization. Status and relationship verification must have text/icon/pattern equivalents to color.

With `prefers-reduced-motion: reduce`, camera travel, pulsing, and nonessential transitions are disabled or effectively instantaneous; no essential information is lost.

### 6.6 API and localhost security

The runtime must bind only to an explicit loopback address (`127.0.0.1` and, if supported and tested, `::1`), never `0.0.0.0`. Tests must inspect the listening socket rather than trusting console output. Mutations fail closed for missing/invalid authorization or anti-forgery proof selected by the architecture. Reject hostile `Host` and `Origin` values, unsupported methods, non-JSON mutation bodies, oversized bodies, unexpected fields, and malformed identifiers. Do not emit secrets, stack traces, absolute paths, or raw evidence content in errors.

The test environment must deny outbound network access. The core slice remains functional when the Ollama endpoint in `docs/TEAM.json` is absent; AI failure cannot relax validation or mutate authoritative state.

## 7. Release matrix

Automated release evidence is required on Windows 11 because it is the primary local platform. E2E coverage is required on the bundled/default Chromium engine and one additional engine (Firefox or WebKit). A release-candidate human accessibility check is required with Windows keyboard navigation, 200% zoom, forced/reduced motion, and one screen-reader path through the non-graph representation.

## 8. Repository and proposed release commands

The current npm baseline provides `test` (Vitest), `typecheck`, `build`, and `start:api`. The first four commands below are executable baseline checks; `test:runtime` and `accept` are release scripts the implementation must add, along with a pinned Playwright development dependency and E2E configuration. All scripts must be non-interactive, return non-zero on failure, avoid live AI/network dependencies, and work from the repository root.

```bash
npm ci
npm run typecheck
npm test
npm run build
npm exec -- playwright test tests/e2e
npm run test:runtime
npm run accept
```

Required script semantics:

- `npm test`: run every discovered Vitest test once (the current script already uses `vitest run`). Release configuration must organize or tag unit, component, integration, and security coverage so omitted suites are detectable.
- `npm run typecheck`: no-emission strict type check plus fixture/schema validation.
- `npm run build`: create the production artifact from a clean checkout; warnings configured as fatal for release.
- `npm run test:runtime`: build, start the production server on `127.0.0.1` using an ephemeral isolated data directory and fixed evaluation time, wait for readiness, run runtime/API/socket checks, then always stop the process and delete the temporary data.
- `npm run accept`: execute typecheck, all Vitest projects, production build, runtime checks, and Playwright acceptance tests in that order; it is the single release-gate command.

Vitest must run once (`run`, not watch mode). Runtime tests must launch the built artifact, not a development server. The runtime harness must print the selected port and PID, enforce a timeout, and clean up in success and failure paths.

## 9. CI and acceptance gates

A candidate fails release for any failed test, skipped acceptance test, focused test (`.only`), unexpected snapshot update, unhandled rejection, accessibility blocker, high/critical dependency vulnerability with a reachable path, non-loopback listener, or missing evidence artifact. Retries may diagnose environmental flakiness but a test that passes only on retry remains a failure until triaged.

Minimum coverage gates for authority-critical modules (schema validation, provenance, assurance, authorization) are 100% branch coverage and mutation testing of each decision rule. Other changed production code requires at least 90% line and 85% branch coverage. Coverage percentage never substitutes for acceptance-scenario coverage.

## 10. Evidence and defect handling

Each release-gate run retains:

- exact commit SHA, Node/npm versions, OS, browser versions, and command lines;
- JUnit results, coverage, Playwright trace/video/screenshots on failure;
- build manifest/hash and runtime log with secrets redacted;
- assurance oracle comparison and socket-inspection result;
- a requirements-to-test mapping using acceptance IDs from `docs/ACCEPTANCE.md`.

Defects that violate graph integrity, provenance, assurance determinism, AI authority, or network boundaries are release blockers. Accessibility blockers and failures of the primary navigation journey are also release blockers. QA approval must come from an independent run against the candidate commit; implementation-agent reports are not evidence.
