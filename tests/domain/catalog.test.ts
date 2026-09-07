import { describe, expect, it } from "vitest";
import {
  catalog,
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
  issuer: "Example Authority",
  jurisdictions: ["global"],
  industries: ["cross-industry"],
  applicability: "Organizations using the example framework.",
  version: "1.0",
  status: "current" as const,
  officialUrl: "https://example.test/framework",
  aliases: ["Example security framework"],
  contentAuthority: "publisher" as const,
  contentMarker: "paraphrase" as const,
  sourceCitation: "Example Authority official framework page",
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

describe("catalog validation", () => {
  it("accepts strict records and authoritative relationships", () => {
    const parsed = validateCatalog({
      records: [record, concept],
      relationships: [{
        id: "relationship_example",
        source: record.id,
        target: concept.id,
        type: "contains",
        status: "verified",
        provenance: {
          authority: "authoritative",
          sourceUrl: "https://example.test/framework/contents",
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

  it("rejects dangling relationship references", () => {
    expect(() => validateCatalog({
      records: [record],
      relationships: [{
        id: "relationship_dangling",
        source: record.id,
        target: "missing_record",
        type: "related_to",
        status: "explanatory",
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

  it("requires authoritative evidence for verified mappings", () => {
    expect(() => validateCatalog({
      records: [record, concept],
      relationships: [{
        id: "relationship_unverified",
        source: record.id,
        target: concept.id,
        type: "maps_to",
        status: "verified",
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

  it("requires explanatory relationships to be explicitly non-authoritative", () => {
    expect(() => validateCatalog({
      records: [record, concept],
      relationships: [{
        id: "relationship_explanatory",
        source: record.id,
        target: concept.id,
        type: "related_to",
        status: "explanatory",
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
    expect(catalog.relationships.filter((item) => item.status === "verified").every((item) =>
      byId.get(item.source)?.contentAuthority === "publisher"
      && byId.get(item.target)?.contentAuthority === "publisher")).toBe(true);
  });

  it("searches case-insensitively across catalog text and applies filters", () => {
    expect(searchCatalog("multi-factor").some((item) => item.type === "control")).toBe(true);
    expect(searchCatalog("nist", { types: ["framework"], domains: ["governance"] }).map((item) => item.slug)).toContain("nist-csf-2-0");
    expect(searchCatalog("", { jurisdictions: ["European Union"] }).map((item) => item.slug)).toContain("gdpr");
    expect(searchCatalog("payment", { industries: ["payment-card"] }).map((item) => item.slug)).toContain("pci-dss-v4-0-1");
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
