import { Transport, TransportConfig, MessageEnvelope, MessageHandler, RetryPolicy, DeadLetterQueue } from './types';
import { EventEmitter } from 'events';
export declare abstract class BaseTransport extends EventEmitter implements Transport {
    protected config: TransportConfig;
    protected connected: boolean;
    protected subscriptions: Map<string, MessageHandler>;
    protected retryPolicy: RetryPolicy;
    protected deadLetterQueue?: DeadLetterQueue;
    constructor(config: TransportConfig);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract send(envelope: MessageEnvelope): Promise<void>;
    abstract subscribe(pattern: string, handler: MessageHandler): Promise<void>;
    abstract unsubscribe(pattern: string): Promise<void>;
    isConnected(): boolean;
    protected sendWithRetry(envelope: MessageEnvelope): Promise<void>;
    protected abstract doSend(envelope: MessageEnvelope): Promise<void>;
    protected isRetryableError(error: Error): boolean;
    protected calculateRetryDelay(attempt: number): number;
    protected sleep(ms: number): Promise<void>;
    protected handleMessage(envelope: MessageEnvelope): void;
    protected findHandler(envelope: MessageEnvelope): MessageHandler | null;
    protected matchesPattern(messageType: string, pattern: string): boolean;
    protected executeHandler(handler: MessageHandler, envelope: MessageEnvelope): Promise<void>;
    setRetryPolicy(policy: Partial<RetryPolicy>): void;
    setDeadLetterQueue(dlq: DeadLetterQueue): void;
    protected emitConnectionEvent(event: 'connected' | 'disconnected' | 'error', data?: any): void;
}
export declare class MemoryDeadLetterQueue implements DeadLetterQueue {
    private messages;
    addMessage(envelope: MessageEnvelope, error: Error): Promise<void>;
    getMessages(limit?: number): Promise<MessageEnvelope[]>;
    requeue(messageId: string): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
    clear(): Promise<void>;
    getSize(): number;
}
//# sourceMappingURL=transport.d.ts.map