import { z } from "zod";
import { additionalEditorialKnowledgeRecords } from "./catalog-content/editorial-knowledge.js";
import { additionalExternalRecords } from "./catalog-content/external-references.js";
import { additionalPolicyRecords } from "./catalog-content/policies.js";
import { additionalCuratedRelationships } from "./catalog-content/relationships.js";

export const catalogRecordTypes = [
  "framework",
  "regulation",
  "standard",
  "control_catalog",
  "policy",
  "control",
  "concept",
  "law",
  "contract_clause",
  "guidance",
  "criteria",
  "knowledge_base",
] as const;

export const catalogRecordStatuses = ["current", "draft", "superseded", "withdrawn"] as const;
export const catalogIndustries = [
  "cross-industry",
  "defense-industrial-base",
  "government",
  "healthcare",
  "financial-services",
  "payment-processing",
  "education",
  "technology-saas",
  "professional-services",
  "retail",
  "small-business",
  "critical-infrastructure",
] as const;
export const catalogRelationshipTypes = [
  "contains",
  "implements",
  "maps_to",
  "related_to",
  "supersedes",
] as const;

const identifierSchema = z.string().regex(/^[a-z][a-z0-9_]{2,79}$/);
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const labelSchema = z.string().trim().min(1).max(200);
const taxonomyValuesSchema = z.array(labelSchema).min(1).max(30)
  .refine((values) => new Set(values).size === values.length, "Taxonomy values must be unique.");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maximumDay = daysInMonth[month - 1];
  return maximumDay !== undefined && day <= maximumDay;
}, "Expected a valid calendar date");

const policyDecisionSchema = z.object({
  id: identifierSchema,
  question: z.string().trim().min(1).max(300),
  options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
}).strict();

const policyApproachSchema = z.object({
  id: identifierSchema,
  name: labelSchema,
  whenToUse: z.string().trim().min(1).max(500),
  tradeoff: z.string().trim().min(1).max(500),
}).strict();

const policyChecklistItemSchema = z.object({
  id: identifierSchema,
  phase: z.enum(["define", "implement", "operate", "review"]),
  title: labelSchema,
  guidance: z.string().trim().min(1).max(700),
  industries: z.array(z.enum(catalogIndustries)).min(1).max(catalogIndustries.length)
    .refine((values) => new Set(values).size === values.length, "Industry values must be unique.")
    .optional(),
}).strict();

export const policyPlaybookSchema = z.object({
  contentAuthority: z.literal("eidos_editorial"),
  contentMarker: z.literal("editorial"),
  sourceCitation: labelSchema,
  reviewedAt: dateSchema,
  reviewedBy: labelSchema,
  outcome: z.string().trim().min(1).max(700),
  decisions: z.array(policyDecisionSchema).min(1).max(12),
  approaches: z.array(policyApproachSchema).min(1).max(8),
  checklist: z.array(policyChecklistItemSchema).min(1).max(40),
  suggestedOwners: z.array(labelSchema).min(1).max(12),
  evidenceExamples: z.array(labelSchema).min(1).max(20),
  reviewTriggers: z.array(labelSchema).min(1).max(20),
}).strict().superRefine((playbook, context) => {
  if (new Set(playbook.decisions.map((item) => item.id)).size !== playbook.decisions.length) {
    context.addIssue({ code: "custom", path: ["decisions"], message: "Decision identifiers must be unique." });
  }
  if (new Set(playbook.approaches.map((item) => item.id)).size !== playbook.approaches.length) {
    context.addIssue({ code: "custom", path: ["approaches"], message: "Approach identifiers must be unique." });
  }
  if (new Set(playbook.checklist.map((item) => item.id)).size !== playbook.checklist.length) {
    context.addIssue({ code: "custom", path: ["checklist"], message: "Checklist identifiers must be unique." });
  }
  const allIdentifiers = [
    ...playbook.decisions.map((item) => item.id),
    ...playbook.approaches.map((item) => item.id),
    ...playbook.checklist.map((item) => item.id),
  ];
  if (new Set(allIdentifiers).size !== allIdentifiers.length) {
    context.addIssue({ code: "custom", message: "All playbook identifiers must be unique across decisions, approaches, and checklist items." });
  }
});

const publisherAuthorityHosts: Readonly<Record<string, readonly string[]>> = {
  "U.S. National Institute of Standards and Technology": ["nist.gov"],
  "International Organization for Standardization and International Electrotechnical Commission": ["iso.org"],
  "Center for Internet Security": ["cisecurity.org"],
  "PCI Security Standards Council": ["pcisecuritystandards.org"],
  "U.S. Department of Health and Human Services": ["hhs.gov"],
  "European Parliament and Council of the European Union": ["europa.eu"],
  "ISACA": ["isaca.org"],
  "HITRUST Alliance": ["hitrustalliance.net"],
  "U.S. Department of Energy": ["energy.gov"],
  "Cybersecurity and Infrastructure Security Agency": ["cisa.gov"],
  "MITRE Corporation": ["mitre.org"],
  "U.S. Department of Defense": ["defense.gov", "acquisition.gov"],
  "United States Congress": ["congress.gov"],
  "U.S. Department of Education": ["ed.gov"],
  "U.S. Federal Trade Commission": ["ftc.gov"],
  "New York State Department of Financial Services": ["dfs.ny.gov"],
  "International Electrotechnical Commission": ["iec.ch"],
  "American Institute of Certified Public Accountants": ["aicpa-cima.com"],
  "North American Electric Reliability Corporation": ["nerc.com"],
  "Cloud Security Alliance": ["cloudsecurityalliance.org"],
  "OWASP Foundation": ["owasp.org"],
  "Federal Risk and Authorization Management Program": ["fedramp.gov"],
};

