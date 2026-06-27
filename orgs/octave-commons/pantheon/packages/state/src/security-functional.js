import { z } from 'zod';
// Security-focused validation schemas
export const AgentIdSchema = z
    .string()
    .min(1, 'Agent ID cannot be empty')
    .max(255, 'Agent ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Agent ID can only contain alphanumeric characters, hyphens, and underscores')
    .refine((id) => !id.includes('..') && !id.includes('/') && !id.includes('\\'), 'Agent ID cannot contain path traversal characters');
export const ContextKeySchema = z
    .string()
    .min(1, 'Context key cannot be empty')
    .max(500, 'Context key too long')
    .regex(/^[a-zA-Z0-9_.:-]+$/, 'Context key contains invalid characters')
    .refine((key) => !key.includes('..') && !key.includes('/') && !key.includes('\\'), 'Context key cannot contain path traversal characters');
export const ContextValueSchema = z.any().refine((value) => {
    // Prevent prototype pollution
    if (value && typeof value === 'object') {
        return !('__proto__' in value) && !('constructor' in value) && !('prototype' in value);
    }
    return true;
}, 'Context value contains prohibited properties');
export const ShareTypeSchema = z.enum(['read', 'write', 'admin']);
export const PermissionSchema = z
    .string()
    .min(1, 'Permission cannot be empty')
    .max(100, 'Permission too long')
    .regex(/^[a-zA-Z0-9_:.-]+$/, 'Permission contains invalid characters');
export const TokenSchema = z.string().min(10, 'Token too short').max(2000, 'Token too long');
export const EventDataSchema = z.record(z.unknown()).refine((data) => {
    // Prevent prototype pollution in event data
    for (const key in data) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return false;
        }
    }
    return true;
}, 'Event data contains prohibited properties');
export const SnapshotIdSchema = z
    .string()
    .min(1, 'Snapshot ID cannot be empty')
    .max(255, 'Snapshot ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Snapshot ID contains invalid characters');
