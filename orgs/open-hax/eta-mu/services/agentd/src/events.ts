import { WebSocket } from "ws";

type Event = {
  type: string;
  ts?: number;
  data?: unknown;
};

export class EventBus {
  private subs = new Set<WebSocket>();
  emit(e: Event) {
    const payload = JSON.stringify({ ...e, ts: Date.now() });
    for (const ws of this.subs) {
      try { ws.send(payload); } catch {}
    }
  }
  attach(ws: WebSocket) { this.subs.add(ws); }
  detach(ws: WebSocket) { this.subs.delete(ws); }
}

export const bus = new EventBus();