# Stack Decision

## Decision

Use a strict TypeScript modular monolith for the first Eidos release.

- Web interface: React 19 and Vite
- Graph rendering: Cytoscape.js with optional fCoSE layout support
- Local API: Fastify
- Boundary validation: Zod
- Persistence: Node 24 built-in SQLite behind a repository interface
- Tests: Vitest
- Package manager: npm with exact versions and lifecycle scripts disabled by default

## Why

1. Shared domain types and validation rules reduce drift between the graph UI and API.
2. Cytoscape.js supports typed graph interaction, layouts, selection, filtering, and graph traversal without requiring a custom WebGL engine for the first release.
3. Fastify provides a small local HTTP boundary with explicit schema and security controls.
4. Node's built-in SQLite avoids a native third-party database driver while preserving a migration path through repository adapters.
5. A modular monolith is easier to finish, test, package, and deploy than separate Python and TypeScript services.

## Alternatives considered

### Python FastAPI plus React

Strong validation and analysis ecosystem, and aligned with Corey's Python interest. Rejected for the first release because a two-language system adds duplicated contracts, separate toolchains, and more integration surface before the graph workflow is proven. Python remains a future option for import, analysis, or scanner workers when it provides a concrete advantage.

### Next.js full-stack

Strong production deployment ecosystem. Rejected for the first release because Eidos is an application workspace rather than a content-oriented site, and Vite plus Fastify gives clearer client/server boundaries with less framework coupling.

### Rust desktop application

Strong local security and packaging potential. Rejected for the first release because it increases iteration cost for a motion-heavy graph UI and does not materially improve the first consultant workflow.

## Architecture rule

The domain layer cannot import React, Fastify, Cytoscape, SQLite, or AI-provider code. UI, HTTP, persistence, and AI integrations consume domain contracts through adapters.

## Revisit conditions

Revisit this decision if verified requirements demand native desktop isolation, large-scale graph rendering beyond Cytoscape's measured limits, Python-only analysis libraries, or multi-user hosted operation.
