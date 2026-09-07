export interface FittableGraph {
  elements(): unknown;
  fit(elements: unknown, padding: number): void;
  one(event: "layoutstop", callback: () => void): void;
}

export interface LayoutGraph<Options> extends FittableGraph {
  layout(options: Options): {
    one(event: "layoutstop", callback: () => void): void;
    run(): unknown;
  };
}

export type FrameScheduler = (callback: () => void) => number;

export interface SemanticNode {
  id: string;
  type: string;
}

export interface GraphPosition {
  x: number;
  y: number;
}

const SEMANTIC_COLUMNS: Readonly<Record<string, number>> = {
  business_objective: -3,
  threat: -2,
  vulnerability: -2,
  finding: -2,
  asset: -1,
  identity: -1,
  dependency: -1,
  data: -1,
  owner: -1,
  application: 0,
  risk: 1,
  control: 2,
  validation_activity: 3,
  evidence: 4,
  policy: 4,
  requirement: 5,
  framework: 6,
};

export function createSemanticPositions(
  nodes: readonly SemanticNode[],
): Record<string, GraphPosition> {
  const byColumn = new Map<number, SemanticNode[]>();
  for (const node of nodes) {
    const column = SEMANTIC_COLUMNS[node.type] ?? 0;
    const group = byColumn.get(column) ?? [];
    group.push(node);
    byColumn.set(column, group);
  }

  const positions: Record<string, GraphPosition> = {};
  for (const [column, columnNodes] of byColumn) {
    const ordered = [...columnNodes].sort((left, right) => left.id.localeCompare(right.id));
    ordered.forEach((node, index) => {
      positions[node.id] = {
        x: column * 205,
        y: (index - (ordered.length - 1) / 2) * 160,
      };
    });
  }
  return positions;
}

export function attachInitialGraphFit(
  graph: FittableGraph,
  schedule: FrameScheduler = window.requestAnimationFrame.bind(window),
): void {
  const fitCompleteGraph = () => graph.fit(graph.elements(), 96);
  graph.one("layoutstop", fitCompleteGraph);
  schedule(fitCompleteGraph);
}

export function runInitialGraphLayout<Options>(
  graph: LayoutGraph<Options>,
  options: Options,
  schedule: FrameScheduler = window.requestAnimationFrame.bind(window),
): void {
  const layout = graph.layout(options);
  layout.one("layoutstop", () => {
    schedule(() => graph.fit(graph.elements(), 96));
  });
  layout.run();
}
