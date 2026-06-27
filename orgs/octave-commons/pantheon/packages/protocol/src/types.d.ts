import { z } from 'zod';
export declare const MessageEnvelopeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    sender: z.ZodString;
    recipient: z.ZodString;
    timestamp: z.ZodDate;
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    signature: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    correlationId: z.ZodOptional<z.ZodString>;
    replyTo: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    ttl: z.ZodOptional<z.ZodNumber>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    priority: "low" | "high" | "urgent" | "normal";
    sender: string;
    recipient: string;
    timestamp: Date;
    payload: Record<string, any>;
    maxRetries: number;
    retryCount: number;
    metadata?: Record<string, any> | undefined;
    signature?: string | undefined;
    correlationId?: string | undefined;
    replyTo?: string | undefined;
    ttl?: number | undefined;
}, {
    id: string;
    type: string;
    sender: string;
    recipient: string;
    timestamp: Date;
    payload: Record<string, any>;
    priority?: "low" | "high" | "urgent" | "normal" | undefined;
    metadata?: Record<string, any> | undefined;
    maxRetries?: number | undefined;
    signature?: string | undefined;
    correlationId?: string | undefined;
    replyTo?: string | undefined;
    ttl?: number | undefined;
    retryCount?: number | undefined;
}>;
export declare const TransportConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["amqp", "websocket", "http"]>;
    url: z.ZodString;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    auth: z.ZodDefault<z.ZodObject<{
        type: z.ZodEnum<["none", "basic", "token", "certificate"]>;
        credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "none" | "basic" | "token" | "certificate";
        credentials?: Record<string, any> | undefined;
    }, {
        type: "none" | "basic" | "token" | "certificate";
        credentials?: Record<string, any> | undefined;
    }>>;
    reconnect: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        maxAttempts: z.ZodDefault<z.ZodNumber>;
        delay: z.ZodDefault<z.ZodNumber>;
        backoff: z.ZodDefault<z.ZodEnum<["linear", "exponential"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoff: "linear" | "exponential";
    }, {
        enabled?: boolean | undefined;
        maxAttempts?: number | undefined;
        delay?: number | undefined;
        backoff?: "linear" | "exponential" | undefined;
    }>>;
    queue: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        durable: z.ZodDefault<z.ZodBoolean>;
        exclusive: z.ZodDefault<z.ZodBoolean>;
        autoDelete: z.ZodDefault<z.ZodBoolean>;
        arguments: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        durable: boolean;
        exclusive: boolean;
        autoDelete: boolean;
        arguments?: Record<string, any> | undefined;
    }, {
        name: string;
        durable?: boolean | undefined;
        exclusive?: boolean | undefined;
        autoDelete?: boolean | undefined;
        arguments?: Record<string, any> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "websocket" | "http" | "amqp";
    url: string;
    auth: {
        type: "none" | "basic" | "token" | "certificate";
        credentials?: Record<string, any> | undefined;
    };
    reconnect: {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoff: "linear" | "exponential";
    };
    queue?: {
        name: string;
        durable: boolean;
        exclusive: boolean;
        autoDelete: boolean;
        arguments?: Record<string, any> | undefined;
    } | undefined;
    options?: Record<string, any> | undefined;
}, {
    type: "websocket" | "http" | "amqp";
    url: string;
    queue?: {
        name: string;
        durable?: boolean | undefined;
        exclusive?: boolean | undefined;
        autoDelete?: boolean | undefined;
        arguments?: Record<string, any> | undefined;
    } | undefined;
    options?: Record<string, any> | undefined;
    auth?: {
        type: "none" | "basic" | "token" | "certificate";
        credentials?: Record<string, any> | undefined;
    } | undefined;
    reconnect?: {
        enabled?: boolean | undefined;
        maxAttempts?: number | undefined;
        delay?: number | undefined;
        backoff?: "linear" | "exponential" | undefined;
    } | undefined;
}>;
export type MessageEnvelope = z.infer<typeof MessageEnvelopeSchema>;
export type TransportConfig = z.infer<typeof TransportConfigSchema>;
export interface Transport {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(envelope: MessageEnvelope): Promise<void>;
    subscribe(pattern: string, handler: MessageHandler): Promise<void>;
    unsubscribe(pattern: string): Promise<void>;
    isConnected(): boolean;
}
export type MessageHandler = (envelope: MessageEnvelope) => Promise<void | MessageEnvelope>;
export interface MessageProtocol {
    send(message: Omit<MessageEnvelope, 'id' | 'timestamp' | 'signature'>): Promise<string>;
    sendAndWait(message: Omit<MessageEnvelope, 'id' | 'timestamp' | 'signature'>, timeout?: number): Promise<MessageEnvelope>;
    subscribe(pattern: string, handler: MessageHandler): Promise<void>;
    unsubscribe(pattern: string): Promise<void>;
    signMessage(envelope: MessageEnvelope, secretKey: string): MessageEnvelope;
    verifySignature(envelope: MessageEnvelope, publicKey: string): boolean;
}
export interface RetryPolicy {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoff: 'linear' | 'exponential';
    retryableErrors: string[];
}
export interface DeadLetterQueue {
    addMessage(envelope: MessageEnvelope, error: Error): Promise<void>;
    getMessages(limit?: number): Promise<MessageEnvelope[]>;
    requeue(messageId: string): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
}
export interface MessageMetrics {
    sent: number;
    received: number;
    failed: number;
    retried: number;
    deadLettered: number;
    averageLatency: number;
    lastActivity: Date;
}
export interface ProtocolMetrics {
    getMessageMetrics(): Promise<MessageMetrics>;
    getTransportMetrics(): Promise<Record<string, any>>;
    resetMetrics(): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map