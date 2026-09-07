type CatalogIndustry =
  | "cross-industry"
  | "defense-industrial-base"
  | "government"
  | "healthcare"
  | "financial-services"
  | "payment-processing"
  | "education"
  | "technology-saas"
  | "professional-services"
  | "retail"
  | "small-business"
  | "critical-infrastructure";

type PlaybookDecision = {
  id: string;
  question: string;
  options: string[];
};

type PlaybookApproach = {
  id: string;
  name: string;
  whenToUse: string;
  tradeoff: string;
};

type PlaybookChecklistItem = {
  id: string;
  phase: "define" | "implement" | "operate" | "review";
  title: string;
  guidance: string;
  industries?: CatalogIndustry[];
};

type PolicyPlaybookContent = {
  outcome: string;
  decisions: PlaybookDecision[];
  approaches: PlaybookApproach[];
  checklist: PlaybookChecklistItem[];
  suggestedOwners: string[];
  evidenceExamples: string[];
  reviewTriggers: string[];
};

type PolicySeed = {
  id: `policy_${string}`;
  slug: `${string}-policy`;
  name: string;
  acronym?: string;
  summary: string;
  description: string;
  applicability: string;
  domains: string[];
  tags: string[];
  industries?: CatalogIndustry[];
  playbook: PolicyPlaybookContent;
};

const editorialMetadata = {
  contentAuthority: "eidos_editorial" as const,
  contentMarker: "editorial" as const,
  sourceCitation: "Eidos policy playbook editorial guidance",
  reviewedAt: "2026-09-07",
  reviewedBy: "Rosco — Eidos editorial reviewer",
};

function policy(seed: PolicySeed) {
  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    ...(seed.acronym === undefined ? {} : { acronym: seed.acronym }),
    type: "policy" as const,
    summary: seed.summary,
    description: seed.description,
    issuer: "Eidos sample library",
    jurisdictions: ["organization-specific"],
    industries: seed.industries ?? ["cross-industry" as const],
    applicability: seed.applicability,
    version: "sample 1.0",
    status: "current" as const,
    domains: seed.domains,
    tags: seed.tags,
    playbook: { ...editorialMetadata, ...seed.playbook },
  };
}

