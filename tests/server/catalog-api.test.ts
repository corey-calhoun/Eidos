import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../../src/server/app.js";

const servers: Array<ReturnType<typeof buildServer>> = [];
const trustedHeaders = { host: "127.0.0.1:4317" };

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("Eidos catalog API", () => {
  it("lists the trusted catalog and supports plain-language search", async () => {
    const server = buildServer();
    servers.push(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/catalog?q=authentication",
      headers: trustedHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.summary.totalRecords).toBeGreaterThanOrEqual(10);
    expect(body.records.length).toBeGreaterThan(0);
  });

  it("supports strict multi-industry filtering with cross-industry references", async () => {
    const server = buildServer();
    servers.push(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/catalog?industry=healthcare,government",
      headers: trustedHeaders,
    });

    expect(response.statusCode).toBe(200);
    const records = response.json().records as Array<{ slug: string }>;
    expect(records.some((record) => record.slug === "hipaa-security-rule")).toBe(true);
    expect(records.some((record) => record.slug === "nist-csf-2-0")).toBe(true);

    const invalid = await server.inject({
      method: "GET",
      url: "/api/catalog?industry=healthcare,unknown-sector",
      headers: trustedHeaders,
    });
    expect(invalid.statusCode).toBe(400);

    for (const industry of ["healthcare,", ",healthcare", "healthcare,,government", "healthcare,healthcare"]) {
      const malformed = await server.inject({
        method: "GET",
        url: `/api/catalog?industry=${encodeURIComponent(industry)}`,
        headers: trustedHeaders,
      });
      expect(malformed.statusCode).toBe(400);
    }
  });

  it("returns a catalog record with related materials and provenance", async () => {
    const server = buildServer();
    servers.push(server);

    const listing = await server.inject({ method: "GET", url: "/api/catalog", headers: trustedHeaders });
    expect(listing.statusCode).toBe(200);
    const nist = listing.json().records.find((record: { acronym?: string }) => record.acronym === "NIST CSF");
    expect(nist).toBeDefined();

    const response = await server.inject({
      method: "GET",
      url: `/api/catalog/${nist.slug}`,
      headers: trustedHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      record: {
        acronym: "NIST CSF",
        status: "current",
        officialUrl: "https://www.nist.gov/cyberframework",
      },
    });
    expect(Array.isArray(response.json().relationships)).toBe(true);
  });

  it("compares selected governance references without making compliance claims", async () => {
    const server = buildServer();
    servers.push(server);

    const listing = await server.inject({ method: "GET", url: "/api/catalog", headers: trustedHeaders });
    const records = listing.json().records as Array<{ slug: string; type: string }>;
    const comparable = records.filter((record) => ["framework", "standard", "control_catalog"].includes(record.type)).slice(0, 2);
    expect(comparable).toHaveLength(2);

    const response = await server.inject({
      method: "GET",
      url: `/api/catalog/compare?slugs=${comparable.map((record) => record.slug).join(",")}`,
      headers: trustedHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().records).toHaveLength(2);
    expect(response.json().disclaimer.toLowerCase()).toContain("not legal advice");
  });

  it("rejects unknown query parameters instead of silently accepting them", async () => {
    const server = buildServer();
    servers.push(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/catalog?authoritative=true",
      headers: trustedHeaders,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "invalid_catalog_query" });
  });

  it("does not expose assessment-graph or assurance routes in the catalog runtime", async () => {
    const server = buildServer();
    servers.push(server);

    for (const url of ["/api/graph", "/api/exports/snapshot", "/api/exports/summary"]) {
      const response = await server.inject({ method: "GET", url, headers: trustedHeaders });
      expect(response.statusCode).toBe(404);
    }

    const proposal = await server.inject({
      method: "POST",
      url: "/api/analysis/proposals",
      headers: { ...trustedHeaders, origin: "http://127.0.0.1:4173", "content-type": "application/json" },
      payload: { question: "Assess a client" },
    });
    expect(proposal.statusCode).toBe(404);
  });
});
