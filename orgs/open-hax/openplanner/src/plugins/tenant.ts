/**
 * Tenant Resolution Plugin
 *
 * Resolves tenant context from auth, host, API key, or header.
 * Attaches TenantContext to request for downstream use.
 *
 * Resolution order:
 * 1. X-Tenant-ID header (for service-to-service)
 * 2. Tenant from API key lookup (future)
 * 3. Subdomain from Host header (future)
 * 4. URL param :tenant_id (fallback, for legacy compatibility)
 * 5. Request body tenant_id (fallback, for legacy compatibility)
 */

import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Tenant, TenantPolicy, TenantContext } from "../lib/tenant-types.js";

export interface TenantPluginOptions {
  /** Routes that don't require tenant context */
  publicPaths?: string[];
  /** Routes that use legacy :tenant_id param resolution */
  legacyParamPaths?: string[];
  /** Enable strict mode (reject requests without tenant) */
  strict?: boolean;
}

const DEFAULT_PUBLIC_PATHS = [
  "/",
  "/v1/health",
  "/v1/metrics",
  "/v1/public",

  // Graph export is currently authenticated via API key and not tenant-scoped.
  // Graph-weaver and other internal consumers do not send X-Tenant-ID yet.
  "/v1/graph/export",

  "/v1/graph/node-embeddings/query",
  "/v1/graph/node-embeddings/materialize",
];

const DEFAULT_LEGACY_PARAM_PATHS = [
  "/v1/labels",
  "/v1/tenants",
  "/v1/export",
];

function tenantsCollection(app: FastifyInstance) {
  return app.mongo.db.collection("tenants");
}

function tenantPoliciesCollection(app: FastifyInstance) {
  return app.mongo.db.collection("tenant_policies");
}

/**
 * Resolve tenant from various sources.
 */
async function resolveTenant(
  app: FastifyInstance,
  req: FastifyRequest
): Promise<Tenant | null> {
  // 1. X-Tenant-ID header (service-to-service)
  const headerTenantId = req.headers["x-tenant-id"];
  if (typeof headerTenantId === "string" && headerTenantId.trim()) {
    const tenant = await tenantsCollection(app).findOne({ tenant_id: headerTenantId.trim() });
    if (tenant) return tenant as unknown as Tenant;
  }

  // 2. Tenant from API key lookup (future: api_keys collection with tenant_id FK)
  // TODO: Implement when API key management is added

  // 3. Subdomain from Host header
  const host = req.headers.host;
  if (host) {
    // Extract subdomain (e.g., "tenant.example.com" -> "tenant")
    const parts = host.split(".");
    if (parts.length >= 3) {
      const subdomain = parts[0];
      const tenant = await tenantsCollection(app).findOne({
        $or: [
          { slug: subdomain },
          { domains: host },
          { domains: { $regex: new RegExp(`^${subdomain}\\.`) } },
        ],
      });
      if (tenant) return tenant as unknown as Tenant;
    }
  }

  // 4. URL param :tenant_id (legacy)
  const params = req.params as Record<string, string | undefined>;
  if (params?.tenant_id) {
    const tenant = await tenantsCollection(app).findOne({ tenant_id: params.tenant_id });
    if (tenant) return tenant as unknown as Tenant;
  }

  // 5. Request body tenant_id (legacy, for POST/PUT)
  const body = req.body as Record<string, unknown> | undefined;
  if (body?.tenant_id && typeof body.tenant_id === "string") {
    const tenant = await tenantsCollection(app).findOne({ tenant_id: body.tenant_id });
    if (tenant) return tenant as unknown as Tenant;
  }

  return null;
}

/**
 * Load tenant policy.
 */
async function loadTenantPolicy(
  app: FastifyInstance,
  tenant: Tenant
): Promise<TenantPolicy | undefined> {
  if (!tenant.policy_id) return undefined;
  
  const policy = await tenantPoliciesCollection(app).findOne({ tenant_id: tenant.tenant_id });
  return policy as unknown as TenantPolicy | undefined;
}

/**
 * Check if path matches any pattern in the list.
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("/*")) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern || pathname.startsWith(pattern + "/");
  });
}

export const tenantPlugin = fp<TenantPluginOptions>(async (app, options) => {
  const publicPaths = options?.publicPaths ?? DEFAULT_PUBLIC_PATHS;
  const legacyParamPaths = options?.legacyParamPaths ?? DEFAULT_LEGACY_PARAM_PATHS;
  const strict = options?.strict ?? false;

  app.addHook("onRequest", async (req, reply) => {
    const pathname = req.url.split("?")[0];

    // Skip public paths
    if (matchesPath(pathname, publicPaths)) {
      return;
    }

    // Resolve tenant
    const tenant = await resolveTenant(app, req);

    if (!tenant) {
      // For legacy paths, allow request to proceed without tenant context
      // (backward compatibility during migration)
      if (matchesPath(pathname, legacyParamPaths)) {
        req.log.debug({ pathname }, "tenant resolution skipped for legacy path");
        return;
      }

      // In strict mode, reject
      if (strict) {
        return reply.unauthorized("Tenant context required");
      }

      // In non-strict mode, log at debug level and proceed
      // (warn level creates too much noise from internal docker services)
      req.log.debug({ pathname }, "no tenant context resolved");
      return;
    }

    // Check tenant status
    if (tenant.status === "suspended") {
      return reply.forbidden("Tenant is suspended");
    }

    // Load policy
    const policy = await loadTenantPolicy(app, tenant);

    // Attach context
    req.tenantContext = {
      tenant,
      policy,
      roles: [], // TODO: Extract from JWT
      scopes: [], // TODO: Extract from JWT
    };

    req.log.debug({ tenant_id: tenant.tenant_id, pathname }, "tenant context resolved");
  });
});

export default tenantPlugin;
