import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { AssuranceGraph } from "../domain/graph.js";
import { validateGraph } from "../domain/graph.js";

const CURRENT_SNAPSHOT_ID = 1;
const SCHEMA_VERSION = 1;
const APPLICATION_VERSION = "0.1.0";
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS graph_snapshots (
    id INTEGER PRIMARY KEY CHECK (id = 1)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS graph_nodes (
    snapshot_id INTEGER NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    node_id TEXT NOT NULL,
    payload TEXT NOT NULL CHECK (json_valid(payload)),
    PRIMARY KEY (snapshot_id, node_id),
    UNIQUE (snapshot_id, position),
    FOREIGN KEY (snapshot_id) REFERENCES graph_snapshots(id) ON DELETE CASCADE
  ) STRICT;

  CREATE TABLE IF NOT EXISTS graph_edges (
    snapshot_id INTEGER NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    edge_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    payload TEXT NOT NULL CHECK (json_valid(payload)),
    PRIMARY KEY (snapshot_id, edge_id),
    UNIQUE (snapshot_id, position),
    FOREIGN KEY (snapshot_id) REFERENCES graph_snapshots(id) ON DELETE CASCADE,
    FOREIGN KEY (snapshot_id, source_node_id)
      REFERENCES graph_nodes(snapshot_id, node_id),
    FOREIGN KEY (snapshot_id, target_node_id)
      REFERENCES graph_nodes(snapshot_id, node_id)
  ) STRICT;
`;
const SCHEMA_CHECKSUM = createHash("sha256").update(SCHEMA_SQL).digest("hex");
const GRAPH_KEYS = new Set(["nodes", "edges"]);
const NODE_KEYS = new Set(["id", "type", "label", "assurance", "provenance", "summary", "severity", "metadata"]);
const EDGE_KEYS = new Set(["id", "source", "target", "type", "state", "provenance"]);
const PROVENANCE_KEYS = new Set([
  "authority",
  "sourceType",
  "sourceReference",
  "observedAt",
  "verifiedAt",
  "verifiedBy",
  "confidence",
]);

function hasOnlyKeys(value: unknown, allowedKeys: ReadonlySet<string>): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    Object.keys(value).every((key) => allowedKeys.has(key));
}

function hasNoUnknownFields(input: unknown): boolean {
  if (!hasOnlyKeys(input, GRAPH_KEYS)) return false;
  const graph = input as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return true;
  return graph.nodes.every((node) => {
    if (!hasOnlyKeys(node, NODE_KEYS)) return false;
    const provenance = (node as { provenance?: unknown }).provenance;
    return provenance === undefined || hasOnlyKeys(provenance, PROVENANCE_KEYS);
  }) && graph.edges.every((edge) => {
      if (!hasOnlyKeys(edge, EDGE_KEYS)) return false;
      const provenance = (edge as { provenance?: unknown }).provenance;
      return provenance === undefined || hasOnlyKeys(provenance, PROVENANCE_KEYS);
    });
}

export class GraphSnapshotRepository {
  readonly databasePath: string;
  readonly #database: DatabaseSync;
  #closed = false;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
    this.#database = new DatabaseSync(databasePath);
    try {
      this.#database.exec("PRAGMA foreign_keys = ON");
      this.#database.exec("PRAGMA journal_mode = WAL");
      this.#database.exec("PRAGMA synchronous = FULL");
      this.#database.exec("PRAGMA busy_timeout = 5000");
      this.#database.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY CHECK (version > 0),
          checksum TEXT NOT NULL CHECK (length(checksum) = 64),
          application_version TEXT NOT NULL
        ) STRICT;
      `);

      const migrations = this.#database
        .prepare("SELECT version, checksum FROM schema_migrations ORDER BY version")
        .all() as Array<{ version: number; checksum: string }>;
      const newerMigration = migrations.find((migration) => migration.version > SCHEMA_VERSION);
      if (newerMigration) {
        throw new Error(`Database migration ${newerMigration.version} is newer than supported schema ${SCHEMA_VERSION}.`);
      }
      const currentMigration = migrations.find((migration) => migration.version === SCHEMA_VERSION);
      if (currentMigration && currentMigration.checksum !== SCHEMA_CHECKSUM) {
        throw new Error(`Database schema migration ${SCHEMA_VERSION} checksum does not match the application.`);
      }

      if (!currentMigration) {
        this.#database.exec("BEGIN IMMEDIATE");
        try {
          this.#database.exec(SCHEMA_SQL);
          this.#database.prepare(
            "INSERT INTO schema_migrations (version, checksum, application_version) VALUES (?, ?, ?)",
          ).run(SCHEMA_VERSION, SCHEMA_CHECKSUM, APPLICATION_VERSION);
          this.#database.exec("COMMIT");
        } catch (error) {
          this.#database.exec("ROLLBACK");
          throw error;
        }
      }
    } catch (error) {
      this.#database.close();
      this.#closed = true;
      throw error;
    }
  }

  saveSnapshot(input: unknown): AssuranceGraph {
    const validation = validateGraph(input);
    if (!validation.success || !hasNoUnknownFields(input)) {
      throw new TypeError("Graph snapshot failed domain validation.");
    }

    const graph = validation.data;
    const insertNode = this.#database.prepare(
      "INSERT INTO graph_nodes (snapshot_id, position, node_id, payload) VALUES (?, ?, ?, ?)",
    );
    const insertEdge = this.#database.prepare(
      "INSERT INTO graph_edges (snapshot_id, position, edge_id, source_node_id, target_node_id, payload) VALUES (?, ?, ?, ?, ?, ?)",
    );

    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.prepare("DELETE FROM graph_snapshots WHERE id = ?").run(CURRENT_SNAPSHOT_ID);
      this.#database.prepare("INSERT INTO graph_snapshots (id) VALUES (?)").run(CURRENT_SNAPSHOT_ID);

      graph.nodes.forEach((node, position) => {
        insertNode.run(CURRENT_SNAPSHOT_ID, position, node.id, JSON.stringify(node));
      });
      graph.edges.forEach((edge, position) => {
        insertEdge.run(
          CURRENT_SNAPSHOT_ID,
          position,
          edge.id,
          edge.source,
          edge.target,
          JSON.stringify(edge),
        );
      });

      this.#database.exec("COMMIT");
      return graph;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  getSnapshot(): AssuranceGraph | null {
    const snapshot = this.#database
      .prepare("SELECT id FROM graph_snapshots WHERE id = ?")
      .get(CURRENT_SNAPSHOT_ID);
    if (snapshot === undefined) return null;

    const nodes = this.#database
      .prepare("SELECT payload FROM graph_nodes WHERE snapshot_id = ? ORDER BY position")
      .all(CURRENT_SNAPSHOT_ID)
      .map((row) => JSON.parse(String(row.payload)) as unknown);
    const edges = this.#database
      .prepare("SELECT payload FROM graph_edges WHERE snapshot_id = ? ORDER BY position")
      .all(CURRENT_SNAPSHOT_ID)
      .map((row) => JSON.parse(String(row.payload)) as unknown);
    const validation = validateGraph({ nodes, edges });
    if (!validation.success) {
      throw new Error("Persisted graph snapshot failed domain validation.");
    }
    return validation.data;
  }

  close(): void {
    if (this.#closed) return;
    this.#database.close();
    this.#closed = true;
  }
}
