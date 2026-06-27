"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportConfigSchema = exports.MessageEnvelopeSchema = void 0;
const zod_1 = require("zod");
exports.MessageEnvelopeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    sender: zod_1.z.string(),
    recipient: zod_1.z.string(),
    timestamp: zod_1.z.date(),
    payload: zod_1.z.record(zod_1.z.any()),
    signature: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    correlationId: zod_1.z.string().optional(),
    replyTo: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    ttl: zod_1.z.number().optional(), // Time to live in milliseconds
    retryCount: zod_1.z.number().default(0),
    maxRetries: zod_1.z.number().default(3),
});
exports.TransportConfigSchema = zod_1.z.object({
    type: zod_1.z.enum(['amqp', 'websocket', 'http']),
    url: zod_1.z.string(),
    options: zod_1.z.record(zod_1.z.any()).optional(),
    auth: zod_1.z.object({
        type: zod_1.z.enum(['none', 'basic', 'token', 'certificate']),
        credentials: zod_1.z.record(zod_1.z.any()).optional()
    }).default({ type: 'none' }),
    reconnect: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        maxAttempts: zod_1.z.number().default(5),
        delay: zod_1.z.number().default(1000),
        backoff: zod_1.z.enum(['linear', 'exponential']).default('exponential')
    }).default({}),
    queue: zod_1.z.object({
        name: zod_1.z.string(),
        durable: zod_1.z.boolean().default(true),
        exclusive: zod_1.z.boolean().default(false),
        autoDelete: zod_1.z.boolean().default(false),
        arguments: zod_1.z.record(zod_1.z.any()).optional()
    }).optional()
});
//# sourceMappingURL=types.js.map