import { describe, expect, it } from "vitest";
import { sampleGraph } from "../../src/domain/sample-graph.js";
import { findPath, summarizeGraph, validateGraph } from "../../src/domain/graph.js";

describe("sampleGraph", () => {
  it("is a valid provenance-backed graph", () => {
    expect(validateGraph(sampleGraph).success).toBe(true);
  });

  it("contains the complete application-to-framework assurance chain", () => {
    expect(findPath(sampleGraph, "app_acme_orders", "framework_owasp_asvs")).toEqual([
      "app_acme_orders",
      "risk_admin_compromise",
      "control_admin_mfa",
      "validation_mfa_login",
      "evidence_mfa_test",
      "requirement_asvs_auth",
      "framework_owasp_asvs",
    ]);
  });

  it("contains the canonical acceptance IDs and a proposed side branch", () => {
    const canonicalIds = [
      "app_acme_orders",
      "risk_admin_compromise",
      "control_admin_mfa",
      "validation_mfa_login",
      "evidence_mfa_test",
      "requirement_asvs_auth",
    ];
    expect(canonicalIds.every((id) => sampleGraph.nodes.some((node) => node.id === id))).toBe(true);
    expect(sampleGraph.edges).toContainEqual(expect.objectContaining({
      id: "edge_control_policy",
      source: "control_admin_mfa",
      target: "policy_access_control",
      state: "proposed",
    }));
  });

  it("summarizes assurance state without trusting a display score", () => {
    expect(summarizeGraph(sampleGraph)).toMatchObject({
      totalNodes: 13,
      verifiedEdges: 11,
      criticalFindings: 1,
      validatedControls: 1,
    });
  });
});
