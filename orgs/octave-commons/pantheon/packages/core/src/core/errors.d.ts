/**
 * Custom error hierarchy for Pantheon adapters
 * Provides structured error handling with proper error types and causes
 */
export declare class AdapterError extends Error {
    readonly cause?: Error;
    readonly adapterType: string;
    readonly retryable: boolean;
    constructor(message: string, adapterType: string, cause?: Error, retryable?: boolean);
    toJSON(): {
        name: string;
        message: string;
        adapterType: string;
        retryable: boolean;
        cause: string | undefined;
        stack: string | undefined;
    };
}
export declare class LLMAdapterError extends AdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class OpenAIAdapterError extends LLMAdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class ClaudeAdapterError extends LLMAdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class ToolAdapterError extends AdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class MCPAdapterError extends ToolAdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class ContextAdapterError extends AdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class PersistenceAdapterError extends ContextAdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class MessageBusAdapterError extends AdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class SchedulerAdapterError extends AdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class ActorStateAdapterError extends AdapterError {
    constructor(message: string, cause?: Error, retryable?: boolean);
}
export declare class ValidationError extends AdapterError {
    readonly validationErrors: string[];
    constructor(message: string, validationErrors: string[], cause?: Error);
}
export declare class ConfigurationError extends AdapterError {
    constructor(message: string, adapterType: string, cause?: Error);
}
export declare class TimeoutError extends AdapterError {
    readonly timeout: number;
    constructor(message: string, timeout: number, adapterType: string, cause?: Error);
}
export declare class RateLimitError extends AdapterError {
    readonly retryAfter?: number;
    constructor(message: string, adapterType: string, retryAfter?: number, cause?: Error);
}
export declare function isAdapterError(error: unknown): error is AdapterError;
export declare function isRetryableError(error: unknown): boolean;
export declare function createAdapterError(message: string, adapterType: string, cause?: Error): AdapterError;
export declare function wrapError(error: unknown, adapterType: string, context?: string): AdapterError;
//# sourceMappingURL=errors.d.ts.map