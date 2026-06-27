/**
 * Custom error hierarchy for Pantheon adapters
 * Provides structured error handling with proper error types and causes
 */
// Base adapter error
export class AdapterError extends Error {
    cause;
    adapterType;
    retryable;
    constructor(message, adapterType, cause, retryable = false) {
        super(message);
        this.name = 'AdapterError';
        this.adapterType = adapterType;
        this.cause = cause;
        this.retryable = retryable;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            adapterType: this.adapterType,
            retryable: this.retryable,
            cause: this.cause?.message,
            stack: this.stack,
        };
    }
}
// LLM Adapter Errors
export class LLMAdapterError extends AdapterError {
    constructor(message, cause, retryable = false) {
        super(message, 'LLM', cause, retryable);
        this.name = 'LLMAdapterError';
    }
}
export class OpenAIAdapterError extends LLMAdapterError {
    constructor(message, cause, retryable = false) {
        super(message, cause, retryable);
        this.name = 'OpenAIAdapterError';
    }
}
export class ClaudeAdapterError extends LLMAdapterError {
    constructor(message, cause, retryable = false) {
        super(message, cause, retryable);
        this.name = 'ClaudeAdapterError';
    }
}
// Tool Adapter Errors
export class ToolAdapterError extends AdapterError {
    constructor(message, cause, retryable = false) {
        super(message, 'Tool', cause, retryable);
        this.name = 'ToolAdapterError';
    }
}
export class MCPAdapterError extends ToolAdapterError {
    constructor(message, cause, retryable = false) {
        super(message, cause, retryable);
        this.name = 'MCPAdapterError';
    }
}
// Context Adapter Errors
export class ContextAdapterError extends AdapterError {
    constructor(message, cause, retryable = false) {
        super(message, 'Context', cause, retryable);
        this.name = 'ContextAdapterError';
    }
}
export class PersistenceAdapterError extends ContextAdapterError {
    constructor(message, cause, retryable = false) {
        super(message, cause, retryable);
        this.name = 'PersistenceAdapterError';
    }
}
// Message Bus Adapter Errors
export class MessageBusAdapterError extends AdapterError {
    constructor(message, cause, retryable = false) {
        super(message, 'MessageBus', cause, retryable);
        this.name = 'MessageBusAdapterError';
    }
}
// Scheduler Adapter Errors
export class SchedulerAdapterError extends AdapterError {
    constructor(message, cause, retryable = false) {
        super(message, 'Scheduler', cause, retryable);
        this.name = 'SchedulerAdapterError';
    }
}
// Actor State Adapter Errors
export class ActorStateAdapterError extends AdapterError {
    constructor(message, cause, retryable = false) {
        super(message, 'ActorState', cause, retryable);
        this.name = 'ActorStateAdapterError';
    }
}
// Validation Errors
export class ValidationError extends AdapterError {
    validationErrors;
    constructor(message, validationErrors, cause) {
        super(message, 'Validation', cause, false);
        this.name = 'ValidationError';
        this.validationErrors = validationErrors;
    }
}
// Configuration Errors
export class ConfigurationError extends AdapterError {
    constructor(message, adapterType, cause) {
        super(message, adapterType, cause, false);
        this.name = 'ConfigurationError';
    }
}
// Timeout Errors
export class TimeoutError extends AdapterError {
    timeout;
    constructor(message, timeout, adapterType, cause) {
        super(message, adapterType, cause, true);
        this.name = 'TimeoutError';
        this.timeout = timeout;
    }
}
// Rate Limit Errors
export class RateLimitError extends AdapterError {
    retryAfter;
    constructor(message, adapterType, retryAfter, cause) {
        super(message, adapterType, cause, true);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
// Utility functions for error handling
export function isAdapterError(error) {
    return error instanceof AdapterError;
}
export function isRetryableError(error) {
    if (isAdapterError(error)) {
        return error.retryable;
    }
    return false;
}
export function createAdapterError(message, adapterType, cause) {
    return new AdapterError(message, adapterType, cause);
}
export function wrapError(error, adapterType, context) {
    const message = error instanceof Error ? error.message : String(error);
    const fullMessage = context ? `${context}: ${message}` : message;
    const cause = error instanceof Error ? error : new Error(String(error));
    return new AdapterError(fullMessage, adapterType, cause);
}
//# sourceMappingURL=errors.js.map