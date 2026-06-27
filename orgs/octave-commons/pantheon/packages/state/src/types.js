import { z } from 'zod';
export const ContextEventSchema = z.object({
    id: z.string(),
    type: z.string(),
    agentId: z.string(),
    timestamp: z.date(),
    data: z.record(z.any()),
    metadata: z.record(z.any()).optional(),
});
export const ContextSnapshotSchema = z.object({
    id: z.string(),
    agentId: z.string(),
    timestamp: z.date(),
    state: z.record(z.any()),
    version: z.number(),
    eventId: z.string(),
});
export const AgentContextSchema = z.object({
    id: z.string(),
    agentId: z.string(),
    state: z.record(z.any()),
    version: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    metadata: z.record(z.any()).optional(),
});
export const AuthTokenSchema = z.object({
    token: z.string(),
    agentId: z.string(),
    expiresAt: z.date(),
    permissions: z.array(z.string()),
});
//# sourceMappingURL=types.js.map