function hasUrlUserinfo(sourceUrl: string): boolean {
  const parsedUrl = new URL(sourceUrl);
  return parsedUrl.username !== "" || parsedUrl.password !== "";
}

function isRegisteredPublisherUrl(issuer: string, sourceUrl: string): boolean {
  const parsedUrl = new URL(sourceUrl);
  if (hasUrlUserinfo(sourceUrl)) return false;
  const hostname = parsedUrl.hostname.toLocaleLowerCase();
  return (publisherAuthorityHosts[issuer] ?? []).some((allowedHost) =>
    hostname === allowedHost || hostname.endsWith(`.${allowedHost}`));
}

export const catalogRecordSchema = z.object({
  id: identifierSchema,
  slug: slugSchema,
  name: labelSchema,
  acronym: z.string().trim().min(1).max(40).optional(),
  type: z.enum(catalogRecordTypes),
  summary: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(3000),
  issuer: labelSchema,
  jurisdictions: taxonomyValuesSchema,
  industries: z.array(z.enum(catalogIndustries)).min(1).max(catalogIndustries.length),
  applicability: z.string().trim().min(1).max(1000),
  version: z.string().trim().min(1).max(80).optional(),
  status: z.enum(catalogRecordStatuses),
  officialUrl: z.url().startsWith("https://").optional(),
  aliases: z.array(labelSchema).max(20),
  contentAuthority: z.enum(["publisher", "eidos_editorial"]),
  contentMarker: z.enum(["paraphrase", "editorial"]),
  sourceCitation: z.string().trim().min(1).max(500),
  copyrightTreatment: z.enum(["metadata_summary_link", "eidos_original"]),
  publicationDate: dateSchema.optional(),
  effectiveDate: dateSchema.optional(),
  reviewedAt: dateSchema,
  reviewedBy: labelSchema,
  domains: taxonomyValuesSchema,
  tags: taxonomyValuesSchema,
  playbook: policyPlaybookSchema.optional(),
}).strict().superRefine((record, context) => {
  if (record.playbook !== undefined && record.type !== "policy") {
    context.addIssue({ code: "custom", path: ["playbook"], message: "Playbooks may be attached only to policy records." });
  }
  if (new Set(record.industries).size !== record.industries.length) {
    context.addIssue({ code: "custom", path: ["industries"], message: "Industry values must be unique." });
  }
  if (record.contentAuthority === "publisher"
    && (record.officialUrl === undefined || record.contentMarker !== "paraphrase" || record.copyrightTreatment !== "metadata_summary_link")) {
    context.addIssue({ code: "custom", message: "Publisher records require an official URL and metadata/summary/link treatment." });
  }
  if (record.contentAuthority === "publisher" && record.officialUrl !== undefined
    && hasUrlUserinfo(record.officialUrl)) {
    context.addIssue({ code: "custom", path: ["officialUrl"], message: "Publisher URLs must not contain URL userinfo." });
  } else if (record.contentAuthority === "publisher" && record.officialUrl !== undefined
    && !isRegisteredPublisherUrl(record.issuer, record.officialUrl)) {
    context.addIssue({ code: "custom", path: ["officialUrl"], message: "Publisher records require a registered publisher host for the issuer." });
  }
  if (record.contentAuthority === "eidos_editorial"
    && (record.contentMarker !== "editorial" || record.copyrightTreatment !== "eidos_original")) {
    context.addIssue({ code: "custom", message: "Eidos editorial records require editorial and original-content markers." });
  }
});

const authoritativeProvenanceSchema = z.object({
  authority: z.literal("authoritative"),
  sourceUrl: z.url().startsWith("https://"),
  sourceLabel: labelSchema,
  rationale: z.string().trim().min(1).max(1000),
  reviewedAt: dateSchema,
  reviewedBy: labelSchema,
}).strict();

const nonAuthoritativeProvenanceSchema = z.object({
  authority: z.literal("non_authoritative"),
  sourceLabel: labelSchema,
  rationale: z.string().trim().min(1).max(1000),
  reviewedAt: dateSchema,
  reviewedBy: labelSchema,
}).strict();

const relationshipBase = {
  id: identifierSchema,
  source: identifierSchema,
  target: identifierSchema,
  type: z.enum(catalogRelationshipTypes),
};

export const catalogRelationshipSchema = z.discriminatedUnion("status", [
  z.object({
    ...relationshipBase,
    status: z.literal("official"),
    provenance: authoritativeProvenanceSchema,
  }).strict(),
  z.object({
    ...relationshipBase,
    status: z.literal("eidos_curated"),
    provenance: nonAuthoritativeProvenanceSchema,
  }).strict(),
  z.object({
    ...relationshipBase,
    status: z.literal("unverified"),
    provenance: nonAuthoritativeProvenanceSchema,
  }).strict(),
]);

