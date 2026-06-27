import { normalizeLogin } from "./config.js";
import type { ReviewGateResult, ReviewThreadSummary } from "./types.js";

export const findTrackedUnresolvedThreads = (
  threads: readonly ReviewThreadSummary[],
  actors: readonly string[],
): ReviewGateResult => {
  const tracked = new Set(actors.map(normalizeLogin).filter((value): value is string => Boolean(value)));
  const unresolvedThreads = threads.filter((thread) => {
    if (thread.isResolved) return false;
    return thread.comments.some((comment) => {
      const login = normalizeLogin(comment.authorLogin);
      return typeof login === "string" && tracked.has(login);
    });
  });
  return {
    trackedActors: [...tracked],
    unresolvedThreads,
  };
};
