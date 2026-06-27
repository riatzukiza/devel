import { z } from 'zod';
export declare const AgentIdSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const ContextKeySchema: z.ZodEffects<z.ZodString, string, string>;
export declare const ContextValueSchema: z.ZodEffects<z.ZodAny, any, any>;
export declare const ShareTypeSchema: z.ZodEnum<["read", "write", "admin"]>;
export declare const PermissionSchema: z.ZodString;
export declare const TokenSchema: z.ZodString;
export declare const EventDataSchema: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnknown>, Record<string, unknown>, Record<string, unknown>>;
export declare const SnapshotIdSchema: z.ZodString;
export declare const MetadataQuerySchema: z.ZodObject<{
    agentId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    contextType: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodEnum<["private", "shared", "public"]>>;
    keyPattern: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    offset?: number | undefined;
    agentId?: string | undefined;
    contextType?: string | undefined;
    visibility?: "public" | "private" | "shared" | undefined;
    keyPattern?: string | undefined;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
    agentId?: string | undefined;
    contextType?: string | undefined;
    visibility?: "public" | "private" | "shared" | undefined;
    keyPattern?: string | undefined;
}>;
export type ValidateAgentIdInput = {
    agentId: unknown;
};
export type ValidateAgentIdScope = {
    schemas: {
        AgentIdSchema: typeof AgentIdSchema;
    };
};
export declare const validateAgentId: (input: ValidateAgentIdInput, scope: ValidateAgentIdScope) => string;
export type ValidateContextKeyInput = {
    key: unknown;
};
export type ValidateContextKeyScope = {
    schemas: {
        ContextKeySchema: typeof ContextKeySchema;
    };
};
export declare const validateContextKey: (input: ValidateContextKeyInput, scope: ValidateContextKeyScope) => string;
export type ValidateContextValueInput = {
    value: unknown;
};
export type ValidateContextValueScope = {
    schemas: {
        ContextValueSchema: typeof ContextValueSchema;
    };
};
export declare const validateContextValue: (input: ValidateContextValueInput, scope: ValidateContextValueScope) => unknown;
export type ValidateShareTypeInput = {
    shareType: unknown;
};
export type ValidateShareTypeScope = {
    schemas: {
        ShareTypeSchema: typeof ShareTypeSchema;
    };
};
export declare const validateShareType: (input: ValidateShareTypeInput, scope: ValidateShareTypeScope) => "read" | "write" | "admin";
export type ValidatePermissionsInput = {
    permissions: unknown;
};
export type ValidatePermissionsScope = {
    schemas: {
        PermissionSchema: typeof PermissionSchema;
    };
};
export declare const validatePermissions: (input: ValidatePermissionsInput, scope: ValidatePermissionsScope) => readonly string[];
export type ValidateTokenInput = {
    token: unknown;
};
export type ValidateTokenScope = {
    schemas: {
        TokenSchema: typeof TokenSchema;
    };
};
export declare const validateToken: (input: ValidateTokenInput, scope: ValidateTokenScope) => string;
export type ValidateEventDataInput = {
    data: unknown;
};
export type ValidateEventDataScope = {
    schemas: {
        EventDataSchema: typeof EventDataSchema;
    };
};
export declare const validateEventData: (input: ValidateEventDataInput, scope: ValidateEventDataScope) => Record<string, unknown>;
export type ValidateSnapshotIdInput = {
    snapshotId: unknown;
};
export type ValidateSnapshotIdScope = {
    schemas: {
        SnapshotIdSchema: typeof SnapshotIdSchema;
    };
};
export declare const validateSnapshotId: (input: ValidateSnapshotIdInput, scope: ValidateSnapshotIdScope) => string;
export type ValidateMetadataQueryInput = {
    query: unknown;
};
export type ValidateMetadataQueryScope = {
    schemas: {
        MetadataQuerySchema: typeof MetadataQuerySchema;
    };
};
export declare const validateMetadataQuery: (input: ValidateMetadataQueryInput, scope: ValidateMetadataQueryScope) => unknown;
export type SanitizeStringInput = {
    input: unknown;
    maxLength?: number;
};
export declare const sanitizeString: (input: SanitizeStringInput) => string;
export type SanitizeObjectInput = {
    obj: unknown;
};
export declare const sanitizeObject: (input: SanitizeObjectInput) => unknown;
export type RateLimitRecord = {
    readonly count: number;
    readonly resetTime: number;
};
export type CreateRateLimiterInput = {
    windowMs?: number;
    maxAttempts?: number;
};
export declare const createRateLimiter: (input: CreateRateLimiterInput) => {
    isAllowed: (key: string) => boolean;
    getRemainingAttempts: (key: string) => number;
    getResetTime: (key: string) => number | null;
    reset: (key: string) => void;
    cleanup: () => void;
};
export type GetRateLimiterInput = {
    identifier: string;
    windowMs?: number;
    maxAttempts?: number;
};
export declare const getRateLimiter: (input: GetRateLimiterInput) => ReturnType<typeof createRateLimiter>;
export interface SecurityEvent {
    type: 'authentication' | 'authorization' | 'input_validation' | 'rate_limit' | 'data_access';
    severity: 'low' | 'medium' | 'high' | 'critical';
    agentId?: string;
    action: string;
    details: Readonly<Record<string, unknown>>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}
export type LogSecurityEventInput = Omit<SecurityEvent, 'timestamp'>;
export declare const logSecurityEvent: (input: LogSecurityEventInput) => SecurityEvent;
export declare const SecurityValidator: {
    validateAgentId: (id: unknown) => string;
    validateContextKey: (key: unknown) => string;
    validateContextValue: (value: unknown) => unknown;
    validateShareType: (shareType: unknown) => "read" | "write" | "admin";
    validatePermissions: (permissions: unknown) => readonly string[];
    validateToken: (token: unknown) => string;
    validateEventData: (data: unknown) => Record<string, unknown>;
    validateSnapshotId: (snapshotId: unknown) => string;
    validateMetadataQuery: (query: unknown) => unknown;
    sanitizeString: (input: unknown, maxLength?: number) => string;
    sanitizeObject: (obj: unknown) => unknown;
};
export declare const RateLimiter: {
    getInstance: (identifier: string, windowMs?: number, maxAttempts?: number) => {
        isAllowed: (key: string) => boolean;
        getRemainingAttempts: (key: string) => number;
        getResetTime: (key: string) => number | null;
        reset: (key: string) => void;
        cleanup: () => void;
    };
};
//# sourceMappingURL=security-functional.d.ts.map