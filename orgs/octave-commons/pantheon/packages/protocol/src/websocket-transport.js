"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTransport = void 0;
const ws_1 = __importDefault(require("ws"));
const transport_1 = require("./transport");
class WebSocketTransport extends transport_1.BaseTransport {
    ws;
    server;
    reconnectTimer;
    clients = new Map();
    constructor(config) {
        super(config);
    }
    async connect() {
        try {
            if (this.config.url.startsWith('ws://') || this.config.url.startsWith('wss://')) {
                // Client mode
                await this.connectAsClient();
            }
            else {
                // Server mode
                await this.connectAsServer();
            }
        }
        catch (error) {
            this.emitConnectionEvent('error', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        // Close all client connections
        for (const [, client] of this.clients) {
            client.close();
        }
        this.clients.clear();
        // Close server if in server mode
        if (this.server) {
            this.server.close();
            this.server = undefined;
        }
        // Close client connection if in client mode
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
        this.emitConnectionEvent('disconnected');
    }
    async send(envelope) {
        await this.sendWithRetry(envelope);
    }
    async doSend(envelope) {
        const message = JSON.stringify(envelope);
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            // Client mode - send to server
            this.ws.send(message);
        }
        else if (this.server) {
            // Server mode - send to specific client
            const client = this.clients.get(envelope.recipient);
            if (client && client.readyState === ws_1.default.OPEN) {
                client.send(message);
            }
            else {
                throw new Error(`Client ${envelope.recipient} not connected`);
            }
        }
        else {
            throw new Error('Not connected');
        }
    }
    async subscribe(pattern, handler) {
        this.subscriptions.set(pattern, handler);
    }
    async unsubscribe(pattern) {
        this.subscriptions.delete(pattern);
    }
    async connectAsClient() {
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.config.url);
            this.ws.on('open', () => {
                this.emitConnectionEvent('connected');
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const envelope = JSON.parse(data.toString());
                    this.handleMessage(envelope);
                }
                catch (error) {
                    this.emit('error', error);
                }
            });
            this.ws.on('error', (error) => {
                this.emitConnectionEvent('error', error);
                reject(error);
            });
            this.ws.on('close', () => {
                this.emitConnectionEvent('disconnected');
                this.handleReconnect();
            });
        });
    }
    async connectAsServer() {
        return new Promise((resolve, reject) => {
            const url = new URL(this.config.url);
            const port = parseInt(url.port) || 8080;
            const host = url.hostname || 'localhost';
            this.server = new ws_1.default.Server({
                port,
                host,
                path: url.pathname || '/',
            });
            this.server.on('connection', (ws, req) => {
                const clientId = this.extractClientId(req);
                this.clients.set(clientId, ws);
                ws.on('message', (data) => {
                    try {
                        const envelope = JSON.parse(data.toString());
                        this.handleMessage(envelope);
                    }
                    catch (error) {
                        this.emit('error', error);
                    }
                });
                ws.on('close', () => {
                    this.clients.delete(clientId);
                });
                ws.on('error', (error) => {
                    this.emit('error', error);
                });
            });
            this.server.on('error', (error) => {
                this.emitConnectionEvent('error', error);
                reject(error);
            });
            this.server.on('listening', () => {
                this.emitConnectionEvent('connected');
                resolve();
            });
        });
    }
    extractClientId(req) {
        // Try to get client ID from query parameters or headers
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const clientId = url.searchParams.get('clientId') ||
            req.headers['x-client-id'] ||
            `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return clientId;
    }
    async handleReconnect() {
        if (!this.config.reconnect.enabled) {
            return;
        }
        if (this.reconnectTimer) {
            return; // Already reconnecting
        }
        let attempt = 0;
        const maxAttempts = this.config.reconnect.maxAttempts;
        const baseDelay = this.config.reconnect.delay;
        const tryReconnect = async () => {
            try {
                await this.connect();
                this.reconnectTimer = undefined;
            }
            catch (error) {
                attempt++;
                if (attempt >= maxAttempts) {
                    this.emitConnectionEvent('error', new Error(`Failed to reconnect after ${maxAttempts} attempts`));
                    this.reconnectTimer = undefined;
                    return;
                }
                let delay = baseDelay;
                if (this.config.reconnect.backoff === 'exponential') {
                    delay = baseDelay * Math.pow(2, attempt - 1);
                }
                this.reconnectTimer = setTimeout(tryReconnect, delay);
            }
        };
        // Start reconnection after a short delay
        this.reconnectTimer = setTimeout(tryReconnect, 1000);
    }
    // WebSocket-specific methods
    broadcast(envelope) {
        const message = JSON.stringify(envelope);
        if (this.server) {
            // Server mode - send to all connected clients
            const promises = Array.from(this.clients.values())
                .filter((client) => client.readyState === ws_1.default.OPEN)
                .map((client) => this.sendToClient(client, message));
            return Promise.all(promises).then(() => { });
        }
        else {
            throw new Error('Broadcast only available in server mode');
        }
    }
    sendToClient(client, message) {
        return new Promise((resolve, reject) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(message, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            }
            else {
                reject(new Error('Client not connected'));
            }
        });
    }
    getConnectedClients() {
        return Array.from(this.clients.keys());
    }
    isClientConnected(clientId) {
        const client = this.clients.get(clientId);
        return client ? client.readyState === ws_1.default.OPEN : false;
    }
}
exports.WebSocketTransport = WebSocketTransport;
//# sourceMappingURL=websocket-transport.js.map