export const catalogSchema = z.object({
  records: z.array(catalogRecordSchema).min(1).max(5000),
  relationships: z.array(catalogRelationshipSchema).max(20000),
}).strict().superRefine((value, context) => {
  const recordsById = new Map(value.records.map((record) => [record.id, record]));
  const recordIds = new Set(recordsById.keys());
  const slugs = new Set(value.records.map((record) => record.slug));
  if (recordIds.size !== value.records.length) {
    context.addIssue({ code: "custom", path: ["records"], message: "Catalog record identifiers must be unique." });
  }
  if (slugs.size !== value.records.length) {
    context.addIssue({ code: "custom", path: ["records"], message: "Catalog record slugs must be unique." });
  }

  const relationshipIds = new Set<string>();
  value.relationships.forEach((relationship, index) => {
    if (relationshipIds.has(relationship.id)) {
      context.addIssue({ code: "custom", path: ["relationships", index, "id"], message: "Relationship identifiers must be unique." });
    }
    relationshipIds.add(relationship.id);
    if (!recordIds.has(relationship.source) || !recordIds.has(relationship.target)) {
      context.addIssue({ code: "custom", path: ["relationships", index], message: "Relationships must reference existing records." });
    }
    if (relationship.source === relationship.target) {
      context.addIssue({ code: "custom", path: ["relationships", index], message: "Relationships cannot be self-referential." });
    }
    if (relationship.status === "official") {
      const source = recordsById.get(relationship.source);
      const target = recordsById.get(relationship.target);
      if (source?.contentAuthority !== "publisher" || target?.contentAuthority !== "publisher") {
        context.addIssue({
          code: "custom",
          path: ["relationships", index],
          message: "Official relationships require publisher-classified endpoints.",
        });
      } else if (hasUrlUserinfo(relationship.provenance.sourceUrl)) {
        context.addIssue({
          code: "custom",
          path: ["relationships", index, "provenance", "sourceUrl"],
          message: "Authoritative source URLs must not contain URL userinfo.",
        });
      } else if (!isRegisteredPublisherUrl(source.issuer, relationship.provenance.sourceUrl)
        && !isRegisteredPublisherUrl(target.issuer, relationship.provenance.sourceUrl)) {
        context.addIssue({
          code: "custom",
          path: ["relationships", index, "provenance", "sourceUrl"],
          message: "Official relationship provenance must use a registered endpoint publisher host.",
        });
      }
    }
  });
});

export type CatalogRecord = z.infer<typeof catalogRecordSchema>;
export type CatalogRelationship = z.infer<typeof catalogRelationshipSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogRecordType = (typeof catalogRecordTypes)[number];
export type CatalogRecordStatus = (typeof catalogRecordStatuses)[number];
export type CatalogIndustry = (typeof catalogIndustries)[number];
export type PolicyPlaybook = z.infer<typeof policyPlaybookSchema>;

export interface CatalogSearchFilters {
  types?: readonly CatalogRecordType[];
  statuses?: readonly CatalogRecordStatus[];
  jurisdictions?: readonly string[];
  industries?: readonly CatalogIndustry[];
  domains?: readonly string[];
  tags?: readonly string[];
}

export function validateCatalog(input: unknown): Catalog {
  return catalogSchema.parse(input);
}

const accessControlPolicyPlaybook = {
  contentAuthority: "eidos_editorial",
  contentMarker: "editorial",
  sourceCitation: "Eidos policy playbook editorial guidance",
  reviewedAt: "2026-09-07",
  reviewedBy: "Rosco — Eidos editorial reviewer",
  outcome: "People receive only the access they need for approved work, and that access is reviewed, changed, and removed predictably.",
  decisions: [
    { id: "decision_access_scope", question: "What does this policy govern?", options: ["Workforce access", "Privileged and administrative access", "Third-party access", "Logical and physical access"] },
    { id: "decision_access_approval", question: "Who must approve access?", options: ["Manager and resource owner", "Preapproved role owner", "Security review for elevated access"] },
    { id: "decision_access_review", question: "How will access be reviewed?", options: ["Risk-triggered reviews", "Periodic owner certification", "Continuous exception monitoring"] },
  ],
  approaches: [
    { id: "approach_access_lightweight", name: "Centralized starter process", whenToUse: "Smaller environments with a limited application inventory and clear decision makers.", tradeoff: "Simple to operate, but manual approvals and inventories require disciplined follow-through." },
    { id: "approach_access_role_based", name: "Role-based access model", whenToUse: "Growing organizations with repeatable job functions and enough identity tooling to manage roles.", tradeoff: "Faster standard access, but poorly maintained roles can accumulate excessive permissions." },
    { id: "approach_access_high_assurance", name: "High-assurance access governance", whenToUse: "Environments with sensitive systems, privileged access, contractual constraints, or higher operational impact.", tradeoff: "Stronger oversight and evidence, with greater tooling and review overhead." },
  ],
  checklist: [
    { id: "checklist_access_owner", phase: "define", title: "Name the policy owner and approvers", guidance: "Assign accountability for policy maintenance, access approval, exceptions, and periodic review." },
    { id: "checklist_access_scope", phase: "define", title: "Define people, systems, and access types in scope", guidance: "Describe workforce, contractor, service-account, privileged, remote, physical, and third-party access covered by the policy." },
    { id: "checklist_access_lifecycle", phase: "define", title: "Define the access lifecycle", guidance: "State how access is requested, approved, provisioned, changed, reviewed, suspended, and removed." },
    { id: "checklist_access_healthcare", phase: "define", title: "Identify health-information workflows", guidance: "If healthcare context is relevant, identify systems and workflows handling health information before tailoring roles, approvals, and review depth. Confirm actual obligations separately.", industries: ["healthcare"] },
    { id: "checklist_access_financial", phase: "define", title: "Identify financial and payment-data boundaries", guidance: "If financial or payment context is relevant, identify systems handling customer, transaction, or payment data and the third parties that can reach them. Confirm actual obligations separately.", industries: ["financial-services", "payment-processing"] },
    { id: "checklist_access_government", phase: "define", title: "Identify contract and agency constraints", guidance: "If government or defense context is relevant, identify contract-defined data, system boundaries, and access conditions before selecting policy requirements. Do not infer applicability from this playbook.", industries: ["government", "defense-industrial-base"] },
    { id: "checklist_access_roles", phase: "implement", title: "Translate approvals into enforceable roles", guidance: "Map approved job responsibilities to least-privilege roles, document elevated access, and avoid shared accounts where individual accountability is needed." },
    { id: "checklist_access_authentication", phase: "implement", title: "Set authentication and recovery expectations", guidance: "Define where stronger authentication is required and how enrollment, recovery, emergency access, and exceptions are controlled." },
    { id: "checklist_access_revocation", phase: "operate", title: "Operate timely change and revocation", guidance: "Connect workforce and vendor changes to access removal, and monitor for stale, dormant, or orphaned access." },
    { id: "checklist_access_reviews", phase: "review", title: "Review access and exceptions", guidance: "Have accountable owners periodically review sensitive access, service accounts, exceptions, and evidence that removals occurred." },
  ],
  suggestedOwners: ["Identity and access management", "Information security", "Human resources", "System and data owners"],
  evidenceExamples: ["Approved access requests", "Role and entitlement inventory", "Periodic access-review records", "Termination and revocation records", "Exception approvals and expiration dates"],
  reviewTriggers: ["Material system or organizational change", "Identity-platform change", "Security incident involving access", "New contractual or regulatory context", "Repeated access exceptions"],
};

