import type { AssuranceGraph } from "../domain/graph.js";

export type AuthorityFilter = "all" | "verified" | "proposed" | "unknown";

export interface GraphFilters {
  query: string;
  nodeTypes: ReadonlySet<string>;
  assuranceStates: ReadonlySet<string>;
  authority: AuthorityFilter;
}

export interface RelationshipRow {
  edgeId: string;
  direction: "Incoming" | "Outgoing";
  verb: string;
  counterpart: AssuranceGraph["nodes"][number];
  authority: "Verified" | "Proposed" | "Unknown";
  source: string;
  importance: "Critical" | "High" | "Not rated";
  relevance: "Direct neighbor";
}

export const formatIdentifier = (value: string) => value.replaceAll("_", " ");
export const formatLabel = (value: string) =>
  formatIdentifier(value).replace(/\b\w/g, (character) => character.toUpperCase());

export interface FilteredGraph extends AssuranceGraph {
  contextNodeIds: ReadonlySet<string>;
}

export function filterGraph(
  graph: AssuranceGraph,
  filters: GraphFilters,
  preserveSelectedId?: string | null,
): FilteredGraph {
  const query = filters.query.trim().toLocaleLowerCase();
  const matchedNodes = graph.nodes.filter((node) => {
    const matchesQuery =
      query.length === 0 ||
      node.label.toLocaleLowerCase().includes(query) ||
      node.id.toLocaleLowerCase().includes(query) ||
      node.type.toLocaleLowerCase().includes(query);
    const matchesType = filters.nodeTypes.size === 0 || filters.nodeTypes.has(node.type);
    const matchesAssurance =
      filters.assuranceStates.size === 0 || filters.assuranceStates.has(node.assurance);
    return matchesQuery && matchesType && matchesAssurance;
  });
  const matchedIds = new Set(matchedNodes.map((node) => node.id));
  const selectedContext = preserveSelectedId && !matchedIds.has(preserveSelectedId)
    ? graph.nodes.find((node) => node.id === preserveSelectedId)
    : undefined;
  const nodes = selectedContext ? [...matchedNodes, selectedContext] : matchedNodes;
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter(
    (edge) =>
      visibleIds.has(edge.source) &&
      visibleIds.has(edge.target) &&
      (filters.authority === "all" || edge.state === filters.authority),
  );
  return {
    nodes,
    edges,
    contextNodeIds: new Set(selectedContext ? [selectedContext.id] : []),
  };
}

export interface AllRelationshipRow {
  edge: AssuranceGraph["edges"][number];
  source: AssuranceGraph["nodes"][number];
  target: AssuranceGraph["nodes"][number];
}

export function buildAllRelationshipRows(graph: AssuranceGraph): AllRelationshipRow[] {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  return graph.edges.flatMap((edge) => {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    return source && target ? [{ edge, source, target }] : [];
  });
}

export function buildRelationshipRows(
  graph: AssuranceGraph,
  nodeId: string,
): RelationshipRow[] {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  return graph.edges.flatMap((edge) => {
    if (edge.source !== nodeId && edge.target !== nodeId) return [];
    const outgoing = edge.source === nodeId;
    const counterpart = nodesById.get(outgoing ? edge.target : edge.source);
    if (!counterpart) return [];
    const importance =
      counterpart.severity === "critical"
        ? "Critical"
        : counterpart.severity === "high"
          ? "High"
          : "Not rated";
    return [{
      edgeId: edge.id,
      direction: outgoing ? "Outgoing" : "Incoming",
      verb: formatIdentifier(edge.type),
      counterpart,
      authority:
        edge.state === "verified"
          ? "Verified"
          : edge.state === "proposed"
            ? "Proposed"
            : "Unknown",
      source: edge.provenance?.sourceReference ?? "Source unavailable",
      importance,
      relevance: "Direct neighbor",
    } satisfies RelationshipRow];
  });
}

export function summarizeView(graph: AssuranceGraph) {
  const failedOrCritical = graph.nodes.filter(
    (node) => node.assurance === "failed" || node.severity === "critical",
  ).length;
  const staleEvidence = graph.nodes.filter(
    (node) => node.type === "evidence" && node.assurance === "stale",
  ).length;
  const verifiedEdges = graph.edges.filter((edge) => edge.state === "verified").length;
  return {
    totalNodes: graph.nodes.length,
    failedOrCritical,
    staleEvidence,
    verifiedCoverage:
      graph.edges.length === 0 ? 0 : Math.round((verifiedEdges / graph.edges.length) * 100),
    validatedControls: graph.nodes.filter(
      (node) => node.type === "control" && node.assurance === "validated",
    ).length,
  };
}
