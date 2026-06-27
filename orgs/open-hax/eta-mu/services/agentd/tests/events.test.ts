import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../src/events.js";
import type { WebSocket } from "ws";

describe("EventBus", () => {
  it("attaches and emits payloads with a timestamp", () => {
    const bus = new EventBus();
    const send = vi.fn();
    const socket = { send } as unknown as WebSocket;

    bus.attach(socket);
    const before = Date.now();
    bus.emit({ type: "ping", data: { foo: "bar" } });

    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(send.mock.calls[0][0]);
    expect(payload.type).toBe("ping");
    expect(payload.data).toEqual({ foo: "bar" });
    expect(payload.ts).toBeTypeOf("number");
    expect(payload.ts).toBeGreaterThanOrEqual(before);
    expect(payload.ts).toBeLessThanOrEqual(Date.now());
  });

  it("does not emit to detached sockets", () => {
    const bus = new EventBus();
    const send = vi.fn();
    const socket = { send } as unknown as WebSocket;

    bus.attach(socket);
    bus.detach(socket);
    bus.emit({ type: "ping" });

    expect(send).not.toHaveBeenCalled();
  });

  it("continues broadcasting when one subscriber throws", () => {
    const bus = new EventBus();
    const goodSend = vi.fn();
    const badSend = vi.fn(() => { throw new Error("boom"); });

    const goodSocket = { send: goodSend } as unknown as WebSocket;
    const badSocket = { send: badSend } as unknown as WebSocket;

    bus.attach(badSocket);
    bus.attach(goodSocket);

    bus.emit({ type: "ping" });

    expect(badSend).toHaveBeenCalled();
    expect(goodSend).toHaveBeenCalledTimes(1);
  });
});
