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

  it("rejects publisher authority claimed through an unregistered source host", () => {
    expect(() => validateCatalog({
      records: [{ ...record, officialUrl: "https://attacker.invalid/fake" }],
      relationships: [],
    })).toThrow(/registered publisher host/i);
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
  it("contains useful coverage across all required record types and sources", () => {
    expect(catalogRecords).toBe(catalog.records);
    expect(catalogRelationships).toBe(catalog.relationships);
    expect(catalog.records.length).toBeGreaterThanOrEqual(10);
    expect(new Set(catalog.records.map((item) => item.type))).toEqual(new Set([
      "framework",
      "regulation",
      "standard",
      "control_catalog",
      "policy",
      "control",
      "concept",
    ]));

    const namesAndAcronyms = catalog.records.map((item) => `${item.name} ${item.acronym ?? ""}`).join(" ");
    for (const expected of ["NIST Cybersecurity Framework", "ISO/IEC 27001", "CIS Controls", "PCI DSS", "HIPAA Security Rule", "General Data Protection Regulation"]) {
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
  });

  it("searches case-insensitively across catalog text and applies filters", () => {
    expect(searchCatalog("multi-factor").some((item) => item.type === "control")).toBe(true);
    expect(searchCatalog("nist", { types: ["framework"], domains: ["governance"] }).map((item) => item.slug)).toContain("nist-csf-2-0");
    expect(searchCatalog("", { jurisdictions: ["European Union"] }).map((item) => item.slug)).toContain("gdpr");
    expect(searchCatalog("payment", { industries: ["payment-processing"] }).map((item) => item.slug)).toContain("pci-dss-v4-0-1");
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
