import { BaseTransport } from './transport';
import { TransportConfig, MessageEnvelope, MessageHandler } from './types';
export declare class AMQPTransport extends BaseTransport {
    private connection?;
    private channel?;
    private reconnectTimer?;
    constructor(config: TransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(envelope: MessageEnvelope): Promise<void>;
    protected doSend(envelope: MessageEnvelope): Promise<void>;
    subscribe(pattern: string, handler: MessageHandler): Promise<void>;
    unsubscribe(pattern: string): Promise<void>;
    private setupQueue;
    private getRoutingKey;
    private getQueueName;
    private getPriorityValue;
    private handleReconnect;
}
//# sourceMappingURL=amqp-transport.d.ts.map