const incidentResponsePolicyPlaybook = {
  contentAuthority: "eidos_editorial",
  contentMarker: "editorial",
  sourceCitation: "Eidos policy playbook editorial guidance",
  reviewedAt: "2026-09-07",
  reviewedBy: "Rosco — Eidos editorial reviewer",
  outcome: "Security incidents are identified, escalated, contained, communicated, recovered from, and reviewed through a predictable decision process.",
  decisions: [
    { id: "decision_incident_authority", question: "Who may declare and lead an incident?", options: ["Security lead", "Cross-functional incident commander", "Executive-designated authority"] },
    { id: "decision_incident_severity", question: "How will severity be determined?", options: ["Business impact tiers", "Data and service impact", "Combined technical, legal, and operational criteria"] },
    { id: "decision_incident_communications", question: "Who controls communications?", options: ["Incident commander", "Legal and communications leads", "Predefined role-based approval matrix"] },
  ],
  approaches: [
    { id: "approach_incident_lightweight", name: "Named-response team", whenToUse: "Smaller organizations with a limited environment and a few people covering multiple response roles.", tradeoff: "Easy to understand, but depends heavily on availability and clearly named alternates." },
    { id: "approach_incident_role_based", name: "Role-based incident command", whenToUse: "Organizations coordinating security, IT, legal, communications, privacy, and business operations.", tradeoff: "Improves coordination, but requires exercises and maintained contact paths." },
    { id: "approach_incident_high_assurance", name: "High-assurance response program", whenToUse: "Organizations with sensitive operations, complex dependencies, contractual notification paths, or significant service impact.", tradeoff: "Produces stronger coordination and evidence, with higher exercise and maintenance cost." },
  ],
  checklist: [
    { id: "checklist_incident_roles", phase: "define", title: "Assign response roles and alternates", guidance: "Name incident leadership, technical, legal, privacy, communications, business, and executive decision roles appropriate to the organization." },
    { id: "checklist_incident_severity", phase: "define", title: "Define severity and escalation criteria", guidance: "Describe observable conditions that change priority, leadership, communication, evidence preservation, or outside assistance." },
    { id: "checklist_incident_dependencies", phase: "define", title: "Identify critical contacts and dependencies", guidance: "Maintain reachable contacts for service providers, insurers, counsel, responders, law enforcement, and key business owners where relevant." },
    { id: "checklist_incident_healthcare", phase: "define", title: "Prepare health-information decision paths", guidance: "If healthcare context is relevant, identify who evaluates impacts to health information, care delivery, privacy, and notification duties. Confirm actual obligations with qualified stakeholders.", industries: ["healthcare"] },
    { id: "checklist_incident_financial", phase: "define", title: "Prepare financial-service coordination paths", guidance: "If financial or payment context is relevant, identify decision paths for transaction systems, fraud teams, payment partners, customer impact, and notification review. Confirm actual obligations separately.", industries: ["financial-services", "payment-processing"] },
    { id: "checklist_incident_government", phase: "define", title: "Prepare government and contractual reporting paths", guidance: "If government or defense context is relevant, identify contract, agency, and data-handling contacts before an incident. Do not infer reporting obligations from this playbook.", industries: ["government", "defense-industrial-base"] },
    { id: "checklist_incident_workflows", phase: "implement", title: "Document response and communication workflows", guidance: "Create usable steps for intake, triage, containment, evidence handling, recovery decisions, internal updates, and approved external communications." },
    { id: "checklist_incident_tools", phase: "implement", title: "Prepare tools and protected records", guidance: "Ensure responders can securely communicate, preserve timelines and evidence, reach backups, and work when primary systems are unavailable." },
    { id: "checklist_incident_exercise", phase: "operate", title: "Exercise realistic scenarios", guidance: "Test decision authority, handoffs, communications, technical actions, and third-party coordination; assign owners and dates to improvements." },
    { id: "checklist_incident_review", phase: "review", title: "Review incidents and corrective actions", guidance: "Document lessons, control gaps, policy changes, responsible owners, and follow-through without turning the playbook itself into a readiness score." },
  ],
  suggestedOwners: ["Information security", "IT operations", "Legal and privacy", "Communications", "Business continuity and executive leadership"],
  evidenceExamples: ["Incident timeline and decision log", "Escalation and communication records", "Preserved technical evidence", "Exercise reports", "Corrective-action ownership records"],
  reviewTriggers: ["Material incident or exercise", "Major technology or supplier change", "New business or data-processing activity", "Contact or leadership change", "Repeated response delay or coordination failure"],
};

