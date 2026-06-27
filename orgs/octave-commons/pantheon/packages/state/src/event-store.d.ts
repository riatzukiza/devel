import { ContextEvent, EventStore } from './types.js';
export declare class PostgresEventStore implements EventStore {
    private db;
    private cacheOptions?;
    private cache;
    private cachePromise;
    constructor(db: any, cacheOptions?: any | undefined);
    private initializeCache;
    private getCache;
    appendEvent(event: ContextEvent): Promise<void>;
    getEvents(agentId: string, fromVersion?: number): Promise<ContextEvent[]>;
    getEvent(eventId: string): Promise<ContextEvent | null>;
    private mapRowToEvent;
}
//# sourceMappingURL=event-store.d.ts.map