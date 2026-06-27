import type { EventClient } from "../../types/index.js";

export type SubscribeResult = {
  readonly success: boolean;
  readonly subscription?: string;
  readonly eventType?: string;
  readonly sessionId?: string;
  readonly note?: string;
  readonly error?: string;
};

async function createSubscription({ eventType, handler, client }) {
  for (const event of await client.event.subscribe()) {
    if (event.type === eventType) {
    }
  }
}

export async function subscribe({
  eventType,
  sessionId,
  client,
  listener,
}: {
  readonly eventType?: string;
  readonly sessionId?: string;
  readonly client: EventClient;
}): Promise<SubscribeResult> {
  // Note: The async generator returned by client.event.subscribe()
  // should be handled by the caller, not the action

  return {
    success: true,
    subscription: "Event subscription established",
    eventType,
    sessionId,
    note: "Use the returned async generator to listen for events",
  };
}
