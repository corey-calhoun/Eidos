# Eidos Product Brief

## Product definition

Eidos is a local-first cybersecurity governance reference library: a searchable Rolodex of frameworks, laws, regulations, contract clauses, guidance, standards, criteria, knowledge bases, control catalogs, policies, controls, and GRC concepts, including useful relationships among them.

Eidos helps people find a subject, understand it in plain language, inspect where the information came from and which version it describes, and follow related material without assembling the landscape from scattered sources.

Eidos explains the knowledge landscape. It is not primarily a graph of one client's assessment. **Checkpoint is the separate product that assesses an organization's readiness.**

## The Rolodex metaphor

A Rolodex is useful because each card stands on its own and points to the next useful card. In Eidos:

- the catalog is the Rolodex;
- each framework, regulation, standard, control catalog, policy, control, or concept is a reference card;
- directories and search help a user find the right card;
- a detail view explains the card and records its source, version, status, and applicability;
- relationships connect it to relevant cards without making a graph the only way to navigate.

The relationship map is an optional exploration aid. Search, directories, cards, and detail pages remain usable without it.

## Users

Eidos is for people who need to understand or explain cybersecurity governance material, including:

- GRC, security, risk, privacy, and compliance professionals;
- independent and in-house consultants;
- policy and control authors;
- internal and external auditors;
- educators, students, and professionals learning the field.

The MVP is not limited to a consultant assessing one client or one application.

## Approved priority industry contexts

The contextual-discovery taxonomy prioritizes:

- **Defense industrial base / DoD contracting:** CMMC, DFARS, NIST SP 800-171, and related federal contract-security context;
- **Government:** federal, state, local, and public-sector governance context such as FISMA, NIST SP 800-53, and FedRAMP where relevant;
- **Healthcare:** HIPAA, HITECH, sector guidance, and healthcare security and privacy context;
- **Financial services:** banking, credit unions, insurance, investment, and financial regulatory/security context;
- **Payment processing:** PCI-related obligations and payment-card security context;
- **Education:** K–12 and higher-education security, privacy, and governance context;
- **Technology / SaaS, professional services, retail, small business, critical infrastructure, and cross-industry** reference contexts.

Defense/DoD and general government must remain distinct selectable contexts because their contractual, regulatory, and control baselines differ. Financial services and payment processing must likewise remain distinct even when records overlap.

Industry selection is a relevance aid, not a legal applicability determination. Eidos must explain why a record was surfaced and use language such as “commonly relevant” or “potentially applicable” unless an authoritative rule and sufficient user context support a stronger statement.

The curated-core target is at least 75 source-reviewed records. It must provide meaningful depth across every supported material type and at least one directly tagged record for every selectable industry context. Cross-industry records remain useful fallback material, but cannot substitute for dedicated Defense/DoD, Government, Healthcare, Financial services, Payment processing, Education, Technology/SaaS, Professional services, Retail, Small business, or Critical infrastructure coverage.

The curated core is a governed starting library, not a claim of exhaustive or permanently current coverage. New material is added in reviewable batches with official publisher provenance, explicit version and jurisdiction context, licensing/copyright treatment, and human editorial review. Regulations, contractual clauses, implementation guidance, standards, control catalogs, policies, controls, and concepts remain separate record types even when they are closely related.

## Problem

Cybersecurity governance knowledge is spread across publisher sites, long documents, control catalogs, regulatory text, guidance, and internal notes. Names overlap, versions change, relationships are easy to overstate, and readers often cannot tell whether a mapping is official, curated, or merely suggested.

A user needs a dependable starting point that answers:

1. What is this item?
2. Who publishes or governs it?
3. Which version, revision, or effective period am I reading about?
4. Where is the authoritative source?
5. What does it apply to, and what context or jurisdiction matters?
6. What other material is meaningfully related, and why?
7. Is a stated relationship official, independently curated, or unverified?

## Product promise

