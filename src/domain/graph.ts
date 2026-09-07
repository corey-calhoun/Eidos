import { z } from "zod";
import { assuranceStates } from "./assurance.js";

export const nodeTypes = [
  "business_objective",
  "application",
  "asset",
  "identity",
  "dependency",
  "data",
  "threat",
  "vulnerability",
  "risk",
  "control",
  "policy",
  "validation_activity",
  "evidence",
  "finding",
  "requirement",
  "framework",
  "owner",
] as const;

export const edgeTypes = [
  "supports",
  "depends_on",
  "stores",
  "processes",
  "accessed_by",
  "targets",
  "exposes",
  "enables",
  "creates_risk",
  "affected_by",
  "mitigated_by",
  "implemented_by",
  "validated_by",
  "supported_by",
  "required_by",
  "owned_by",
  "supersedes",
  "conflicts_with",
  "derived_from",
  "invalidated_by",
] as const;

export type NodeType = (typeof nodeTypes)[number];
export type EdgeType = (typeof edgeTypes)[number];

const provenanceSchema = z.object({
  authority: z.enum(["human", "deterministic", "client_asserted", "ai_proposed"]),
  sourceType: z.enum([
    "consultant_observation",
    "deterministic_tool",
    "client_document",
    "public_standard",
  ]),
  sourceReference: z.string().min(1).max(2048),
  observedAt: z.iso.datetime(),
  verifiedAt: z.iso.datetime().optional(),
  verifiedBy: z.string().min(1).max(254).optional(),
  confidence: z.number().min(0).max(1),
}).strict();

export const graphNodeSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/),
  type: z.enum(nodeTypes),
  label: z.string().trim().min(1).max(160),
  assurance: z.enum(assuranceStates),
  provenance: provenanceSchema.optional(),
  summary: z.string().trim().max(2000).optional(),
  severity: z.enum(["info", "low", "moderate", "high", "critical"]).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
}).strict();

export const graphEdgeSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.enum(edgeTypes),
  state: z.enum(["verified", "proposed", "unknown"]),
  provenance: provenanceSchema.optional(),
}).strict();

const endpointPairs = (
  from: readonly NodeType[],
  to: readonly NodeType[],
): ReadonlyArray<readonly [NodeType, NodeType]> =>
  from.flatMap((source) => to.map((target) => [source, target] as const));

const sameTypePairs = nodeTypes.map((type) => [type, type] as const);

const allowedDirections: Record<EdgeType, ReadonlyArray<readonly [NodeType, NodeType]>> = {
  supports: [
    ["business_objective", "application"],
    ["business_objective", "asset"],
    ...endpointPairs(["application", "asset", "control", "policy"], ["business_objective"]),
    ...endpointPairs(["evidence", "policy", "control"], ["requirement"]),
  ],
  depends_on: endpointPairs(["application", "asset", "dependency"], ["asset", "dependency", "data", "identity"]),
  stores: endpointPairs(["application", "asset", "dependency"], ["data"]),
  processes: endpointPairs(["application", "asset", "dependency"], ["data"]),
  accessed_by: endpointPairs(["application", "asset", "dependency", "data"], ["identity"]),
  targets: endpointPairs(["threat"], ["application", "asset", "identity", "dependency", "data"]),
  exposes: endpointPairs(["vulnerability", "finding", "application", "asset", "dependency"], ["application", "asset", "identity", "data", "threat"]),
  enables: endpointPairs(["threat", "vulnerability", "finding", "application", "dependency"], ["threat", "risk", "business_objective"]),
  creates_risk: endpointPairs(["threat", "vulnerability", "finding"], ["risk"]),
  affected_by: endpointPairs(["business_objective", "application", "asset", "identity", "dependency", "data"], ["risk"]),
  mitigated_by: endpointPairs(["risk", "threat", "vulnerability", "finding"], ["control"]),
  implemented_by: endpointPairs(["control"], ["policy", "application", "dependency", "identity"]),
  validated_by: endpointPairs(["control"], ["validation_activity"]),
  supported_by: endpointPairs(["validation_activity", "control", "finding", "requirement"], ["evidence"]),
  required_by: [
    ["control", "requirement"],
    ["requirement", "framework"],
  ],
  owned_by: endpointPairs(nodeTypes.filter((type) => type !== "owner"), ["owner"]),
  supersedes: sameTypePairs,
  conflicts_with: sameTypePairs,
  derived_from: endpointPairs(["finding", "risk", "evidence", "requirement"], ["evidence", "finding", "requirement", "validation_activity"]),
  invalidated_by: endpointPairs(["control", "validation_activity", "evidence", "requirement"], ["finding", "evidence", "validation_activity"]),
};

