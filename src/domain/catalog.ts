import { z } from "zod";

export const catalogRecordTypes = [
  "framework",
  "regulation",
  "standard",
  "control_catalog",
  "policy",
  "control",
  "concept",
] as const;

export const catalogRecordStatuses = ["current", "draft", "superseded", "withdrawn"] as const;
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
const taxonomyValuesSchema = z.array(labelSchema).min(1).max(30);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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
  industries: taxonomyValuesSchema,
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
}).strict().superRefine((record, context) => {
  if (record.contentAuthority === "publisher"
    && (record.officialUrl === undefined || record.contentMarker !== "paraphrase" || record.copyrightTreatment !== "metadata_summary_link")) {
    context.addIssue({ code: "custom", message: "Publisher records require an official URL and metadata/summary/link treatment." });
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
    status: z.literal("verified"),
    provenance: authoritativeProvenanceSchema,
  }).strict(),
  z.object({
    ...relationshipBase,
    status: z.literal("explanatory"),
    provenance: nonAuthoritativeProvenanceSchema,
  }).strict(),
]);

export const catalogSchema = z.object({
  records: z.array(catalogRecordSchema).min(1).max(5000),
  relationships: z.array(catalogRelationshipSchema).max(20000),
}).strict().superRefine((value, context) => {
  const recordIds = new Set(value.records.map((record) => record.id));
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
  });
});

export type CatalogRecord = z.infer<typeof catalogRecordSchema>;
export type CatalogRelationship = z.infer<typeof catalogRelationshipSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogRecordType = (typeof catalogRecordTypes)[number];
export type CatalogRecordStatus = (typeof catalogRecordStatuses)[number];

export interface CatalogSearchFilters {
  types?: readonly CatalogRecordType[];
  statuses?: readonly CatalogRecordStatus[];
  jurisdictions?: readonly string[];
  industries?: readonly string[];
  domains?: readonly string[];
  tags?: readonly string[];
}

export function validateCatalog(input: unknown): Catalog {
  return catalogSchema.parse(input);
}

const rawSampleCatalog = {
  records: [
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
      id: "standard_pci_dss_v4_0_1", slug: "pci-dss-v4-0-1", name: "Payment Card Industry Data Security Standard v4.0.1", acronym: "PCI DSS", type: "standard",
      summary: "A security standard for protecting payment account data throughout its lifecycle.",
      description: "PCI DSS establishes technical and operational requirements for entities that store, process, or transmit cardholder data or can affect the cardholder data environment.",
      issuer: "PCI Security Standards Council", jurisdictions: ["global"], industries: ["payment-card", "retail", "financial services"],
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
    },
    {
      id: "policy_incident_response", slug: "incident-response-policy", name: "Incident Response Policy", acronym: "IR Policy", type: "policy",
      summary: "A reusable policy pattern for preparing for, detecting, handling, and learning from security incidents.",
      description: "This sample policy establishes roles, escalation expectations, communications, evidence preservation, recovery, and post-incident review at a high level.",
      issuer: "Eidos sample library", jurisdictions: ["organization-specific"], industries: ["cross-industry"],
      applicability: "Organizations defining an incident-response governance baseline.", version: "sample 1.0", status: "current",
      domains: ["incident response", "governance", "resilience"], tags: ["escalation", "communications", "lessons learned"],
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
    {
      id: "relationship_nist_contains_governance", source: "framework_nist_csf_2_0", target: "concept_cybersecurity_governance", type: "contains", status: "verified",
      provenance: { authority: "authoritative", sourceUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf", sourceLabel: "NIST CSF 2.0 publication — GOVERN Function", rationale: "NIST CSF 2.0 defines GOVERN as one of the framework's six Functions." },
    },
    {
      id: "relationship_nist_iso_context", source: "framework_nist_csf_2_0", target: "standard_iso_27001_2022", type: "related_to", status: "explanatory",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "Both are widely used risk-based cybersecurity references; this is not an official control mapping." },
    },
    {
      id: "relationship_nist_cis_context", source: "framework_nist_csf_2_0", target: "catalog_cis_controls_v8_1", type: "related_to", status: "explanatory",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "The outcome-oriented framework and prioritized safeguard catalog are often considered together; no exact mapping is asserted." },
    },
    {
      id: "relationship_access_policy_mfa", source: "policy_access_control", target: "control_multi_factor_authentication", type: "implements", status: "explanatory",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos sample-library rationale", rationale: "The sample MFA control illustrates one possible implementation of the sample policy; organizations must tailor it." },
    },
    {
      id: "relationship_ir_policy_exercise", source: "policy_incident_response", target: "control_security_incident_exercises", type: "implements", status: "explanatory",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos sample-library rationale", rationale: "Exercises are one possible means of implementing and assuring the sample incident-response policy." },
    },
    {
      id: "relationship_hipaa_risk_context", source: "regulation_hipaa_security_rule", target: "concept_risk_based_approach", type: "related_to", status: "explanatory",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "The concept helps explain contextual implementation but does not claim an exact regulatory mapping." },
    },
    {
      id: "relationship_gdpr_governance_context", source: "regulation_gdpr", target: "concept_cybersecurity_governance", type: "related_to", status: "explanatory",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "Governance is relevant to accountability and security, but this relationship is explanatory rather than legal guidance." },
    },
    {
      id: "relationship_pci_mfa_context", source: "standard_pci_dss_v4_0_1", target: "control_multi_factor_authentication", type: "related_to", status: "explanatory",
      provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale: "MFA is relevant to payment security; no requirement-level or control-to-control mapping is asserted here." },
    },
  ],
} as const;

const editorialReview = { reviewedAt: "2026-09-06", reviewedBy: "Eidos editorial review" } as const;

function enrichRecord(record: (typeof rawSampleCatalog.records)[number]) {
  const officialUrl = "officialUrl" in record ? record.officialUrl : undefined;
  const acronym = "acronym" in record ? record.acronym : undefined;
  return {
    ...record,
    aliases: acronym ? [acronym] : [],
    contentAuthority: officialUrl ? "publisher" as const : "eidos_editorial" as const,
    contentMarker: officialUrl ? "paraphrase" as const : "editorial" as const,
    sourceCitation: officialUrl ? `${record.issuer} official publisher page` : "Eidos sample library editorial record",
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

const sampleCatalog = {
  records: rawSampleCatalog.records.map(enrichRecord),
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

export function searchCatalog(query: string, filters: CatalogSearchFilters = {}): CatalogRecord[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return catalog.records.filter((record) => {
    const searchable = [
      record.name, record.acronym ?? "", record.summary, record.description, record.issuer,
      record.applicability, record.version ?? "", ...record.jurisdictions, ...record.industries,
      ...record.domains, ...record.tags,
    ].join(" ").toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term))
      && (filters.types === undefined || filters.types.includes(record.type))
      && (filters.statuses === undefined || filters.statuses.includes(record.status))
      && includesAny(record.jurisdictions, filters.jurisdictions)
      && includesAny(record.industries, filters.industries)
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
    verifiedRelationships: catalog.relationships.filter((relationship) => relationship.status === "verified").length,
    explanatoryRelationships: catalog.relationships.filter((relationship) => relationship.status === "explanatory").length,
  };
}
