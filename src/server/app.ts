import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import {
  catalogIndustries,
  catalogRecordStatuses,
  catalogRecordTypes,
  catalogSummary,
  compareRecords,
  getRecordBySlug,
  getRelatedRecords,
  searchCatalog,
} from "../domain/catalog.js";
import { createAssuranceMarkdownSummary, createAssuranceSnapshot } from "../domain/export.js";
import { summarizeGraph, validateGraph } from "../domain/graph.js";
import { sampleGraph } from "../domain/sample-graph.js";
import { GraphSnapshotRepository } from "./storage.js";

const allowedOrigins = new Set([
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);
const allowedHosts = new Set([
  "127.0.0.1:4317",
  "localhost:4317",
  "[::1]:4317",
]);

const proposalRequest = z
  .object({
    question: z.string().trim().min(1).max(500),
  })
  .strict();

const industryQuery = z.string().trim().min(1).max(300)
  .refine((value) => {
    const industries = value.split(",").map((industry) => industry.trim());
    return industries.every(Boolean) && new Set(industries).size === industries.length;
  }, "Industry query values must be non-empty and unique.")
  .transform((value) => value.split(",").map((industry) => industry.trim()))
  .pipe(z.array(z.enum(catalogIndustries)).min(1).max(catalogIndustries.length));

const catalogQuery = z.object({
  q: z.string().trim().max(200).optional(),
  type: z.enum(catalogRecordTypes).optional(),
  status: z.enum(catalogRecordStatuses).optional(),
  industry: industryQuery.optional(),
}).strict();

const catalogRecordParams = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
}).strict();

const catalogCompareQuery = z.object({
  slugs: z.string().trim().min(1).max(400),
}).strict();

export interface ServerOptions {
  databasePath?: string;
  now?: () => string;
  enableLegacyAssessmentApi?: boolean;
}

export function buildServer(options: ServerOptions = {}) {
  const legacyAssessmentApiEnabled = options.enableLegacyAssessmentApi === true;
  const repository = legacyAssessmentApiEnabled
    ? new GraphSnapshotRepository(options.databasePath ?? ":memory:")
    : null;
  const now = options.now ?? (() => new Date().toISOString());
  if (repository !== null && repository.getSnapshot() === null) {
    repository.saveSnapshot(sampleGraph);
  }

  const app = Fastify({
    logger: false,
    bodyLimit: 64 * 1024,
    requestTimeout: 10_000,
  });

  app.addHook("onClose", async () => {
    repository?.close();
  });

  void app.register(cors, {
    origin(origin, callback) {
      callback(null, origin === undefined || allowedOrigins.has(origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
  });

  app.addHook("onRequest", async (request, reply) => {
    const requestId = randomUUID();
    reply
      .header("X-Request-Id", requestId)
      .header("X-Content-Type-Options", "nosniff")
      .header("X-Frame-Options", "DENY")
      .header("Referrer-Policy", "no-referrer")
      .header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
      .header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
      .header("Cache-Control", "no-store");

    const host = request.headers.host;
    if (host === undefined || !allowedHosts.has(host.toLowerCase())) {
      return reply.code(421).send({ error: "host_not_allowed", requestId });
    }

    const origin = request.headers.origin;
    if (origin !== undefined && !allowedOrigins.has(origin)) {
      return reply.code(403).send({ error: "origin_not_allowed", requestId });
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      if (origin === undefined) {
        return reply.code(403).send({ error: "origin_required", requestId });
      }
      const mediaType = request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
      if (mediaType !== "application/json") {
        return reply.code(415).send({ error: "unsupported_media_type", requestId });
      }
    }
  });

  app.get("/health", async () => ({ status: "ok", service: "eidos-api" }));

  app.get("/api/catalog", async (request, reply) => {
    const parsed = catalogQuery.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_catalog_query" });
    }
    const filters = {
      ...(parsed.data.type === undefined ? {} : { types: [parsed.data.type] }),
      ...(parsed.data.status === undefined ? {} : { statuses: [parsed.data.status] }),
      ...(parsed.data.industry === undefined ? {} : { industries: parsed.data.industry }),
    };
    const records = searchCatalog(parsed.data.q ?? "", filters);
    return { records, summary: catalogSummary() };
  });

  app.get("/api/catalog/compare", async (request, reply) => {
    const parsed = catalogCompareQuery.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_catalog_comparison" });
    }
    const slugs = parsed.data.slugs.split(",").map((slug) => slug.trim()).filter(Boolean);
    if (slugs.length < 2 || slugs.length > 3 || new Set(slugs).size !== slugs.length) {
      return reply.code(400).send({ error: "invalid_catalog_comparison" });
    }
    const records = slugs.map((slug) => getRecordBySlug(slug));
    if (records.some((record) => record === undefined)) {
      return reply.code(404).send({ error: "catalog_record_not_found" });
    }
    return {
      ...compareRecords(records.map((record) => record!.id)),
      disclaimer: "Educational reference only; this comparison is not legal advice and does not establish compliance or equivalence.",
    };
  });

  app.get("/api/catalog/:slug", async (request, reply) => {
    const parsed = catalogRecordParams.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_catalog_record" });
    }
    const record = getRecordBySlug(parsed.data.slug);
    if (record === undefined) {
      return reply.code(404).send({ error: "catalog_record_not_found" });
    }
    return { record, relationships: getRelatedRecords(record.id) };
  });

  if (legacyAssessmentApiEnabled && repository !== null) {
    app.get("/api/graph", async (_request, reply) => {
      const graph = repository.getSnapshot();
      if (graph === null) {
        return reply.code(503).send({ error: "graph_unavailable" });
      }
      const validation = validateGraph(graph);
      if (!validation.success) {
        return reply.code(500).send({ error: "invalid_authoritative_graph" });
      }
      return { graph: validation.data, summary: summarizeGraph(validation.data) };
    });

    app.get("/api/exports/snapshot", async (_request, reply) => {
      const graph = repository.getSnapshot();
      if (graph === null) {
        return reply.code(503).send({ error: "graph_unavailable" });
      }
      return createAssuranceSnapshot(graph, now());
    });

    app.get("/api/exports/summary", async (_request, reply) => {
      const graph = repository.getSnapshot();
      if (graph === null) {
        return reply.code(503).send({ error: "graph_unavailable" });
      }
      return reply.type("text/markdown; charset=utf-8").send(
        createAssuranceMarkdownSummary(graph, now()),
      );
    });

    app.post("/api/analysis/proposals", async (request, reply) => {
      const parsed = proposalRequest.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }

      return {
        authority: "ai_proposed",
        canVerify: false,
        question: parsed.data.question,
        proposal: "Review the failed administrative-access risk and confirm that current MFA evidence remains fresh.",
        disclaimer: "This proposal cannot create or modify verified assurance state.",
      };
    });
  }

  return app;
}
