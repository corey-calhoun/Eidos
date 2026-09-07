import { describe, expect, it } from "vitest";
import {
  createAssuranceMarkdownSummary,
  createAssuranceSnapshot,
  serializeAssuranceSnapshot,
} from "../../src/domain/export.js";
import type { AssuranceGraph } from "../../src/domain/graph.js";

const generatedAt = "2026-09-06T18:30:00.000Z";

const graph: AssuranceGraph = {
  nodes: [
    {
      id: "control_mfa",
      type: "control",
      label: "Administrator MFA",
      assurance: "validated",
      metadata: { owner: "Identity Team", priority: 1 },
    },
  ],
  edges: [],
};

describe("createAssuranceSnapshot", () => {
  it("creates a versioned snapshot at the caller-supplied timestamp with a graph digest", () => {
    expect(createAssuranceSnapshot(graph, generatedAt)).toEqual({
      schemaVersion: "1.0.0",
      generatedAt,
      graph: {
        edges: [],
        nodes: [
          {
            assurance: "validated",
            id: "control_mfa",
            label: "Administrator MFA",
            metadata: { owner: "Identity Team", priority: 1 },
            type: "control",
          },
        ],
      },
      integrity: {
        algorithm: "SHA-256",
        digest: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    });
  });

  it("covers schema version, generation time, and graph in the integrity digest", () => {
    const first = createAssuranceSnapshot(graph, generatedAt);
    const later = createAssuranceSnapshot(graph, "2026-09-06T18:31:00.000Z");
    expect(first.integrity.digest).not.toBe(later.integrity.digest);
  });

  it("serializes equivalent graph permutations to byte-identical canonical JSON", () => {
    const secondNode = {
      id: "risk_takeover",
      type: "risk" as const,
      label: "Account takeover",
      assurance: "failed" as const,
      severity: "critical" as const,
    };
    const first = {
      nodes: [secondNode, ...graph.nodes],
      edges: [{ id: "edge_mitigation", source: "risk_takeover", target: "control_mfa", type: "mitigated_by" as const, state: "proposed" as const }],
    };
    const permuted = {
      nodes: [...first.nodes].reverse(),
      edges: [...first.edges].reverse(),
    };

    const serialized = serializeAssuranceSnapshot(first, generatedAt);

    expect(serialized).toBe(serializeAssuranceSnapshot(permuted, generatedAt));
    expect(serialized.endsWith("\n")).toBe(true);
    expect(JSON.parse(serialized)).toEqual(createAssuranceSnapshot(first, generatedAt));
  });

  it("rejects a non-canonical generated timestamp", () => {
    expect(() => createAssuranceSnapshot(graph, "September 6, 2026")).toThrow(
      "generatedAt must be an RFC 3339 UTC timestamp with millisecond precision.",
    );
  });
});

describe("createAssuranceMarkdownSummary", () => {
  it("reports graph, severity, assurance, and provenance without making compliance claims", () => {
    const reportGraph: AssuranceGraph = {
      nodes: [
        ...graph.nodes,
        {
          id: "risk_takeover",
          type: "risk",
          label: "Account takeover",
          assurance: "failed",
          severity: "high",
        },
        {
          id: "finding_password_only",
          type: "finding",
          label: "Password-only administration",
          assurance: "failed",
          severity: "critical",
          summary: "The administrative console accepted password-only authentication.",
        },
      ],
      edges: [
        {
          id: "edge_verified",
          source: "risk_takeover",
          target: "control_mfa",
          type: "mitigated_by",
          state: "verified",
          provenance: {
            authority: "human",
            sourceType: "consultant_observation",
            sourceReference: "engagement://acme/control/1",
            observedAt: "2026-09-01T00:00:00.000Z",
            verifiedAt: "2026-09-01T01:00:00.000Z",
            verifiedBy: "consultant@example.test",
            confidence: 1,
          },
        },
        {
          id: "edge_proposed",
          source: "finding_password_only",
          target: "risk_takeover",
          type: "creates_risk",
          state: "proposed",
        },
      ],
    };

    expect(createAssuranceMarkdownSummary(reportGraph, generatedAt)).toBe(`# Eidos Assurance Summary

_Generated: ${generatedAt}_

## Scope
- 3 nodes: 1 control, 1 finding, 1 risk.
- 2 relationships: 1 verified, 1 proposed, 0 unknown.

## Assurance states
- Failed: 2
- Validated: 1

## Priority observations
- **Critical · Failed** — Password-only administration (\`finding_password_only\`, finding): The administrative console accepted password-only authentication.
- **High · Failed** — Account takeover (\`risk_takeover\`, risk)

## Provenance
- Verified relationships with provenance: 1 of 1.
- Verified source types: Consultant observation (1).
- Proposed and unknown relationships are not treated as verified assurance.

## Interpretation
This summary reflects recorded graph relationships and assurance states. It does not claim certification, audit completion, or compliance.
`);
  });
});