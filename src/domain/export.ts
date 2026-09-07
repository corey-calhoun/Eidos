import type { AssuranceGraph } from "./graph.js";

export const assuranceExportSchemaVersion = "1.0.0" as const;

export interface AssuranceSnapshot {
  schemaVersion: typeof assuranceExportSchemaVersion;
  generatedAt: string;
  graph: AssuranceGraph;
  integrity: {
    algorithm: "SHA-256";
    digest: string;
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => compareText(left, right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function canonicalGraph(graph: AssuranceGraph): AssuranceGraph {
  return canonicalize({
    nodes: [...graph.nodes].sort((left, right) => compareText(left.id, right.id)),
    edges: [...graph.edges].sort((left, right) => compareText(left.id, right.id)),
  }) as AssuranceGraph;
}

function assertCanonicalTimestamp(generatedAt: string): void {
  const canonicalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!canonicalPattern.test(generatedAt) || new Date(generatedAt).toISOString() !== generatedAt) {
    throw new TypeError("generatedAt must be an RFC 3339 UTC timestamp with millisecond precision.");
  }
}

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256(value: string): string {
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const bytes = new TextEncoder().encode(value);
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bitLength = bytes.length * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index += 1) {
      const prior15 = words[index - 15]!;
      const prior2 = words[index - 2]!;
      const sigma0 = rotateRight(prior15, 7) ^ rotateRight(prior15, 18) ^ (prior15 >>> 3);
      const sigma1 = rotateRight(prior2, 17) ^ rotateRight(prior2, 19) ^ (prior2 >>> 10);
      words[index] = (words[index - 16]! + sigma0 + words[index - 7]! + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash as [number, number, number, number, number, number, number, number];
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sum1 + choice + constants[index]! + words[index]!) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    const compressed = [a, b, c, d, e, f, g, h];
    for (let index = 0; index < hash.length; index += 1) hash[index] = (hash[index]! + compressed[index]!) >>> 0;
  }

  return hash.map((word) => word.toString(16).padStart(8, "0")).join("");
}

export function createAssuranceSnapshot(graph: AssuranceGraph, generatedAt: string): AssuranceSnapshot {
  assertCanonicalTimestamp(generatedAt);
  const normalizedGraph = canonicalGraph(graph);
  const envelope = {
    schemaVersion: assuranceExportSchemaVersion,
    generatedAt,
    graph: normalizedGraph,
  };
  return {
    ...envelope,
    integrity: {
      algorithm: "SHA-256",
      digest: sha256(JSON.stringify(canonicalize(envelope))),
    },
  };
}

export function serializeAssuranceSnapshot(graph: AssuranceGraph, generatedAt: string): string {
  return `${JSON.stringify(canonicalize(createAssuranceSnapshot(graph, generatedAt)), null, 2)}\n`;
}

const assuranceDisplayOrder = [
  "failed",
  "stale",
  "partially_effective",
  "implemented_unverified",
  "planned",
  "unknown",
  "risk_accepted",
  "not_applicable",
  "validated",
] as const;

const severityRank = { critical: 5, high: 4, moderate: 3, low: 2, info: 1 } as const;

function displayName(value: string): string {
  const words = value.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function countBy(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function inlineText(value: string): string {
  return value.replaceAll("\\", "\\\\").replace(/([*\[\]<>#|])/g, "\\$1").replaceAll("\n", " ");
}

export function createAssuranceMarkdownSummary(graph: AssuranceGraph, generatedAt: string): string {
  assertCanonicalTimestamp(generatedAt);
  const nodeTypeCounts = [...countBy(graph.nodes.map((node) => node.type))]
    .sort(([left], [right]) => compareText(left, right))
    .map(([type, count]) => `${count} ${type.replaceAll("_", " ")}${count === 1 ? "" : "s"}`)
    .join(", ");
  const edgeStateCounts = countBy(graph.edges.map((edge) => edge.state));
  const assuranceCounts = countBy(graph.nodes.map((node) => node.assurance));
  const assuranceLines = assuranceDisplayOrder
    .filter((state) => assuranceCounts.has(state))
    .map((state) => `- ${displayName(state)}: ${assuranceCounts.get(state)}`);

  const priorityLines = graph.nodes
    .filter((node) => node.severity !== undefined)
    .sort((left, right) => {
      const severityDifference = severityRank[right.severity!] - severityRank[left.severity!];
      return severityDifference || compareText(left.label, right.label) || compareText(left.id, right.id);
    })
    .map((node) => {
      const detail = node.summary === undefined ? "" : `: ${inlineText(node.summary)}`;
      return `- **${displayName(node.severity!)} · ${displayName(node.assurance)}** — ${inlineText(node.label)} (\`${node.id.replaceAll("`", "\\`")}\`, ${node.type.replaceAll("_", " ")})${detail}`;
    });

  const verifiedEdges = graph.edges.filter((edge) => edge.state === "verified");
  const verifiedWithProvenance = verifiedEdges.filter((edge) => edge.provenance !== undefined);
  const sourceCounts = countBy(verifiedWithProvenance.map((edge) => edge.provenance!.sourceType));
  const sourceSummary = [...sourceCounts]
    .sort(([left], [right]) => compareText(left, right))
    .map(([sourceType, count]) => `${displayName(sourceType)} (${count})`)
    .join(", ") || "none";

  return [
    "# Eidos Assurance Summary",
    "",
    `_Generated: ${generatedAt}_`,
    "",
    "## Scope",
    `- ${graph.nodes.length} nodes: ${nodeTypeCounts}.`,
    `- ${graph.edges.length} relationships: ${edgeStateCounts.get("verified") ?? 0} verified, ${edgeStateCounts.get("proposed") ?? 0} proposed, ${edgeStateCounts.get("unknown") ?? 0} unknown.`,
    "",
    "## Assurance states",
    ...assuranceLines,
    "",
    "## Priority observations",
    ...(priorityLines.length > 0 ? priorityLines : ["_No severity-rated observations are recorded._"]),
    "",
    "## Provenance",
    `- Verified relationships with provenance: ${verifiedWithProvenance.length} of ${verifiedEdges.length}.`,
    `- Verified source types: ${sourceSummary}.`,
    "- Proposed and unknown relationships are not treated as verified assurance.",
    "",
    "## Interpretation",
    "This summary reflects recorded graph relationships and assurance states. It does not claim certification, audit completion, or compliance.",
    "",
  ].join("\n");
}