export const additionalPolicyRecords = [
  policy({
    id: "policy_information_security_governance",
    slug: "information-security-governance-policy",
    name: "Information Security Governance Policy",
    summary: "A reusable policy pattern for directing, overseeing, and maintaining an organization-wide information security program.",
    description: "This sample policy establishes security accountability, decision authority, policy hierarchy, exception governance, and management oversight without asserting that any particular obligation applies.",
    applicability: "Organizations establishing or refreshing accountability and oversight for information security decisions.",
    domains: ["information security governance", "accountability", "oversight"],
    tags: ["policy hierarchy", "roles", "exceptions", "management review"],
    playbook: {
      outcome: "Security priorities, authorities, exceptions, and oversight are assigned to accountable roles and revisited as organizational risk and operations change.",
      decisions: [
        { id: "decision_governance_authority", question: "Which body has authority to approve security policy and resolve material exceptions?", options: ["Executive sponsor", "Cross-functional governance committee", "Board-delegated risk committee"] },
        { id: "decision_governance_reporting", question: "How will leaders receive decision-useful security reporting?", options: ["Scheduled risk and exception briefings", "Event-triggered escalation plus periodic summaries", "Integrated enterprise-risk reporting"] },
      ],
      approaches: [
        { id: "approach_governance_named_lead", name: "Named accountable lead", whenToUse: "Smaller organizations where one executive and one security lead can coordinate policy decisions directly.", tradeoff: "Keeps ownership clear, but concentration of knowledge and authority requires capable alternates." },
        { id: "approach_governance_committee", name: "Cross-functional governance forum", whenToUse: "Organizations where technology, privacy, legal, operations, and business owners share security risk decisions.", tradeoff: "Broadens context and buy-in, but slower decisions are possible without a defined charter and escalation path." },
      ],
      checklist: [
        { id: "checklist_governance_define", phase: "define", title: "Set authority and policy hierarchy", guidance: "Name accountable sponsors, policy owners, approval bodies, delegated authorities, exception authority, and the relationship among policies, standards, and procedures." },
        { id: "checklist_governance_implement", phase: "implement", title: "Establish decision and escalation forums", guidance: "Create usable charters, meeting cadences, reporting inputs, conflict-resolution paths, and alternates for unavailable decision makers." },
        { id: "checklist_governance_operate", phase: "operate", title: "Direct priorities and exceptions", guidance: "Use current risk, incidents, business changes, and unresolved exceptions to make and communicate time-bounded governance decisions." },
        { id: "checklist_governance_review", phase: "review", title: "Review governance effectiveness", guidance: "Examine delayed decisions, unclear ownership, stale policies, recurring exceptions, and whether leaders receive enough context to direct improvements." },
      ],
      suggestedOwners: ["Executive security sponsor", "Information security", "Enterprise risk management", "Legal and privacy"],
      evidenceExamples: ["Approved governance charter", "Policy ownership register", "Governance meeting decisions", "Time-bounded exception approvals"],
      reviewTriggers: ["Executive or organizational restructuring", "Material change in risk appetite", "Major incident or audit theme", "Repeated ownership or escalation failures"],
    },
  }),
  policy({
    id: "policy_cybersecurity_risk_management",
    slug: "cybersecurity-risk-management-policy",
    name: "Cybersecurity Risk Management Policy",
    summary: "A reusable policy pattern for identifying, analyzing, treating, communicating, and monitoring cybersecurity risk.",
    description: "This sample policy describes a consistent risk-decision process, including criteria, ownership, treatment choices, acceptance authority, and monitoring; it does not calculate risk or compliance.",
    applicability: "Organizations seeking a repeatable basis for cybersecurity risk decisions across systems, suppliers, data, and business activities.",
    domains: ["cybersecurity risk management", "governance", "assurance"],
    tags: ["risk criteria", "risk treatment", "risk acceptance", "monitoring"],
    playbook: {
      outcome: "Cybersecurity risks are described consistently, assigned to business owners, treated within stated tolerances, and escalated when exposure or uncertainty exceeds authority.",
      decisions: [
        { id: "decision_risk_method", question: "What risk estimation method will support comparable decisions?", options: ["Qualitative likelihood and impact", "Calibrated ordinal scoring", "Scenario-based quantitative analysis"] },
        { id: "decision_risk_acceptance", question: "Who may accept residual cybersecurity risk?", options: ["Named business owner within thresholds", "Risk committee by tier", "Executive approval for all material risk"] },
      ],
      approaches: [
        { id: "approach_risk_register", name: "Central risk register", whenToUse: "Organizations needing a straightforward inventory of scenarios, owners, treatments, due dates, and decisions.", tradeoff: "Easy to launch and explain, but entries can become stale or scoring-centric without active owner engagement." },
        { id: "approach_risk_scenarios", name: "Business-impact scenarios", whenToUse: "Organizations ready to connect threat events, affected assets, business consequences, and treatment choices.", tradeoff: "Produces richer decisions, but requires facilitation, credible data, and more stakeholder time." },
      ],
      checklist: [
        { id: "checklist_risk_define", phase: "define", title: "Define risk criteria and authority", guidance: "Document risk language, estimation criteria, tolerance boundaries, treatment options, acceptance limits, and escalation authority." },
        { id: "checklist_risk_implement", phase: "implement", title: "Create assessment and ownership workflows", guidance: "Provide repeatable scenario capture, analysis, owner assignment, treatment planning, challenge, approval, and dependency recording." },
        { id: "checklist_risk_operate", phase: "operate", title: "Monitor treatments and changing exposure", guidance: "Revisit material scenarios when controls, threats, assets, suppliers, assumptions, or business impacts change; escalate overdue or ineffective treatment." },
        { id: "checklist_risk_review", phase: "review", title: "Challenge the risk process", guidance: "Review inconsistent ratings, unsupported acceptance, aging treatments, missing dependencies, and whether decisions reflect current business impact." },
      ],
      suggestedOwners: ["Enterprise risk management", "Information security", "Business risk owners", "Internal audit or independent assurance"],
      evidenceExamples: ["Documented risk criteria", "Risk scenario records", "Treatment and acceptance decisions", "Risk review meeting records"],
      reviewTriggers: ["Material business or technology change", "New threat intelligence affecting assumptions", "Major supplier or concentration change", "Incident exposing an unrecognized scenario"],
    },
  }),
  policy({
    id: "policy_asset_management",
    slug: "asset-management-policy",
    name: "Asset Management Policy",
    summary: "A reusable policy pattern for maintaining accountable knowledge of technology, software, services, and information assets.",
    description: "This sample policy sets expectations for asset ownership, inventory scope, lifecycle events, reconciliation, and risk-relevant attributes so security decisions have a dependable basis.",
    applicability: "Organizations managing devices, infrastructure, applications, cloud resources, services, software, or information that require accountable stewardship.",
    domains: ["asset management", "inventory", "governance"],
    tags: ["asset owner", "discovery", "lifecycle", "reconciliation"],
    playbook: {
      outcome: "In-scope assets have accountable owners and enough current lifecycle, location, dependency, and sensitivity context to support security decisions.",
      decisions: [
        { id: "decision_asset_scope", question: "Which asset classes and environments must be represented?", options: ["Managed hardware and software", "Technology plus cloud and supplier services", "Technology, services, and information assets"] },
        { id: "decision_asset_source", question: "What is the authoritative inventory model?", options: ["Single governed repository", "Federated systems with reconciliation", "Automated discovery with owner attestation"] },
      ],
      approaches: [
        { id: "approach_asset_owner_inventory", name: "Owner-maintained inventory", whenToUse: "Smaller, stable environments with clear purchasing and deployment paths.", tradeoff: "Low tooling cost, but accuracy depends on timely manual updates and reconciliation." },
        { id: "approach_asset_federated", name: "Federated discovery and reconciliation", whenToUse: "Hybrid environments where endpoint, cloud, network, application, and procurement systems each hold useful asset facts.", tradeoff: "Improves coverage and freshness, but identity matching and source conflicts require governance." },
      ],
      checklist: [
        { id: "checklist_asset_define", phase: "define", title: "Define asset classes and required attributes", guidance: "Specify in-scope asset types, ownership, business purpose, location, lifecycle state, sensitivity, criticality, support status, and dependency attributes." },
        { id: "checklist_asset_implement", phase: "implement", title: "Connect lifecycle and discovery sources", guidance: "Link acquisition, deployment, change, cloud provisioning, supplier onboarding, transfer, and disposal events to inventory updates and owner confirmation." },
        { id: "checklist_asset_operate", phase: "operate", title: "Reconcile unknown and stale assets", guidance: "Compare inventories with discovery and operational sources, investigate unmanaged or duplicate assets, and route ownership gaps for resolution." },
        { id: "checklist_asset_review", phase: "review", title: "Review inventory fitness", guidance: "Sample records for ownership, freshness, lifecycle accuracy, unsupported technology, and whether risk processes can reliably use the recorded attributes." },
      ],
      suggestedOwners: ["IT asset management", "Information security", "Infrastructure and cloud operations", "Application and data owners"],
      evidenceExamples: ["Asset inventory extracts", "Owner attestation records", "Discovery reconciliation reports", "Asset retirement records"],
      reviewTriggers: ["Acquisition or divestiture", "New cloud or discovery platform", "Repeated unknown assets", "Material inventory-to-operations mismatch"],
    },
  }),
  policy({
    id: "policy_data_lifecycle",
    slug: "data-lifecycle-policy",
    name: "Data Lifecycle Policy",
    summary: "A reusable policy pattern for classifying, handling, retaining, transferring, and disposing of information throughout its lifecycle.",
    description: "This sample policy establishes accountable data categories and handling rules from creation or receipt through use, sharing, retention, archival, and defensible disposal.",
    applicability: "Organizations that create, receive, store, use, share, archive, or dispose of business, customer, workforce, regulated, or confidential information.",
    domains: ["data lifecycle", "information classification", "records management"],
    tags: ["handling", "retention", "disposal", "data transfer"],
    playbook: {
      outcome: "Information receives handling, access, transfer, retention, and disposal treatment proportionate to its defined sensitivity, business value, and confirmed obligations.",
      decisions: [
        { id: "decision_data_classes", question: "How many classification levels can users and systems apply consistently?", options: ["Public, internal, confidential", "Four-tier sensitivity model", "Context-specific categories with mapped handling rules"] },
        { id: "decision_data_retention", question: "How will retention periods and holds be governed?", options: ["Enterprise retention schedule", "System-specific schedules mapped to an enterprise baseline", "Data-owner schedules reviewed by legal and records stakeholders"] },
      ],
      approaches: [
        { id: "approach_data_baseline", name: "Simple classification baseline", whenToUse: "Organizations beginning with a limited number of understandable labels and manual handling rules.", tradeoff: "Promotes adoption, but broad classes may not capture every workflow or obligation." },
        { id: "approach_data_embedded", name: "Lifecycle controls embedded in platforms", whenToUse: "Organizations able to apply labels, retention, transfer restrictions, and disposal workflows through managed systems.", tradeoff: "Improves consistency at scale, but mapping errors and unmanaged repositories still need oversight." },
      ],
      checklist: [
        { id: "checklist_data_define", phase: "define", title: "Define classes and lifecycle rules", guidance: "Describe classification criteria and minimum rules for collection, marking, access, storage, use, transfer, retention, legal hold, archival, and disposal." },
        { id: "checklist_data_implement", phase: "implement", title: "Map rules into workflows and systems", guidance: "Give owners usable handling patterns and configure supported repositories, transfer channels, backups, and disposal processes to reflect approved rules." },
        { id: "checklist_data_operate", phase: "operate", title: "Manage retention, holds, and disposal", guidance: "Apply authorized schedules and holds, investigate handling exceptions, and ensure disposal methods address copies, media, cloud resources, and supplier-held data." },
        { id: "checklist_data_review", phase: "review", title: "Review classification and handling fit", guidance: "Sample high-value workflows for misclassification, excessive retention, unsupported transfers, inaccessible holds, and disposal that cannot be demonstrated." },
      ],
      suggestedOwners: ["Data governance", "Records management", "Legal and privacy", "Information security", "Business data owners"],
      evidenceExamples: ["Classification standard", "Approved retention schedule", "Legal-hold instructions", "Media or data disposal records"],
      reviewTriggers: ["New data category or processing purpose", "Legal or contractual change", "Migration to a new repository", "Repeated handling or disposal exception"],
    },
  }),
  policy({
    id: "policy_privacy_personal_data_protection",
    slug: "privacy-personal-data-protection-policy",
    name: "Privacy and Personal Data Protection Policy",
    summary: "A reusable policy pattern for governing personal-data processing, individual rights, transparency, sharing, and privacy risk.",
    description: "This sample policy establishes privacy roles and lifecycle expectations while requiring qualified stakeholders to determine actual legal, contractual, and jurisdictional obligations.",
    applicability: "Organizations processing personal data about customers, users, workforce members, applicants, partners, or other identifiable individuals.",
    domains: ["privacy", "personal data protection", "data governance"],
    tags: ["processing purpose", "individual rights", "privacy review", "data sharing"],
    playbook: {
      outcome: "Personal-data processing has a documented purpose, accountable owner, proportionate safeguards, transparent handling, and a workable path for individual requests and concerns.",
      decisions: [
        { id: "decision_privacy_inventory", question: "At what level will personal-data processing be inventoried?", options: ["Business process", "System and data flow", "Purpose, parties, systems, and transfer chain"] },
        { id: "decision_privacy_review", question: "Which changes require privacy review before launch?", options: ["All new personal-data processing", "Risk-triggered changes", "Defined categories plus escalation for uncertainty"] },
      ],
      approaches: [
        { id: "approach_privacy_intake", name: "Central privacy intake", whenToUse: "Organizations where a small privacy or legal team can review new processing and requests centrally.", tradeoff: "Creates consistency, but can become a bottleneck without triage criteria and service expectations." },
        { id: "approach_privacy_champions", name: "Federated privacy stewardship", whenToUse: "Larger organizations needing trained business or product representatives to identify issues early.", tradeoff: "Scales context and ownership, but advice can drift unless central guidance and escalation remain active." },
      ],
      checklist: [
        { id: "checklist_privacy_define", phase: "define", title: "Define privacy principles and authority", guidance: "Set expectations for purpose, proportionality, transparency, access, quality, retention, sharing, individual requests, complaints, and escalation without presuming legal applicability." },
        { id: "checklist_privacy_implement", phase: "implement", title: "Build processing and request workflows", guidance: "Create intake, inventory, notice, choice, rights-request, supplier, transfer, incident, and change-review paths with named decision makers and verification steps." },
        { id: "checklist_privacy_operate", phase: "operate", title: "Handle requests and processing changes", guidance: "Coordinate identity verification, search, evaluation, response, correction, deletion, restriction, objection, and escalation as applicable to the confirmed context." },
        { id: "checklist_privacy_review", phase: "review", title: "Review high-risk processing", guidance: "Examine purpose drift, unexpected sharing, excessive collection or retention, unresolved requests, inaccurate notices, and safeguards that no longer match the processing." },
      ],
      suggestedOwners: ["Privacy office or privacy lead", "Legal", "Data governance", "Product and business owners", "Information security"],
      evidenceExamples: ["Personal-data processing inventory", "Privacy review decisions", "Approved notices and request procedures", "Data-sharing review records"],
      reviewTriggers: ["New purpose or category of personal data", "Expansion into a new jurisdiction", "New tracking, profiling, or automated decision use", "Privacy incident or repeated request failure"],
    },
  }),
  policy({
    id: "policy_security_awareness_acceptable_use",
    slug: "security-awareness-acceptable-use-policy",
    name: "Security Awareness and Acceptable Use Policy",
    summary: "A reusable policy pattern for setting secure-use expectations and preparing people to recognize and report security concerns.",
    description: "This sample policy combines role-aware security learning with understandable rules for organizational systems, accounts, data, communications, software, devices, and reporting.",
    applicability: "Workforce members, contractors, interns, and other authorized users of organizational technology or information.",
    domains: ["security awareness", "acceptable use", "workforce security"],
    tags: ["training", "phishing", "user conduct", "reporting"],
    playbook: {
      outcome: "People understand permitted technology use, receive learning relevant to their role and risk, and can promptly report mistakes, suspicious activity, and policy concerns without ambiguity.",
      decisions: [
        { id: "decision_awareness_cadence", question: "How will learning frequency reflect role and risk?", options: ["Onboarding plus annual baseline", "Baseline plus periodic reinforcement", "Role- and event-triggered learning program"] },
        { id: "decision_acceptable_use", question: "How much limited personal use is permitted?", options: ["No personal use", "Reasonable incidental use", "Locally defined use within stated boundaries"] },
      ],
      approaches: [
        { id: "approach_awareness_baseline", name: "Common baseline and acknowledgment", whenToUse: "Organizations needing a simple, consistent minimum for all users.", tradeoff: "Easy to administer, but generic annual content may not change behavior or address specialized roles." },
        { id: "approach_awareness_role_based", name: "Role-based continuous reinforcement", whenToUse: "Organizations with distinct risks for administrators, developers, executives, finance, support, or data-handling roles.", tradeoff: "More relevant and timely, but requires maintained audience mapping and varied content." },
      ],
      checklist: [
        { id: "checklist_awareness_define", phase: "define", title: "Set understandable use and learning expectations", guidance: "Describe permitted and prohibited behaviors, reporting paths, monitoring transparency, consequences, role-based topics, and how users obtain help." },
        { id: "checklist_awareness_implement", phase: "implement", title: "Prepare onboarding and role-based learning", guidance: "Map audiences to practical scenarios, acknowledgment points, reporting tools, manager support, simulations where appropriate, and accessible alternatives." },
        { id: "checklist_awareness_operate", phase: "operate", title: "Reinforce and support secure behavior", guidance: "Deliver timely guidance for emerging threats and technology changes, respond constructively to reports, and address repeated confusion with targeted support." },
        { id: "checklist_awareness_review", phase: "review", title: "Review clarity and relevance", guidance: "Use questions, reporting patterns, exercise observations, and recurring misuse to identify unclear rules or learning that does not match real work." },
      ],
      suggestedOwners: ["Security awareness lead", "Information security", "Human resources", "Legal", "Business managers"],
      evidenceExamples: ["Approved acceptable-use statement", "Role-to-learning matrix", "Learning delivery records", "Security reporting guidance"],
      reviewTriggers: ["New collaboration or AI technology", "Material change in threat patterns", "Repeated user confusion or misuse", "Workforce model or monitoring change"],
    },
  }),
  policy({
    id: "policy_vulnerability_patch_management",
    slug: "vulnerability-patch-management-policy",
    name: "Vulnerability and Patch Management Policy",
    summary: "A reusable policy pattern for discovering, prioritizing, remediating, mitigating, and reviewing technology vulnerabilities.",
    description: "This sample policy coordinates vulnerability intelligence, asset context, remediation targets, testing, exceptions, and verification without claiming that any environment is secure or compliant.",
    applicability: "Organizations operating or depending on supported hardware, software, applications, cloud resources, containers, or network devices.",
    domains: ["vulnerability management", "patch management", "security operations"],
    tags: ["remediation", "prioritization", "scanning", "exceptions"],
    playbook: {
      outcome: "Known vulnerabilities are evaluated using exploitability, exposure, asset importance, and business impact, then remediated or explicitly mitigated within accountable timeframes.",
      decisions: [
        { id: "decision_vulnerability_priority", question: "Which factors set remediation priority?", options: ["Severity and age", "Severity, exposure, and exploit activity", "Business-impact scenarios with threat and asset context"] },
        { id: "decision_patch_window", question: "How will urgent changes bypass normal maintenance windows?", options: ["Emergency change path", "Preauthorized patch categories", "Risk-owner decision with temporary mitigation"] },
      ],
      approaches: [
        { id: "approach_vulnerability_sla", name: "Severity-tier targets", whenToUse: "Organizations needing simple, measurable remediation expectations across a mostly standard environment.", tradeoff: "Easy to communicate, but severity alone can misprioritize low-exposure or actively exploited conditions." },
        { id: "approach_vulnerability_risk", name: "Threat- and asset-informed prioritization", whenToUse: "Organizations with sufficient inventory, exposure, exploit, and business-impact context.", tradeoff: "Directs effort toward likely harm, but data quality and transparent decision rules are essential." },
      ],
      checklist: [
        { id: "checklist_vulnerability_define", phase: "define", title: "Define coverage and remediation rules", guidance: "Specify asset and vulnerability sources, prioritization factors, target timeframes, emergency handling, exception authority, compensating measures, and verification criteria." },
        { id: "checklist_vulnerability_implement", phase: "implement", title: "Connect discovery to accountable work", guidance: "Map findings to asset owners, deduplicate sources, test relevant updates, create remediation workflows, and protect scanning credentials and infrastructure." },
        { id: "checklist_vulnerability_operate", phase: "operate", title: "Prioritize, remediate, and verify", guidance: "Triage new intelligence, address urgent exposure, coordinate outages, track approved mitigation, and rescan or otherwise verify that intended changes took effect." },
        { id: "checklist_vulnerability_review", phase: "review", title: "Review aging exposure and exceptions", guidance: "Examine recurring vulnerable products, unsupported assets, failed deployments, overdue work, exception concentration, and gaps in discovery coverage." },
      ],
      suggestedOwners: ["Vulnerability management", "IT operations", "Application and platform owners", "Change management", "Business risk owners"],
      evidenceExamples: ["Vulnerability source coverage map", "Prioritized remediation records", "Patch deployment reports", "Approved mitigation or exception decisions"],
      reviewTriggers: ["Actively exploited vulnerability affecting the environment", "Major scanning or patch-platform change", "Repeated failed or delayed remediation", "New unsupported technology population"],
    },
  }),
  policy({
    id: "policy_secure_configuration_change_control",
    slug: "secure-configuration-change-control-policy",
    name: "Secure Configuration and Change Control Policy",
    summary: "A reusable policy pattern for establishing secure baselines and governing technology changes throughout their lifecycle.",
    description: "This sample policy links approved configuration baselines with change assessment, authorization, testing, deployment, rollback, drift handling, and emergency review.",
    applicability: "Organizations managing endpoints, servers, network devices, applications, infrastructure as code, cloud services, or security tooling.",
    domains: ["secure configuration", "change control", "configuration management"],
    tags: ["baseline", "hardening", "drift", "rollback"],
    playbook: {
      outcome: "Technology begins from an approved, risk-informed baseline and changes through proportionate review, testing, authorization, rollback planning, and post-change validation.",
      decisions: [
        { id: "decision_configuration_baseline", question: "How will baselines be selected and tailored?", options: ["Vendor secure defaults", "Recognized benchmarks with documented tailoring", "Organization-authored hardened builds by technology class"] },
        { id: "decision_change_tiers", question: "Which changes may follow preauthorized paths?", options: ["None", "Low-risk repeatable changes", "Standard changes with automated safeguards and sampling"] },
      ],
      approaches: [
        { id: "approach_configuration_documents", name: "Documented baseline and approval", whenToUse: "Smaller or less automated environments with a manageable number of technology patterns.", tradeoff: "Straightforward to begin, but manual build and drift checks can become inconsistent." },
        { id: "approach_configuration_code", name: "Policy-backed configuration as code", whenToUse: "Organizations able to version, test, approve, deploy, and monitor configuration through automation.", tradeoff: "Improves repeatability and traceability, but pipeline compromise or faulty templates can amplify mistakes." },
      ],
      checklist: [
        { id: "checklist_configuration_define", phase: "define", title: "Define baselines and change categories", guidance: "Set minimum configurations, tailoring authority, prohibited settings, normal, standard, and emergency change criteria, segregation expectations, and exception rules." },
        { id: "checklist_configuration_implement", phase: "implement", title: "Build controlled deployment paths", guidance: "Version baselines, assess security impact, test changes, record approvals, protect automation, plan rollback, and validate target scope before broad deployment." },
        { id: "checklist_configuration_operate", phase: "operate", title: "Control changes and respond to drift", guidance: "Use approved paths, monitor unauthorized or unexpected configuration, contain harmful drift, and retrospectively review emergency changes." },
        { id: "checklist_configuration_review", phase: "review", title: "Review baseline fitness and change outcomes", guidance: "Evaluate failed changes, recurring emergency use, stale settings, drift patterns, exceptions, and whether baselines remain supported and practical." },
      ],
      suggestedOwners: ["Configuration and change management", "Platform engineering", "Information security", "Service owners"],
      evidenceExamples: ["Approved configuration baselines", "Change assessment and approval records", "Deployment and rollback results", "Configuration drift reports"],
      reviewTriggers: ["New technology platform", "Material vendor hardening update", "Security incident tied to configuration", "Repeated emergency change or drift"],
    },
  }),
  policy({
    id: "policy_logging_monitoring_alerting",
    slug: "logging-monitoring-alerting-policy",
    name: "Logging, Monitoring, and Alerting Policy",
    summary: "A reusable policy pattern for generating, protecting, analyzing, and acting on security-relevant telemetry.",
    description: "This sample policy defines risk-informed event coverage, time quality, access, retention, detection ownership, triage, escalation, tuning, and monitoring health.",
    applicability: "Organizations relying on technology systems, applications, cloud services, networks, identities, or suppliers whose events support security and operational decisions.",
    domains: ["security monitoring", "logging", "detection"],
    tags: ["telemetry", "alerting", "triage", "log integrity"],
    playbook: {
      outcome: "Security-relevant activity produces trustworthy, appropriately protected telemetry, and actionable detections reach accountable responders through tested escalation paths.",
      decisions: [
        { id: "decision_logging_coverage", question: "Which events are mandatory for the most important systems?", options: ["Authentication and administrative events", "Identity, data, configuration, and security-control events", "Use-case-driven event catalog by threat and business impact"] },
        { id: "decision_monitoring_model", question: "Who provides continuous or after-hours monitoring where needed?", options: ["Internal on-call rotation", "Managed security provider", "Hybrid internal ownership and provider triage"] },
      ],
      approaches: [
        { id: "approach_logging_priority", name: "Priority-system logging", whenToUse: "Organizations beginning with critical systems and a small set of high-value detections.", tradeoff: "Controls cost and complexity, but lower-priority systems may leave investigation or detection gaps." },
        { id: "approach_logging_use_case", name: "Detection use-case program", whenToUse: "Organizations able to map threats and response decisions to required telemetry, logic, ownership, and tests.", tradeoff: "Produces explainable monitoring, but requires ongoing engineering, tuning, and source-health management." },
      ],
      checklist: [
        { id: "checklist_logging_define", phase: "define", title: "Define telemetry and response requirements", guidance: "Prioritize systems and events, set time, protection, access, retention, privacy, escalation, after-hours, and monitoring-health expectations." },
        { id: "checklist_logging_implement", phase: "implement", title: "Build sources, detections, and runbooks", guidance: "Onboard required events, normalize time and identity context, restrict log access, create actionable detection logic, and connect alerts to tested triage paths." },
        { id: "checklist_logging_operate", phase: "operate", title: "Monitor source health and alerts", guidance: "Detect missing or delayed telemetry, triage alerts within defined priorities, preserve relevant context, tune noisy logic, and escalate suspected incidents." },
        { id: "checklist_logging_review", phase: "review", title: "Review coverage and detection value", guidance: "Test selected use cases, investigate blind spots and persistent noise, confirm owner responsiveness, and reassess retention against operational need and constraints." },
      ],
      suggestedOwners: ["Security operations", "Platform and application owners", "Infrastructure operations", "Privacy and legal"],
      evidenceExamples: ["Logging requirement matrix", "Telemetry source-health reports", "Detection rule reviews", "Alert triage and escalation records"],
      reviewTriggers: ["Material incident or missed detection", "New critical system or data flow", "Monitoring provider or platform change", "Persistent telemetry loss or alert noise"],
    },
  }),
  policy({
    id: "policy_third_party_supply_chain_security",
    slug: "third-party-supply-chain-security-policy",
    name: "Third-Party and Supply Chain Security Policy",
    summary: "A reusable policy pattern for evaluating and governing security risk arising from suppliers, service providers, software, and other external dependencies.",
    description: "This sample policy covers risk tiering, due diligence, contracting, access, monitoring, incident coordination, concentration, change, and secure exit throughout external-party relationships.",
    applicability: "Organizations acquiring technology, software, data processing, professional services, managed services, or components from external parties.",
    domains: ["third-party security", "supply chain security", "vendor risk"],
    tags: ["due diligence", "contracting", "supplier monitoring", "concentration risk"],
    playbook: {
      outcome: "External dependencies receive security scrutiny and oversight proportionate to their access, data, service criticality, substitutability, and potential business impact.",
      decisions: [
        { id: "decision_supplier_tiers", question: "Which factors determine supplier risk tier?", options: ["Data access", "Access plus service criticality", "Data, access, criticality, concentration, and substitutability"] },
        { id: "decision_supplier_assurance", question: "What assurance is appropriate for higher-risk suppliers?", options: ["Questionnaire and contract terms", "Independent reports plus targeted validation", "Collaborative assessment and ongoing technical monitoring"] },
      ],
      approaches: [
        { id: "approach_supplier_tiered", name: "Tiered due diligence", whenToUse: "Organizations needing proportionate intake and review without applying the same burden to every supplier.", tradeoff: "Focuses effort, but weak tiering inputs can overlook material dependencies." },
        { id: "approach_supplier_continuous", name: "Lifecycle and continuous oversight", whenToUse: "Organizations with critical providers, material data sharing, privileged integrations, or concentrated service dependencies.", tradeoff: "Detects change earlier, but external ratings and signals require validation and can create noise." },
      ],
      checklist: [
        { id: "checklist_supplier_define", phase: "define", title: "Define tiering and minimum expectations", guidance: "Set intake criteria, tiers, due diligence depth, contract topics, access conditions, incident coordination, monitoring, exception authority, and exit requirements." },
        { id: "checklist_supplier_implement", phase: "implement", title: "Embed security in acquisition and onboarding", guidance: "Identify owners and dependencies, assess material risks, negotiate proportionate terms, approve residual decisions, restrict access, and prepare service-transition paths." },
        { id: "checklist_supplier_operate", phase: "operate", title: "Monitor material supplier changes", guidance: "Track ownership, service, control, incident, subcontractor, financial, geographic, and concentration changes that could alter risk or require action." },
        { id: "checklist_supplier_review", phase: "review", title: "Review critical relationships and exits", guidance: "Reassess evidence and dependency assumptions, unresolved findings, access, data return or deletion, continuity alternatives, and whether exceptions remain justified." },
      ],
      suggestedOwners: ["Third-party risk management", "Procurement", "Legal", "Information security", "Business service owners"],
      evidenceExamples: ["Supplier inventory and tiering rationale", "Due-diligence decisions", "Security contract provisions", "Supplier review and exit records"],
      reviewTriggers: ["New critical supplier or material integration", "Supplier incident or control deterioration", "Merger, ownership, or hosting-location change", "Concentration or exit-risk increase"],
    },
  }),
  policy({
    id: "policy_technology_resilience_backup_disaster_recovery",
    slug: "technology-resilience-backup-disaster-recovery-policy",
    name: "Technology Resilience, Backup, and Disaster Recovery Policy",
    acronym: "Technology Resilience Policy",
    summary: "A reusable policy pattern for maintaining recoverable technology services, protected backups, and coordinated disaster recovery.",
    description: "This sample policy connects business impact, service dependencies, recovery objectives, backup design, restoration testing, alternate operations, crisis authority, and improvement.",
    applicability: "Organizations whose important products, services, operations, or records depend on technology availability and recoverability.",
    domains: ["technology resilience", "backup", "disaster recovery"],
    tags: ["recovery objectives", "restoration testing", "failover", "dependencies"],
    playbook: {
      outcome: "Critical technology and data can be restored to an approved point and service level through tested arrangements with clear authority, dependencies, and fallback decisions.",
      decisions: [
        { id: "decision_resilience_objectives", question: "Who approves recovery time and recovery point objectives?", options: ["Technology service owner", "Business process owner", "Joint business and technology authority"] },
        { id: "decision_resilience_backup", question: "Which backup isolation model matches the threat and service context?", options: ["Separate managed backup account", "Immutable or offline recovery copies", "Multiple isolated copies across failure domains"] },
      ],
      approaches: [
        { id: "approach_resilience_restore", name: "Backup-and-restore recovery", whenToUse: "Services that can tolerate planned rebuild and restoration within approved objectives.", tradeoff: "Lower standing cost, but recovery takes longer and hidden dependencies may emerge during restoration." },
        { id: "approach_resilience_redundant", name: "Engineered redundant recovery", whenToUse: "Services requiring shorter interruption with alternate capacity or automated failover.", tradeoff: "Reduces recovery time, but increases complexity, cost, synchronization risk, and the need for realistic testing." },
      ],
      checklist: [
        { id: "checklist_resilience_define", phase: "define", title: "Define critical services and recovery objectives", guidance: "Identify accountable business owners, acceptable interruption and data loss, upstream and downstream dependencies, recovery authority, and minimum operating modes." },
        { id: "checklist_resilience_implement", phase: "implement", title: "Build protected recovery capabilities", guidance: "Design backup scope, isolation, credentials, retention, alternate infrastructure, restoration order, communications, supplier coordination, and manual fallback procedures." },
        { id: "checklist_resilience_operate", phase: "operate", title: "Monitor backups and exercise recovery", guidance: "Investigate failed jobs, protect recovery access, restore representative data and services, test dependency sequencing, and resolve exercise observations." },
        { id: "checklist_resilience_review", phase: "review", title: "Review recoverability against change", guidance: "Compare objectives and runbooks with current architecture, data volume, suppliers, staffing, threats, test results, and business tolerance." },
      ],
      suggestedOwners: ["Business continuity", "Disaster recovery", "Infrastructure and cloud operations", "Business service owners", "Information security"],
      evidenceExamples: ["Approved recovery objectives", "Backup architecture and job reports", "Restoration test results", "Disaster-recovery exercise decisions"],
      reviewTriggers: ["Failed restoration or recovery exercise", "Material architecture or data-volume change", "New critical service dependency", "Incident affecting availability or backup trust"],
    },
  }),
  policy({
    id: "policy_secure_development_application_security",
    slug: "secure-development-application-security-policy",
    name: "Secure Development and Application Security Policy",
    acronym: "Secure SDLC Policy",
    summary: "A reusable policy pattern for integrating security into software design, development, acquisition, release, operation, and retirement.",
    description: "This sample policy establishes proportionate application risk classification, security requirements, design review, code and dependency controls, testing, release criteria, vulnerability handling, and accountable exceptions.",
    applicability: "Organizations building, configuring, acquiring, integrating, or operating applications, APIs, scripts, infrastructure code, or software-enabled products.",
    domains: ["secure development", "application security", "software supply chain"],
    tags: ["secure SDLC", "threat modeling", "code review", "dependency security"],
    playbook: {
      outcome: "Software risk is addressed early and throughout delivery through explicit requirements, secure engineering practices, proportionate assurance, controlled release, and supported remediation.",
      decisions: [
        { id: "decision_app_risk_tier", question: "Which factors determine application assurance depth?", options: ["Internet exposure", "Exposure and data sensitivity", "Business impact, privilege, data, exposure, and change risk"] },
        { id: "decision_app_release", question: "Who may accept unresolved security issues at release?", options: ["Product owner within thresholds", "Security and business co-approval", "Executive risk owner for material issues"] },
      ],
      approaches: [
        { id: "approach_app_guardrails", name: "Secure defaults and pipeline guardrails", whenToUse: "Teams with repeatable repositories and delivery pipelines that can inherit approved templates and checks.", tradeoff: "Scales consistent basics, but generic automation cannot replace contextual design and authorization review." },
        { id: "approach_app_risk_assurance", name: "Risk-tiered application assurance", whenToUse: "Portfolios where high-impact applications need deeper design, code, penetration, or abuse-case review.", tradeoff: "Focuses specialist effort, but tiering and release exceptions must remain transparent and current." },
      ],
      checklist: [
        { id: "checklist_app_define", phase: "define", title: "Define secure delivery requirements", guidance: "Set risk tiers, design and coding expectations, approved components, secrets handling, review depth, testing, release criteria, vulnerability response, and exception authority." },
        { id: "checklist_app_implement", phase: "implement", title: "Embed security in design and delivery", guidance: "Provide secure templates, threat or abuse analysis, peer review, dependency controls, protected pipelines, testing, artifact integrity, and release decision records." },
        { id: "checklist_app_operate", phase: "operate", title: "Respond to application and dependency risk", guidance: "Monitor supported applications and components, triage reported weaknesses, coordinate safe fixes, protect disclosure channels, and retire unsupported software deliberately." },
        { id: "checklist_app_review", phase: "review", title: "Review engineering outcomes", guidance: "Examine recurring flaw classes, escaped issues, pipeline bypass, aging dependencies, exception use, and whether assurance depth matches current application risk." },
      ],
      suggestedOwners: ["Application security", "Software engineering", "Product management", "Platform engineering", "Business risk owners"],
      evidenceExamples: ["Application risk-tier rationale", "Security design or threat-review records", "Code and dependency review results", "Release security decisions"],
      reviewTriggers: ["Major architecture or trust-boundary change", "Material application incident", "New delivery platform or programming model", "Repeated vulnerability class or pipeline bypass"],
    },
  }),
  policy({
    id: "policy_cloud_security",
    slug: "cloud-security-policy",
    name: "Cloud Security Policy",
    summary: "A reusable policy pattern for governing secure adoption, configuration, operation, and exit of cloud services.",
    description: "This sample policy addresses shared-responsibility decisions, approved service patterns, identity, data, networking, logging, resilience, posture, supplier dependencies, and decommissioning.",
    applicability: "Organizations using or planning infrastructure, platform, software, container, serverless, or managed cloud services.",
    domains: ["cloud security", "shared responsibility", "cloud governance"],
    tags: ["landing zone", "cloud posture", "tenant security", "cloud exit"],
    playbook: {
      outcome: "Cloud use follows approved ownership and architecture patterns, with shared responsibilities understood and security controls maintained across provisioning, operation, change, and exit.",
      decisions: [
        { id: "decision_cloud_account", question: "How will cloud accounts, subscriptions, or tenants be governed?", options: ["Central provisioning", "Federated provisioning within landing-zone guardrails", "Product-owned environments with central policy enforcement"] },
        { id: "decision_cloud_services", question: "How may teams adopt new managed cloud services?", options: ["Approved-service catalog", "Risk-tiered architecture review", "Guardrailed self-service with exception escalation"] },
      ],
      approaches: [
        { id: "approach_cloud_landing_zone", name: "Central landing-zone baseline", whenToUse: "Organizations needing common identity, network, logging, policy, and account structures before broad cloud adoption.", tradeoff: "Creates consistency, but an inflexible central model can delay teams or drive unmanaged workarounds." },
        { id: "approach_cloud_product", name: "Federated product ownership with guardrails", whenToUse: "Mature product teams able to own cloud risk while inheriting centrally enforced minimums and monitoring.", tradeoff: "Enables speed and context, but requires strong engineering capability and clear responsibility boundaries." },
      ],
      checklist: [
        { id: "checklist_cloud_define", phase: "define", title: "Define cloud responsibility and approved patterns", guidance: "Map provider and customer duties, account ownership, identity, data, network, logging, resilience, region, service approval, exception, and exit expectations." },
        { id: "checklist_cloud_implement", phase: "implement", title: "Build reusable cloud guardrails", guidance: "Create protected account setup, federated identity, least-privilege roles, baseline policies, centralized telemetry, secret handling, encryption choices, and deployment templates." },
        { id: "checklist_cloud_operate", phase: "operate", title: "Monitor posture and cloud change", guidance: "Investigate risky configuration, privilege, exposed resources, disabled telemetry, provider changes, quota or resilience concerns, and assets outside approved provisioning." },
        { id: "checklist_cloud_review", phase: "review", title: "Review architecture and provider dependency", guidance: "Reassess shared-responsibility assumptions, service criticality, regions, concentration, recoverability, cost-driven shortcuts, exceptions, and data or access removal at exit." },
      ],
      suggestedOwners: ["Cloud platform engineering", "Cloud security", "Application and data owners", "Enterprise architecture", "Procurement"],
      evidenceExamples: ["Cloud responsibility matrix", "Approved landing-zone design", "Cloud policy and posture reports", "Cloud service approval or exception decisions"],
      reviewTriggers: ["New cloud provider or service class", "Material cloud security incident", "Major landing-zone or identity change", "Provider contract, region, or exit-risk change"],
    },
  }),
  policy({
    id: "policy_network_security",
    slug: "network-security-policy",
    name: "Network Security Policy",
    summary: "A reusable policy pattern for designing, controlling, monitoring, and reviewing network connectivity and trust boundaries.",
    description: "This sample policy establishes network ownership, segmentation, connection approval, secure administration, external exposure, wireless and name-service safeguards, telemetry, and periodic rule review.",
    applicability: "Organizations operating office, data-center, cloud, industrial, wireless, remote-access, or externally connected networks.",
    domains: ["network security", "segmentation", "communications security"],
    tags: ["firewall", "trust boundary", "remote access", "network monitoring"],
    playbook: {
      outcome: "Network paths are intentionally designed and approved, sensitive boundaries limit unnecessary movement, and connectivity changes remain observable, attributable, and reviewable.",
      decisions: [
        { id: "decision_network_zones", question: "How will network trust zones be defined?", options: ["User, server, and external zones", "Zones by sensitivity and administration", "Application- and identity-aware microsegments"] },
        { id: "decision_network_access", question: "What default governs traffic between zones?", options: ["Deny unless approved", "Restricted by zone baseline", "Identity- and service-specific authorization"] },
      ],
      approaches: [
        { id: "approach_network_perimeter", name: "Layered zones and controlled perimeters", whenToUse: "Organizations with stable network boundaries and centrally managed routing and filtering.", tradeoff: "Clear and widely supportable, but broad internal zones may permit excessive lateral movement." },
        { id: "approach_network_identity", name: "Identity- and workload-aware segmentation", whenToUse: "Hybrid or dynamic environments needing finer control independent of physical location.", tradeoff: "Reduces implicit trust, but depends on reliable identity, inventory, policy orchestration, and troubleshooting capability." },
      ],
      checklist: [
        { id: "checklist_network_define", phase: "define", title: "Define zones and connection authority", guidance: "Document trust boundaries, allowed-path principles, external exposure, administration, remote access, wireless, third-party, name-service, telemetry, and exception expectations." },
        { id: "checklist_network_implement", phase: "implement", title: "Implement controlled network paths", guidance: "Build segmentation, secure management paths, authenticated remote access, protected configurations, change review, resilient core services, and relevant traffic telemetry." },
        { id: "checklist_network_operate", phase: "operate", title: "Manage rules and suspicious traffic", guidance: "Process connection changes, investigate unexpected exposure or movement, maintain device support, and respond to configuration, certificate, route, or monitoring failures." },
        { id: "checklist_network_review", phase: "review", title: "Review paths and boundaries", guidance: "Recertify sensitive connections, remove stale rules, test representative segmentation, evaluate shadow connectivity, and reconcile diagrams with actual architecture." },
      ],
      suggestedOwners: ["Network engineering", "Network security", "Cloud and infrastructure operations", "Application and service owners"],
      evidenceExamples: ["Current network and trust-boundary diagrams", "Approved connectivity requests", "Firewall or policy rule reviews", "Segmentation validation results"],
      reviewTriggers: ["New external connection or site", "Material architecture or remote-access change", "Network-related incident", "Repeated stale rule or segmentation failure"],
    },
  }),
  policy({
    id: "policy_endpoint_remote_work_security",
    slug: "endpoint-remote-work-security-policy",
    name: "Endpoint and Remote Work Security Policy",
    summary: "A reusable policy pattern for protecting organizational endpoints and information used outside controlled facilities.",
    description: "This sample policy governs device eligibility, secure configuration, protection, authentication, updates, local data, removable media, remote connectivity, loss reporting, support, and return.",
    applicability: "Organizations whose workforce uses laptops, desktops, mobile devices, virtual desktops, personally owned devices, or remote locations to access organizational resources.",
    domains: ["endpoint security", "remote work", "mobile security"],
    tags: ["device management", "BYOD", "remote access", "device loss"],
    playbook: {
      outcome: "Devices and remote-work arrangements receive safeguards proportionate to access and data risk, remain supportable, and can be restricted or recovered when trust changes.",
      decisions: [
        { id: "decision_endpoint_ownership", question: "Which device ownership models are permitted?", options: ["Organization-managed only", "Managed corporate and enrolled personal devices", "Virtual access from otherwise unmanaged devices"] },
        { id: "decision_endpoint_local_data", question: "When may sensitive data reside locally?", options: ["Never", "Only on managed encrypted devices", "By approved workflow with additional safeguards"] },
      ],
      approaches: [
        { id: "approach_endpoint_managed", name: "Fully managed endpoint", whenToUse: "Organizations able to issue, configure, monitor, update, support, and recover devices centrally.", tradeoff: "Provides stronger consistency and response options, but increases equipment, management, and privacy-administration overhead." },
        { id: "approach_endpoint_virtual", name: "Controlled virtual workspace", whenToUse: "Organizations needing to limit local data or support contractors and personal-device access.", tradeoff: "Reduces endpoint data exposure, but availability, usability, peripheral, and screen-capture risks remain." },
      ],
      checklist: [
        { id: "checklist_endpoint_define", phase: "define", title: "Define eligible devices and remote conditions", guidance: "Set ownership, enrollment, configuration, protection, update, authentication, local-data, media, workspace, travel, monitoring, support, loss, and return expectations." },
        { id: "checklist_endpoint_implement", phase: "implement", title: "Enroll and protect endpoints", guidance: "Apply approved builds, device identity, encryption, endpoint protection, update management, remote-access controls, recovery mechanisms, and clear user reporting instructions." },
        { id: "checklist_endpoint_operate", phase: "operate", title: "Maintain endpoint trust", guidance: "Monitor management health, address missed updates and detections, support secure travel and remote work, and rapidly restrict lost, stolen, compromised, or unreturned devices." },
        { id: "checklist_endpoint_review", phase: "review", title: "Review device and remote-work risk", guidance: "Examine unmanaged access, local-data exceptions, stale devices, unsupported platforms, privacy concerns, recurring loss, and whether remote safeguards fit actual work patterns." },
      ],
      suggestedOwners: ["Endpoint engineering", "Information security", "IT support", "Human resources", "Business managers"],
      evidenceExamples: ["Approved endpoint baseline", "Device enrollment and health reports", "Remote-access configuration records", "Lost-device response and return records"],
      reviewTriggers: ["Material workforce-location change", "New endpoint or virtual-workspace platform", "Lost-device or endpoint incident", "Repeated unmanaged or unsupported access"],
    },
  }),
  policy({
    id: "policy_cryptography_key_management",
    slug: "cryptography-key-management-policy",
    name: "Cryptography and Key Management Policy",
    summary: "A reusable policy pattern for selecting cryptographic protections and managing keys, certificates, and secrets throughout their lifecycle.",
    description: "This sample policy establishes approved uses and accountable generation, storage, distribution, activation, rotation, recovery, revocation, destruction, inventory, and exception practices.",
    applicability: "Organizations using encryption, digital signatures, certificates, cryptographic keys, tokens, or secrets to protect information, identities, software, or communications.",
    domains: ["cryptography", "key management", "secrets management"],
    tags: ["encryption", "certificate lifecycle", "key rotation", "algorithm agility"],
    playbook: {
      outcome: "Cryptographic protections are selected for defined risks, and keys, certificates, and secrets remain attributable, protected, available when legitimately needed, replaceable, and revocable.",
      decisions: [
        { id: "decision_crypto_standards", question: "Who approves cryptographic algorithms, protocols, strengths, and uses?", options: ["Information security", "Architecture review body", "Cryptography specialist for high-impact uses"] },
        { id: "decision_crypto_custody", question: "Which key custody model is appropriate?", options: ["Centrally managed service", "Application-owned keys within approved controls", "External managed custody with contractual safeguards"] },
      ],
      approaches: [
        { id: "approach_crypto_central", name: "Central key and secrets services", whenToUse: "Organizations able to provide managed certificate, key, and secret capabilities to application and infrastructure teams.", tradeoff: "Improves consistency and rotation, but creates a critical dependency requiring strong resilience and access governance." },
        { id: "approach_crypto_federated", name: "Federated custody under a common standard", whenToUse: "Distributed environments where teams or platforms must operate separate cryptographic services.", tradeoff: "Fits varied technology, but inventory, expertise, and policy consistency are harder to maintain." },
      ],
      checklist: [
        { id: "checklist_crypto_define", phase: "define", title: "Define approved cryptography and custody", guidance: "Specify approved uses, prohibited designs, algorithm and protocol governance, ownership, separation, escrow or recovery, rotation, revocation, destruction, and exception authority." },
        { id: "checklist_crypto_implement", phase: "implement", title: "Build protected lifecycle services", guidance: "Use trustworthy generation, hardware or software protection appropriate to risk, authenticated distribution, inventory, access logging, backup where justified, and automated renewal or rotation." },
        { id: "checklist_crypto_operate", phase: "operate", title: "Manage expiry, compromise, and rotation", guidance: "Monitor certificates and keys, prevent secrets in unapproved locations, rotate on schedule or trigger, revoke suspected material, and coordinate dependent service changes." },
        { id: "checklist_crypto_review", phase: "review", title: "Review cryptographic fitness", guidance: "Identify obsolete protocols, unknown ownership, weak custody, failed rotation, unmanaged certificates, concentration risk, and systems unable to migrate when guidance changes." },
      ],
      suggestedOwners: ["Cryptography or security architecture", "Identity and certificate services", "Platform engineering", "Application owners"],
      evidenceExamples: ["Approved cryptographic standard", "Key and certificate inventory", "Rotation or renewal records", "Revocation and compromise-response records"],
      reviewTriggers: ["Cryptographic weakness or protocol deprecation", "Suspected key or secret compromise", "New key-management platform", "Repeated expiry or rotation failure"],
    },
  }),
  policy({
    id: "policy_physical_security",
    slug: "physical-security-policy",
    name: "Physical Security Policy",
    summary: "A reusable policy pattern for protecting people, facilities, equipment, media, and supporting utilities from physical threats.",
    description: "This sample policy addresses site risk, physical zones, visitor and delivery handling, entry authorization, monitoring, environmental protection, equipment placement, media movement, and emergency access.",
    applicability: "Organizations occupying or relying on offices, data rooms, operational sites, storage areas, shared facilities, or colocated infrastructure.",
    domains: ["physical security", "facility security", "environmental protection"],
    tags: ["visitor management", "physical access", "secure areas", "environmental controls"],
    playbook: {
      outcome: "Physical access and facility protections match the people, equipment, information, and service impact at each site, with accountable response to entry, environmental, and safety events.",
      decisions: [
        { id: "decision_physical_zones", question: "How will physical security zones be classified?", options: ["Public and restricted", "Public, controlled, and high-security", "Site-specific zones based on asset and safety impact"] },
        { id: "decision_physical_monitoring", question: "Which areas require monitoring or entry records?", options: ["Primary entrances", "Entrances and sensitive rooms", "Risk-selected boundaries with privacy review"] },
      ],
      approaches: [
        { id: "approach_physical_layered", name: "Layered facility zones", whenToUse: "Dedicated sites where perimeter, reception, workspace, and sensitive-area controls can be designed together.", tradeoff: "Creates clear boundaries, but cost and emergency-egress requirements limit where stronger barriers are practical." },
        { id: "approach_physical_shared", name: "Shared-facility compensating model", whenToUse: "Leased, coworking, colocation, or multi-tenant sites where the organization controls only part of the physical environment.", tradeoff: "Adapts to limited control, but relies more on provider assurance, local enclosures, procedural controls, and escalation." },
      ],
      checklist: [
        { id: "checklist_physical_define", phase: "define", title: "Define site zones and authority", guidance: "Assess site threats and set entry, visitor, delivery, escort, monitoring, equipment, media, utility, emergency, privacy, and exception expectations by zone." },
        { id: "checklist_physical_implement", phase: "implement", title: "Establish layered physical safeguards", guidance: "Deploy appropriate barriers, credentials, reception processes, secure rooms or cabinets, environmental sensors, alternate utilities, monitoring, and emergency-release arrangements." },
        { id: "checklist_physical_operate", phase: "operate", title: "Manage access and facility events", guidance: "Authorize and remove access, oversee visitors and deliveries, investigate forced or anomalous entry, protect maintenance activity, and coordinate safety-first emergency response." },
        { id: "checklist_physical_review", phase: "review", title: "Review sites and shared dependencies", guidance: "Inspect access lists, sensitive areas, blind spots, environmental events, provider responsibilities, unused credentials, equipment movement, and changes in occupancy or neighborhood risk." },
      ],
      suggestedOwners: ["Facilities and physical security", "Information security", "Health and safety", "Site leadership", "Infrastructure operations"],
      evidenceExamples: ["Site risk and zone assessment", "Physical access authorization records", "Visitor and delivery procedures", "Facility inspection or alarm-test records"],
      reviewTriggers: ["New or relocated facility", "Physical intrusion or environmental event", "Material occupancy or shared-facility change", "Repeated access-control or alarm failure"],
    },
  }),
  policy({
    id: "policy_ai_governance_acceptable_use",
    slug: "ai-governance-acceptable-use-policy",
    name: "AI Governance and Acceptable Use Policy",
    acronym: "AI Governance Policy",
    summary: "A reusable policy pattern for governing responsible acquisition, development, deployment, and use of artificial intelligence.",
    description: "This sample policy establishes AI use-case ownership, risk tiering, permitted use, data and security boundaries, human oversight, evaluation, transparency, supplier review, monitoring, and retirement without asserting system trustworthiness or legal compliance.",
    applicability: "Organizations whose workforce, products, services, operations, or suppliers use generative, predictive, decision-support, autonomous, or other AI capabilities.",
    domains: ["AI governance", "acceptable use", "model risk"],
    tags: ["generative AI", "human oversight", "AI inventory", "model evaluation"],
    playbook: {
      outcome: "AI uses are inventoried and owned, permitted behavior is understandable, and safeguards, evaluation, human authority, transparency, and monitoring are proportionate to plausible harm and dependency.",
      decisions: [
        { id: "decision_ai_tiers", question: "Which factors determine AI use-case risk tier?", options: ["Data sensitivity and external impact", "Impact, autonomy, scale, and reversibility", "Rights, safety, security, privacy, business, and concentration scenarios"] },
        { id: "decision_ai_human", question: "Where must a person review or retain final authority?", options: ["Externally consequential outputs", "High-impact decisions and irreversible actions", "Risk-selected decisions with defined override and appeal paths"] },
      ],
      approaches: [
        { id: "approach_ai_approved_tools", name: "Approved-tool acceptable use", whenToUse: "Organizations beginning with workforce use of hosted AI tools and needing clear data, verification, and accountability boundaries.", tradeoff: "Fast to communicate, but tool approval alone does not address every use case, integration, or downstream decision." },
        { id: "approach_ai_lifecycle", name: "Risk-tiered AI lifecycle governance", whenToUse: "Organizations developing or embedding AI in products, operations, or consequential decision support.", tradeoff: "Provides deeper, use-case-specific oversight, but requires multidisciplinary expertise, testing capacity, and maintained inventories." },
      ],
      checklist: [
        { id: "checklist_ai_define", phase: "define", title: "Define AI scope, tiers, and prohibited uses", guidance: "Describe covered systems and uses, inventory ownership, permitted and prohibited behavior, data boundaries, human authority, transparency, testing, supplier, incident, exception, and retirement expectations." },
        { id: "checklist_ai_implement", phase: "implement", title: "Assess and prepare AI use cases", guidance: "Document purpose, affected people, data and model provenance, threats, failure modes, dependencies, evaluation criteria, human controls, user communication, fallback, and approval before material use." },
        { id: "checklist_ai_operate", phase: "operate", title: "Monitor use, change, and emerging harm", guidance: "Track material model, prompt, data, supplier, autonomy, and integration changes; investigate misuse, insecure output handling, performance drift, harmful outcomes, and override failures." },
        { id: "checklist_ai_review", phase: "review", title: "Review continued fitness and authority", guidance: "Reevaluate risk tier, actual use, evaluation limits, affected-party concerns, human reliance, security testing, supplier concentration, exceptions, and whether to constrain or retire the use case." },
      ],
      suggestedOwners: ["AI governance lead", "Information security", "Privacy and legal", "Data science and engineering", "Product and business risk owners"],
      evidenceExamples: ["AI system and use-case inventory", "Risk-tier and approval rationale", "Evaluation and red-team reports", "Human-oversight and change-review design records"],
      reviewTriggers: ["New high-impact AI use case", "Material model, data, autonomy, or supplier change", "AI-related security, privacy, safety, or fairness concern", "Repeated override, reliability, or misuse issue"],
    },
  }),
] as const;
