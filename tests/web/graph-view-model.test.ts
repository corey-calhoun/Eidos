import { describe, expect, it } from "vitest";
import { sampleGraph } from "../../src/domain/sample-graph.js";
import {
  buildAllRelationshipRows,
  buildRelationshipRows,
  filterGraph,
  summarizeView,
} from "../../src/web/graph-view-model.js";

describe("graph view model", () => {
  it("filters by a search term while preserving connecting relationships", () => {
    const result = filterGraph(sampleGraph, {
      query: "MFA",
      nodeTypes: new Set(),
      assuranceStates: new Set(),
      authority: "all",
    });

    expect(result.nodes.map((node) => node.id).sort()).toEqual([
      "control_admin_mfa",
      "evidence_mfa_test",
      "validation_mfa_login",
    ]);
    expect(result.edges.map((edge) => edge.id).sort()).toEqual([
      "edge_control_validation",
      "edge_validation_evidence",
    ]);
  });

  it("retains a selected entity outside active filters as explicit context", () => {
    const result = filterGraph(sampleGraph, {
      query: "MFA",
      nodeTypes: new Set(),
      assuranceStates: new Set(),
      authority: "all",
    }, "risk_admin_compromise");

    expect(result.nodes.find((node) => node.id === "risk_admin_compromise")).toBeDefined();
    expect(result.contextNodeIds).toEqual(new Set(["risk_admin_compromise"]));
  });

  it("describes incoming and outgoing relationships without relying on the graph", () => {
    const rows = buildRelationshipRows(sampleGraph, "risk_admin_compromise");
    expect(rows.map((row) => [row.direction, row.verb, row.counterpart.id])).toEqual([
      ["Incoming", "creates risk", "finding_password_only"],
      ["Incoming", "affected by", "app_acme_orders"],
      ["Outgoing", "mitigated by", "control_admin_mfa"],
    ]);
    expect(rows.every((row) => row.authority === "Verified")).toBe(true);
  });

  it("keeps the non-graph table synchronized with the filtered graph", () => {
    const riskOnly = filterGraph(sampleGraph, {
      query: "",
      nodeTypes: new Set(["risk"]),
      assuranceStates: new Set(),
      authority: "all",
    });
    expect(riskOnly.nodes).toHaveLength(1);
    expect(buildAllRelationshipRows(riskOnly)).toEqual([]);
  });

  it("computes scoped metrics without turning unavailable data into a reassuring value", () => {
    expect(summarizeView(sampleGraph)).toEqual({
      totalNodes: 13,
      failedOrCritical: 3,
      staleEvidence: 0,
      verifiedCoverage: 92,
      validatedControls: 1,
    });
  });
});
