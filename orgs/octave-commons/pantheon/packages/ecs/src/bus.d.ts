type BrokerClient = {
    connect(): Promise<void>;
    publish(topic: string, payload: unknown): unknown;
    subscribe(topic: string, handler: (evt: unknown) => void): unknown;
    enqueue(queue: string, task: unknown): unknown;
};
type Handler<T> = (msg: T) => void;
type BusMessage = {
    readonly topic: string;
} & Record<string, unknown>;
export declare class AgentBus {
    private readonly broker;
    private open;
    private pending;
    private handlers;
    constructor(broker: BrokerClient);
    publish<T extends BusMessage>(msg: T): void;
    subscribe<T>(topic: string, handler: Handler<T>): void;
    enqueue(queue: string, task: unknown): void;
}
export {};
//# sourceMappingURL=bus.d.ts.map