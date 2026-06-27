"use strict";
/**
 * Agent OS Core Message Protocol - Type Definitions
 *
 * This file contains the complete TypeScript interface definitions
 * for the Agent OS Core Message Protocol.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreMessageSchema = exports.AgentAddressSchema = exports.ConnectionState = exports.SpanStatus = exports.BackpressureStrategy = exports.AgentStatus = exports.BackoffStrategy = exports.LoadBalancingStrategy = exports.TrustLevel = exports.QoSLevel = exports.Priority = exports.MessageType = void 0;
const zod_1 = require("zod");
// ============================================================================
// Core Message Types
// ============================================================================
var MessageType;
(function (MessageType) {
    // Core Communication
    MessageType["REQUEST"] = "request";
    MessageType["RESPONSE"] = "response";
    MessageType["EVENT"] = "event";
    MessageType["STREAM"] = "stream";
    // Protocol Management
    MessageType["HANDSHAKE"] = "handshake";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["DISCOVERY"] = "discovery";
    MessageType["CAPABILITY_NEGOTIATION"] = "capability_negotiation";
    // Error Handling
    MessageType["ERROR"] = "error";
    MessageType["TIMEOUT"] = "timeout";
    MessageType["CIRCUIT_BREAK"] = "circuit_break";
    // Lifecycle Management
    MessageType["AGENT_REGISTER"] = "agent_register";
    MessageType["AGENT_UNREGISTER"] = "agent_unregister";
    MessageType["AGENT_STATUS"] = "agent_status";
    MessageType["SERVICE_HEALTH"] = "service_health";
})(MessageType || (exports.MessageType = MessageType = {}));
var Priority;
(function (Priority) {
    Priority[Priority["LOW"] = 0] = "LOW";
    Priority[Priority["NORMAL"] = 1] = "NORMAL";
    Priority[Priority["HIGH"] = 2] = "HIGH";
    Priority[Priority["CRITICAL"] = 3] = "CRITICAL";
})(Priority || (exports.Priority = Priority = {}));
var QoSLevel;
(function (QoSLevel) {
    QoSLevel[QoSLevel["AT_MOST_ONCE"] = 0] = "AT_MOST_ONCE";
    QoSLevel[QoSLevel["AT_LEAST_ONCE"] = 1] = "AT_LEAST_ONCE";
    QoSLevel[QoSLevel["EXACTLY_ONCE"] = 2] = "EXACTLY_ONCE";
})(QoSLevel || (exports.QoSLevel = QoSLevel = {}));
var TrustLevel;
(function (TrustLevel) {
    TrustLevel["UNTRUSTED"] = "untrusted";
    TrustLevel["LOW"] = "low";
    TrustLevel["MEDIUM"] = "medium";
    TrustLevel["HIGH"] = "high";
    TrustLevel["SYSTEM"] = "system";
})(TrustLevel || (exports.TrustLevel = TrustLevel = {}));
var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_CONNECTIONS"] = "least_connections";
    LoadBalancingStrategy["WEIGHTED_ROUND_ROBIN"] = "weighted_round_robin";
    LoadBalancingStrategy["RANDOM"] = "random";
    LoadBalancingStrategy["CONSISTENT_HASH"] = "consistent_hash";
})(LoadBalancingStrategy || (exports.LoadBalancingStrategy = LoadBalancingStrategy = {}));
var BackoffStrategy;
(function (BackoffStrategy) {
    BackoffStrategy["FIXED"] = "fixed";
    BackoffStrategy["LINEAR"] = "linear";
    BackoffStrategy["EXPONENTIAL"] = "exponential";
    BackoffStrategy["EXPONENTIAL_WITH_JITTER"] = "exponential_with_jitter";
})(BackoffStrategy || (exports.BackoffStrategy = BackoffStrategy = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["STARTING"] = "starting";
    AgentStatus["RUNNING"] = "running";
    AgentStatus["STOPPING"] = "stopping";
    AgentStatus["STOPPED"] = "stopped";
    AgentStatus["ERROR"] = "error";
    AgentStatus["MAINTENANCE"] = "maintenance";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var BackpressureStrategy;
(function (BackpressureStrategy) {
    BackpressureStrategy["DROP"] = "drop";
    BackpressureStrategy["BUFFER"] = "buffer";
    BackpressureStrategy["REJECT"] = "reject";
    BackpressureStrategy["THROTTLE"] = "throttle";
})(BackpressureStrategy || (exports.BackpressureStrategy = BackpressureStrategy = {}));
var SpanStatus;
(function (SpanStatus) {
    SpanStatus["OK"] = "ok";
    SpanStatus["ERROR"] = "error";
    SpanStatus["TIMEOUT"] = "timeout";
    SpanStatus["CANCELLED"] = "cancelled";
})(SpanStatus || (exports.SpanStatus = SpanStatus = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["CONNECTING"] = "connecting";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["DISCONNECTING"] = "disconnecting";
    ConnectionState["DISCONNECTED"] = "disconnected";
    ConnectionState["ERROR"] = "error";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
exports.AgentAddressSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    namespace: zod_1.z.string().min(1),
    domain: zod_1.z.string().min(1),
    version: zod_1.z.string().optional(),
    endpoint: zod_1.z.string().url().optional(),
});
exports.CoreMessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    version: zod_1.z.string().regex(/^\d+\.\d+\.\d+$/),
    type: zod_1.z.nativeEnum(MessageType),
    timestamp: zod_1.z.string().datetime(),
    sender: exports.AgentAddressSchema,
    recipient: exports.AgentAddressSchema,
    replyTo: exports.AgentAddressSchema.optional(),
    correlationId: zod_1.z.string().uuid().optional(),
    signature: zod_1.z
        .object({
        algorithm: zod_1.z.enum(['ES256', 'RS256', 'HS256']),
        keyId: zod_1.z.string(),
        signature: zod_1.z.string(),
        certificate: zod_1.z.string().optional(),
        timestamp: zod_1.z.string().datetime(),
    })
        .optional(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    token: zod_1.z.string().optional(),
    payload: zod_1.z.object({
        type: zod_1.z.string(),
        data: zod_1.z.unknown(),
        encoding: zod_1.z.string().optional(),
        compression: zod_1.z.string().optional(),
        size: zod_1.z.number().nonnegative().optional(),
        checksum: zod_1.z.string().optional(),
    }),
    metadata: zod_1.z.object({
        source: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        version: zod_1.z.string().optional(),
        schema: zod_1.z.string().optional(),
        custom: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
    headers: zod_1.z.record(zod_1.z.string()),
    priority: zod_1.z.nativeEnum(Priority),
    ttl: zod_1.z.number().positive().optional(),
    qos: zod_1.z.nativeEnum(QoSLevel),
    retryPolicy: zod_1.z
        .object({
        maxAttempts: zod_1.z.number().positive(),
        backoffStrategy: zod_1.z.nativeEnum(BackoffStrategy),
        initialDelay: zod_1.z.number().positive(),
        maxDelay: zod_1.z.number().positive(),
        multiplier: zod_1.z.number().positive().optional(),
        jitter: zod_1.z.boolean().optional(),
        retryConditions: zod_1.z.array(zod_1.z.string()),
        deadLetterQueue: zod_1.z.string().optional(),
    })
        .optional(),
    deadline: zod_1.z.string().datetime().optional(),
    traceId: zod_1.z.string().optional(),
    spanId: zod_1.z.string().optional(),
});
//# sourceMappingURL=types.js.map