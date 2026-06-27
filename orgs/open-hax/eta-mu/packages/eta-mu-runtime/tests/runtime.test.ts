import { describe, expect, it } from "vitest";

import {
  createActionBatch as createActionBatchCljs,
  createBreathEpisode as createBreathEpisodeCljs,
  createEtaBelief as createEtaBeliefCljs,
  createEtaMuState as createEtaMuStateCljs,
  rankCheapMuCandidates as rankCheapMuCandidatesCljs,
  selectPanelsFromContext as selectPanelsFromContextCljs,
} from "@open-hax/eta-mu-runtime/cljs";
import { createActionBatch } from "../src/envelope.js";
import { rankCheapMuCandidates, selectPanelsFromContext } from "../src/planner.js";
import {
  createBreathEpisode,
  createEtaBelief,
  createEtaMuState,
} from "../src/state.js";

describe("createEtaBelief", () => {
  it("clamps values into the unit interval", () => {
    const belief = createEtaBelief({
      urgency: 2,
      ambiguity: -1,
    });

    expect(belief.urgency).toBe(1);
    expect(belief.ambiguity).toBe(0);
  });
});

describe("selectPanelsFromContext", () => {
  it("surfaces truth, trajectory, and breath under active pressure", () => {
    const panels = selectPanelsFromContext({
      repo: "open-hax/proxx",
      trigger: "check.completed",
      target: "staging",
      summary: "staging gate changed",
      belief: createEtaBelief({
        urgency: 0.8,
        reviewDebt: 0.7,
        drift: 0.6,
      }),
      unresolvedReviewThreads: 2,
      quietWindowDetected: true,
    });

    expect(panels).toEqual([
      "field",
      "movement",
      "truth",
      "trajectory",
      "memory",
      "breath",
    ]);
  });
});

describe("rankCheapMuCandidates", () => {
  it("asks for evidence before stronger movement when ambiguity is high", () => {
    const candidates = rankCheapMuCandidates({
      repo: "open-hax/proxx",
      trigger: "pull_request_review_comment",
      target: "pr#42",
      summary: "state needs reconciliation",
      belief: createEtaBelief({
        ambiguity: 0.9,
        socialFriction: 0.8,
      }),
      hasPendingHumanAttention: true,
    });

    expect(candidates.map((candidate) => candidate.kind)).toContain(
      "request-evidence",
    );
    expect(candidates.map((candidate) => candidate.kind)).toContain(
      "request-human-attention",
    );
  });
});

describe("CLJS cutover wrappers", () => {
  it("keeps public TypeScript exports in parity with CLJS runtime exports", () => {
    const context = {
      repo: "open-hax/proxx",
      trigger: "check.completed",
      target: "staging",
      summary: "staging gate changed",
      belief: createEtaBelief({
        urgency: 0.8,
        reviewDebt: 0.7,
        drift: 0.6,
      }),
      unresolvedReviewThreads: 2,
      quietWindowDetected: true,
    };

    expect(createEtaBelief({ urgency: 2, ambiguity: -1 })).toEqual(
      createEtaBeliefCljs({ urgency: 2, ambiguity: -1 }),
    );
    expect(
      createBreathEpisode("episode:test", "2026-05-30T00:00:00.000Z", true, 2),
    ).toEqual(
      createBreathEpisodeCljs(
        "episode:test",
        "2026-05-30T00:00:00.000Z",
        true,
        2,
      ),
    );
    expect(
      createEtaMuState({
        currentEpisodeId: "episode:test",
        now: "2026-05-30T00:00:00.000Z",
        belief: { urgency: 0.2 },
      }),
    ).toEqual(
      createEtaMuStateCljs({
        currentEpisodeId: "episode:test",
        now: "2026-05-30T00:00:00.000Z",
        belief: { urgency: 0.2 },
      }),
    );
    expect(selectPanelsFromContext(context)).toEqual(
      selectPanelsFromContextCljs(context),
    );
    expect(rankCheapMuCandidates(context)).toEqual(
      rankCheapMuCandidatesCljs(context),
    );
    expect(createActionBatch(context)).toEqual(createActionBatchCljs(context));
  });

  it("keeps minimal default planning context in parity with CLJS exports", () => {
    const context = {
      repo: "open-hax/proxx",
      trigger: "scheduler.tick",
      target: "open-hax/proxx",
      summary: "cheap reconcile loop found no action",
      belief: createEtaBelief(),
    };

    expect(selectPanelsFromContext(context)).toEqual(
      selectPanelsFromContextCljs(context),
    );
    expect(rankCheapMuCandidates(context)).toEqual(
      rankCheapMuCandidatesCljs(context),
    );
    expect(createActionBatch(context)).toEqual(createActionBatchCljs(context));
  });
});

describe("createActionBatch", () => {
  it("emits a noop batch when no cheap movement is justified", () => {
    const batch = createActionBatch({
      repo: "open-hax/proxx",
      trigger: "scheduler.tick",
      target: "open-hax/proxx",
      summary: "cheap reconcile loop found no action",
      belief: createEtaBelief(),
    });

    expect(batch.kind).toBe("eta-mu-action-batch.v1");
    expect(batch.actions).toHaveLength(1);
    expect(batch.actions[0]?.kind).toBe("noop");
    expect(batch.breath.shouldCommit).toBe(false);
  });
});
