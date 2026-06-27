import type { FastifyPluginAsync } from "fastify";
import { redactionStateSchemas } from "./state.js";

const vectorSearchRequestSchema = {
  type: "object",
  required: ["q"],
  properties: {
    q: { type: "string", minLength: 1 },
    k: { type: "integer", minimum: 1, maximum: 200, default: 20 },
    source: { type: "string" },
    kind: { type: "string" },
    project: { type: "string" },
    visibility: { type: "string", enum: ["internal", "review", "public", "archived"] },
    tier: { type: "string", enum: ["hot", "compact", "both"], default: "both" },
    where: {
      type: "object",
      additionalProperties: true,
      description: "Filter object; runtime only accepts safe scalar filters for source, kind, project, session, visibility, parent_id, and embedding_model.",
    },
  },
  additionalProperties: false,
} as const;

const vectorSearchResponseSchema = {
  type: "object",
  required: ["ok", "result", "tier", "storageBackend"],
  properties: {
    ok: { type: "boolean" },
    tier: { type: "string", enum: ["hot", "compact", "both"] },
    storageBackend: { type: "string", enum: ["mongodb"] },
    result: {
      type: "object",
      required: ["ids", "documents", "metadatas", "distances", "include"],
      properties: {
        ids: { type: "array", items: { type: "array", items: { type: "string" } } },
        documents: { type: "array", items: { type: "array", items: { type: "string" } } },
        metadatas: { type: "array", items: { type: "array", items: { type: "object", additionalProperties: true } } },
        distances: { type: "array", items: { type: "array", items: { anyOf: [{ type: "number" }, { type: "null" }] } } },
        include: { type: "array", items: { type: "string", enum: ["documents", "metadatas", "distances"] } },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} as const;

function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "OpenPlanner API",
      version: "0.3.0",
      description: "OpenPlanner event ledger, graph/semantic search index, and source-reference hydration API. This document currently covers the source-text redaction parity surface and vector search hydration contract.",
    },
    servers: [
      { url: "http://127.0.0.1:7777/v1", description: "local production container" },
      { url: "http://127.0.0.1:7778/v1", description: "local development container" },
    ],
    security: [{ bearerAuth: [] }],
    paths: {
      "/state/redaction": {
        get: {
          summary: "Validate source-text redaction state",
          operationId: "getRedactionState",
          parameters: [
            {
              name: "strict",
              in: "query",
              required: false,
              schema: { type: "boolean", default: false },
              description: "When true, document-event text awaiting Migration 2 apply mode fails validation instead of producing warn status.",
            },
          ],
          responses: {
            "200": {
              description: "Redaction state ledger",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RedactionStateResponse" },
                },
              },
            },
          },
        },
      },
      "/search/vector": {
        post: {
          summary: "Vector search with redacted-hit hydration",
          operationId: "postVectorSearch",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VectorSearchRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Chroma-compatible vector query result; redacted source-backed hits are hydrated into documents[].",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/VectorSearchResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
      schemas: {
        RedactionStateResponse: redactionStateSchemas.redactionStateResponseSchema,
        VectorSearchRequest: vectorSearchRequestSchema,
        VectorSearchResponse: vectorSearchResponseSchema,
      },
    },
  };
}

export const openApiRoutes: FastifyPluginAsync = async (app) => {
  app.get("/openapi.json", {
    schema: {
      summary: "OpenAPI 3.1 schema for documented OpenPlanner surfaces",
      response: {
        200: {
          type: "object",
          required: ["openapi", "info", "paths", "components"],
          properties: {
            openapi: { type: "string" },
            info: { type: "object", additionalProperties: true },
            paths: { type: "object", additionalProperties: true },
            components: { type: "object", additionalProperties: true },
          },
          additionalProperties: true,
        },
      },
    },
  }, async () => openApiDocument());
};

export const openApiSchemas = {
  vectorSearchRequestSchema,
  vectorSearchResponseSchema,
};