From one search box or browse directory, a user can reach a clear reference record, verify its source and version context, follow explained relationships, and compare related materials without Eidos presenting interpretation as law, certification, or an official crosswalk.

## Front door and first workflow

The product opens on the library, not on a client workspace or graph.

1. Search across the whole catalog or browse a compact material-type and industry filter rail.
2. Scan concise reference cards in a contained result workspace without traversing a long landing page.
3. Open a centered detail workspace that begins with a plain-language overview.
4. Move among focused Overview, Playbook, Related, and Source & trust sections rather than scrolling through every information class at once.
5. Inspect publisher, authoritative source, version or revision, status, dates, applicability, and the record's review history in the dedicated trust section.
6. Follow related materials and see why each relationship exists and how it is sourced.
7. Compare selected records side by side.
8. Optionally open a relationship map to explore the same catalog neighborhood visually.

## Catalog objects

The first catalog recognizes these plain-language material types:

- **Framework:** an organized approach for managing or describing cybersecurity work.
- **Law:** a statute or enacted legislative instrument.
- **Regulation:** a rule issued under legal or regulatory authority.
- **Contract clause:** a contractual provision that may impose defined obligations when incorporated into an agreement.
- **Guidance:** publisher-issued recommendations, models, or implementation guidance that are not themselves represented as law, regulation, or contract terms.
- **Standard:** a published set of requirements or specifications.
- **Criteria:** evaluation or attestation criteria used to judge a defined subject matter.
- **Knowledge base:** a maintained body of structured reference knowledge, such as adversary behaviors.
- **Control catalog:** an organized collection of safeguards or control statements.
- **Policy:** public policy guidance, a policy model, or an example policy suitable for reference. An organization's private policy is not part of the first catalog.
- **Control:** a safeguard or practice described independently or within a source catalog.
- **GRC concept:** a term, method, role, or idea that helps explain governance, risk, or compliance.

Labels should reflect how publishers describe their own material. Eidos must not silently reclassify a source to make the catalog look more uniform.

## Reference record

Every published record must provide enough context to judge what it represents. Where applicable, the detail view includes:

- title, common name, identifier, aliases, and material type;
- a concise plain-language summary;
- publisher or issuing authority;
- authoritative source link and a human-readable citation;
- version, revision, edition, publication date, effective date, and status, with unknown values clearly marked;
- jurisdiction, sector, audience, and applicability notes where relevant;
- topic tags and key terms;
- related materials with a short explanation of each relationship;
- provenance showing who or what added or reviewed the record and when;
- a clear distinction between source text, quotation, paraphrase, and editorial explanation.

The product should not fill missing metadata with guesses.

## Policy playbooks

Policy records should lead with practical action rather than publisher metadata. When a reviewed playbook exists, the detail experience should provide:

- the outcome the policy is intended to produce;
- decisions the organization must make while tailoring the policy;
- alternative implementation approaches and their tradeoffs;
- a phased starter checklist;
- likely owners and reviewers;
- examples of evidence an organization commonly retains;
- events that should trigger policy review;
- selected-industry context where an Eidos-authored checklist item has been reviewed for that context.

Playbooks are Eidos editorial guidance. Industry-tailored items must be labeled as orientation rather than legal applicability. Publisher metadata, citations, authority, and related materials remain available as a secondary trust layer.

Eidos does not store whether checklist items are complete, collect organization evidence, calculate gaps, or score readiness. Those organization-specific workflows belong to Checkpoint.

## Relationships

Relationships help users move through the library. Examples include "published by," "contains," "updates," "supersedes," "references," "implements," "related to," and "mapped to."

Each displayed relationship must state:

- the two records it connects;
- the relationship type and a plain-language reason;
- its authority: **official**, **Eidos-curated**, or **unverified**;
- its supporting source or editorial provenance;
- its last review date.

