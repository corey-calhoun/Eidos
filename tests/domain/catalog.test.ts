import { describe, expect, it } from "vitest";
import {
  catalog,
  catalogIndustries,
  catalogRecords,
  catalogRelationships,
  catalogSummary,
  compareRecords,
  getRecordBySlug,
  getRelatedRecords,
  searchCatalog,
  validateCatalog,
} from "../../src/domain/catalog.js";

const record = {
  id: "framework_example",
  slug: "example-framework",
  name: "Example Framework",
  acronym: "EF",
  type: "framework" as const,
  summary: "A plain-language summary.",
  description: "A longer description of the example framework.",
  issuer: "U.S. National Institute of Standards and Technology",
  jurisdictions: ["global"],
  industries: ["cross-industry"],
  applicability: "Organizations using the example framework.",
  version: "1.0",
  status: "current" as const,
  officialUrl: "https://www.nist.gov/cyberframework",
  aliases: ["Example security framework"],
  contentAuthority: "publisher" as const,
  contentMarker: "paraphrase" as const,
  sourceCitation: "NIST official framework page",
  copyrightTreatment: "metadata_summary_link" as const,
  reviewedAt: "2026-09-06",
  reviewedBy: "Eidos editorial review",
  domains: ["governance"],
  tags: ["example"],
};

const concept = {
  ...record,
  id: "concept_example",
  slug: "example-concept",
  name: "Example Concept",
  acronym: undefined,
  type: "concept" as const,
  officialUrl: undefined,
  aliases: [],
  contentAuthority: "eidos_editorial" as const,
  contentMarker: "editorial" as const,
  sourceCitation: "Eidos sample library editorial record",
  copyrightTreatment: "eidos_original" as const,
};

const publisherConcept = {
  ...concept,
  officialUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf",
  contentAuthority: "publisher" as const,
  contentMarker: "paraphrase" as const,
  sourceCitation: "Example Authority official concept page",
  copyrightTreatment: "metadata_summary_link" as const,
};

const policyPlaybook = {
  contentAuthority: "eidos_editorial",
  contentMarker: "editorial",
  sourceCitation: "Eidos policy playbook editorial guidance",
  reviewedAt: "2026-09-06",
  reviewedBy: "Eidos editorial review",
  outcome: "Access is limited to authorized people for approved business purposes.",
  decisions: [{
    id: "decision_approval_model",
    question: "Who may approve access?",
    options: ["Manager and resource owner", "Role-based preapproval"],
  }],
  approaches: [{
    id: "approach_lightweight",
    name: "Lightweight centralized review",
    whenToUse: "Smaller environments with a limited application inventory.",
    tradeoff: "Simple to operate, but more dependent on manual review.",
  }],
  checklist: [{
    id: "checklist_define_scope",
    phase: "define",
    title: "Define the policy scope",
    guidance: "Identify the people, systems, locations, and access types governed by the policy.",
  }, {
    id: "checklist_health_context",
    phase: "define",
    title: "Identify sensitive health-data systems",
    guidance: "Identify systems and workflows that handle health information before tailoring access rules.",
    industries: ["healthcare"],
  }],
  suggestedOwners: ["Identity and access management", "Information security"],
  evidenceExamples: ["Approved access requests", "Periodic access review records"],
  reviewTriggers: ["Material system or organizational change", "Security incident"],
};

