# Product Brief

## Product

Eidos is a local-first Security Assurance Graph for an independent security consultant assessing one client web application at a time.

It replaces disconnected notes and opaque posture scores with a traceable model connecting business objectives, assets, dependencies, threats, vulnerabilities, risks, controls, validation activities, evidence, policies, requirements, and frameworks.

## Primary user

A security consultant conducting and explaining an assessment of a client's web application.

## Primary promise

From any important object, the consultant can see what supports or threatens it, inspect the source of every authoritative claim, and understand an assurance state derived from explicit deterministic rules.

## First workflow

1. Open the sample client web-application workspace.
2. Start from the application as the central graph node.
3. Explore a high-impact administrative-access risk.
4. Follow the risk to its MFA control.
5. Inspect the validation performed against that control.
6. Inspect the evidence and its provenance.
7. See which policy and framework requirement depend on that control.
8. Understand why the current assurance state is validated, failed, stale, or unknown.
9. Return to the original overview without losing orientation.

## First sample scenario

The sample client operates an Internet-facing ordering application containing customer and order data. Its administrative console initially permits password-only authentication. Eidos connects the administrative interface and customer database to an account-compromise threat, an unauthorized-export risk, an MFA control, a login validation, dated evidence, an access-control policy, and a framework requirement.

## MVP acceptance

- Load one realistic sample workspace without external services.
- Display typed nodes and directional relationships.
- Keep the selected application visible during drill-down.
- Navigate the complete application-to-requirement assurance chain.
- Show provenance and evidence freshness in a detail drawer.
- Calculate assurance states deterministically.
- Distinguish verified relationships from proposed or unknown relationships.
- Reject structurally invalid graph data.
- Provide accessible keyboard and reduced-motion behavior.
- Export a machine-readable snapshot and a concise consultant-facing summary.

## Non-goals

- Certification, audit, or legal advice
- Complete framework libraries
- Automated framework interpretation
- AI-created verified mappings
- Scanner integrations
- Multi-tenant hosting
- Billing
- Production deployment
- Replacement for Checkpoint
