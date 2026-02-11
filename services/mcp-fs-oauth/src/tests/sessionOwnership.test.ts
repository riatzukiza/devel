import { describe, expect, it } from "bun:test";

import { decideUnknownSession } from "../sessionOwnership.js";

describe("session ownership decisions", () => {
  it("returns missing when no session record exists", () => {
    const decision = decideUnknownSession(null, 7777);
    expect(decision).toEqual({ action: "missing" });
  });

  it("allows touch-only when session belongs to current process", () => {
    const record = JSON.stringify({ createdAt: 1234, processId: 7777 });
    const decision = decideUnknownSession(record, 7777);
    expect(decision).toEqual({ action: "allow", touchOnly: true });
  });

  it("adopts dead-owner session for current process", () => {
    const record = JSON.stringify({ createdAt: 5555, processId: 12345 });
    const decision = decideUnknownSession(record, 7777, 9999, () => false);

    expect(decision.action).toBe("allow");
    if (decision.action === "allow" && !decision.touchOnly) {
      expect(decision.nextRecord).toEqual({ createdAt: 5555, processId: 7777 });
      return;
    }
    throw new Error("Expected allow/adopt decision");
  });

  it("returns conflict when owner process is still alive", () => {
    const record = JSON.stringify({ createdAt: 5555, processId: 12345 });
    const decision = decideUnknownSession(record, 7777, Date.now(), () => true);
    expect(decision).toEqual({ action: "conflict" });
  });
});