const rawSampleCatalog = {
  records: [
    ...additionalExternalRecords,
    ...additionalEditorialKnowledgeRecords,
    ...additionalPolicyRecords,
    {
      id: "framework_nist_csf_2_0", slug: "nist-csf-2-0", name: "NIST Cybersecurity Framework 2.0", acronym: "NIST CSF", type: "framework",
      summary: "A voluntary framework for understanding, assessing, prioritizing, and communicating cybersecurity outcomes.",
      description: "NIST CSF 2.0 organizes cybersecurity outcomes into six Functions—Govern, Identify, Protect, Detect, Respond, and Recover—without prescribing a single implementation method.",
      issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States", "global"], industries: ["cross-industry"],
      applicability: "Organizations of any size, sector, or maturity seeking to manage cybersecurity risk.", version: "2.0", status: "current",
      officialUrl: "https://www.nist.gov/cyberframework", domains: ["governance", "risk management", "cybersecurity"], tags: ["outcomes", "profiles", "tiers"],
    },
    {
      id: "standard_iso_27001_2022", slug: "iso-iec-27001-2022", name: "ISO/IEC 27001:2022", acronym: "ISO 27001", type: "standard",
      summary: "An international standard specifying requirements for an information security management system.",
      description: "ISO/IEC 27001 defines requirements to establish, implement, maintain, and continually improve a risk-based information security management system.",
      issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["cross-industry"],
      applicability: "Organizations seeking a certifiable information security management system.", version: "2022", status: "current",
      officialUrl: "https://www.iso.org/standard/27001", domains: ["governance", "risk management", "information security"], tags: ["ISMS", "certification", "management system"],
    },
    {
      id: "catalog_cis_controls_v8_1", slug: "cis-controls-v8-1", name: "CIS Critical Security Controls v8.1", acronym: "CIS Controls", type: "control_catalog",
      summary: "A prioritized set of safeguards for defending systems and data against common cyberattacks.",
      description: "The CIS Controls group practical safeguards into implementation groups so organizations can prioritize foundational and advanced cyber hygiene.",
      issuer: "Center for Internet Security", jurisdictions: ["global"], industries: ["cross-industry"],
      applicability: "Organizations seeking prioritized, prescriptive cybersecurity safeguards.", version: "8.1", status: "current",
      officialUrl: "https://www.cisecurity.org/controls/v8-1", domains: ["cybersecurity", "asset management", "access control"], tags: ["safeguards", "implementation groups", "cyber hygiene"],
    },
    {
      id: "catalog_nist_sp_800_53_rev_5", slug: "nist-sp-800-53-rev-5", name: "NIST SP 800-53 Revision 5", acronym: "NIST SP 800-53", type: "control_catalog",
      summary: "A customizable catalog of security and privacy controls for information systems and organizations.",
      description: "NIST SP 800-53 Revision 5 organizes flexible security and privacy controls that can support organization-wide risk management and requirements arising from missions, laws, directives, policies, standards, and guidance.",
      issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States"], industries: ["government"],
      applicability: "Organizations selecting and tailoring security and privacy controls for information systems and organizational risk, particularly in U.S. government contexts.", version: "Revision 5, Release 5.2.0", status: "current",
      officialUrl: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", domains: ["security controls", "privacy controls", "risk management"], tags: ["control families", "customizable controls", "information systems"],
    },
    {
      id: "standard_pci_dss_v4_0_1", slug: "pci-dss-v4-0-1", name: "Payment Card Industry Data Security Standard v4.0.1", acronym: "PCI DSS", type: "standard",
      summary: "A security standard for protecting payment account data throughout its lifecycle.",
      description: "PCI DSS establishes technical and operational requirements for entities that store, process, or transmit cardholder data or can affect the cardholder data environment.",
      issuer: "PCI Security Standards Council", jurisdictions: ["global"], industries: ["payment-processing", "retail", "financial-services"],
      applicability: "Entities that store, process, or transmit cardholder data and relevant service providers.", version: "4.0.1", status: "current",
      officialUrl: "https://www.pcisecuritystandards.org/standards/pci-dss/", domains: ["payment security", "access control", "network security"], tags: ["cardholder data", "CDE", "compliance"],
    },
    {
      id: "regulation_hipaa_security_rule", slug: "hipaa-security-rule", name: "HIPAA Security Rule", acronym: "HIPAA Security Rule", type: "regulation",
      summary: "U.S. requirements for safeguarding electronic protected health information.",
      description: "The Security Rule requires covered entities and business associates to apply administrative, physical, and technical safeguards to electronic protected health information.",
      issuer: "U.S. Department of Health and Human Services", jurisdictions: ["United States"], industries: ["healthcare"],
      applicability: "HIPAA covered entities and business associates that create, receive, maintain, or transmit electronic protected health information.", status: "current",
      officialUrl: "https://www.hhs.gov/hipaa/for-professionals/security/index.html", domains: ["privacy", "information security", "risk management"], tags: ["ePHI", "safeguards", "health data"],
    },
    {
      id: "regulation_gdpr", slug: "gdpr", name: "General Data Protection Regulation", acronym: "GDPR", type: "regulation",
      summary: "European Union law governing the processing and protection of personal data.",
      description: "GDPR establishes principles, rights, obligations, and supervisory mechanisms for personal-data processing, including security and accountability requirements.",
      issuer: "European Parliament and Council of the European Union", jurisdictions: ["European Union", "European Economic Area"], industries: ["cross-industry"],
      applicability: "Controllers and processors within scope, including certain organizations outside the EU that offer goods or services to or monitor people in the EU.", version: "Regulation (EU) 2016/679", status: "current",
      officialUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj", effectiveDate: "2018-05-25", domains: ["privacy", "data protection", "governance"], tags: ["personal data", "data subject rights", "accountability"],
    },
    {
      id: "policy_access_control", slug: "access-control-policy", name: "Access Control Policy", type: "policy",
      summary: "A reusable policy pattern for governing logical and physical access to organizational resources.",
      description: "This sample policy record describes expected access approval, least privilege, authentication, periodic review, and timely revocation practices; it is not legal advice or an official framework requirement.",
      issuer: "Eidos sample library", jurisdictions: ["organization-specific"], industries: ["cross-industry"],
      applicability: "Organizations tailoring a policy baseline to their risk, legal, contractual, and technical context.", version: "sample 1.0", status: "current",
      domains: ["access control", "identity management", "governance"], tags: ["least privilege", "authentication", "access review"],
      playbook: accessControlPolicyPlaybook,
    },
    {
      id: "policy_incident_response", slug: "incident-response-policy", name: "Incident Response Policy", acronym: "IR Policy", type: "policy",
      summary: "A reusable policy pattern for preparing for, detecting, handling, and learning from security incidents.",
      description: "This sample policy establishes roles, escalation expectations, communications, evidence preservation, recovery, and post-incident review at a high level.",
      issuer: "Eidos sample library", jurisdictions: ["organization-specific"], industries: ["cross-industry"],
      applicability: "Organizations defining an incident-response governance baseline.", version: "sample 1.0", status: "current",
      domains: ["incident response", "governance", "resilience"], tags: ["escalation", "communications", "lessons learned"],
      playbook: incidentResponsePolicyPlaybook,
    },
    {
      id: "control_multi_factor_authentication", slug: "multi-factor-authentication-control", name: "Multi-factor Authentication Control", acronym: "MFA", type: "control",
      summary: "Require more than one distinct authentication factor for access scenarios selected by risk.",
      description: "This sample control calls for risk-based MFA coverage, secure enrollment and recovery, monitored exceptions, and evidence that enforcement operates as intended.",
      issuer: "Eidos sample library", jurisdictions: ["organization-specific"], industries: ["cross-industry"],
      applicability: "Privileged, remote, sensitive, or otherwise high-risk access as determined by the organization.", version: "sample 1.0", status: "current",
      domains: ["access control", "identity management", "cybersecurity"], tags: ["authentication", "privileged access", "identity"],
    },
    {
      id: "control_security_incident_exercises", slug: "security-incident-exercises", name: "Security Incident Exercise Control", type: "control",
      summary: "Exercise incident-response plans at a risk-informed frequency and track corrective actions.",
      description: "This sample control covers scenario-based exercises, participation by relevant roles, documented observations, assigned improvements, and follow-through.",
      issuer: "Eidos sample library", jurisdictions: ["organization-specific"], industries: ["cross-industry"],
      applicability: "Organizations that need assurance their incident-response arrangements work in practice.", version: "sample 1.0", status: "current",
      domains: ["incident response", "resilience", "assurance"], tags: ["tabletop exercise", "testing", "corrective action"],
    },
    {
      id: "concept_cybersecurity_governance", slug: "nist-csf-govern-function", name: "GOVERN Function (NIST CSF 2.0)", acronym: "GOVERN", type: "concept",
      summary: "The NIST CSF 2.0 Function covering cybersecurity risk strategy, expectations, policy, roles, oversight, and communication.",
      description: "GOVERN is one of six NIST CSF 2.0 Functions. This Eidos description is a short paraphrase of the publisher's framework structure, not a reproduction of the framework text.",
      issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States", "global"], industries: ["cross-industry"],
      applicability: "Organizations using NIST CSF 2.0 to establish and monitor cybersecurity risk-management strategy and expectations.", version: "2.0", status: "current",
      officialUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf", domains: ["governance", "risk management", "cybersecurity"], tags: ["GOVERN", "accountability", "oversight", "strategy"],
    },
    {
      id: "concept_risk_based_approach", slug: "risk-based-approach", name: "Risk-based Approach", type: "concept",
      summary: "Prioritize safeguards and assurance effort according to context, likelihood, impact, and risk tolerance.",
      description: "A risk-based approach avoids treating every asset or obligation identically and instead uses defensible context to select and evaluate measures.",
      issuer: "Eidos sample library", jurisdictions: ["global"], industries: ["cross-industry"],
      applicability: "Organizations tailoring governance and control decisions to their own risk context.", status: "current",
      domains: ["risk management", "governance", "assurance"], tags: ["prioritization", "risk tolerance", "context"],
    },
  ],
  relationships: [
    ...additionalCuratedRelationships,
    {
      id: "relationship_nist_csf_2_supersedes_1_1", source: "framework_nist_csf_2_0", target: "framework_nist_csf_1_1", type: "supersedes", status: "official",
      provenance: { authority: "authoritative", sourceUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf", sourceLabel: "NIST Cybersecurity Framework 2.0 publication", rationale: "NIST identifies CSF 2.0 as the successor to CSF 1.1." },
    },
    {
      id: "relationship_nist_contains_governance", source: "framework_nist_csf_2_0", target: "concept_cybersecurity_governance", type: "contains", status: "official",
      provenance: { authority: "authoritative", sourceUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf", sourceLabel: "NIST CSF 2.0 publication — GOVERN Function", rationale: "NIST CSF 2.0 defines GOVERN as one of the framework's six Functions." },
    },
    {
      id: "relationship_nist_iso_context", source: "framework_nist_csf_2_0", target: "standard_iso_27001_2022", type: "related_to", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "Both are widely used risk-based cybersecurity references; this is not an official control mapping." },
    },
    {
      id: "relationship_nist_cis_context", source: "framework_nist_csf_2_0", target: "catalog_cis_controls_v8_1", type: "related_to", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "The outcome-oriented framework and prioritized safeguard catalog are often considered together; no exact mapping is asserted." },
    },
    {
      id: "relationship_nist_800_53_context", source: "framework_nist_csf_2_0", target: "catalog_nist_sp_800_53_rev_5", type: "related_to", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "NIST CSF describes cybersecurity outcomes while SP 800-53 provides a control catalog; this relationship is orientation, not an official crosswalk or compliance mapping." },
    },
    {
      id: "relationship_access_policy_mfa", source: "policy_access_control", target: "control_multi_factor_authentication", type: "implements", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos sample-library rationale", rationale: "The sample MFA control illustrates one possible implementation of the sample policy; organizations must tailor it." },
    },
    {
      id: "relationship_ir_policy_exercise", source: "policy_incident_response", target: "control_security_incident_exercises", type: "implements", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos sample-library rationale", rationale: "Exercises are one possible means of implementing and assuring the sample incident-response policy." },
    },
    {
      id: "relationship_hipaa_risk_context", source: "regulation_hipaa_security_rule", target: "concept_risk_based_approach", type: "related_to", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "The concept helps explain contextual implementation but does not claim an exact regulatory mapping." },
    },
    {
      id: "relationship_gdpr_governance_context", source: "regulation_gdpr", target: "concept_cybersecurity_governance", type: "related_to", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "Governance is relevant to accountability and security, but this relationship is explanatory rather than legal guidance." },
    },
    {
      id: "relationship_pci_mfa_context", source: "standard_pci_dss_v4_0_1", target: "control_multi_factor_authentication", type: "related_to", status: "eidos_curated",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "MFA is relevant to payment security; no requirement-level or control-to-control mapping is asserted here." },
    },
  ],
} as const;

