import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { classifyGithubEvent } from "../src/event-classifier.js";

const config = loadConfig();

describe("classifyGithubEvent", () => {
  it("detects mentions in issue comments", () => {
    const result = classifyGithubEvent(
      "issue_comment",
      {
        action: "created",
        issue: { number: 12, pull_request: {} },
        comment: { body: "please check this @eta-mu" },
        sender: { login: "err" },
      },
      config,
      "open-hax/voxx",
    );
    expect(result.trigger).toBe("mention");
    expect(result.shouldRun).toBe(true);
    expect(result.pullRequestNumber).toBe(12);
  });

  it("treats plain issue comments as noop", () => {
    const result = classifyGithubEvent(
      "issue_comment",
      {
        action: "created",
        issue: { number: 7 },
        comment: { body: "plain note" },
        sender: { login: "err" },
      },
      config,
      "open-hax/voxx",
    );
    expect(result.shouldRun).toBe(false);
    expect(result.trigger).toBe("noop");
  });

  it("ignores eta-mu's own login", () => {
    const result = classifyGithubEvent(
      "issues",
      {
        action: "opened",
        issue: { number: 3 },
        sender: { login: "app/eta-mu" },
      },
      config,
      "open-hax/voxx",
    );
    expect(result.shouldRun).toBe(false);
  });
});
