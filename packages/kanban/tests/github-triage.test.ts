import { describe, expect, it } from "vitest";

import { refineGitHubSweep } from "../src/github-triage.js";

describe("refineGitHubSweep", () => {
  it("classifies issues and prs into kanban states while excluding opted-out repos", () => {
    const refined = refineGitHubSweep(
      {
        generatedAt: "2026-03-21T20:09:13Z",
        repos: [
          {
            owner_repo: "open-hax/proxx",
            issues: [
              {
                number: 65,
                title: "[Critical] Keep revealSecrets ephemeral — do not persist in localStorage",
                url: "https://github.com/open-hax/proxx/issues/65",
                createdAt: "2026-03-20T02:55:27Z",
                updatedAt: "2026-03-20T02:55:27Z",
                author: { login: "app/coderabbitai", is_bot: true },
                labels: []
              }
            ],
            prs: []
          },
          {
            owner_repo: "open-hax/openhax",
            issues: [
              {
                number: 1,
                title: "testing",
                url: "https://github.com/open-hax/openhax/issues/1",
                createdAt: "2025-12-01T00:00:00Z",
                updatedAt: "2025-12-01T00:00:00Z",
                labels: []
              }
            ],
            prs: [
              {
                number: 3,
                title: "@openhax/kanban: local web UI (serve)",
                url: "https://github.com/open-hax/openhax/pull/3",
                createdAt: "2026-03-14T19:33:59Z",
                updatedAt: "2026-03-15T06:23:34Z",
                isDraft: false,
                mergeStateStatus: "UNSTABLE",
                statusCheckRollup: [
                  {
                    __typename: "CheckRun",
                    name: "coverage",
                    conclusion: "FAILURE"
                  }
                ],
                labels: []
              }
            ]
          },
          {
            owner_repo: "riatzukiza/TANF-app",
            issues: [],
            prs: [
              {
                number: 25,
                title: "Bump flatted from 3.2.5 to 3.4.2 in /tdrs-frontend",
                url: "https://github.com/riatzukiza/TANF-app/pull/25",
                createdAt: "2026-03-20T14:39:06Z",
                updatedAt: "2026-03-20T14:39:06Z",
                labels: []
              }
            ]
          }
        ]
      },
      {
        now: new Date("2026-03-21T21:00:00Z"),
        excludeRepos: ["riatzukiza/TANF-app"]
      }
    );

    expect(refined.items).toHaveLength(3);
    expect(refined.items.find((item) => item.number === 65)?.proposedStatus).toBe("breakdown");
    expect(refined.items.find((item) => item.number === 65)?.proposedLabels).toContain("source:coderabbit");
    expect(refined.items.find((item) => item.number === 1)?.proposedStatus).toBe("rejected");
    expect(refined.items.find((item) => item.kind === "pr")?.proposedStatus).toBe("blocked");
  });
});