export const MetadataQuerySchema = z.object({
    agentId: AgentIdSchema.optional(),
    contextType: z.string().max(100).optional(),
    visibility: z.enum(['private', 'shared', 'public']).optional(),
    keyPattern: z.string().max(500).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).max(10000).optional(),
});
export const validateAgentId = (input, scope) => {
    return scope.schemas.AgentIdSchema.parse(input.agentId);
};
export const validateContextKey = (input, scope) => {
    return scope.schemas.ContextKeySchema.parse(input.key);
};
export const validateContextValue = (input, scope) => {
    return scope.schemas.ContextValueSchema.parse(input.value);
};
export const validateShareType = (input, scope) => {
    return scope.schemas.ShareTypeSchema.parse(input.shareType);
};
export const validatePermissions = (input, scope) => {
    if (Array.isArray(input.permissions)) {
        return input.permissions.map((p) => scope.schemas.PermissionSchema.parse(p));
    }
    throw new Error('Permissions must be an array');
};
export const validateToken = (input, scope) => {
    return scope.schemas.TokenSchema.parse(input.token);
};
export const validateEventData = (input, scope) => {
    return scope.schemas.EventDataSchema.parse(input.data);
};
export const validateSnapshotId = (input, scope) => {
    return scope.schemas.SnapshotIdSchema.parse(input.snapshotId);
};
export const validateMetadataQuery = (input, scope) => {
    return scope.schemas.MetadataQuerySchema.parse(input.query);
};
export const sanitizeString = (input) => {
    if (typeof input.input !== 'string') {
        throw new Error('Input must be a string');
    }
    const maxLength = input.maxLength || 1000;
    // Remove potentially dangerous characters
    const sanitized = input.input
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
        .replace(/[\uFFFE\uFFFF]/g, '') // Invalid Unicode
        .trim();
    // Truncate if too long
    if (sanitized.length > maxLength) {
        return sanitized.substring(0, maxLength);
    }
    return sanitized;
};
export const sanitizeObject = (input) => {
    if (input.obj === null || input.obj === undefined) {
        return input.obj;
    }
    if (typeof input.obj !== 'object') {
        return input.obj;
    }
    if (Array.isArray(input.obj)) {
        return input.obj.map((item) => sanitizeObject({ obj: item }));
    }
    const objRecord = input.obj;
    const keys = Object.keys(objRecord);
    return keys.reduce((acc, key) => {
        // Skip dangerous prototype properties
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return acc;
        }
        return {
            ...acc,
            [key]: sanitizeObject({ obj: objRecord[key] }),
        };
    }, {});
};
export const createRateLimiter = (input) => {
    const windowMs = input.windowMs || 60000;
    const maxAttempts = input.maxAttempts || 10;
    const attempts = new Map();
    const isAllowed = (key) => {
        const now = Date.now();
        const record = attempts.get(key);
        if (!record || now - record.resetTime >= windowMs) {
            attempts.set(key, { count: 1, resetTime: now });
            return true;
        }
        if (record.count >= maxAttempts) {
            return false;
        }
        const updatedRecord = { ...record, count: record.count + 1 };
        attempts.set(key, updatedRecord);
        return true;
    };
    const getRemainingAttempts = (key) => {
        const now = Date.now();
        const record = attempts.get(key);
        if (!record || now - record.resetTime >= windowMs) {
            return maxAttempts;
        }
        return Math.max(0, maxAttempts - record.count);
    };
    const getResetTime = (key) => {
        const record = attempts.get(key);
        return record ? record.resetTime : null;
    };
    const reset = (key) => {
        attempts.delete(key);
    };
    const cleanup = () => {
        const now = Date.now();
        const keysToDelete = [];
        attempts.forEach((record, key) => {
            if (now - record.resetTime >= windowMs) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => attempts.delete(key));
    };
    return {
        isAllowed,
        getRemainingAttempts,
        getResetTime,
        reset,
        cleanup,
    };
};
// Rate limiter factory with singleton pattern
const rateLimiterInstances = new Map();
export const getRateLimiter = (input) => {
    const key = `${input.identifier}:${input.windowMs || 60000}:${input.maxAttempts || 10}`;
    if (!rateLimiterInstances.has(key)) {
        const instance = createRateLimiter({
            windowMs: input.windowMs,
            maxAttempts: input.maxAttempts,
        });
        rateLimiterInstances.set(key, instance);
    }
    return rateLimiterInstances.get(key);
};
export const logSecurityEvent = (input) => {
    const securityEvent = {
        ...input,
        timestamp: new Date(),
    };
    // In a real implementation, this would store events
    if (process.env.NODE_ENV === 'production') {
        console.warn('SECURITY EVENT:', JSON.stringify(securityEvent));
    }
    return securityEvent;
};
// Legacy compatibility exports
export const SecurityValidator = {
    validateAgentId: (id) => validateAgentId({ agentId: id }, { schemas: { AgentIdSchema } }),
    validateContextKey: (key) => validateContextKey({ key }, { schemas: { ContextKeySchema } }),
    validateContextValue: (value) => validateContextValue({ value }, { schemas: { ContextValueSchema } }),
    validateShareType: (shareType) => validateShareType({ shareType }, { schemas: { ShareTypeSchema } }),
    validatePermissions: (permissions) => validatePermissions({ permissions }, { schemas: { PermissionSchema } }),
    validateToken: (token) => validateToken({ token }, { schemas: { TokenSchema } }),
    validateEventData: (data) => validateEventData({ data }, { schemas: { EventDataSchema } }),
    validateSnapshotId: (snapshotId) => validateSnapshotId({ snapshotId }, { schemas: { SnapshotIdSchema } }),
    validateMetadataQuery: (query) => validateMetadataQuery({ query }, { schemas: { MetadataQuerySchema } }),
    sanitizeString: (input, maxLength) => sanitizeString({ input, maxLength }),
    sanitizeObject: (obj) => sanitizeObject({ obj }),
};
export const RateLimiter = {
    getInstance: (identifier, windowMs, maxAttempts) => getRateLimiter({ identifier, windowMs, maxAttempts }),
};
//# sourceMappingURL=security-functional.js.map