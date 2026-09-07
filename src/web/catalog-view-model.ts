import type { CatalogRecord } from "../domain/catalog.js";

export type CatalogViewRecord = CatalogRecord;

export interface CatalogFilters {
  query: string;
  types: ReadonlySet<string>;
  statuses: ReadonlySet<string>;
  domains: ReadonlySet<string>;
}

export interface CatalogFacet {
  value: string;
  label: string;
  count: number;
}

const TYPE_LABELS: Readonly<Record<string, readonly [string, string]>> = {
  framework: ["Framework", "Frameworks"],
  regulation: ["Regulation", "Regulations"],
  standard: ["Standard", "Standards"],
  control_catalog: ["Control catalog", "Control catalogs"],
  policy: ["Policy", "Policies"],
  control: ["Control", "Controls"],
  concept: ["GRC concept", "GRC concepts"],
};

export function formatCatalogType(type: string, plural = false): string {
  const known = TYPE_LABELS[type];
  if (known) return known[plural ? 1 : 0];
  const label = type.replaceAll("_", " ").replace(/^./, (letter) => letter.toLocaleUpperCase());
  return plural ? `${label}s` : label;
}

export function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toLocaleUpperCase());
}

export function getRecordDialogFocusAction(
  wasOpen: boolean,
  isOpen: boolean,
): "focus_dialog" | "restore_library" | null {
  if (isOpen) return "focus_dialog";
  return wasOpen ? "restore_library" : null;
}

function countFacets(values: readonly string[], labels: (value: string) => string): CatalogFacet[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([value, count]) => ({ value, label: labels(value), count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildCatalogFacets(records: readonly CatalogViewRecord[]): {
  types: CatalogFacet[];
  statuses: CatalogFacet[];
  domains: CatalogFacet[];
} {
  return {
    types: countFacets(records.map((record) => record.type), (type) => formatCatalogType(type, true)),
    statuses: countFacets(records.map((record) => record.status), humanize),
    domains: countFacets(records.flatMap((record) => record.domains), humanize),
  };
}

const COMPARABLE_TYPES = new Set(["framework", "regulation", "standard", "control_catalog"]);

export function isComparable(record: CatalogViewRecord): boolean {
  return COMPARABLE_TYPES.has(record.type);
}

export function toggleComparison(
  selectedIds: readonly string[],
  record: CatalogViewRecord,
): { ids: string[]; reason: string | null } {
  if (selectedIds.includes(record.id)) {
    return { ids: selectedIds.filter((id) => id !== record.id), reason: null };
  }
  if (!isComparable(record)) {
    return {
      ids: [...selectedIds],
      reason: `${formatCatalogType(record.type, true)} are reference material but are not available for comparison.`,
    };
  }
  if (selectedIds.length >= 3) {
    return { ids: [...selectedIds], reason: "You can compare up to three references at a time." };
  }
  return { ids: [...selectedIds, record.id], reason: null };
}

export function filterCatalog<T extends CatalogViewRecord>(
  records: readonly T[],
  filters: CatalogFilters,
): T[] {
  const terms = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

  return records.filter((record) => {
    if (filters.types.size > 0 && !filters.types.has(record.type)) return false;
    if (filters.statuses.size > 0 && !filters.statuses.has(record.status)) return false;
    if (filters.domains.size > 0 && !record.domains.some((domain) => filters.domains.has(domain))) return false;

    const searchable = [
      record.name,
      record.acronym ?? "",
      record.summary,
      record.description,
      record.issuer,
      record.applicability,
      record.version ?? "",
      ...record.jurisdictions,
      ...record.industries,
      ...record.domains,
      ...record.tags,
    ].join(" ").toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}
