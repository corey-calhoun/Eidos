# Eidos Catalog-First Local MVP Acceptance

**Status:** Target acceptance contract for the catalog-first pivot

**Scope:** Single-user, local-only cybersecurity governance reference library using built-in sample data

**Release command:** `npm ci && npm run accept`

**Production authority:** Passing this contract does not authorize deployment. Production requires Corey's explicit approval and a separate security review.

This contract replaces the former one-client assessment-graph acceptance target. Existing implementation evidence may belong to that earlier product direction and does not satisfy a catalog criterion unless it verifies the behavior stated here.

## 1. Acceptance boundary

The MVP is accepted only when a reviewer can use the library front door to:

```text
search or browse
  -> scan reference cards
  -> open a reference detail
  -> use a policy playbook when available
  -> verify source and version context
  -> follow a related item
  -> compare selected records
```

The workflow must work without external services, network access, a client assessment workspace, or a relationship map. A map may be included, but it is optional and cannot compensate for a missing catalog workflow.

Eidos explains reusable knowledge. Readiness assessment, evidence collection, gaps, findings, remediation, and assurance scoring are outside this acceptance contract and belong to Checkpoint.

## 2. Built-in catalog fixture

The repository must contain a deterministic, reviewable built-in catalog fixture suitable for local demonstration and automated tests.

Pass when:

- the curated-core fixture contains at least 75 published records;
- each core material type contains at least six records, each specialized publisher-aligned type contains at least one reviewed record, and the policy directory contains at least fifteen records with Policy Playbooks;
- every selectable industry context other than `cross-industry` has at least one directly tagged record rather than relying exclusively on broad fallback material;
- the fixture contains at least one published record for each supported type: framework, law, regulation, contract clause, guidance, standard, criteria, knowledge base, control catalog, policy, control, and GRC concept;
- at least two records share a meaningful comparison topic;
- at least one record has an alias and at least one has a recognizable identifier;
- at least one versioned record includes version or revision data;
- at least one regulation includes jurisdiction and effective-date context;
- the fixture includes at least one official relationship and one Eidos-curated relationship, each backed by the required provenance;
- records and relationships use stable unique IDs so links and tests are repeatable;
- the fixture uses only material that may be stored and displayed under its source terms; restricted source text is represented by metadata, a short permitted quotation if appropriate, and a link rather than unauthorized reproduction;
- loading the same fixture repeatedly produces the same published catalog without duplicate records or relationships.

The fixture is a curated core, not a claim of complete or permanently current coverage.

## 3. Automated acceptance criteria

### AC-01 — Strict catalog validation

Pass when automated tests show that:

- every third-party published record has a stable ID, title, supported material type, plain-language summary, publisher or issuing authority, authoritative-source citation, source URL or document identifier, and review provenance;
- every Eidos-authored sample policy, control, or explanatory concept identifies Eidos as its editorial issuer, is visibly non-authoritative, and does not present a supporting reference as the source of the sample text;
- version, revision, edition, publication date, effective date, jurisdiction, sector, audience, and applicability may be marked unknown when they do not apply or cannot be verified; they are never guessed;
- unknown fields, unsupported material types, malformed dates or URLs, duplicate IDs, and dangling relationship endpoints fail closed;
- direct quotations, paraphrases, and editorial explanations have distinguishable data markers;
- a published record cannot treat AI output as authoritative source material.
- publisher authority is accepted only when the official URL belongs to a registered host for the stated issuer, and official relationship provenance belongs to a registered host for at least one endpoint publisher.

### AC-02 — Relationship authority and provenance

Pass when automated tests show that:

- each relationship identifies both endpoint records, a supported relationship type, a plain-language explanation, authority, provenance, and last-review time;
- authority is limited to `official`, `eidos_curated`, or `unverified`;
- `official` is accepted only with an authoritative source that explicitly supports the relationship;
- `eidos_curated` is visibly editorial and cannot be serialized or displayed as official;
- `unverified` and AI-suggested relationships cannot be presented as established facts;
- invalid endpoints, missing provenance, unsupported relationship types, and self-contradictory authority metadata fail closed.

### AC-03 — Universal search

Pass when automated tests show that:

- one search control searches the complete published catalog rather than only the current directory;
- title, common name, alias, identifier, summary, publisher, and topic tags are searchable;
- matching is case-insensitive and ignores harmless surrounding whitespace;
- results are deterministic for the same catalog and query;
- every result shows title, material type, short summary, publisher, and version/status context;
- selecting a result opens the matching detail view;
- a no-results query gives a clear empty state and a way to clear the query;
- search does not require network access.

### AC-04 — Browse directories and filtering

Pass when automated tests show that:

