"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidator = exports.MessageSigner = exports.EnvelopeBuilder = void 0;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
class EnvelopeBuilder {
    envelope = {};
    constructor(type, sender, recipient) {
        this.envelope = {
            type,
            sender,
            recipient,
            timestamp: new Date(),
            priority: 'normal',
            retryCount: 0,
            maxRetries: 3
        };
    }
    withPayload(payload) {
        this.envelope.payload = payload;
        return this;
    }
    withCorrelationId(correlationId) {
        this.envelope.correlationId = correlationId;
        return this;
    }
    withReplyTo(replyTo) {
        this.envelope.replyTo = replyTo;
        return this;
    }
    withPriority(priority) {
        this.envelope.priority = priority;
        return this;
    }
    withTTL(ttl) {
        this.envelope.ttl = ttl;
        return this;
    }
    withMaxRetries(maxRetries) {
        this.envelope.maxRetries = maxRetries;
        return this;
    }
    withMetadata(metadata) {
        this.envelope.metadata = metadata;
        return this;
    }
    build() {
        const envelope = {
            id: (0, uuid_1.v4)(),
            ...this.envelope
        };
        // Validate required fields
        if (!envelope.payload) {
            throw new Error('Message payload is required');
        }
        return envelope;
    }
}
exports.EnvelopeBuilder = EnvelopeBuilder;
class MessageSigner {
    static signMessage(envelope, secretKey) {
        const messageData = {
            id: envelope.id,
            type: envelope.type,
            sender: envelope.sender,
            recipient: envelope.recipient,
            timestamp: envelope.timestamp.toISOString(),
            payload: envelope.payload
        };
        const messageString = JSON.stringify(messageData);
        const signature = crypto_1.default
            .createHmac('sha256', secretKey)
            .update(messageString)
            .digest('hex');
        return {
            ...envelope,
            signature
        };
    }
    static verifySignature(envelope, publicKey) {
        if (!envelope.signature) {
            return false;
        }
        try {
            const messageData = {
                id: envelope.id,
                type: envelope.type,
                sender: envelope.sender,
                recipient: envelope.recipient,
                timestamp: envelope.timestamp.toISOString(),
                payload: envelope.payload
            };
            const messageString = JSON.stringify(messageData);
            const expectedSignature = crypto_1.default
                .createHmac('sha256', publicKey)
                .update(messageString)
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(envelope.signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        }
        catch (error) {
            return false;
        }
    }
    static generateKeyPair() {
        const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        return { publicKey, privateKey };
    }
}
exports.MessageSigner = MessageSigner;
class MessageValidator {
    static validateEnvelope(envelope) {
        const errors = [];
        if (!envelope.id || typeof envelope.id !== 'string') {
            errors.push('Message ID is required and must be a string');
        }
        if (!envelope.type || typeof envelope.type !== 'string') {
            errors.push('Message type is required and must be a string');
        }
        if (!envelope.sender || typeof envelope.sender !== 'string') {
            errors.push('Sender is required and must be a string');
        }
        if (!envelope.recipient || typeof envelope.recipient !== 'string') {
            errors.push('Recipient is required and must be a string');
        }
        if (!envelope.timestamp || !(envelope.timestamp instanceof Date)) {
            errors.push('Timestamp is required and must be a Date');
        }
        if (!envelope.payload || typeof envelope.payload !== 'object') {
            errors.push('Payload is required and must be an object');
        }
        if (envelope.ttl !== undefined && (typeof envelope.ttl !== 'number' || envelope.ttl <= 0)) {
            errors.push('TTL must be a positive number');
        }
        if (envelope.retryCount < 0) {
            errors.push('Retry count cannot be negative');
        }
        if (envelope.maxRetries < 0) {
            errors.push('Max retries cannot be negative');
        }
        // Check if message has expired
        if (envelope.ttl && envelope.timestamp) {
            const now = new Date();
            const expiryTime = new Date(envelope.timestamp.getTime() + envelope.ttl);
            if (now > expiryTime) {
                errors.push('Message has expired');
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    static sanitizeEnvelope(envelope) {
        return {
            ...envelope,
            metadata: envelope.metadata || {},
            payload: envelope.payload || {}
        };
    }
}
exports.MessageValidator = MessageValidator;
//# sourceMappingURL=envelope.js.map