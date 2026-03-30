import { createHash } from "node:crypto";

import type { CephalonPolicy, Memory, UUID } from "../types/index.js";
import type { MemoryStore } from "./memory-store.js";
import { MemoryFactory, type MemoryFactoryConfig } from "./memory-factory.js";

export interface MemoryCompactorSummary {
  runs: number;
  lastRunAt?: number;
  lastSummaryCount: number;
  lastSourceCount: number;
  lastSkippedReason?: string;
}

export interface MemoryCompactorOptions {
  threshold: number;
  maxGroupsPerRun?: number;
}

interface CompactionGroup {
  key: string;
  clusterId: string;
  memories: Memory[];
}

function startOfDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function compactText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clusterIdFor(memories: readonly Memory[]): string {
  const seed = memories.map((memory) => memory.id).sort().join(":");
  return createHash("sha256").update(seed).digest("hex").slice(0, 24);
}

function groupCandidates(memories: readonly Memory[], maxGroups: number): CompactionGroup[] {
  const groups = new Map<string, Memory[]>();

  for (const memory of memories) {
    const key = [
      memory.sessionId,
      memory.source.channelId ?? "no-channel",
      startOfDay(memory.timestamp),
    ].join("|");

    const bucket = groups.get(key) ?? [];
    bucket.push(memory);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .map(([key, bucket]) => ({
      key,
      clusterId: clusterIdFor(bucket),
      memories: bucket.sort((left, right) => left.timestamp - right.timestamp),
    }))
    .filter((group) => group.memories.length >= 2)
    .sort((left, right) => right.memories.length - left.memories.length)
    .slice(0, Math.max(1, maxGroups));
}

function buildSummaryText(group: CompactionGroup, policy: CephalonPolicy): string {
  const byText = new Map<string, { text: string; count: number }>();
  const byAuthor = new Map<string, number>();

  for (const memory of group.memories) {
    const normalized = compactText(memory.content.normalizedText || memory.content.text);
    const existing = byText.get(normalized) ?? { text: compactText(memory.content.text), count: 0 };
    existing.count += 1;
    byText.set(normalized, existing);

    if (memory.source.authorId) {
      byAuthor.set(memory.source.authorId, (byAuthor.get(memory.source.authorId) ?? 0) + 1);
    }
  }

  const topPatterns = [...byText.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, Math.max(1, policy.compaction.summary.maxPatterns));

  const topAuthors = [...byAuthor.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([authorId, count]) => `${authorId}×${count}`)
    .join(", ");

  const bullets = topPatterns
    .slice(0, Math.max(1, policy.compaction.summary.maxBullets))
    .map((entry) => `- (${entry.count}x) ${entry.text.slice(0, 220)}`)
    .join("\n");

  const first = group.memories[0];
  const last = group.memories[group.memories.length - 1];

  return [
    `Compacted memory cluster for session ${first.sessionId}.`,
    `Channel: ${first.source.channelId ?? "n/a"}. Window: ${new Date(first.timestamp).toISOString()} -> ${new Date(last.timestamp).toISOString()}.`,
    `Source memories: ${group.memories.length}.`,
    topAuthors ? `Frequent authors: ${topAuthors}.` : undefined,
    "Repeated patterns:",
    bullets,
  ].filter(Boolean).join("\n");
}

export class MemoryCompactor {
  private readonly store: MemoryStore;
  private readonly policy: CephalonPolicy;
  private readonly threshold: number;
  private readonly maxGroupsPerRun: number;
  private readonly factoryConfig: MemoryFactoryConfig;
  private readonly summaryState: MemoryCompactorSummary = {
    runs: 0,
    lastSummaryCount: 0,
    lastSourceCount: 0,
  };

  public constructor(
    store: MemoryStore,
    policy: CephalonPolicy,
    factoryConfig: MemoryFactoryConfig,
    options: MemoryCompactorOptions,
  ) {
    this.store = store;
    this.policy = policy;
    this.factoryConfig = factoryConfig;
    this.threshold = options.threshold;
    this.maxGroupsPerRun = options.maxGroupsPerRun ?? 4;
  }

  public summary(): MemoryCompactorSummary {
    return { ...this.summaryState };
  }

  public async runOnce(): Promise<void> {
    this.summaryState.runs += 1;
    this.summaryState.lastRunAt = Date.now();
    this.summaryState.lastSummaryCount = 0;
    this.summaryState.lastSourceCount = 0;
    this.summaryState.lastSkippedReason = undefined;

    const count = await this.resolveCount();
    if (count < this.threshold) {
      this.summaryState.lastSkippedReason = `below-threshold:${count}<${this.threshold}`;
      return;
    }

    const candidates = await this.store.findGCCandidates({
      ageMinDays: this.policy.compaction.ageMinDays,
      accessThreshold: this.policy.compaction.access.threshold,
      excludeKinds: [...this.policy.compaction.locks.neverDeleteKinds],
      excludeTags: [...this.policy.compaction.locks.neverDeleteTags],
      limit: this.policy.compaction.grouping.maxSourceCount * this.maxGroupsPerRun,
    });

    const eligible = candidates.filter(
      (memory) => !memory.lifecycle.replacedBySummaryId && memory.kind !== "summary" && memory.kind !== "aggregate",
    );
    if (eligible.length < 2) {
      this.summaryState.lastSkippedReason = "no-eligible-clusters";
      return;
    }

    const groups = groupCandidates(eligible, this.maxGroupsPerRun);
    if (groups.length === 0) {
      this.summaryState.lastSkippedReason = "no-groups";
      return;
    }

    const factory = new MemoryFactory(this.factoryConfig);

    for (const group of groups) {
      const summaryText = buildSummaryText(group, this.policy);
      const summaryMemory = factory.createSummaryMemory(
        summaryText,
        group.memories.map((memory) => memory.id),
        {
          clusterId: group.clusterId,
          timestamp: group.memories[group.memories.length - 1]?.timestamp,
        },
      );
      await this.store.insert(summaryMemory);

      for (const memory of group.memories) {
        await this.store.update(memory.id, {
          cluster: {
            ...(memory.cluster ?? {}),
            clusterId: group.clusterId,
          },
          lifecycle: {
            ...memory.lifecycle,
            replacedBySummaryId: summaryMemory.id as UUID,
          },
        });
      }

      this.summaryState.lastSummaryCount += 1;
      this.summaryState.lastSourceCount += group.memories.length;
    }
  }

  private async resolveCount(): Promise<number> {
    if (typeof this.store.count === "function") {
      return await this.store.count();
    }
    if (typeof this.store.getAllMemories === "function") {
      const memories = await this.store.getAllMemories();
      return memories.length;
    }
    return this.threshold;
  }
}
