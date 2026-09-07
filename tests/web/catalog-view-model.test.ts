import { describe, expect, it } from "vitest";
import { catalogRecords } from "../../src/domain/catalog.js";
import {
  buildPolicyPlaybookView,
  buildCatalogFacets,
  filterCatalog,
  formatCatalogType,
  formatRelationshipAuthority,
  getAdjacentRecordDetailSection,
  getDialogFocusEdge,
  getIndustryRelevance,
  getRecordDialogFocusAction,
  getRecordDetailSections,
  toggleComparison,
  type CatalogViewRecord,
} from "../../src/web/catalog-view-model.js";

const records: CatalogViewRecord[] = [
  {
    id: "framework_nist_csf_2", slug: "nist-csf-2-0", name: "NIST Cybersecurity Framework 2.0", acronym: "NIST CSF 2.0", type: "framework",
    summary: "A flexible framework for managing cybersecurity risk.", description: "An outcomes-based cybersecurity reference.",
    issuer: "National Institute of Standards and Technology", jurisdictions: ["global"], industries: ["cross-industry", "government"],
    applicability: "Organizations of any size and sector.", version: "2.0", status: "current", officialUrl: "https://www.nist.gov/cyberframework",
    aliases: ["NIST CSF"], contentAuthority: "publisher", contentMarker: "paraphrase", sourceCitation: "NIST official publisher page",
    copyrightTreatment: "metadata_summary_link", reviewedAt: "2026-09-06", reviewedBy: "Eidos editorial review",
    domains: ["Risk management", "Governance"], tags: ["NIST", "CSF"],
  },
  {
    id: "regulation_gdpr", slug: "gdpr", name: "General Data Protection Regulation", acronym: "GDPR", type: "regulation",
    summary: "European Union rules for personal data protection.", description: "Rules for processing personal information.",
    issuer: "European Union", jurisdictions: ["European Union"], industries: ["financial-services"],
    applicability: "Organizations processing personal data of people in the EEA.", version: "2016/679", status: "current", officialUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    aliases: ["GDPR"], contentAuthority: "publisher", contentMarker: "paraphrase", sourceCitation: "EUR-Lex official publication",
    copyrightTreatment: "metadata_summary_link", effectiveDate: "2018-05-25", reviewedAt: "2026-09-06", reviewedBy: "Eidos editorial review",
    domains: ["Privacy", "Data protection"], tags: ["EU", "personal data"],
  },
  {
    id: "policy_incident_response", slug: "incident-response-policy", name: "Incident Response Policy", type: "policy",
    summary: "A policy reference for preparing for and handling incidents.", description: "A reusable policy pattern.",
    issuer: "Eidos editorial", jurisdictions: ["organization-specific"], industries: ["cross-industry"],
    applicability: "Security and operations teams.", version: "1.0", status: "draft",
    aliases: [], contentAuthority: "eidos_editorial", contentMarker: "editorial", sourceCitation: "Eidos sample library editorial record",
    copyrightTreatment: "eidos_original", reviewedAt: "2026-09-06", reviewedBy: "Eidos editorial review",
    domains: ["Incident response"], tags: ["policy", "operations"],
  },
];