const editorialReview = { reviewedAt: "2026-09-07", reviewedBy: "Rosco — Eidos editorial reviewer" } as const;

function buildSourceCitation(
  record: (typeof rawSampleCatalog.records)[number],
  officialUrl: string | undefined,
): string {
  const version = "version" in record && record.version ? `; version ${record.version}` : "";
  const publicationDate = "publicationDate" in record && record.publicationDate ? `; published ${record.publicationDate}` : "";
  const effectiveDate = "effectiveDate" in record && record.effectiveDate ? `; effective ${record.effectiveDate}` : "";
  const source = officialUrl ? `; official source ${officialUrl}` : "; Eidos original editorial record";
  return `${record.name}${version}${publicationDate}${effectiveDate}${source}; reviewed ${editorialReview.reviewedAt}`;
}

function enrichRecord(record: (typeof rawSampleCatalog.records)[number]) {
  const officialUrl = "officialUrl" in record ? record.officialUrl : undefined;
  const acronym = "acronym" in record ? record.acronym : undefined;
  return {
    ...record,
    aliases: acronym ? [acronym] : [],
    contentAuthority: officialUrl ? "publisher" as const : "eidos_editorial" as const,
    contentMarker: officialUrl ? "paraphrase" as const : "editorial" as const,
    sourceCitation: buildSourceCitation(record, officialUrl),
    copyrightTreatment: officialUrl ? "metadata_summary_link" as const : "eidos_original" as const,
    ...editorialReview,
  };
}

