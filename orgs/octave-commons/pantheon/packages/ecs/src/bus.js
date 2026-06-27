const extractPayload = (event) => typeof event === 'object' && event !== null && 'payload' in event
    ? event.payload
    : undefined;
export class AgentBus {
    broker;
    open = false;
    pending = [];
    handlers = {};
    constructor(broker) {
        this.broker = broker;
        void this.broker.connect().then(() => {
            this.open = true;
            this.pending.forEach((action) => {
                if (action.kind === 'sub') {
                    this.broker.subscribe(action.topic, (evt) => {
                        const payload = extractPayload(evt);
                        const current = this.handlers[action.topic] ?? [];
                        current.forEach((fn) => fn(payload));
                    });
                }
                else if (action.kind === 'pub') {
                    this.broker.publish(action.topic, action.payload);
                }
                else if (action.kind === 'enq') {
                    this.broker.enqueue(action.queue, action.task);
                }
            });
            this.pending = [];
        });
    }
    publish(msg) {
        if (!this.open) {
            this.pending = [...this.pending, { kind: 'pub', topic: msg.topic, payload: msg }];
            return;
        }
        this.broker.publish(msg.topic, msg);
    }
    subscribe(topic, handler) {
        const current = this.handlers[topic] ?? [];
        this.handlers = { ...this.handlers, [topic]: [...current, handler] };
        if (!this.open) {
            this.pending = [
                ...this.pending,
                { kind: 'sub', topic, handler: handler },
            ];
            return;
        }
        this.broker.subscribe(topic, (evt) => {
            const payload = extractPayload(evt);
            const subscribers = this.handlers[topic] ?? [];
            subscribers.forEach((fn) => fn(payload));
        });
    }
    enqueue(queue, task) {
        if (!this.open) {
            this.pending = [...this.pending, { kind: 'enq', queue, task }];
            return;
        }
        this.broker.enqueue(queue, task);
    }
}
//# sourceMappingURL=bus.js.map