const graphSchema = z
  .object({
    nodes: z.array(graphNodeSchema).min(1).max(2000),
    edges: z.array(graphEdgeSchema).max(10000),
  })
  .strict()
  .superRefine((graph, context) => {
    const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
    if (nodes.size !== graph.nodes.length) {
      context.addIssue({ code: "custom", message: "Node identifiers must be unique." });
    }

    graph.nodes.forEach((node, index) => {
      if (node.assurance === "unknown") return;
      const provenance = node.provenance;
      if (
        provenance === undefined ||
        !["human", "deterministic"].includes(provenance.authority) ||
        provenance.verifiedAt === undefined ||
        provenance.verifiedBy === undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "provenance"],
          message: "Authoritative node assurance requires accepted human or deterministic provenance with a verification actor and timestamp.",
        });
      }
    });

    const edgeIds = new Set<string>();
    graph.edges.forEach((edge, index) => {
      if (edgeIds.has(edge.id)) {
        context.addIssue({ code: "custom", path: ["edges", index, "id"], message: "Edge identifiers must be unique." });
      }
      edgeIds.add(edge.id);

      const source = nodes.get(edge.source);
      const target = nodes.get(edge.target);
      if (!source || !target) {
        context.addIssue({ code: "custom", path: ["edges", index], message: "Relationships must reference existing nodes." });
        return;
      }

      if (edge.state === "verified") {
        const provenance = edge.provenance;
        if (
          provenance === undefined ||
          !["human", "deterministic"].includes(provenance.authority) ||
          provenance.verifiedAt === undefined ||
          provenance.verifiedBy === undefined
        ) {
          context.addIssue({
            code: "custom",
            path: ["edges", index, "provenance"],
            message: "Verified relationships require accepted human or deterministic provenance with a verification actor and timestamp.",
          });
        }
      }

      const directions = allowedDirections[edge.type];
      if (!directions.some(([from, to]) => from === source.type && to === target.type)) {
        context.addIssue({ code: "custom", path: ["edges", index, "type"], message: `Relationship ${edge.type} is invalid from ${source.type} to ${target.type}.` });
      }
    });
  });

export type AssuranceGraph = z.infer<typeof graphSchema>;

export function validateGraph(input: unknown) {
  return graphSchema.safeParse(input);
}

export function findPath(graph: AssuranceGraph, startId: string, endId: string): string[] {
  const queue: string[][] = [[startId]];
  const visited = new Set([startId]);
  const outgoing = new Map<string, string[]>();

  for (const edge of graph.edges) {
    const targets = outgoing.get(edge.source) ?? [];
    targets.push(edge.target);
    outgoing.set(edge.source, targets);
  }

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1]!;
    if (current === endId) return path;

    for (const target of outgoing.get(current) ?? []) {
      if (!visited.has(target)) {
        visited.add(target);
        queue.push([...path, target]);
      }
    }
  }

  return [];
}

export function summarizeGraph(graph: AssuranceGraph) {
  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    verifiedEdges: graph.edges.filter((edge) => edge.state === "verified").length,
    criticalFindings: graph.nodes.filter(
      (node) => node.type === "finding" && node.severity === "critical",
    ).length,
    validatedControls: graph.nodes.filter(
      (node) => node.type === "control" && node.assurance === "validated",
    ).length,
  };
}