function enrichRelationship(relationship: (typeof rawSampleCatalog.relationships)[number]) {
  return {
    ...relationship,
    provenance: { ...relationship.provenance, ...editorialReview },
  };
}

const catalogStatusOrder = { current: 0, draft: 1, superseded: 2 } as const;

const sampleCatalog = {
  records: rawSampleCatalog.records.map(enrichRecord)
    .sort((left, right) => catalogStatusOrder[left.status] - catalogStatusOrder[right.status]),
  relationships: rawSampleCatalog.relationships.map(enrichRelationship),
};

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export const catalog: Catalog = deepFreeze(validateCatalog(sampleCatalog));
export const catalogRecords: Catalog["records"] = catalog.records;
export const catalogRelationships: Catalog["relationships"] = catalog.relationships;
const recordsById = new Map(catalogRecords.map((record) => [record.id, record]));
const recordsBySlug = new Map(catalogRecords.map((record) => [record.slug, record]));

function includesAny(values: readonly string[], expected: readonly string[] | undefined): boolean {
  if (expected === undefined || expected.length === 0) return true;
  const normalized = new Set(values.map((value) => value.toLocaleLowerCase()));
  return expected.some((value) => normalized.has(value.toLocaleLowerCase()));
}

function includesIndustry(values: readonly CatalogIndustry[], expected: readonly CatalogIndustry[] | undefined): boolean {
  if (expected === undefined || expected.length === 0) return true;
  return expected.some((industry) => values.includes(industry)
    || (industry !== "cross-industry" && values.includes("cross-industry")));
}

