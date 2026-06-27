/**
 * @fileoverview Core presence types for the eta-mu substrate.
 *
 * A presence is not a user — it is a position in the semantic field,
 * with its own will, budget, and coordination role.
 *
 * @license GPL-3.0-or-later
 */

import { z } from "zod";

// ============================================================================
// ANCHOR TYPES
// ============================================================================

/**
 * Anchor kind determines how a presence is positioned in the field.
 */
export const anchorKindSchema = z.enum([
  "bootstrap",     // Initial bootstrap presence
  "threat-radar",  // Threat monitoring presence
  "user",          // User-controlled presence
  "system",        // System/infrastructure presence
  "observer",      // Passive observation presence
]);

export type AnchorKind = z.infer<typeof anchorKindSchema>;

/**
 * Position anchor for a presence in the field.
 * All coordinates are normalized 0.0-1.0.
 */
export const presenceAnchorSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  zoom: z.number().min(0.1).max(10).default(1.0),
  kind: anchorKindSchema,
});

export type PresenceAnchor = z.infer<typeof presenceAnchorSchema>;

// ============================================================================
// ROLE TYPES
// ============================================================================

/**
 * Operational role defines what function a presence serves.
 */
export const operationalRoleSchema = z.enum([
  "system",        // Infrastructure (cpu, ram, disk, network, gpu, npu)
  "security",      // Threat monitoring
  "geopolitical",  // Global risk analysis
  "scanner",       // Automated scanning
  "observer",      // Passive observation
  "audit",         // Compliance tracking
  "media",         // Content processing
  "archive",       // Knowledge storage
]);

export type OperationalRole = z.infer<typeof operationalRoleSchema>;

// ============================================================================
// LOCALIZED STRING
// ============================================================================

/**
 * Localized string supporting multiple languages.
 */
export const localizedStringSchema = z.object({
  en: z.string().min(1),
  ja: z.string().optional(),
});

export type LocalizedString = z.infer<typeof localizedStringSchema>;

// ============================================================================
// PRESENCE TYPE
// ============================================================================

/**
 * A presence is a position/role in the semantic field.
 * It is NOT a user — it's a function that may be controlled by different users over time.
 */
export const presenceSchema = z.object({
  id: z.string().min(1),
  label: localizedStringSchema,
  anchor: presenceAnchorSchema,
  role: operationalRoleSchema,
  description: z.string().min(1),
  ownerId: z.string().optional(),
  version: z.number().int().nonnegative().default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Presence = z.infer<typeof presenceSchema>;

// ============================================================================
// DAIMON BUDGET
// ============================================================================

/**
 * DAIMON budget for a presence.
 * DAIMON = Distributed AI Monitor.
 * Each presence has a budget for AI operations — tokens, compute, attention.
 */
export const daimonBudgetSchema = z.object({
  presenceId: z.string().min(1),
  baseTokens: z.number().int().nonnegative(),
  currentTokens: z.number().int().nonnegative(),
  maxBurst: z.number().int().nonnegative(),
  temperature: z.number().min(0).max(1).default(0.5),
  weight: z.number().min(0).max(2).default(1.0),
});

export type DaimonBudget = z.infer<typeof daimonBudgetSchema>;

/**
 * Budget allocation record.
 */
export const budgetAllocationSchema = z.object({
  presenceId: z.string().min(1),
  allocationId: z.string().min(1),
  tokens: z.number().int().nonnegative(),
  reason: z.string().min(1),
  timestamp: z.string().datetime(),
});

export type BudgetAllocation = z.infer<typeof budgetAllocationSchema>;

// ============================================================================
// HANDOFF PROTOCOL
// ============================================================================

/**
 * Handoff request for transferring presence ownership.
 */
export const presenceHandoffSchema = z.object({
  presenceId: z.string().min(1),
  fromOwnerId: z.string().min(1),
  toOwnerId: z.string().min(1),
  version: z.number().int().nonnegative(),
  reason: z.string().optional(),
});

export type PresenceHandoff = z.infer<typeof presenceHandoffSchema>;

/**
 * Handoff result.
 */
export const handoffResultSchema = z.object({
  success: z.boolean(),
  newVersion: z.number().int().nonnegative().optional(),
  error: z.enum(["owner_conflict", "version_conflict", "not_found"]).optional(),
});

export type HandoffResult = z.infer<typeof handoffResultSchema>;

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Presence event types.
 */
export const presenceEventTypeSchema = z.enum([
  "presence.created",
  "presence.updated",
  "presence.handoff_initiated",
  "presence.handoff_completed",
  "presence.handoff_rejected",
  "presence.budget_allocated",
  "presence.budget_released",
]);

export type PresenceEventType = z.infer<typeof presenceEventTypeSchema>;

/**
 * Presence event.
 */
export const presenceEventSchema = z.object({
  type: presenceEventTypeSchema,
  presenceId: z.string().min(1),
  payload: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  sourceId: z.string().min(1),
});

export type PresenceEvent = z.infer<typeof presenceEventSchema>;

// ============================================================================
// FIELD TYPES
// ============================================================================

/**
 * Field assignment for a presence.
 */
export const fieldAssignmentSchema = z.object({
  fieldId: z.string().min(1),
  presenceId: z.string().min(1),
  assignedAt: z.string().datetime(),
  status: z.enum(["active", "paused", "released"]).default("active"),
});

export type FieldAssignment = z.infer<typeof fieldAssignmentSchema>;

/**
 * Named field IDs from fork_tales.
 */
export const CANONICAL_NAMED_FIELD_IDS = [
  "receipt_river",
  "witness_thread",
  "fork_tax_canticle",
  "mage_of_receipts",
  "keeper_of_receipts",
  "anchor_registry",
  "gates_of_truth",
  "file_sentinel",
  "change_fog",
  "path_ward",
  "manifest_lith",
  "resolution_weaver",
  "core_pulse",
] as const;

export type NamedFieldId = typeof CANONICAL_NAMED_FIELD_IDS[number];