/**
 * Agent OS Core Message Protocol - Type Definitions
 *
 * This file contains the complete TypeScript interface definitions
 * for the Agent OS Core Message Protocol.
 */
import { z } from 'zod';
export declare enum MessageType {
    REQUEST = "request",
    RESPONSE = "response",
    EVENT = "event",
    STREAM = "stream",
    HANDSHAKE = "handshake",
    HEARTBEAT = "heartbeat",
    DISCOVERY = "discovery",
    CAPABILITY_NEGOTIATION = "capability_negotiation",
    ERROR = "error",
    TIMEOUT = "timeout",
    CIRCUIT_BREAK = "circuit_break",
    AGENT_REGISTER = "agent_register",
    AGENT_UNREGISTER = "agent_unregister",
    AGENT_STATUS = "agent_status",
    SERVICE_HEALTH = "service_health"
}
export declare enum Priority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}
export declare enum QoSLevel {
    AT_MOST_ONCE = 0,// Fire and forget
    AT_LEAST_ONCE = 1,// Guaranteed delivery
    EXACTLY_ONCE = 2
}
export declare enum TrustLevel {
    UNTRUSTED = "untrusted",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    SYSTEM = "system"
}
export declare enum LoadBalancingStrategy {
    ROUND_ROBIN = "round_robin",
    LEAST_CONNECTIONS = "least_connections",
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin",
    RANDOM = "random",
    CONSISTENT_HASH = "consistent_hash"
}
export declare enum BackoffStrategy {
    FIXED = "fixed",
    LINEAR = "linear",
    EXPONENTIAL = "exponential",
    EXPONENTIAL_WITH_JITTER = "exponential_with_jitter"
}
export interface CoreMessage {
    id: string;
    version: string;
    type: MessageType;
    timestamp: string;
    sender: AgentAddress;
    recipient: AgentAddress;
    replyTo?: AgentAddress;
    correlationId?: string;
    signature?: MessageSignature;
    capabilities: string[];
    token?: string;
    payload: MessagePayload;
    metadata: MessageMetadata;
    headers: Record<string, string>;
    priority: Priority;
    ttl?: number;
    qos: QoSLevel;
    retryPolicy?: RetryPolicy;
    deadline?: string;
    traceId?: string;
    spanId?: string;
}
export interface AgentAddress {
    id: string;
    namespace: string;
    domain: string;
    version?: string;
    endpoint?: string;
}
export interface MessagePayload {
    type: string;
    data: unknown;
    encoding?: string;
    compression?: string;
    size?: number;
    checksum?: string;
}
export interface MessageMetadata {
    source?: string;
    category?: string;
    tags?: string[];
    version?: string;
    schema?: string;
    custom?: Record<string, unknown>;
}
export interface MessageSignature {
    algorithm: 'ES256' | 'RS256' | 'HS256';
    keyId: string;
    signature: string;
    certificate?: string;
    timestamp: string;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: BackoffStrategy;
    initialDelay: number;
    maxDelay: number;
    multiplier?: number;
    jitter?: boolean;
    retryConditions: string[];
    deadLetterQueue?: string;
}
export interface SecurityContext {
    principal: AgentIdentity;
    credentials: Credentials;
    tokenExpiry: string;
    capabilities: Capability[];
    permissions: Permission[];
    roles: string[];
    trustLevel: TrustLevel;
    sandbox: SandboxConfig;
    resourceLimits: ResourceLimits;
}
export interface AgentIdentity {
    id: string;
    type: string;
    namespace: string;
    version: string;
    owner: string;
    metadata: Record<string, unknown>;
}
export interface Credentials {
    type: 'token' | 'certificate' | 'api_key' | 'basic';
    value: string;
    expires?: string;
    issuer?: string;
    scope?: string[];
}
export interface Capability {
    id: string;
    namespace: string;
    actions: string[];
    resources: string[];
    conditions: Condition[];
    expires?: string;
}
export interface Permission {
    resource: string;
    actions: string[];
    conditions: Condition[];
    expires?: string;
}
export interface Condition {
    type: 'time' | 'ip' | 'rate' | 'custom';
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
    value: unknown;
    parameters?: Record<string, unknown>;
}
export interface SandboxConfig {
    enabled: boolean;
    isolation: 'process' | 'container' | 'vm';
    allowedPaths: string[];
    networkAccess: boolean;
    maxMemory?: number;
    maxCpu?: number;
    timeout?: number;
}
export interface ResourceLimits {
    maxMemory: number;
    maxCpu: number;
    maxConnections: number;
    maxMessagesPerSecond: number;
    maxPayloadSize: number;
}
export interface ServiceRegistry {
    register(agent: AgentRegistration): Promise<void>;
    unregister(agentId: string): Promise<void>;
    discover(query: ServiceQuery): Promise<AgentInstance[]>;
    resolve(address: AgentAddress): Promise<AgentEndpoint>;
    healthCheck(agentId: string): Promise<HealthStatus>;
    watchHealth(agentId: string): Promise<Observable<HealthStatus>>;
    listAgents(filter?: AgentFilter): Promise<AgentInstance[]>;
    getAgent(agentId: string): Promise<AgentInstance | null>;
}
export interface AgentRegistration {
    agent: AgentInfo;
    endpoints: Endpoint[];
    capabilities: Capability[];
    healthCheck: HealthCheckConfig;
    loadBalancing: LoadBalancingConfig;
    metadata: Record<string, unknown>;
}
export interface AgentInfo {
    id: string;
    name: string;
    type: string;
    version: string;
    namespace: string;
    domain: string;
    owner: string;
    description?: string;
    tags?: string[];
}
export interface Endpoint {
    id: string;
    type: 'http' | 'websocket' | 'amqp' | 'tcp' | 'udp';
    address: string;
    port?: number;
    path?: string;
    protocol: string;
    secure: boolean;
    metadata: Record<string, unknown>;
}
export interface HealthCheckConfig {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
    endpoint?: string;
    protocol: 'http' | 'tcp' | 'custom';
    expectedStatus?: number;
}
export interface LoadBalancingConfig {
    strategy: LoadBalancingStrategy;
    weight?: number;
    stickySessions?: boolean;
    healthCheckThreshold: number;
}
export interface ServiceQuery {
    type?: string;
    namespace?: string;
    domain?: string;
    capabilities?: string[];
    tags?: string[];
    healthy?: boolean;
    limit?: number;
}
export interface AgentFilter {
    type?: string;
    namespace?: string;
    domain?: string;
    status?: AgentStatus;
    tags?: string[];
}
export interface AgentInstance {
    info: AgentInfo;
    endpoints: Endpoint[];
    capabilities: Capability[];
    status: AgentStatus;
    health: HealthStatus;
    loadBalancing: LoadBalancingConfig;
    registrationTime: string;
    lastHeartbeat: string;
    metadata: Record<string, unknown>;
}
export interface AgentEndpoint {
    instanceId: string;
    endpoint: Endpoint;
    load: number;
    connections: number;
    lastUsed: string;
}
export declare enum AgentStatus {
    STARTING = "starting",
    RUNNING = "running",
    STOPPING = "stopping",
    STOPPED = "stopped",
    ERROR = "error",
    MAINTENANCE = "maintenance"
}
export interface HealthStatus {
    healthy: boolean;
    status: 'healthy' | 'unhealthy' | 'degraded';
    lastCheck: string;
    responseTime?: number;
    error?: string;
    metrics?: HealthMetrics;
}
export interface HealthMetrics {
    cpu: number;
    memory: number;
    connections: number;
    messagesPerSecond: number;
    errorRate: number;
    uptime: number;
}
export interface FlowControl {
    rateLimiter: RateLimiter;
    tokenBucket: TokenBucket;
    backpressureStrategy: BackpressureStrategy;
    bufferSizes: Record<string, number>;
    circuitBreaker: CircuitBreaker;
    bulkhead: Bulkhead;
}
export interface RateLimiter {
    limit: number;
    window: number;
    strategy: 'fixed' | 'sliding';
    currentUsage: number;
    resetTime: number;
}
export interface TokenBucket {
    capacity: number;
    tokens: number;
    refillRate: number;
    lastRefill: number;
}
export declare enum BackpressureStrategy {
    DROP = "drop",
    BUFFER = "buffer",
    REJECT = "reject",
    THROTTLE = "throttle"
}
export interface CircuitBreaker {
    state: 'closed' | 'open' | 'half_open';
    failureThreshold: number;
    recoveryTimeout: number;
    failureCount: number;
    lastFailureTime: number;
}
export interface Bulkhead {
    maxConcurrent: number;
    queueSize: number;
    activeExecutions: number;
    queuedExecutions: number;
}
export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    baggage: Record<string, string>;
    sampled: boolean;
    flags: number;
}
export interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    tags: Record<string, any>;
    logs: LogEntry[];
    status: SpanStatus;
    service: string;
    resource: Record<string, any>;
}
export interface LogEntry {
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, any>;
}
export declare enum SpanStatus {
    OK = "ok",
    ERROR = "error",
    TIMEOUT = "timeout",
    CANCELLED = "cancelled"
}
export interface Metrics {
    messagesSent: Counter;
    messagesReceived: Counter;
    messageLatency: Histogram;
    messageErrors: Counter;
    activeConnections: Gauge;
    queueDepth: Gauge;
    processingTime: Histogram;
    resourceUtilization: Gauge;
    agentInteractions: Counter;
    capabilityUsage: Counter;
    serviceAvailability: Gauge;
}
export interface Counter {
    name: string;
    value: number;
    labels: Record<string, string>;
    timestamp?: number;
}
export interface Gauge {
    name: string;
    value: number;
    labels: Record<string, string>;
    timestamp?: number;
}
export interface Histogram {
    name: string;
    buckets: Record<string, number>;
    count: number;
    sum: number;
    labels: Record<string, string>;
    timestamp?: number;
}
export interface HandshakeRequest {
    protocolVersion: string;
    agentId: string;
    capabilities: string[];
    securityContext: SecurityContext;
    metadata: Record<string, unknown>;
}
export interface HandshakeResponse {
    accepted: boolean;
    protocolVersion: string;
    assignedCapabilities: string[];
    securityContext: SecurityContext;
    connectionId: string;
    serverInfo: ServerInfo;
    reason?: string;
}
export interface ServerInfo {
    version: string;
    capabilities: string[];
    maxConnections: number;
    maxMessageSize: number;
    supportedProtocols: string[];
}
export interface CapabilityNegotiation {
    requested: Capability[];
    offered: Capability[];
    negotiated: Capability[];
    rejected: Capability[];
    reason?: string;
}
export interface Heartbeat {
    timestamp: string;
    sequence: number;
    status: AgentStatus;
    metrics: HealthMetrics;
    capabilities: string[];
}
export interface Transport {
    connect(endpoint: string, options?: ConnectOptions): Promise<Connection>;
    disconnect(connectionId: string): Promise<void>;
    send(message: CoreMessage): Promise<void>;
    receive(): AsyncIterable<CoreMessage>;
    acknowledge(messageId: string): Promise<void>;
    reject(messageId: string, reason: string): Promise<void>;
    setFlowControl(config: FlowControlConfig): void;
    getFlowControlStatus(): FlowControlStatus;
    isConnected(): boolean;
    getConnectionInfo(): ConnectionInfo;
}
export interface Connection {
    id: string;
    endpoint: string;
    state: ConnectionState;
    established: string;
    lastActivity: string;
    messagesSent: number;
    messagesReceived: number;
    bytesTransferred: number;
}
export declare enum ConnectionState {
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTING = "disconnecting",
    DISCONNECTED = "disconnected",
    ERROR = "error"
}
export interface ConnectOptions {
    timeout?: number;
    retryPolicy?: RetryPolicy;
    security?: SecurityOptions;
    compression?: boolean;
    multiplexing?: boolean;
}
export interface SecurityOptions {
    tls?: boolean;
    certificate?: string;
    privateKey?: string;
    caCertificate?: string;
    verifyPeer?: boolean;
}
export interface FlowControlConfig {
    windowSize: number;
    maxMessages: number;
    rateLimit: number;
    backpressure: boolean;
}
export interface FlowControlStatus {
    windowUsed: number;
    queuedMessages: number;
    rateLimited: boolean;
    backpressureActive: boolean;
}
export interface ConnectionInfo {
    id: string;
    endpoint: string;
    protocol: string;
    secure: boolean;
    compression: boolean;
    multiplexing: boolean;
    established: string;
    lastActivity: string;
}
export interface Serializer {
    serialize(message: CoreMessage): Uint8Array;
    deserialize(data: Uint8Array): CoreMessage;
    validate(message: CoreMessage): ValidationResult;
    getSchema(): MessageSchema;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    path: string;
    message: string;
    code: string;
    value?: unknown;
}
export interface ValidationWarning {
    path: string;
    message: string;
    code: string;
    value?: unknown;
}
export interface MessageSchema {
    version: string;
    schema: Record<string, unknown>;
    encoding: string;
    compression?: string;
}
export type Observable<T> = {
    subscribe(observer: (value: T) => void): () => void;
};
export type AsyncIterable<T> = AsyncGenerator<T, void, unknown>;
export interface SelectionContext {
    messageId: string;
    sender: AgentAddress;
    recipient: AgentAddress;
    payload: MessagePayload;
    timestamp: string;
    metadata: Record<string, unknown>;
}
export declare const AgentAddressSchema: z.ZodObject<{
    id: z.ZodString;
    namespace: z.ZodString;
    domain: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    endpoint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    namespace: string;
    domain: string;
    version?: string | undefined;
    endpoint?: string | undefined;
}, {
    id: string;
    namespace: string;
    domain: string;
    version?: string | undefined;
    endpoint?: string | undefined;
}>;
export declare const CoreMessageSchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodString;
    type: z.ZodNativeEnum<typeof MessageType>;
    timestamp: z.ZodString;
    sender: z.ZodObject<{
        id: z.ZodString;
        namespace: z.ZodString;
        domain: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        endpoint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    }, {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    }>;
    recipient: z.ZodObject<{
        id: z.ZodString;
        namespace: z.ZodString;
        domain: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        endpoint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    }, {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    }>;
    replyTo: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        namespace: z.ZodString;
        domain: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        endpoint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    }, {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    }>>;
    correlationId: z.ZodOptional<z.ZodString>;
    signature: z.ZodOptional<z.ZodObject<{
        algorithm: z.ZodEnum<["ES256", "RS256", "HS256"]>;
        keyId: z.ZodString;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        algorithm: "ES256" | "RS256" | "HS256";
        timestamp: string;
        signature: string;
        keyId: string;
        certificate?: string | undefined;
    }, {
        algorithm: "ES256" | "RS256" | "HS256";
        timestamp: string;
        signature: string;
        keyId: string;
        certificate?: string | undefined;
    }>>;
    capabilities: z.ZodArray<z.ZodString, "many">;
    token: z.ZodOptional<z.ZodString>;
    payload: z.ZodObject<{
        type: z.ZodString;
        data: z.ZodUnknown;
        encoding: z.ZodOptional<z.ZodString>;
        compression: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodNumber>;
        checksum: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        data?: unknown;
        encoding?: string | undefined;
        compression?: string | undefined;
        size?: number | undefined;
        checksum?: string | undefined;
    }, {
        type: string;
        data?: unknown;
        encoding?: string | undefined;
        compression?: string | undefined;
        size?: number | undefined;
        checksum?: string | undefined;
    }>;
    metadata: z.ZodObject<{
        source: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        version: z.ZodOptional<z.ZodString>;
        schema: z.ZodOptional<z.ZodString>;
        custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        custom?: Record<string, unknown> | undefined;
        version?: string | undefined;
        source?: string | undefined;
        category?: string | undefined;
        tags?: string[] | undefined;
        schema?: string | undefined;
    }, {
        custom?: Record<string, unknown> | undefined;
        version?: string | undefined;
        source?: string | undefined;
        category?: string | undefined;
        tags?: string[] | undefined;
        schema?: string | undefined;
    }>;
    headers: z.ZodRecord<z.ZodString, z.ZodString>;
    priority: z.ZodNativeEnum<typeof Priority>;
    ttl: z.ZodOptional<z.ZodNumber>;
    qos: z.ZodNativeEnum<typeof QoSLevel>;
    retryPolicy: z.ZodOptional<z.ZodObject<{
        maxAttempts: z.ZodNumber;
        backoffStrategy: z.ZodNativeEnum<typeof BackoffStrategy>;
        initialDelay: z.ZodNumber;
        maxDelay: z.ZodNumber;
        multiplier: z.ZodOptional<z.ZodNumber>;
        jitter: z.ZodOptional<z.ZodBoolean>;
        retryConditions: z.ZodArray<z.ZodString, "many">;
        deadLetterQueue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        maxDelay: number;
        maxAttempts: number;
        initialDelay: number;
        backoffStrategy: BackoffStrategy;
        retryConditions: string[];
        multiplier?: number | undefined;
        jitter?: boolean | undefined;
        deadLetterQueue?: string | undefined;
    }, {
        maxDelay: number;
        maxAttempts: number;
        initialDelay: number;
        backoffStrategy: BackoffStrategy;
        retryConditions: string[];
        multiplier?: number | undefined;
        jitter?: boolean | undefined;
        deadLetterQueue?: string | undefined;
    }>>;
    deadline: z.ZodOptional<z.ZodString>;
    traceId: z.ZodOptional<z.ZodString>;
    spanId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: MessageType;
    priority: Priority;
    metadata: {
        custom?: Record<string, unknown> | undefined;
        version?: string | undefined;
        source?: string | undefined;
        category?: string | undefined;
        tags?: string[] | undefined;
        schema?: string | undefined;
    };
    capabilities: string[];
    sender: {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    };
    recipient: {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    };
    timestamp: string;
    payload: {
        type: string;
        data?: unknown;
        encoding?: string | undefined;
        compression?: string | undefined;
        size?: number | undefined;
        checksum?: string | undefined;
    };
    headers: Record<string, string>;
    version: string;
    qos: QoSLevel;
    token?: string | undefined;
    signature?: {
        algorithm: "ES256" | "RS256" | "HS256";
        timestamp: string;
        signature: string;
        keyId: string;
        certificate?: string | undefined;
    } | undefined;
    correlationId?: string | undefined;
    replyTo?: {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    } | undefined;
    ttl?: number | undefined;
    retryPolicy?: {
        maxDelay: number;
        maxAttempts: number;
        initialDelay: number;
        backoffStrategy: BackoffStrategy;
        retryConditions: string[];
        multiplier?: number | undefined;
        jitter?: boolean | undefined;
        deadLetterQueue?: string | undefined;
    } | undefined;
    deadline?: string | undefined;
    traceId?: string | undefined;
    spanId?: string | undefined;
}, {
    id: string;
    type: MessageType;
    priority: Priority;
    metadata: {
        custom?: Record<string, unknown> | undefined;
        version?: string | undefined;
        source?: string | undefined;
        category?: string | undefined;
        tags?: string[] | undefined;
        schema?: string | undefined;
    };
    capabilities: string[];
    sender: {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    };
    recipient: {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    };
    timestamp: string;
    payload: {
        type: string;
        data?: unknown;
        encoding?: string | undefined;
        compression?: string | undefined;
        size?: number | undefined;
        checksum?: string | undefined;
    };
    headers: Record<string, string>;
    version: string;
    qos: QoSLevel;
    token?: string | undefined;
    signature?: {
        algorithm: "ES256" | "RS256" | "HS256";
        timestamp: string;
        signature: string;
        keyId: string;
        certificate?: string | undefined;
    } | undefined;
    correlationId?: string | undefined;
    replyTo?: {
        id: string;
        namespace: string;
        domain: string;
        version?: string | undefined;
        endpoint?: string | undefined;
    } | undefined;
    ttl?: number | undefined;
    retryPolicy?: {
        maxDelay: number;
        maxAttempts: number;
        initialDelay: number;
        backoffStrategy: BackoffStrategy;
        retryConditions: string[];
        multiplier?: number | undefined;
        jitter?: boolean | undefined;
        deadLetterQueue?: string | undefined;
    } | undefined;
    deadline?: string | undefined;
    traceId?: string | undefined;
    spanId?: string | undefined;
}>;
export type ValidatedCoreMessage = z.infer<typeof CoreMessageSchema>;
//# sourceMappingURL=types.d.ts.map