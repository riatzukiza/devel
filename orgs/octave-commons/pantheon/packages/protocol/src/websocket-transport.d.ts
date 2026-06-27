import { BaseTransport } from './transport';
import { TransportConfig, MessageEnvelope, MessageHandler } from './types';
export declare class WebSocketTransport extends BaseTransport {
    private ws?;
    private server?;
    private reconnectTimer?;
    private clients;
    constructor(config: TransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(envelope: MessageEnvelope): Promise<void>;
    protected doSend(envelope: MessageEnvelope): Promise<void>;
    subscribe(pattern: string, handler: MessageHandler): Promise<void>;
    unsubscribe(pattern: string): Promise<void>;
    private connectAsClient;
    private connectAsServer;
    private extractClientId;
    private handleReconnect;
    broadcast(envelope: MessageEnvelope): Promise<void>;
    private sendToClient;
    getConnectedClients(): string[];
    isClientConnected(clientId: string): boolean;
}
//# sourceMappingURL=websocket-transport.d.ts.map