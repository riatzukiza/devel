import { describe, expect, it } from "vitest";

import { canTransition, getAllowedTransitions, normalizeKanbanStatus, renderKanbanFsm } from "../src/fsm.js";

describe("kanban fsm", () => {
  it("normalizes legacy and human-readable status tokens", () => {
    expect(normalizeKanbanStatus("In Review")).toBe("in_review");
    expect(normalizeKanbanStatus("review")).toBe("in_review");
    expect(normalizeKanbanStatus("Doing")).toBe("in_progress");
  });

  it("enforces canonical forward transitions", () => {
    expect(canTransition("incoming", "accepted")).toBe(true);
    expect(canTransition("accepted", "todo")).toBe(false);
    expect(getAllowedTransitions("testing")).toContain("document");
  });

  it("renders the workflow summary", () => {
    expect(renderKanbanFsm()).toContain("Incoming -> Accepted, Rejected, Ice Box");
  });
});