An official relationship requires an authoritative publisher source that explicitly supports it. An Eidos-curated relationship is editorial guidance, not an official mapping. An unverified or suggested relationship cannot be displayed as fact. Optional AI assistance may suggest candidates for human review, but it cannot publish, verify, or relabel a relationship as official.

## Catalog-first MVP

The first local MVP proves that a person can use Eidos as a small but coherent reference library. It includes:

- universal catalog search;
- browse directories for each supported material type;
- concise result/reference cards;
- a stable detail view for every published record;
- related-material navigation with relationship authority and provenance;
- source, version, status, applicability, and review metadata;
- side-by-side comparison of selected records;
- a representative built-in catalog that works without external services;
- keyboard-accessible core navigation and reduced-motion behavior;
- local-only operation and deterministic validation of catalog data.

A visual relationship map is optional for this MVP. If present, it must show the same records and relationships as the catalog and must never be the sole route to information.

## Success evidence

The MVP succeeds when representative users can, using only the local product:

- find a known item by title, alias, or identifier;
- discover an unfamiliar item by browsing its directory;
- explain what a record is and identify its publisher and source;
- tell which version or effective period is represented, or see that it is unknown;
- distinguish official mappings from Eidos-curated or unverified relationships;
- move between related records and return without losing context;
- compare records without the product claiming that different materials are equivalent;
- complete the core workflow without using a relationship map.

## Source and provenance rules

1. Prefer the issuing authority or publisher as the primary source. Secondary sources may add context but cannot replace an available authoritative source.
2. Record enough citation data to relocate the source: publisher, title, URL or document identifier, version or date context, and access or review date.
3. Keep direct quotations visibly distinct from paraphrase and editorial explanation. Respect source licenses and quotation limits; link rather than reproduce restricted material.
4. Never invent missing versions, dates, applicability, legal effect, control text, or mappings. Mark missing information as unknown or incomplete.
5. Do not label a crosswalk or relationship "official" unless an authoritative source explicitly supports it. Record Eidos-created mappings as curated and cite the evidence used.
6. Preserve historical versions as separate versioned records or clearly identified revisions when they materially differ. Do not silently overwrite the meaning of an older record.
7. Show jurisdiction and effective-date context for regulations. A summary is educational reference material, not legal interpretation.
8. Changes to published records and relationships must be attributable to a human editor or deterministic import and include a review time.
9. AI-generated text or candidate links are non-authoritative until a human reviews and accepts them; acceptance does not make them official.
10. If a source cannot be verified, the product must say so plainly and must not elevate the item or relationship to authoritative status.

## Non-goals for the local MVP

- Assessing an organization's readiness, maturity, posture, or compliance; that is Checkpoint's role.
- Managing a client assessment, client evidence, findings, remediation, or assurance scores.
- Certifying compliance, completing an audit, or replacing professional judgment.
- Providing legal advice, regulatory interpretation, or a guarantee of applicability.
- Claiming that Eidos-created summaries or mappings are official.
- Reproducing complete copyrighted or license-restricted source material without permission.
- Offering a complete library of every framework, law, standard, policy, control, or version.
- Automatically monitoring publishers or guaranteeing that every record is current.
- Publishing AI-generated records or relationships without human review.
- Scanner integrations, control testing, continuous monitoring, or automated evidence collection.
- Multi-tenant hosting, accounts, billing, cloud synchronization, or production deployment.
- Requiring a graph or relationship map to use the library.

## Product boundary with Checkpoint

| Eidos | Checkpoint |
|---|---|
| Explains frameworks, regulations, standards, controls, policies, and concepts | Assesses an organization's readiness against selected expectations |
| Organizes reusable reference knowledge | Organizes organization-specific scope, answers, evidence, gaps, and actions |
| Answers "What is this, where did it come from, and how is it related?" | Answers "Where are we ready, where are the gaps, and what should we do next?" |
| May provide sourced reference relationships | Applies selected knowledge to an organization's assessment context |

The products may share identifiers or link to one another later, but Eidos must remain useful as a standalone reference library.
