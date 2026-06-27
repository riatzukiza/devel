/**
 * Tenants API — Native OpenPlanner implementation replacing Python km_labels.
 *
 * Stores tenant records in MongoDB collection `tenants`.
 * Stores tenant policies in MongoDB collection `tenant_policies`.
 *
 * Enhanced with status, isolation_mode, and policy management.
 */

import type { FastifyInstance } from "fastify";
import type { TenantStatus, IsolationMode, TenantPolicy } from "../../lib/tenant-types.js";

// ── Types ────────────────────────────────────────────────────────────

interface Tenant {
  tenant_id: string;
  slug?: string;
  name: string;
  status: TenantStatus;
  isolation_mode: IsolationMode;
  domains: string[];
  config: Record<string, unknown> | null;
  model_profile_id?: string;
  policy_id?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

interface CreateTenantPayload {
  tenant_id: string;
  slug?: string;
  name: string;
  domains?: string[];
  config?: Record<string, unknown>;
  status?: TenantStatus;
  isolation_mode?: IsolationMode;
  owner_id?: string;
}

interface UpdateTenantPayload {
  name?: string;
  slug?: string;
  domains?: string[];
  config?: Record<string, unknown> | null;
  status?: TenantStatus;
  isolation_mode?: IsolationMode;
  model_profile_id?: string;
  policy_id?: string;
}

interface CreatePolicyPayload {
  tenant_id: string;
  retention_days?: number;
  review_threshold?: number;
  pii_rules?: {
    detect?: boolean;
    redact?: boolean;
    reject?: boolean;
  };
  translation_config?: {
    glossary_id?: string;
    default_target_langs?: string[];
  };
  rate_limits?: {
    requests_per_minute?: number;
    tokens_per_day?: number;
  };
}

function tenantsCollection(app: FastifyInstance) {
  return app.mongo.db.collection("tenants");
}

function policiesCollection(app: FastifyInstance) {
  return app.mongo.db.collection("tenant_policies");
}

// ── Tenant Routes ───────────────────────────────────────────────────

export async function tenantsRoutes(app: FastifyInstance) {
  // List all tenants
  app.get("/", async () => {
    const rows = await tenantsCollection(app)
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    return rows.map((r) => ({
      tenant_id: r.tenant_id,
      slug: r.slug,
      name: r.name,
      status: r.status ?? "active",
      isolation_mode: r.isolation_mode ?? "shared",
      domains: r.domains ?? [],
      config: r.config ?? null,
      model_profile_id: r.model_profile_id,
      policy_id: r.policy_id,
      owner_id: r.owner_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  });

  // Get a tenant by ID
  app.get<{ Params: { tenant_id: string } }>("/:tenant_id", async (req, reply) => {
    const { tenant_id } = req.params;
    const row = await tenantsCollection(app).findOne({ tenant_id });
    if (!row) return reply.code(404).send({ detail: "Tenant not found" });

    return {
      tenant_id: row.tenant_id,
      slug: row.slug,
      name: row.name,
      status: row.status ?? "active",
      isolation_mode: row.isolation_mode ?? "shared",
      domains: row.domains ?? [],
      config: row.config ?? null,
      model_profile_id: row.model_profile_id,
      policy_id: row.policy_id,
      owner_id: row.owner_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  // Create a tenant
  app.post("/", async (req, reply) => {
    const payload = req.body as CreateTenantPayload;
    const now = new Date().toISOString();

    const existing = await tenantsCollection(app).findOne({ tenant_id: payload.tenant_id });
    if (existing) {
      return reply.code(409).send({ detail: "Tenant already exists" });
    }

    const doc = {
      tenant_id: payload.tenant_id,
      slug: payload.slug ?? payload.tenant_id.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: payload.name,
      status: payload.status ?? "active",
      isolation_mode: payload.isolation_mode ?? "shared",
      domains: payload.domains ?? [],
      config: payload.config ?? {},
      owner_id: payload.owner_id,
      created_at: now,
      updated_at: now,
    };

    await tenantsCollection(app).insertOne(doc);

    return reply.code(201).send({
      tenant_id: doc.tenant_id,
      slug: doc.slug,
      name: doc.name,
      status: doc.status,
      isolation_mode: doc.isolation_mode,
      domains: doc.domains,
      config: doc.config,
      owner_id: doc.owner_id,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    });
  });

  // Update a tenant
  app.patch<{ Params: { tenant_id: string } }>("/:tenant_id", async (req, reply) => {
    const { tenant_id } = req.params;
    const payload = req.body as UpdateTenantPayload;
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = { updated_at: now };
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.slug !== undefined) updates.slug = payload.slug;
    if (payload.domains !== undefined) updates.domains = payload.domains;
    if (payload.config !== undefined) updates.config = payload.config;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.isolation_mode !== undefined) updates.isolation_mode = payload.isolation_mode;
    if (payload.model_profile_id !== undefined) updates.model_profile_id = payload.model_profile_id;
    if (payload.policy_id !== undefined) updates.policy_id = payload.policy_id;

    const result = await tenantsCollection(app).findOneAndUpdate(
      { tenant_id },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result) return reply.code(404).send({ detail: "Tenant not found" });

    return {
      tenant_id: result.tenant_id,
      slug: result.slug,
      name: result.name,
      status: result.status ?? "active",
      isolation_mode: result.isolation_mode ?? "shared",
      domains: result.domains ?? [],
      config: result.config ?? null,
      model_profile_id: result.model_profile_id,
      policy_id: result.policy_id,
      owner_id: result.owner_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  });

  // Delete a tenant and all associated data
  app.delete<{ Params: { tenant_id: string } }>("/:tenant_id", async (req, reply) => {
    const { tenant_id } = req.params;

    // Delete associated data
    await app.mongo.db.collection("km_labels").deleteMany({ tenant_id });
    await policiesCollection(app).deleteOne({ tenant_id });

    const result = await tenantsCollection(app).deleteOne({ tenant_id });
    if (result.deletedCount === 0) {
      return reply.code(404).send({ detail: "Tenant not found" });
    }

    return reply.code(204).send();
  });

  // ── Policy Routes ─────────────────────────────────────────────────

  // Get tenant policy
  app.get<{ Params: { tenant_id: string } }>("/:tenant_id/policy", async (req, reply) => {
    const { tenant_id } = req.params;
    const policy = await policiesCollection(app).findOne({ tenant_id });
    if (!policy) return reply.code(404).send({ detail: "Policy not found" });

    return {
      tenant_id: policy.tenant_id,
      retention_days: policy.retention_days ?? 30,
      review_threshold: policy.review_threshold ?? 0.7,
      pii_rules: policy.pii_rules ?? { detect: true, redact: false, reject: false },
      translation_config: policy.translation_config,
      rate_limits: policy.rate_limits,
      created_at: policy.created_at,
      updated_at: policy.updated_at,
    };
  });

  // Create or update tenant policy
  app.put<{ Params: { tenant_id: string } }>("/:tenant_id/policy", async (req, reply) => {
    const { tenant_id } = req.params;
    const payload = req.body as CreatePolicyPayload;
    const now = new Date();

    // Verify tenant exists
    const tenant = await tenantsCollection(app).findOne({ tenant_id });
    if (!tenant) return reply.code(404).send({ detail: "Tenant not found" });

    const doc = {
      tenant_id,
      retention_days: payload.retention_days ?? 30,
      review_threshold: payload.review_threshold ?? 0.7,
      pii_rules: payload.pii_rules ?? { detect: true, redact: false, reject: false },
      translation_config: payload.translation_config,
      rate_limits: payload.rate_limits,
      created_at: now,
      updated_at: now,
    };

    await policiesCollection(app).updateOne(
      { tenant_id },
      { $set: doc },
      { upsert: true },
    );

    // Update tenant with policy reference
    await tenantsCollection(app).updateOne(
      { tenant_id },
      { $set: { policy_id: tenant_id, updated_at: now.toISOString() } },
    );

    return reply.code(200).send(doc);
  });
}
