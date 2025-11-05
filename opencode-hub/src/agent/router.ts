// Agent layer adapter around @promethean-os/pantheon + @promethean-os/kanban
// This is a lightweight interface; wire to your real packages.
import type { AgentPlan, ChatMessage, Repo } from "../types.js";

export interface AgentDeps {
  planFromMessage(msg: ChatMessage, repos: Repo[]): Promise<AgentPlan>;
  commitPlan(plan: AgentPlan): Promise<void>;
}

export class DummyAgent implements AgentDeps {
  async planFromMessage(msg: ChatMessage, repos: Repo[]): Promise<AgentPlan> {
    // Demo logic: if user mentions repo name in text, target that repo; else all.
    const targets = repos.filter(r => msg.text.includes(r.name)).map(r => r.id);
    const targetRepos = targets.length ? targets : repos.map(r => r.id);
    const tasks = targetRepos.map((rid, i) => ({
      id: `${msg.id}:t${i}`,
      title: `Implement "${msg.text}" in ${rid}`,
      repoId: rid
    }));
    return { id: `plan:${msg.id}`, title: `Auto-plan for: ${msg.text}`, targetRepos, tasks };
  }
  async commitPlan(_plan: AgentPlan): Promise<void> {
    // Use @promethean-os/kanban to create/update tasks scoped globally and per-repo.
  }
}