describe("catalog view model", () => {
  it("searches readable record fields and combines type, status, and domain filters", () => {
    expect(filterCatalog(records, {
      query: "personal data", types: new Set(["regulation"]), statuses: new Set(["current"]), domains: new Set(["Privacy"]), industries: new Set(),
    }).map((record) => record.id)).toEqual(["regulation_gdpr"]);

    expect(filterCatalog(records, {
      query: "national institute", types: new Set(), statuses: new Set(), domains: new Set(), industries: new Set(),
    }).map((record) => record.id)).toEqual(["framework_nist_csf_2"]);
  });

  it("builds sorted browse facets with readable labels and record counts", () => {
    expect(buildCatalogFacets(records).types).toEqual([
      { value: "framework", label: "Frameworks", count: 1 },
      { value: "policy", label: "Policies", count: 1 },
      { value: "regulation", label: "Regulations", count: 1 },
    ]);
    expect(buildCatalogFacets(records).domains).toEqual([
      { value: "Data protection", label: "Data protection", count: 1 },
      { value: "Governance", label: "Governance", count: 1 },
      { value: "Incident response", label: "Incident response", count: 1 },
      { value: "Privacy", label: "Privacy", count: 1 },
      { value: "Risk management", label: "Risk management", count: 1 },
    ]);
    expect(buildCatalogFacets(records).industries).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "defense-industrial-base", label: "Defense / DoD", directCount: 0 }),
      expect.objectContaining({ value: "government", label: "Government", directCount: 1 }),
      expect.objectContaining({ value: "healthcare", label: "Healthcare" }),
      expect.objectContaining({ value: "financial-services", label: "Financial services" }),
    ]));
    expect(formatCatalogType("control_catalog", true)).toBe("Control catalogs");
    expect(formatCatalogType("concept")).toBe("GRC concept");
  });

  it("limits comparison to three eligible references and toggles a selected record off", () => {
    expect(toggleComparison([], records[2]!)).toEqual({
      ids: [], reason: "Policies are reference material but are not available for comparison.",
    });
    expect(toggleComparison(["framework_nist_csf_2", "regulation_gdpr", "standard_iso_27001"], {
      ...records[0]!, id: "catalog_nist_800_53", type: "control_catalog",
    })).toEqual({
      ids: ["framework_nist_csf_2", "regulation_gdpr", "standard_iso_27001"],
      reason: "You can compare up to three references at a time.",
    });
    expect(toggleComparison(["framework_nist_csf_2", "regulation_gdpr"], records[0]!)).toEqual({
      ids: ["regulation_gdpr"], reason: null,
    });
  });

  it("focuses every opened record dialog and restores library focus when navigation closes it", () => {
    expect(getRecordDialogFocusAction(false, true)).toBe("focus_dialog");
    expect(getRecordDialogFocusAction(true, true)).toBe("focus_dialog");
    expect(getRecordDialogFocusAction(true, false)).toBe("restore_library");
    expect(getRecordDialogFocusAction(false, false)).toBeNull();
  });

  it("keeps focus inside a dialog when the focused heading is not in the tab order", () => {
    expect(getDialogFocusEdge(-1, 4, true)).toBe("last");
    expect(getDialogFocusEdge(-1, 4, false)).toBe("first");
    expect(getDialogFocusEdge(0, 4, true)).toBe("last");
    expect(getDialogFocusEdge(3, 4, false)).toBe("first");
    expect(getDialogFocusEdge(1, 4, false)).toBeNull();
  });

  it("filters selected industries with OR semantics and explains direct versus cross-industry matches", () => {
    const filtered = filterCatalog(records, {
      query: "", types: new Set(), statuses: new Set(), domains: new Set(), industries: new Set(["financial-services", "government"]),
    });
    expect(filtered.map((item) => item.id)).toEqual(["framework_nist_csf_2", "regulation_gdpr", "policy_incident_response"]);
    expect(getIndustryRelevance(records[0]!, new Set(["government"]))).toMatchObject({
      kind: "direct",
      label: expect.stringContaining("Eidos-tagged"),
    });
    expect(getIndustryRelevance(records[2]!, new Set(["healthcare"]))).toMatchObject({ kind: "cross_industry" });
  });

  it("labels relationship authority without presenting unverified candidates as established", () => {
    expect(formatRelationshipAuthority("official")).toBe("Official publisher relationship");
    expect(formatRelationshipAuthority("eidos_curated")).toBe("Eidos-curated context");
    expect(formatRelationshipAuthority("unverified")).toBe("Unverified candidate — not established");
  });

  it("tailors policy playbooks to selected industries without storing assessment state", () => {
    const policy = catalogRecords.find((item) => item.slug === "access-control-policy")!;
    const general = buildPolicyPlaybookView(policy, new Set());
    const healthcare = buildPolicyPlaybookView(policy, new Set(["healthcare"]));
    const regulated = buildPolicyPlaybookView(policy, new Set(["healthcare", "government"]));
    const unsupportedContext = buildPolicyPlaybookView(policy, new Set(["technology-saas"]));

    expect(general?.contextLabel).toBe("General starter guidance");
    expect(general?.checklist.some((item) => item.id === "checklist_access_healthcare")).toBe(false);
    expect(healthcare?.contextLabel).toBe("Tailored for Healthcare");
    expect(healthcare?.checklist.some((item) => item.id === "checklist_access_healthcare")).toBe(true);
    expect(healthcare?.checklist.some((item) => item.id === "checklist_access_financial")).toBe(false);
    expect(regulated?.checklist.some((item) => item.id === "checklist_access_government")).toBe(true);
    expect(unsupportedContext?.contextLabel).toBe("General starter guidance");
    expect(unsupportedContext?.checklist).toEqual(general?.checklist);
    expect(Object.hasOwn(healthcare?.checklist[0] ?? {}, "completed")).toBe(false);
    expect(buildPolicyPlaybookView(catalogRecords.find((item) => item.type !== "policy")!, new Set())).toBeNull();
  });

  it("keeps dense record content in focused sections and exposes playbooks only when available", () => {
    const policy = catalogRecords.find((item) => item.slug === "access-control-policy")!;
    const framework = catalogRecords.find((item) => item.type === "framework")!;

    expect(getRecordDetailSections(policy).map((section) => section.id)).toEqual([
      "overview", "playbook", "related", "source",
    ]);
    expect(getRecordDetailSections(framework).map((section) => section.id)).toEqual([
      "overview", "related", "source",
    ]);
    expect(getAdjacentRecordDetailSection("overview", "previous", policy)).toBe("source");
    expect(getAdjacentRecordDetailSection("source", "next", policy)).toBe("overview");
    expect(getAdjacentRecordDetailSection("playbook", "next", framework)).toBe("overview");
  });

});