export function searchCatalog(query: string, filters: CatalogSearchFilters = {}): CatalogRecord[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return catalog.records.filter((record) => {
    const searchable = [
      record.name, record.acronym ?? "", record.summary, record.description, record.issuer,
      record.applicability, record.version ?? "", ...record.jurisdictions, ...record.industries,
      ...record.domains, ...record.tags,
    ].join(" ").toLocaleLowerCase();
    const searchableTokens = new Set(searchable.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
    return terms.every((term) => term.length <= 2 ? searchableTokens.has(term) : searchable.includes(term))
      && (filters.types === undefined || filters.types.includes(record.type))
      && (filters.statuses === undefined || filters.statuses.includes(record.status))
      && includesAny(record.jurisdictions, filters.jurisdictions)
      && includesIndustry(record.industries, filters.industries)
      && includesAny(record.domains, filters.domains)
      && includesAny(record.tags, filters.tags);
  });
}

export function getRecordBySlug(slug: string): CatalogRecord | undefined {
  return recordsBySlug.get(slug);
}

export function getRelatedRecords(id: string): Array<{
  record: CatalogRecord;
  relationship: CatalogRelationship;
  direction: "outgoing" | "incoming";
}> {
  if (!recordsById.has(id)) throw new Error(`Unknown catalog record: ${id}`);
  const related: Array<{
    record: CatalogRecord;
    relationship: CatalogRelationship;
    direction: "outgoing" | "incoming";
  }> = [];
  for (const relationship of catalog.relationships) {
    if (relationship.source === id) {
      related.push({ record: recordsById.get(relationship.target)!, relationship, direction: "outgoing" });
    } else if (relationship.target === id) {
      related.push({ record: recordsById.get(relationship.source)!, relationship, direction: "incoming" });
    }
  }
  return related;
}

function intersection(records: readonly CatalogRecord[], select: (record: CatalogRecord) => readonly string[]): string[] {
  const [first, ...rest] = records;
  if (first === undefined) return [];
  return select(first).filter((value) => rest.every((record) => select(record).includes(value)));
}

export function compareRecords(ids: readonly string[]) {
  if (ids.length < 2) throw new Error("Compare at least two catalog records.");
  if (new Set(ids).size !== ids.length) throw new Error("Catalog comparison identifiers must be unique.");
  const records = ids.map((id) => {
    const record = recordsById.get(id);
    if (record === undefined) throw new Error(`Unknown catalog record: ${id}`);
    return record;
  });
  return {
    records,
    sharedDomains: intersection(records, (record) => record.domains),
    sharedTags: intersection(records, (record) => record.tags),
    differences: {
      type: records.map((record) => record.type),
      issuer: records.map((record) => record.issuer),
      jurisdictions: records.map((record) => record.jurisdictions),
      industries: records.map((record) => record.industries),
      version: records.map((record) => record.version),
      status: records.map((record) => record.status),
    },
  };
}

export function catalogSummary() {
  const byType = Object.fromEntries(catalogRecordTypes.map((type) => [type, 0])) as Record<CatalogRecordType, number>;
  const byStatus = Object.fromEntries(catalogRecordStatuses.map((status) => [status, 0])) as Record<CatalogRecordStatus, number>;
  for (const record of catalog.records) {
    byType[record.type] += 1;
    byStatus[record.status] += 1;
  }
  return {
    totalRecords: catalog.records.length,
    totalRelationships: catalog.relationships.length,
    byType,
    byStatus,
    officialRelationships: catalog.relationships.filter((relationship) => relationship.status === "official").length,
    eidosCuratedRelationships: catalog.relationships.filter((relationship) => relationship.status === "eidos_curated").length,
    unverifiedRelationships: catalog.relationships.filter((relationship) => relationship.status === "unverified").length,
    // Compatibility aliases for existing local clients.
    verifiedRelationships: catalog.relationships.filter((relationship) => relationship.status === "official").length,
    explanatoryRelationships: catalog.relationships.filter((relationship) => relationship.status === "eidos_curated").length,
  };
}