describe("catalog validation", () => {
  it("accepts strict records and authoritative relationships", () => {
    const parsed = validateCatalog({
      records: [record, publisherConcept],
      relationships: [{
        id: "relationship_example",
        source: record.id,
        target: concept.id,
        type: "contains",
        status: "official",
        provenance: {
          authority: "authoritative",
          sourceUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf",
          sourceLabel: "Example Framework contents",
          rationale: "The publisher identifies the concept as part of the framework.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    });

    expect(parsed.records).toHaveLength(2);
  });

  it("rejects unknown properties and duplicate identifiers or slugs", () => {
    expect(() => validateCatalog({ records: [{ ...record, injected: true }], relationships: [] })).toThrow();
    expect(() => validateCatalog({ records: [record, { ...concept, id: record.id }], relationships: [] })).toThrow(/identifiers/i);
    expect(() => validateCatalog({ records: [record, { ...concept, slug: record.slug }], relationships: [] })).toThrow(/slugs/i);
  });

  it("rejects impossible calendar dates rather than only checking date shape", () => {
    expect(() => validateCatalog({ records: [{ ...record, reviewedAt: "2025-02-30" }], relationships: [] })).toThrow(/calendar date/i);
    expect(() => validateCatalog({ records: [{ ...record, publicationDate: "2026-99-99" }], relationships: [] })).toThrow(/calendar date/i);
    expect(() => validateCatalog({ records: [{ ...record, effectiveDate: "2026-04-31" }], relationships: [] })).toThrow(/calendar date/i);
  });

  it("rejects unsupported industry taxonomy values", () => {
    expect(() => validateCatalog({
      records: [{ ...record, industries: ["made-up-sector"] }],
      relationships: [],
    })).toThrow();
    expect(() => validateCatalog({
      records: [{ ...record, industries: ["government", "government"] }],
      relationships: [],
    })).toThrow(/unique/i);
  });

  it("rejects duplicate values in generic taxonomy arrays", () => {
    for (const field of ["jurisdictions", "domains", "tags"] as const) {
      expect(() => validateCatalog({
        records: [{ ...record, [field]: [record[field][0], record[field][0]] }],
        relationships: [],
      })).toThrow(/unique/i);
    }
  });

  it("rejects publisher authority claimed through an unregistered source host", () => {
    expect(() => validateCatalog({
      records: [{ ...record, officialUrl: "https://attacker.invalid/fake" }],
      relationships: [],
    })).toThrow(/registered publisher host/i);
    expect(() => validateCatalog({
      records: [{ ...record, officialUrl: "https://attacker.invalid@nist.gov/fake" }],
      relationships: [],
    })).toThrow(/userinfo/i);
  });

  it("accepts strict policy playbooks and rejects assessment state or non-policy attachment", () => {
    const policy = {
      ...record,
      id: "policy_example",
      slug: "example-policy",
      type: "policy",
      contentAuthority: "eidos_editorial",
      contentMarker: "editorial",
      copyrightTreatment: "eidos_original",
      officialUrl: undefined,
      playbook: policyPlaybook,
    };
    expect(() => validateCatalog({ records: [policy], relationships: [] })).not.toThrow();
    expect(() => validateCatalog({ records: [{ ...record, type: "policy", playbook: policyPlaybook }], relationships: [] })).not.toThrow();
    const { contentAuthority: _authority, ...playbookWithoutAuthority } = policyPlaybook;
    expect(() => validateCatalog({ records: [{ ...policy, playbook: playbookWithoutAuthority }], relationships: [] })).toThrow(/contentAuthority/);
    expect(() => validateCatalog({ records: [{ ...record, playbook: policyPlaybook }], relationships: [] })).toThrow(/policy records/i);
    expect(() => validateCatalog({
      records: [{
        ...policy,
        playbook: {
          ...policyPlaybook,
          checklist: [{ ...policyPlaybook.checklist[0], completed: true }],
        },
      }],
      relationships: [],
    })).toThrow();
  });

  it("rejects duplicate identifiers inside a policy playbook", () => {
    const policy = {
      ...record,
      id: "policy_duplicate_playbook_ids",
      slug: "duplicate-playbook-ids",
      type: "policy",
      contentAuthority: "eidos_editorial",
      contentMarker: "editorial",
      copyrightTreatment: "eidos_original",
      officialUrl: undefined,
      playbook: policyPlaybook,
    };
    expect(() => validateCatalog({
      records: [{ ...policy, playbook: { ...policyPlaybook, checklist: [policyPlaybook.checklist[0], policyPlaybook.checklist[0]] } }],
      relationships: [],
    })).toThrow(/checklist identifiers/i);
    expect(() => validateCatalog({
      records: [{ ...policy, playbook: { ...policyPlaybook, decisions: [policyPlaybook.decisions[0], policyPlaybook.decisions[0]] } }],
      relationships: [],
    })).toThrow(/decision identifiers/i);
    expect(() => validateCatalog({
      records: [{ ...policy, playbook: { ...policyPlaybook, approaches: [policyPlaybook.approaches[0], policyPlaybook.approaches[0]] } }],
      relationships: [],
    })).toThrow(/approach identifiers/i);
    expect(() => validateCatalog({
      records: [{
        ...policy,
        playbook: {
          ...policyPlaybook,
          approaches: [{ ...policyPlaybook.approaches[0], id: policyPlaybook.decisions[0].id }],
        },
      }],
      relationships: [],
    })).toThrow(/all playbook identifiers/i);
  });

  it("rejects dangling relationship references", () => {
    expect(() => validateCatalog({
      records: [record],
      relationships: [{
        id: "relationship_dangling",
        source: record.id,
        target: "missing_record",
        type: "related_to",
        status: "eidos_curated",
        provenance: {
          authority: "non_authoritative",
          sourceLabel: "Eidos editorial note",
          rationale: "This is contextual guidance, not an official mapping.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).toThrow(/existing records/i);
  });

  it("requires authoritative evidence for official mappings", () => {
    expect(() => validateCatalog({
      records: [record, concept],
      relationships: [{
        id: "relationship_unverified",
        source: record.id,
        target: concept.id,
        type: "maps_to",
        status: "official",
        provenance: {
          authority: "non_authoritative",
          sourceLabel: "Editorial inference",
          rationale: "No authoritative mapping is claimed.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).toThrow();
  });

  it("rejects official relationships unless both endpoints are publisher records", () => {
    expect(() => validateCatalog({
      records: [record, concept],
      relationships: [{
        id: "relationship_mixed_authority",
        source: record.id,
        target: concept.id,
        type: "contains",
        status: "official",
        provenance: {
          authority: "authoritative",
          sourceUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf",
          sourceLabel: "Example Framework contents",
          rationale: "The publisher identifies the concept as part of the framework.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).toThrow(/publisher-classified endpoints/i);
  });

  it("rejects URL userinfo in authoritative relationship provenance", () => {
    expect(() => validateCatalog({
      records: [record, publisherConcept],
      relationships: [{
        id: "relationship_userinfo_authority",
        source: record.id,
        target: publisherConcept.id,
        type: "contains",
        status: "official",
        provenance: {
          authority: "authoritative",
          sourceUrl: "https://attacker.invalid@nist.gov/fake",
          sourceLabel: "Deceptive authority URL",
          rationale: "URL userinfo must not be accepted as authoritative provenance.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).toThrow(/userinfo/i);
  });

  it("requires Eidos-curated relationships to be explicitly non-authoritative", () => {
    expect(() => validateCatalog({
      records: [record, concept],
      relationships: [{
        id: "relationship_explanatory",
        source: record.id,
        target: concept.id,
        type: "related_to",
        status: "eidos_curated",
        provenance: {
          authority: "authoritative",
          sourceUrl: "https://example.test/mapping",
          sourceLabel: "Example mapping",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).toThrow();
  });

  it("accepts explicitly unverified relationships only as non-authoritative candidates", () => {
    expect(() => validateCatalog({
      records: [record, concept],
      relationships: [{
        id: "relationship_candidate",
        source: record.id,
        target: concept.id,
        type: "related_to",
        status: "unverified",
        provenance: {
          authority: "non_authoritative",
          sourceLabel: "Unverified editorial candidate",
          rationale: "This candidate remains unverified and is not an established relationship.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).not.toThrow();

    expect(() => validateCatalog({
      records: [record, publisherConcept],
      relationships: [{
        id: "relationship_candidate_with_authority",
        source: record.id,
        target: publisherConcept.id,
        type: "related_to",
        status: "unverified",
        provenance: {
          authority: "authoritative",
          sourceUrl: "https://www.nist.gov/cyberframework",
          sourceLabel: "Misclassified candidate",
          rationale: "An unverified candidate cannot claim authoritative provenance.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).toThrow();
  });

  it("rejects official relationship provenance from an unregistered endpoint publisher host", () => {
    expect(() => validateCatalog({
      records: [record, publisherConcept],
      relationships: [{
        id: "relationship_fake_provenance",
        source: record.id,
        target: publisherConcept.id,
        type: "maps_to",
        status: "official",
        provenance: {
          authority: "authoritative",
          sourceUrl: "https://attacker.invalid/fake-mapping",
          sourceLabel: "Claimed mapping",
          rationale: "This source is not controlled by either endpoint publisher.",
          reviewedAt: "2026-09-06",
          reviewedBy: "Eidos editorial review",
        },
      }],
    })).toThrow(/endpoint publisher host/i);
  });
});

describe("curated catalog", () => {
  it("provides action-oriented playbooks for every built-in policy record", () => {
    const policies = catalogRecords.filter((item) => item.type === "policy");
    expect(policies.length).toBeGreaterThan(0);
    expect(policies.every((item) => item.playbook !== undefined)).toBe(true);
  });

  it("contains curated-core depth across every record type and industry context", () => {
    expect(catalogRecords.length).toBeGreaterThanOrEqual(75);

    const minimumByType = {
      framework: 6,
      regulation: 6,
      standard: 6,
      control_catalog: 6,
      policy: 15,
      control: 6,
      concept: 6,
      law: 2,
      contract_clause: 1,
      guidance: 1,
      criteria: 1,
      knowledge_base: 1,
    } as const;
    for (const [type, minimum] of Object.entries(minimumByType)) {
      expect(catalogRecords.filter((item) => item.type === type).length, type).toBeGreaterThanOrEqual(minimum);
    }

    for (const industry of catalogIndustries.filter((item) => item !== "cross-industry")) {
      expect(catalogRecords.some((item) => item.industries.includes(industry)), industry).toBe(true);
    }
  });

  it("contains useful coverage across all required record types and sources", () => {
    expect(catalogRecords).toBe(catalog.records);
    expect(catalogRelationships).toBe(catalog.relationships);
    expect(catalog.records.length).toBeGreaterThanOrEqual(75);
    expect(new Set(catalog.records.map((item) => item.type))).toEqual(new Set([
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
    ]));

    const namesAndAcronyms = catalog.records.map((item) => `${item.name} ${item.acronym ?? ""}`).join(" ");
    for (const expected of [
      "NIST Cybersecurity Framework", "ISO/IEC 27001", "CIS Controls", "PCI DSS", "HIPAA Security Rule", "General Data Protection Regulation",
      "NIST SP 800-171 Revision 3", "Cybersecurity Maturity Model Certification", "Family Educational Rights and Privacy Act",
      "FTC Safeguards Rule", "Digital Operational Resilience Act", "Cross-Sector Cybersecurity Performance Goals",
      "Cloud Controls Matrix", "OWASP Application Security Verification Standard", "NERC Critical Infrastructure Protection Standards",
    ]) {
      expect(namesAndAcronyms).toContain(expected);
    }
    expect(catalog.records.every((item) => item.aliases !== undefined
      && item.sourceCitation.length > 0
      && item.reviewedAt.length > 0
      && item.reviewedBy.length > 0)).toBe(true);
    expect(catalog.records.filter((item) => item.contentAuthority === "publisher")
      .every((item) => item.officialUrl?.startsWith("https://") && item.contentMarker === "paraphrase")).toBe(true);
    expect(catalog.records.filter((item) => item.contentAuthority === "eidos_editorial")
      .every((item) => item.contentMarker === "editorial" && item.copyrightTreatment === "eidos_original")).toBe(true);
    expect(catalog.records.some((item) => item.type === "regulation" && item.effectiveDate !== undefined)).toBe(true);
    expect(catalog.relationships.every((item) => item.provenance.reviewedAt.length > 0
      && item.provenance.reviewedBy.length > 0)).toBe(true);
    expect(catalog.relationships.every((item) => item.provenance.rationale.length > 0)).toBe(true);
    const byId = new Map(catalog.records.map((item) => [item.id, item]));
    expect(catalog.relationships.filter((item) => item.status === "official").every((item) =>
      byId.get(item.source)?.contentAuthority === "publisher"
      && byId.get(item.target)?.contentAuthority === "publisher")).toBe(true);
    expect(catalog.records.every((item) => item.sourceCitation.includes(item.name)
      && (item.officialUrl === undefined || item.sourceCitation.includes(item.officialUrl)))).toBe(true);
    expect(catalog.records.every((item) => item.reviewedBy.includes("Rosco"))).toBe(true);
    expect(catalog.records.some((item) => item.status === "superseded")).toBe(true);
    expect(catalog.relationships.some((item) => item.type === "supersedes" && item.status === "official")).toBe(true);

    const relationshipDegree = new Map(catalog.records.map((item) => [item.id, 0]));
    for (const relationship of catalog.relationships) {
      relationshipDegree.set(relationship.source, relationshipDegree.get(relationship.source)! + 1);
      relationshipDegree.set(relationship.target, relationshipDegree.get(relationship.target)! + 1);
    }
    expect(catalog.records.filter((item) => relationshipDegree.get(item.id) === 0).map((item) => item.name)).toEqual([]);
  });

  it("keeps legally and operationally distinct material types separate", () => {
    const typeBySlug = new Map(catalogRecords.map((record) => [record.slug, record.type]));
    expect(typeBySlug.get("fisma-2014")).toBe("law");
    expect(typeBySlug.get("ferpa")).toBe("law");
    expect(typeBySlug.get("dfars-252-204-7012")).toBe("contract_clause");
    expect(typeBySlug.get("cisa-zero-trust-maturity-model-2-0")).toBe("guidance");
    expect(typeBySlug.get("aicpa-trust-services-criteria")).toBe("criteria");
    expect(typeBySlug.get("mitre-attack")).toBe("knowledge_base");
  });

  it("preserves source-reviewed publication metadata for key curated records", () => {
    expect(catalogRecords.find((record) => record.slug === "cisa-zero-trust-maturity-model-2-0")?.publicationDate)
      .toBe("2023-04-11");
  });

  it("searches case-insensitively across catalog text and applies filters", () => {
    expect(searchCatalog("multi-factor").some((item) => item.type === "control")).toBe(true);
    expect(searchCatalog("nist", { types: ["framework"], domains: ["governance"] }).map((item) => item.slug)).toContain("nist-csf-2-0");
    expect(searchCatalog("", { jurisdictions: ["European Union"] }).map((item) => item.slug)).toContain("gdpr");
    expect(searchCatalog("payment", { industries: ["payment-processing"] }).map((item) => item.slug)).toContain("pci-dss-v4-0-1");
  });

  it("matches short acronyms as tokens instead of substrings inside unrelated words", () => {
    const results = searchCatalog("AI policy");
    expect(results.map((item) => item.slug)).toContain("ai-governance-acceptable-use-policy");
    expect(results.map((item) => item.slug)).not.toContain("endpoint-detection-and-response-control");
  });

  it("filters by approved industries while retaining cross-industry references", () => {
    expect(catalogIndustries).toContain("defense-industrial-base");
    expect(catalogIndustries).toContain("government");
    expect(catalogIndustries).toContain("healthcare");
    expect(catalogIndustries).toContain("financial-services");

    const healthcare = searchCatalog("", { industries: ["healthcare"] });
    expect(healthcare.some((item) => item.slug === "hipaa-security-rule")).toBe(true);
    expect(healthcare.some((item) => item.slug === "nist-csf-2-0")).toBe(true);
    expect(healthcare.some((item) => item.slug === "pci-dss-v4-0-1")).toBe(false);

    const government = searchCatalog("", { industries: ["government"] });
    expect(government.some((item) => item.slug === "nist-sp-800-53-rev-5")).toBe(true);
    expect(government.some((item) => item.slug === "nist-csf-2-0")).toBe(true);
    const nistControls = government.find((item) => item.slug === "nist-sp-800-53-rev-5");
    expect(nistControls).toMatchObject({
      issuer: "U.S. National Institute of Standards and Technology",
      contentAuthority: "publisher",
      industries: ["government"],
    });
    expect(getRelatedRecords(nistControls!.id).some(({ relationship }) =>
      relationship.status === "eidos_curated" && relationship.provenance.rationale.length > 0)).toBe(true);
  });

  it("gets records by slug without exposing mutable catalog state", () => {
    const nist = getRecordBySlug("nist-csf-2-0");
    expect(nist?.acronym).toBe("NIST CSF");
    expect(getRecordBySlug("missing")).toBeUndefined();
    expect(() => nist?.tags.push("mutation")).toThrow();
  });

  it("provides relationships for high-value curated-core entry points", () => {
    for (const slug of [
      "cmmc-32-cfr-part-170",
      "nist-sp-800-171-rev-3",
      "ferpa",
      "nist-ai-rmf-1-0",
      "nist-secure-software-development-framework-1-1",
      "cloud-controls-matrix-4-1",
      "cloud-security-policy",
      "secure-development-application-security-policy",
    ]) {
      const record = getRecordBySlug(slug);
      expect(record, `${slug} should exist`).toBeDefined();
      expect(getRelatedRecords(record!.id).length, `${slug} should have related guidance`).toBeGreaterThan(0);
    }
  });

  it("returns related records with relationship direction and provenance", () => {
    const related = getRelatedRecords("framework_nist_csf_2_0");
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((item) => item.direction === "outgoing" || item.direction === "incoming")).toBe(true);
    expect(related.every((item) => item.relationship.provenance.sourceLabel.length > 0)).toBe(true);
    expect(() => getRelatedRecords("missing")).toThrow(/Unknown catalog record/i);
  });

  it("compares records and rejects unknown or duplicate selections", () => {
    const comparison = compareRecords(["framework_nist_csf_2_0", "standard_iso_27001_2022"]);
    expect(comparison.records).toHaveLength(2);
    expect(comparison.sharedDomains).toContain("governance");
    expect(comparison.differences.type).toEqual(["framework", "standard"]);
    expect(() => compareRecords(["framework_nist_csf_2_0", "missing"])).toThrow(/Unknown catalog record/i);
    expect(() => compareRecords(["framework_nist_csf_2_0", "framework_nist_csf_2_0"])).toThrow(/unique/i);
  });

  it("summarizes counts consistently", () => {
    const summary = catalogSummary();
    expect(summary.totalRecords).toBe(catalog.records.length);
    expect(summary.totalRelationships).toBe(catalog.relationships.length);
    expect(Object.values(summary.byType).reduce((sum, count) => sum + count, 0)).toBe(summary.totalRecords);
    expect(summary.verifiedRelationships + summary.explanatoryRelationships).toBe(summary.totalRelationships);
  });
});
