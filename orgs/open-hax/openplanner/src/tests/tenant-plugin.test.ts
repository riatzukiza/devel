/**
 * Tenant Plugin Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import { MongoClient } from "mongodb";
import { buildApp } from "../app.js";

/**
 * Tenant Resolution Integration Tests
 *
 * Tests tenant context resolution from various sources:
 * 1. X-Tenant-ID header
 * 2. Subdomain from Host header
 * 3. URL param :tenant_id (legacy)
 * 4. Request body tenant_id (legacy)
 * 5. Policy loading
 * 6. Status enforcement
 */

describe("Tenant Plugin", () => {
  let app: FastifyInstance;
  let mongo: MongoClient;
  let tenantsCollection: any;
  let policiesCollection: any;

  const testApiKey = "test-api-key";

  // Test fixtures
  const testTenant = {
    tenant_id: "test-tenant-1",
    slug: "test-tenant",
    name: "Test Tenant",
    status: "active",
    isolation_mode: "shared",
    domains: ["test-tenant.example.com", "test.example.com"],
    config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const suspendedTenant = {
    tenant_id: "suspended-tenant",
    slug: "suspended",
    name: "Suspended Tenant",
    status: "suspended",
    isolation_mode: "shared",
    domains: [],
    config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const testPolicy = {
    tenant_id: "test-tenant-1",
    retention_days: 30,
    review_threshold: 0.7,
    pii_rules: {
      detect: true,
      redact: false,
      reject: false,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeAll(async () => {
    // Build app with test configuration
    app = await buildApp({
      logger: false,
      mongo: {
        url: process.env.MONGO_URL || "mongodb://localhost:27017",
        database: "openplanner_test_tenant",
      },
      apiKey: testApiKey,
    });

    await app.ready();
    mongo = app.mongo.client;
    tenantsCollection = app.mongo.db.collection("tenants");
    policiesCollection = app.mongo.db.collection("tenant_policies");
  });

  afterAll(async () => {
    await app.close();
    await mongo.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await tenantsCollection.deleteMany({});
    await policiesCollection.deleteMany({});

    // Seed test data
    await tenantsCollection.insertMany([testTenant, suspendedTenant]);
    await policiesCollection.insertOne(testPolicy);
  });

  describe("Tenant Resolution", () => {
    it("resolves tenant from X-Tenant-ID header", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/documents",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "x-tenant-id": "test-tenant-1",
      },
    });

    // Should not reject (tenant resolved)
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
  });

    it("resolves tenant from subdomain in Host header", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/documents",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        host: "test-tenant.example.com",
      },
    });

    // Should not reject (tenant resolved from subdomain)
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
  });

    it("resolves tenant from domain match", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/documents",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        host: "test.example.com",
      },
    });

    // Should not reject (tenant resolved from domain)
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
  });

    it("allows legacy labels route with :tenant_id param", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/labels/test-tenant-1",
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    // Should work (legacy path allows param resolution)
    expect(res.statusCode).not.toBe(401);
  });
  });

  describe("Tenant Status Enforcement", () => {
    it("returns 403 for suspended tenant", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/documents",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "x-tenant-id": "suspended-tenant",
      },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().message).toContain("suspended");
  });
  });

  describe("Public Paths", () => {
    it("allows health endpoint without tenant", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/v1/health",
      });

      expect(res.statusCode).toBe(200);
    });

    it("allows public garden routes without tenant", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/v1/public/gardens/test-garden/html",
      });

      // May 404 if garden doesn't exist, but shouldn't 401
      expect(res.statusCode).not.toBe(401);
    });
  });

  describe("Policy Loading", () => {
    it("loads tenant policy when available", async () => {
    // Policy is loaded but not enforced yet in non-strict mode
    const res = await app.inject({
      method: "GET",
      url: "/v1/documents",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "x-tenant-id": "test-tenant-1",
      },
    });

    // Request should succeed
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
  });
  });
});
