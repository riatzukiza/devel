/**
 * Tenant Types
 *
 * Core types for multi-tenant control plane.
 */

export type TenantStatus = "trial" | "active" | "suspended";
export type IsolationMode = "shared" | "isolated" | "dedicated";

export interface TenantPolicy {
  tenant_id: string;
  retention_days: number;
  review_threshold: number; // Confidence below this goes to review queue
  pii_rules: {
    detect: boolean;
    redact: boolean;
    reject: boolean;
  };
  translation_config?: {
    glossary_id?: string;
    default_target_langs: string[];
  };
  rate_limits?: {
    requests_per_minute: number;
    tokens_per_day: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface TenantModelProfile {
  profile_id: string;
  tenant_id: string;
  name: string;
  base_model: string;
  endpoint?: string;
  sampling_params: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
  safety_profile: "default" | "strict" | "permissive";
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  tenant_id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  isolation_mode: IsolationMode;
  deployment_stamp?: string;
  
  // Store references (for isolated/dedicated mode)
  kb_store_ref?: string;
  vector_store_ref?: string;
  graph_store_ref?: string;
  
  // Profile references
  model_profile_id?: string;
  translation_profile_id?: string;
  policy_id?: string;
  
  // Legacy domains field (for host-based resolution)
  domains: string[];
  
  // Legacy config field (being migrated to policies)
  config?: Record<string, unknown>;
  
  // Ownership
  owner_id?: string;
  billing_account_id?: string;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Resolved tenant context attached to requests.
 */
export interface TenantContext {
  tenant: Tenant;
  policy?: TenantPolicy;
  model_profile?: TenantModelProfile;
  user_id?: string;
  roles: string[];
  scopes: string[];
}

/**
 * Request with tenant context.
 */
declare module "fastify" {
  interface FastifyRequest {
    tenantContext?: TenantContext;
  }
}
