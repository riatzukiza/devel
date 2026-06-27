export type LazyMigrationPlanRequest = {
  entity: string;
  targetVersion?: number;
  trigger?: string;
  object: Record<string, unknown>;
  error?: Record<string, unknown> | string;
};

export type LazyMigrationStep = {
  id: string;
  from: number;
  to: number;
  mode: string;
  description?: string;
};

export type LazyMigrationPlan = {
  entity: string;
  currentVersion: number;
  targetVersion: number;
  upToDate: boolean;
  migrationIds: string[];
  migrations: LazyMigrationStep[];
};

export type LazyMigrationPlanResponse = {
  ok: boolean;
  action?: string;
  plan?: LazyMigrationPlan;
  error?: string;
};

function migrationGraphBaseUrl(): string | null {
  const value = String(process.env.OPENPLANNER_MIGRATION_GRAPH_URL ?? "").trim();
  return value.length > 0 ? value.replace(/\/$/, "") : null;
}

export async function planLazyMigrationAfterValidationError(
  request: LazyMigrationPlanRequest,
): Promise<LazyMigrationPlanResponse | null> {
  const baseUrl = migrationGraphBaseUrl();
  if (!baseUrl) return null;

  const response = await fetch(`${baseUrl}/v1/schema/validation-error`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity: request.entity,
      "target-version": request.targetVersion,
      trigger: request.trigger ?? "schema-validation-error",
      object: request.object,
      error: request.error,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `migration_graph_http_${response.status}`,
    };
  }

  return await response.json() as LazyMigrationPlanResponse;
}

export function shouldApplyLazyMigrationInline(plan: LazyMigrationPlan | undefined): boolean {
  if (!plan || plan.upToDate || plan.migrations.length === 0) return false;
  return plan.migrations.every((migration) => migration.mode === "lazy-object");
}

export function shouldEnqueueLazyMigration(plan: LazyMigrationPlan | undefined): boolean {
  if (!plan || plan.upToDate || plan.migrations.length === 0) return false;
  return plan.migrations.some((migration) => migration.mode !== "lazy-object");
}
