import { describe, expect, it } from "vitest";
import { edgeTypes, validateGraph } from "../../src/domain/graph.js";

const provenance = {
  authority: "human" as const,
  sourceType: "consultant_observation" as const,
  sourceReference: "engagement://acme/observation/1",
  observedAt: "2026-09-01T00:00:00.000Z",
  verifiedAt: "2026-09-01T01:00:00.000Z",
  verifiedBy: "consultant@example.test",
  confidence: 1,
};

describe("validateGraph", () => {
  it("accepts a provenance-backed application-to-risk-to-control chain", () => {
    const result = validateGraph({
      nodes: [
        { id: "app", type: "application", label: "Acme Orders", assurance: "unknown" },
        { id: "risk", type: "risk", label: "Admin account compromise", assurance: "failed", provenance },
        { id: "control", type: "control", label: "Administrator MFA", assurance: "implemented_unverified", provenance },
      ],
      edges: [
        { id: "e1", source: "app", target: "risk", type: "affected_by", state: "verified", provenance },
        { id: "e2", source: "risk", target: "control", type: "mitigated_by", state: "verified", provenance },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects dangling relationships", () => {
    const result = validateGraph({
      nodes: [{ id: "app", type: "application", label: "Acme Orders", assurance: "unknown" }],
      edges: [
        { id: "e1", source: "app", target: "missing", type: "affected_by", state: "verified", provenance },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects verified relationships without provenance", () => {
    const result = validateGraph({
      nodes: [
        { id: "risk", type: "risk", label: "Admin account compromise", assurance: "failed" },
        { id: "control", type: "control", label: "Administrator MFA", assurance: "implemented_unverified" },
      ],
      edges: [
        { id: "e1", source: "risk", target: "control", type: "mitigated_by", state: "verified" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires a verification actor and timestamp for verified consultant observations", () => {
    const result = validateGraph({
      nodes: [
        { id: "risk", type: "risk", label: "Admin account compromise", assurance: "failed" },
        { id: "control", type: "control", label: "Administrator MFA", assurance: "implemented_unverified" },
      ],
      edges: [
        {
          id: "e1",
          source: "risk",
          target: "control",
          type: "mitigated_by",
          state: "verified",
          provenance: {
            authority: "human",
            sourceType: "consultant_observation",
            sourceReference: "engagement://acme/observation/2",
            observedAt: "2026-09-01T00:00:00.000Z",
            confidence: 1,
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects semantically invalid relationship directions", () => {
    const result = validateGraph({
      nodes: [
        { id: "control", type: "control", label: "Administrator MFA", assurance: "validated" },
        { id: "risk", type: "risk", label: "Admin account compromise", assurance: "failed" },
      ],
      edges: [
        { id: "e1", source: "control", target: "risk", type: "mitigated_by", state: "verified", provenance },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects every relationship type for a nonsensical owner-to-framework pair", () => {
    for (const type of edgeTypes) {
      const result = validateGraph({
        nodes: [
          { id: "owner", type: "owner", label: "Owner", assurance: "unknown" },
          { id: "framework", type: "framework", label: "Framework", assurance: "unknown" },
        ],
        edges: [{ id: `edge_${type}`, source: "owner", target: "framework", type, state: "unknown" }],
      });
      expect(result.success, `${type} must fail closed`).toBe(false);
    }
  });

  it("rejects authoritative node assurance without human or deterministic provenance", () => {
    expect(validateGraph({
      nodes: [{ id: "control", type: "control", label: "MFA", assurance: "validated" }],
      edges: [],
    }).success).toBe(false);
  });

  it("rejects verified edges without authoritative acceptance metadata", () => {
    const result = validateGraph({
      nodes: [
        { id: "risk", type: "risk", label: "Risk", assurance: "unknown" },
        { id: "control", type: "control", label: "Control", assurance: "unknown" },
      ],
      edges: [{
        id: "edge",
        source: "risk",
        target: "control",
        type: "mitigated_by",
        state: "verified",
        provenance: {
          authority: "client_asserted",
          sourceType: "client_document",
          sourceReference: "client://document/1",
          observedAt: "2026-09-01T00:00:00.000Z",
          confidence: 1,
        },
      }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects unexpected properties instead of silently stripping them", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "app",
          type: "application",
          label: "Acme Orders",
          assurance: "unknown",
          injectedAuthority: "verified",
        },
      ],
      edges: [],
      bypassValidation: true,
    });

    expect(result.success).toBe(false);
  });
});
