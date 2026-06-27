import type { EtaMuConfig } from "./types.js";

const splitCsv = (value: string | undefined, fallback: readonly string[]): readonly string[] => {
  if (!value) return fallback;
  const items = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
};

export const normalizeLogin = (login: string | undefined): string | undefined => login?.trim().toLowerCase();

export const loadConfig = (): EtaMuConfig => ({
  reviewActors: splitCsv(process.env.ETA_MU_REVIEW_ACTORS, ["coderabbitai", "app/coderabbitai"]),
  mentionTokens: splitCsv(process.env.ETA_MU_MENTION_TOKENS, ["@eta-mu", "@app/eta-mu"]),
  ignoreLogins: splitCsv(process.env.ETA_MU_IGNORE_LOGINS, ["github-actions[bot]", "app/eta-mu"]),
  appLogin: process.env.ETA_MU_LOGIN ?? "app/eta-mu",
  reviewCheckName: process.env.ETA_MU_REVIEW_CHECK_NAME ?? "eta-mu-review-gate",
  stateCommentMarker: process.env.ETA_MU_STATE_COMMENT_MARKER ?? "<!-- eta-mu:state -->",
  autofixCommentMarker: process.env.ETA_MU_AUTOFIX_COMMENT_MARKER ?? "<!-- eta-mu:autofix -->",
  controlPlaneUrl: process.env.ETA_MU_CONTROL_PLANE_URL || undefined,
  commitAuthorName: process.env.ETA_MU_COMMIT_AUTHOR_NAME ?? "eta-mu[bot]",
  commitAuthorEmail: process.env.ETA_MU_COMMIT_AUTHOR_EMAIL ?? "eta-mu[bot]@users.noreply.github.com",
  modelProvider: process.env.ETA_MU_MODEL_PROVIDER || undefined,
  modelId: process.env.ETA_MU_MODEL_ID || undefined,
});
