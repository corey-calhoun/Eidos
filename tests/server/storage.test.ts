import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { sampleGraph } from "../../src/domain/sample-graph.js";
import { GraphSnapshotRepository } from "../../src/server/storage.js";

const repositories: GraphSnapshotRepository[] = [];
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const repository of repositories.splice(0)) repository.close();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createRepository() {
  const directory = mkdtempSync(join(tmpdir(), "eidos-storage-"));
  temporaryDirectories.push(directory);
  const repository = new GraphSnapshotRepository(join(directory, "graph.sqlite"));
  repositories.push(repository);
  return repository;
}

describe("GraphSnapshotRepository", () => {
  it("persists a validated graph snapshot across database connections", () => {
    const repository = createRepository();

    expect(repository.getSnapshot()).toBeNull();
    repository.saveSnapshot(sampleGraph);
    repository.close();
    repositories.splice(repositories.indexOf(repository), 1);

    const reopened = new GraphSnapshotRepository(repository.databasePath);
    repositories.push(reopened);
    expect(reopened.getSnapshot()).toEqual(sampleGraph);
  });

  it("records the initialized schema version", () => {
    const repository = createRepository();
    const inspection = new DatabaseSync(repository.databasePath, { readOnly: true });
    try {
      expect(
        inspection.prepare("SELECT version FROM schema_migrations ORDER BY version").all(),
      ).toEqual([{ version: 1 }]);
    } finally {
      inspection.close();
    }
  });

  it("rejects databases from a newer or tampered schema", () => {
    for (const migration of [
      { version: 999, checksum: "f".repeat(64) },
      { version: 1, checksum: "0".repeat(64) },
    ]) {
      const directory = mkdtempSync(join(tmpdir(), "eidos-storage-migration-"));
      temporaryDirectories.push(directory);
      const databasePath = join(directory, "graph.sqlite");
      const database = new DatabaseSync(databasePath);
      database.exec("CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, application_version TEXT NOT NULL) STRICT");
      database.prepare("INSERT INTO schema_migrations VALUES (?, ?, ?)").run(migration.version, migration.checksum, "tampered");
      database.close();

      expect(() => new GraphSnapshotRepository(databasePath)).toThrow(/migration|schema/i);
    }
  });

  it("rejects unknown graph fields without replacing the committed snapshot", () => {
    const repository = createRepository();
    repository.saveSnapshot(sampleGraph);
    const invalidGraph = structuredClone(sampleGraph) as typeof sampleGraph & { injected: string };
    invalidGraph.injected = "not part of the graph contract";

    expect(() => repository.saveSnapshot(invalidGraph)).toThrow(/validation/i);
    expect(repository.getSnapshot()).toEqual(sampleGraph);
  });

  it("enforces foreign keys and rolls back an interrupted replacement atomically", () => {
    const repository = createRepository();
    repository.saveSnapshot(sampleGraph);
    const setup = new DatabaseSync(repository.databasePath);
    setup.exec(`
      CREATE TABLE fk_parent (id INTEGER PRIMARY KEY) STRICT;
      CREATE TABLE fk_probe (
        parent_id INTEGER NOT NULL REFERENCES fk_parent(id)
      ) STRICT;
      CREATE TRIGGER fail_edge_insert
      AFTER INSERT ON graph_edges
      BEGIN
        INSERT INTO fk_probe (parent_id) VALUES (999);
      END;
    `);
    setup.close();

    expect(() => repository.saveSnapshot(sampleGraph)).toThrow(/foreign key/i);
    expect(repository.getSnapshot()).toEqual(sampleGraph);
  });
});