- the library front door exposes directories for frameworks, laws, regulations, contract clauses, guidance, standards, criteria, knowledge bases, control catalogs, policies, controls, and GRC concepts;
- each directory lists only records of its stated type and displays a deterministic count;
- users can narrow the current result set by available version/status, jurisdiction, sector, or topic metadata without changing the underlying records;
- users can select multiple approved industries, with selected industries combined using OR semantics;
- direct industry matches and cross-industry fallback records are both permitted, but every filtered card explains which kind of relevance caused it to appear;
- industry controls display direct-record coverage separately; a context with no direct record is labeled `Broad only` and cannot present fallback volume as direct sector coverage;
- Defense/DoD, Government, Healthcare, Financial services, Payment processing, and Education are distinct selectable contexts;
- filter controls expose programmatic pressed state, selected filters can be removed independently, and Clear all restores the complete catalog;
- industry-filter language explicitly states that relevance is not a legal-applicability or compliance determination;
- filters can be cleared and do not strand the user in an empty view;
- a user can return to the complete catalog from every directory.

### AC-05 — Reference cards and detail view

Pass when automated tests show that:

- each published record has a stable route or deep link;
- a reference card identifies the record without requiring the user to open a graph;
- the detail view shows title, type, summary, publisher, authoritative citation/link, known version and date context, status, applicability context, tags, and review provenance;
- every policy record with a playbook leads with its intended outcome, tailoring decisions, implementation approaches, phased checklist, likely owners, evidence examples, and review triggers;
- selected industry context may include reviewed Eidos-authored checklist items, while general items remain available and the UI states that tailoring is orientation rather than legal applicability;
- policy playbooks expose no completion state, evidence upload, gap, finding, score, or readiness determination;
- source, authority, and provenance remain available as a secondary trust section rather than displacing the policy playbook;
- unknown or not-applicable metadata is labeled plainly rather than omitted in a misleading way;
- external links are visibly identified and use safe browser behavior;
- the detail view reports the record's position in the current filtered result set and provides non-wrapping Previous/Next navigation when adjacent results exist;
- a missing or unknown record ID produces a safe not-found state with a route back to the library.

### AC-06 — Related materials

Pass when automated tests show that:

- a detail view lists each directly related record with relationship type, reason, authority label, supporting source or editorial provenance, and review date;
- following a related item opens the correct detail view;
- a visible back action returns to the prior record and preserves the user's search or browse context, selected detail section, and bounded detail-scroll position;
- official, Eidos-curated, and unverified relationships have distinct text labels and are not distinguished by color alone;
- records remain usable when they have no relationships.

### AC-07 — Comparison

Pass when automated tests show that:

- a user can select at least two records and open a side-by-side comparison;
- the comparison includes type, publisher, purpose/summary, version or revision, status, jurisdiction/applicability, and authoritative source;
- missing values are shown as unknown or not applicable rather than treated as equal;
- the comparison does not state or imply equivalence, compliance, superiority, or an official mapping unless an authoritative source explicitly supports that statement;
- each compared item links back to its full detail view;
- each selected item can be removed from the comparison tray or open comparison without changing catalog data;
- removing items below the two-record comparison minimum closes the comparison safely and returns focus to a usable comparison control.

### AC-08 — Catalog persistence and deterministic loading

Pass when automated tests show that:

- the catalog loads locally without an external API, sign-in, telemetry service, or internet connection;
- validated records and relationships persist across local application restarts when persistence is enabled;
- a failed validation or interrupted replacement cannot partially publish a catalog update;
- unsupported schema or migration versions fail with an actionable local error and preserve the last valid catalog;
- active databases, generated exports, credentials, environment files, and private organizational material remain outside version control.

### AC-09 — Optional relationship map equivalence

This criterion applies only if a relationship map ships in the MVP.

Pass when automated tests show that:

- the map uses the same record and relationship IDs as the catalog;
- selecting a map item opens the same detail view available from search and browse;
- relationship authority labels agree with the detail view;
- filtering does not invent, remove from storage, or change the authority of relationships;
- every fact available only visually in the map has an equivalent text representation.

Omitting the relationship map does not fail the MVP.

### AC-10 — Release command

`npm run accept` must execute, in order:

1. browser/domain and server/domain TypeScript checks;
2. all discovered automated tests;
3. production web and server builds;
4. the production dependency audit at high severity.

Every command must exit `0`. Build output must remain uncommitted. Test names or a release evidence record must make it possible to trace AC-01 through AC-09 to automated evidence, marking AC-09 not applicable when no map ships.

## 4. Runtime and human acceptance criteria

Run the compiled local artifacts after `npm run build`:

```bash
npm run start:api
npm run start:web
```

### AC-11 — Catalog-first front door

Pass when an independent reviewer confirms that:

