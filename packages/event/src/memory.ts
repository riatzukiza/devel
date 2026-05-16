// In-memory EventBus implementation that conforms to ./types
import type {
  EventBus,
  EventRecord,
  PublishOptions,
  SubscribeOptions,
  Handler,
  CursorPosition,
  EventStore,
  CursorStore,
  Ack,
  DeliveryContext,
  UUID,
} from './types.js';
import { randomUUID } from 'node:crypto';

function getSubscriptionKey(topic: string, group: string): string {
  return `${topic}:${group}`;
}

function getCursorKey(topic: string, group: string): string {
  return `${topic}:${group}`;
}

export class InMemoryEventBus implements EventBus {
  private readonly events = new Map<string, EventRecord[]>();
  private readonly cursors = new Map<string, CursorPosition>();
  private readonly subscriptions = new Map<string, Array<{ handler: Handler; opts: SubscribeOptions }>>();
  private readonly groupIndices = new Map<string, number>();

  constructor(
    private store?: EventStore,
    private cursorStore?: CursorStore,
  ) {}

  async publish<T>(topic: string, payload: T, opts: PublishOptions = {}): Promise<EventRecord<T>> {
    const event: EventRecord<T> = {
      id: opts.id || randomUUID(),
      ts: opts.ts || Date.now(),
      topic,
      payload,
      key: opts.key,
      headers: opts.headers,
      tags: opts.tags,
      caused_by: opts.caused_by,
      sid: opts.sid,
    };

    // Store event
    if (!this.events.has(topic)) {
      this.events.set(topic, []);
    }
    this.events.get(topic)!.push(event);

    // Persist to store if provided
    if (this.store) {
      await this.store.insert(event);
    }

    // Notify subscribers - correctly handling consumer groups
    const groupEntries = Array.from(this.subscriptions.entries())
      .filter(([key]) => key.startsWith(`${topic}:`));

    for (const [groupKey, allSubs] of groupEntries) {
      const matchingSubs = allSubs.filter(s => !s.opts.filter || s.opts.filter(event));
      if (matchingSubs.length === 0) continue;

      // Round-robin selection within the group of matching handlers
      const index = this.groupIndices.get(groupKey) || 0;
      const sub = matchingSubs[index % matchingSubs.length];
      
      this.groupIndices.set(groupKey, (index + 1) % matchingSubs.length);

      const ctx: DeliveryContext = {
        attempt: 1,
        maxAttempts: sub.opts.maxAttempts || 5,
      };

      // Fire and forget for in-memory implementation
      sub.handler(event, ctx).catch((err) => {
        console.error('Event handler error:', err);
      });
    }

    return event;
  }

  async subscribe(
    topic: string,
    group: string,
    handler: Handler,
    opts: Omit<SubscribeOptions, 'group'> = {},
  ): Promise<() => Promise<void>> {
    const key = getSubscriptionKey(topic, group);

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }

    const subscription = { handler, opts: { ...opts, group } as SubscribeOptions };
    this.subscriptions.get(key)!.push(subscription);

    // Return unsubscribe function
    return async () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  async ack(_topic: string, _group: string, id: UUID): Promise<Ack> {
    return { id, ok: true };
  }

  async nack(_topic: string, _group: string, id: UUID, reason?: string): Promise<Ack> {
    return { id, ok: false, err: reason };
  }

  async getCursor(topic: string, group: string): Promise<CursorPosition | null> {
    const key = getCursorKey(topic, group);

    if (this.cursorStore) {
      return await this.cursorStore.get(topic, group);
    }

    return this.cursors.get(key) || null;
  }

  async setCursor(topic: string, group: string, cursor: CursorPosition): Promise<void> {
    const key = getCursorKey(topic, group);

    if (this.cursorStore) {
      await this.cursorStore.set(topic, group, cursor);
    }

    this.cursors.set(key, cursor);
  }
}
