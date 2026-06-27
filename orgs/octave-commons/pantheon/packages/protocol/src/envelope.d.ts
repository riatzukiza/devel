import { MessageEnvelope } from './types';
export declare class EnvelopeBuilder {
    private envelope;
    constructor(type: string, sender: string, recipient: string);
    withPayload(payload: Record<string, any>): EnvelopeBuilder;
    withCorrelationId(correlationId: string): EnvelopeBuilder;
    withReplyTo(replyTo: string): EnvelopeBuilder;
    withPriority(priority: 'low' | 'normal' | 'high' | 'urgent'): EnvelopeBuilder;
    withTTL(ttl: number): EnvelopeBuilder;
    withMaxRetries(maxRetries: number): EnvelopeBuilder;
    withMetadata(metadata: Record<string, any>): EnvelopeBuilder;
    build(): MessageEnvelope;
}
export declare class MessageSigner {
    static signMessage(envelope: MessageEnvelope, secretKey: string): MessageEnvelope;
    static verifySignature(envelope: MessageEnvelope, publicKey: string): boolean;
    static generateKeyPair(): {
        publicKey: string;
        privateKey: string;
    };
}
export declare class MessageValidator {
    static validateEnvelope(envelope: MessageEnvelope): {
        valid: boolean;
        errors: string[];
    };
    static sanitizeEnvelope(envelope: MessageEnvelope): MessageEnvelope;
}
//# sourceMappingURL=envelope.d.ts.map