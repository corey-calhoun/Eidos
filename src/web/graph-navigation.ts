export interface GraphHistory {
  entries: readonly (string | null)[];
  index: number;
}

export function createGraphHistory(initialSelection: string | null): GraphHistory {
  return { entries: [initialSelection], index: 0 };
}

export function pushGraphHistory(history: GraphHistory, selection: string | null): GraphHistory {
  const entries = [...history.entries.slice(0, history.index + 1), selection];
  return { entries, index: entries.length - 1 };
}

export function moveGraphHistory(history: GraphHistory, delta: number): GraphHistory {
  const index = Math.max(0, Math.min(history.entries.length - 1, history.index + delta));
  return index === history.index ? history : { ...history, index };
}

export function selectionFromSearch(
  search: string,
  validIds: ReadonlySet<string>,
): string | null {
  const selection = new URLSearchParams(search).get("entity");
  return selection && validIds.has(selection) ? selection : null;
}