- opening Eidos shows a universal search control and clear browse directories before any graph or assessment content;
- no client, application, readiness score, assurance chain, evidence request, or remediation workflow is required to begin;
- the reviewer can find one fixture item by title, one by alias or identifier, and one unfamiliar item by browsing;
- the reviewer can complete the full acceptance workflow in Section 1 without opening a relationship map;
- page and control language describes a library/reference task rather than a client assessment task.
- at desktop widths, the search, filters, result heading, and first result row fit within one browser viewport; additional results scroll inside the library workspace rather than forcing a long page traversal;
- record details open in a centered, viewport-bounded workspace with focused Overview, Playbook when available, Related, and Source & trust sections;

### AC-12 — Source and version comprehension

Pass when an independent reviewer can, for sampled records:

- identify what the item is, who publishes or issues it, and where its authoritative source can be found;
- identify the represented version, revision, status, jurisdiction, and effective period where applicable, or correctly determine that a value is unknown;
- distinguish quotation from Eidos paraphrase or editorial explanation;
- distinguish an official relationship from an Eidos-curated or unverified one;
- see when and by whom or what the record and relationship were last reviewed.

No sampled page may describe Eidos as the issuing authority for third-party material.

### AC-13 — Accessible core journey

Pass when an independent reviewer confirms that:

- search, browse, card selection, detail navigation, related-item navigation, and comparison are keyboard operable with visible focus;
- headings, landmarks, controls, material types, status, and relationship authority have meaningful text labels;
- focus moves predictably when a detail or comparison view opens and returns to the invoking control when it closes;
- no keyboard trap exists;
- 200% browser zoom preserves the core journey without loss of content or function;
- reduced-motion preference does not remove content or required function;
- information is not conveyed by color alone.
- record-detail tabs expose correct tab/tabpanel semantics and support Left Arrow, Right Arrow, Home, and End navigation;
- dense policy guidance is grouped into labeled, keyboard-operable disclosures so users can open only the decision area they need;

Automated accessibility checks support but do not replace keyboard and zoom review.

### AC-14 — Local security and privacy boundary

Pass when runtime evidence confirms that:

- web and API processes bind only to approved loopback addresses;
- hostile Host and Origin values are rejected according to the security requirements;
- defensive response headers, request IDs, no-store behavior, body limits, and strict request validation remain active where applicable;
- no request is made to a third-party analytics, AI, catalog, or telemetry service during the core journey;
- the UI does not invite entry of client evidence or claim to assess an organization's readiness;
- active local data is stored outside the repository unless an explicit test path is used.

Loopback restrictions are not authentication and do not make this build production-safe.

### AC-15 — Claims and editorial review

Pass when a product/documentation reviewer samples every fixture record and relationship and confirms that:

- factual claims are traceable to the displayed source or explicitly labeled editorial explanation;
- legal and regulatory summaries include jurisdiction/date context and do not offer legal advice;
- no Eidos-curated mapping is labeled official;
- no text claims certification, audit completion, compliance, readiness, or guaranteed applicability;
- no restricted source is reproduced beyond permitted terms;
- unknowns and unresolved source questions are visible rather than silently completed.

## 5. Release evidence record

A catalog-first local MVP baseline is accepted only when the release record contains:

- exact test-file and test counts and a mapping from AC-01 through AC-10 to automated evidence;
- typecheck, build, and dependency-audit outcomes;
- catalog fixture validation and deterministic-load results;
- source/license/editorial review outcome for every built-in fixture record;
- secret-scan and repository data-hygiene outcomes;
- loopback socket and runtime security-response evidence;
- screenshots of the library front door, search results, one directory, one reference detail, related materials, comparison, and the optional map if shipped;
- keyboard, 200% zoom, reduced-motion, and non-color-only review results;
- clean Git status and commit identifier, with any pre-existing unrelated changes recorded separately.

## 6. Explicit non-acceptance conditions

The MVP fails acceptance if any of the following is true:

- the primary entry point is a client assessment or graph rather than the reference library;
- a graph is required to discover or understand records;
- readiness, compliance, assurance, maturity, or legal conclusions are generated for an organization;
- source, version/status context, or provenance is missing or guessed on a published fixture record;
- an Eidos-created or AI-suggested relationship is represented as official;
- the product requires an external service or internet connection for the built-in catalog workflow;
- restricted source material is reproduced without permission;
- passing tests are used to claim production readiness.

## 7. Deferred production gates

The following are outside the first local MVP and require separate scope and acceptance criteria:

- accounts, authentication, authorization, tenant isolation, hosted operation, and cloud sync;
- collaborative editing, editorial approval queues, and append-only audit history;
- automated publisher monitoring, source ingestion, license enforcement, and update alerts;
- exhaustive libraries, automated source monitoring, or guarantees that content is permanently current or complete;
- organization-specific overlays, evidence, assessments, findings, remediation, or Checkpoint integration;
- AI-assisted drafting or relationship suggestions beyond a non-authoritative, human-reviewed experiment;
- import/export packages, signed releases, backup/restore automation, and forward migration support;
- production packaging, TLS, configurable deployment, monitoring, incident response, and external penetration testing.
