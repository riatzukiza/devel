"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryDeadLetterQueue = exports.BaseTransport = void 0;
const events_1 = require("events");
class BaseTransport extends events_1.EventEmitter {
    config;
    connected = false;
    subscriptions = new Map();
    retryPolicy;
    deadLetterQueue;
    constructor(config) {
        super();
        this.config = config;
        this.retryPolicy = {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 30000,
            backoff: 'exponential',
            retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'],
        };
    }
    isConnected() {
        return this.connected;
    }
    async sendWithRetry(envelope) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.retryPolicy.maxRetries; attempt++) {
            try {
                await this.doSend(envelope);
                return;
            }
            catch (error) {
                lastError = error;
                if (attempt === this.retryPolicy.maxRetries) {
                    break;
                }
                if (!this.isRetryableError(lastError)) {
                    break;
                }
                const delay = this.calculateRetryDelay(attempt);
                await this.sleep(delay);
            }
        }
        // All retries failed, add to dead letter queue if available
        if (this.deadLetterQueue && lastError) {
            await this.deadLetterQueue.addMessage(envelope, lastError);
        }
        throw lastError || new Error('Failed to send message after all retries');
    }
    isRetryableError(error) {
        return this.retryPolicy.retryableErrors.some((retryableError) => error.message.includes(retryableError) || error.name.includes(retryableError));
    }
    calculateRetryDelay(attempt) {
        let delay;
        if (this.retryPolicy.backoff === 'exponential') {
            delay = this.retryPolicy.initialDelay * Math.pow(2, attempt);
        }
        else {
            delay = this.retryPolicy.initialDelay * (attempt + 1);
        }
        return Math.min(delay, this.retryPolicy.maxDelay);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    handleMessage(envelope) {
        const handler = this.findHandler(envelope);
        if (handler) {
            this.executeHandler(handler, envelope).catch((error) => {
                this.emit('handlerError', { envelope, error });
            });
        }
        else {
            this.emit('noHandler', { envelope });
        }
    }
    findHandler(envelope) {
        // Try exact match first
        const exactHandler = this.subscriptions.get(envelope.type);
        if (exactHandler) {
            return exactHandler;
        }
        // Try pattern matching
        for (const [pattern, handler] of this.subscriptions) {
            if (this.matchesPattern(envelope.type, pattern)) {
                return handler;
            }
        }
        return null;
    }
    matchesPattern(messageType, pattern) {
        // Simple glob-like pattern matching
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(messageType);
    }
    async executeHandler(handler, envelope) {
        try {
            const result = await handler(envelope);
            // If handler returns a message, send it as a reply
            if (result && envelope.replyTo) {
                await this.send(result);
            }
        }
        catch (error) {
            this.emit('handlerError', { envelope, error });
            throw error;
        }
    }
    setRetryPolicy(policy) {
        this.retryPolicy = { ...this.retryPolicy, ...policy };
    }
    setDeadLetterQueue(dlq) {
        this.deadLetterQueue = dlq;
    }
    emitConnectionEvent(event, data) {
        this.connected = event === 'connected';
        this.emit(event, data);
    }
}
exports.BaseTransport = BaseTransport;
class MemoryDeadLetterQueue {
    messages = [];
    async addMessage(envelope, error) {
        this.messages.push({
            envelope,
            error,
            timestamp: new Date(),
        });
    }
    async getMessages(limit = 100) {
        return this.messages.slice(-limit).map((item) => item.envelope);
    }
    async requeue(messageId) {
        const index = this.messages.findIndex((item) => item.envelope.id === messageId);
        if (index !== -1) {
            this.messages.splice(index, 1);
            // In a real implementation, you would requeue the message
            // For now, we just remove it from the DLQ
            console.log(`Requeuing message ${messageId}`);
        }
    }
    async deleteMessage(messageId) {
        const index = this.messages.findIndex((item) => item.envelope.id === messageId);
        if (index !== -1) {
            this.messages.splice(index, 1);
        }
    }
    async clear() {
        this.messages = [];
    }
    getSize() {
        return this.messages.length;
    }
}
exports.MemoryDeadLetterQueue = MemoryDeadLetterQueue;
//# sourceMappingURL=transport.js.map