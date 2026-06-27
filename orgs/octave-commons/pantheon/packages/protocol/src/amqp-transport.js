"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AMQPTransport = void 0;
const amqp = __importStar(require("amqplib"));
const transport_1 = require("./transport");
class AMQPTransport extends transport_1.BaseTransport {
    connection;
    channel;
    reconnectTimer;
    constructor(config) {
        super(config);
    }
    async connect() {
        try {
            this.connection = await amqp.connect(this.config.url, this.config.options);
            if (this.connection) {
                this.channel = await this.connection.createChannel();
            }
            // Setup error handlers
            if (this.connection) {
                this.connection.on('error', (error) => {
                    this.emitConnectionEvent('error', error);
                    this.handleReconnect();
                });
                this.connection.on('close', () => {
                    this.emitConnectionEvent('disconnected');
                    this.handleReconnect();
                });
            }
            if (this.channel) {
                this.channel.on('error', (error) => {
                    this.emitConnectionEvent('error', error);
                });
            }
            // Setup queue if specified
            if (this.config.queue) {
                await this.setupQueue();
            }
            this.emitConnectionEvent('connected');
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
        if (this.channel) {
            await this.channel.close();
            this.channel = undefined;
        }
        if (this.connection) {
            await this.connection.close();
            this.connection = undefined;
        }
        this.emitConnectionEvent('disconnected');
    }
    async send(envelope) {
        await this.sendWithRetry(envelope);
    }
    async doSend(envelope) {
        if (!this.channel) {
            throw new Error('Not connected to AMQP server');
        }
        const routingKey = this.getRoutingKey(envelope);
        const message = Buffer.from(JSON.stringify(envelope));
        const options = {
            messageId: envelope.id,
            timestamp: Math.floor(envelope.timestamp.getTime() / 1000),
            headers: {
                type: envelope.type,
                sender: envelope.sender,
                recipient: envelope.recipient,
                correlationId: envelope.correlationId,
                replyTo: envelope.replyTo,
                priority: this.getPriorityValue(envelope.priority),
                ttl: envelope.ttl,
            },
            persistent: true,
            mandatory: true,
        };
        await this.channel.publish('', routingKey, message, options);
    }
    async subscribe(pattern, handler) {
        if (!this.channel) {
            throw new Error('Not connected to AMQP server');
        }
        // Store handler
        this.subscriptions.set(pattern, handler);
        // Setup queue and binding
        const queueName = this.getQueueName(pattern);
        await this.channel.assertQueue(queueName, {
            durable: true,
            arguments: {
                'x-message-ttl': 60000, // 1 minute TTL
            },
        });
        // Bind to routing key pattern
        await this.channel.bindQueue(queueName, '', pattern);
        // Start consuming
        await this.channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const envelope = JSON.parse(msg.content.toString());
                    this.handleMessage(envelope);
                    this.channel?.ack(msg);
                }
                catch (error) {
                    this.emit('handlerError', { error, message: msg });
                    this.channel?.nack(msg, false, false); // Reject and don't requeue
                }
            }
        });
    }
    async unsubscribe(pattern) {
        this.subscriptions.delete(pattern);
        if (this.channel) {
            const queueName = this.getQueueName(pattern);
            await this.channel.deleteQueue(queueName);
        }
    }
    async setupQueue() {
        if (!this.channel || !this.config.queue) {
            return;
        }
        await this.channel.assertQueue(this.config.queue.name, {
            durable: this.config.queue.durable,
            exclusive: this.config.queue.exclusive,
            autoDelete: this.config.queue.autoDelete,
            arguments: this.config.queue.arguments,
        });
    }
    getRoutingKey(envelope) {
        // Use recipient as routing key, or fallback to message type
        return envelope.recipient || envelope.type;
    }
    getQueueName(pattern) {
        return `agent-protocol-${pattern}`;
    }
    getPriorityValue(priority) {
        switch (priority) {
            case 'urgent':
                return 5;
            case 'high':
                return 4;
            case 'normal':
                return 3;
            case 'low':
                return 2;
            default:
                return 3;
        }
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
}
exports.AMQPTransport = AMQPTransport;
//# sourceMappingURL=amqp-transport.js.map