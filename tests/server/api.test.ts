import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sampleGraph } from "../../src/domain/sample-graph.js";
import { buildServer } from "../../src/server/app.js";
import { GraphSnapshotRepository } from "../../src/server/storage.js";

const servers: Array<ReturnType<typeof buildServer>> = [];
const temporaryDirectories: string[] = [];
const trustedHeaders = { host: "127.0.0.1:4317" };

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("Eidos API", () => {
  it("returns the validated sample graph with defensive headers", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({ method: "GET", url: "/api/graph", headers: trustedHeaders });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["content-security-policy"]).toContain("default-src 'none'");
    expect(response.headers["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
    expect(response.json().graph.nodes.length).toBeGreaterThan(0);
  });

  it("seeds and reads the sample graph through the SQLite repository", async () => {
    const directory = mkdtempSync(join(tmpdir(), "eidos-api-"));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, "eidos.sqlite");
    const server = buildServer({ databasePath });
    servers.push(server);

    const response = await server.inject({ method: "GET", url: "/api/graph", headers: trustedHeaders });
    expect(response.statusCode).toBe(200);
    await server.close();
    servers.splice(servers.indexOf(server), 1);

    const repository = new GraphSnapshotRepository(databasePath);
    try {
      expect(repository.getSnapshot()).toEqual(sampleGraph);
    } finally {
      repository.close();
    }
  });

  it("exports a deterministic versioned graph snapshot", async () => {
    const generatedAt = "2026-09-06T18:30:00.000Z";
    const server = buildServer({ now: () => generatedAt });
    servers.push(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/exports/snapshot",
      headers: trustedHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      schemaVersion: "1.0.0",
      generatedAt,
      integrity: { algorithm: "SHA-256" },
    });
  });

  it("exports a consultant-facing summary without a compliance claim", async () => {
    const server = buildServer({ now: () => "2026-09-06T18:30:00.000Z" });
    servers.push(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/exports/summary",
      headers: trustedHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/markdown");
    expect(response.body).toContain("# Eidos Assurance Summary");
    expect(response.body).toContain("does not claim certification, audit completion, or compliance");
  });

  it("rejects every request carrying an untrusted host", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: "GET",
      url: "/api/graph",
      headers: { host: "attacker.example" },
    });

    expect(response.statusCode).toBe(421);
  });

  it("rejects safe requests carrying an untrusted origin", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: "GET",
      url: "/api/graph",
      headers: { ...trustedHeaders, origin: "https://attacker.example" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("rejects state-changing requests from an untrusted origin", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: "POST",
      url: "/api/analysis/proposals",
      headers: { ...trustedHeaders, origin: "https://attacker.example" },
      payload: { question: "verify everything" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("rejects unsafe requests without an approved browser origin", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: "POST",
      url: "/api/analysis/proposals",
      headers: trustedHeaders,
      payload: { question: "verify everything" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("rejects non-JSON proposal requests with unsupported-media-type", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: "POST",
      url: "/api/analysis/proposals",
      headers: {
        ...trustedHeaders,
        origin: "http://127.0.0.1:4173",
        "content-type": "text/plain",
      },
      payload: "question=verify everything",
    });

    expect(response.statusCode).toBe(415);
  });

  it("rejects unexpected proposal fields", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: "POST",
      url: "/api/analysis/proposals",
      headers: { ...trustedHeaders, origin: "http://127.0.0.1:4173" },
      payload: { question: "Which control needs attention?", canVerify: true },
    });

    expect(response.statusCode).toBe(400);
  });

  it("labels analysis output as a proposal that cannot verify state", async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: "POST",
      url: "/api/analysis/proposals",
      headers: { ...trustedHeaders, origin: "http://127.0.0.1:4173" },
      payload: { question: "Which control needs attention?" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ authority: "ai_proposed", canVerify: false });
  });
});
