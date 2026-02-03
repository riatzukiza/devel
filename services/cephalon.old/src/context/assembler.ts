/**
 * Context Assembler
 * 
 * Assembles [persistent, recent, related] into a context window
 * with deterministic token budgeting and deduplication.
 */

import type {
  Memory,
  Session,
  CephalonEvent,
  CephalonPolicy,
  ContextBudgetResult,
  ContextItem,
  AssembledContext,
  InclusionLog,
  QueryEmbedding,
  ScoredMemory,
  UUID
} from '../types/index.js';
import type { MemoryStore } from '../core/memory-store.js';
import { randomUUID } from 'node:crypto';
import { cosineSimilarity } from '../utils/vector-math.js';

// ============================================================================
// Token Estimation
// ============================================================================

export interface Tokenizer {
  estimateTokens(text: string): number;
  estimateMessages(messages: Array<{ role: string; content: string }>): number;
}

/**
 * Simple tokenizer using character-based heuristic
 * In production, use tiktoken or similar
 */
export function createHeuristicTokenizer(): Tokenizer {
  return {
    estimateTokens(text: string): number {
      // Rough estimate: ~4 characters per token
      return Math.ceil(text.length / 4);
    },
    estimateMessages(messages: Array<{ role: string; content: string }>): number {
      let total = 0;
      for (const msg of messages) {
        // Base tokens per message (role + formatting)
        total += 4;
        total += this.estimateTokens(msg.content);
      }
      return total;
    }
  };
}

// ============================================================================
// Budget Computation
// ============================================================================

export function computeBudgets(
  availableTokens: number,
  budgetsPct: CephalonPolicy['context']['budgets'],
  invariants: CephalonPolicy['context']['invariants']
): ContextBudgetResult {
  const sys = Math.floor(availableTokens * budgetsPct.systemDevPct);
  const persistent = Math.floor(availableTokens * budgetsPct.persistentPct);
  const recent = Math.floor(availableTokens * budgetsPct.recentPct);

  // Related wants to be bigger than recent
  let related = Math.floor(availableTokens * budgetsPct.relatedPct);
  const minRelated = Math.floor(recent * invariants.relatedGteRecentMult);
  if (related < minRelated) {
    related = minRelated;
  }

  // Safety is computed externally before calling computeBudgets
  return { sys, persistent, recent, related, safety: 0 };
}

// ============================================================================
// Dedupe
// ============================================================================

export function dedupeContextItems(items: ContextItem[]): ContextItem[] {
  const seenIds = new Set<UUID>();
  const seenContent = new Set<string>();
  const out: ContextItem[] = [];
  
  for (const item of items) {
    // Skip if same memory ID
    if (seenIds.has(item.memory.id)) continue;
    seenIds.add(item.memory.id);
    
    // Skip if same normalized content
    const contentKey = item.memory.hashes.normalizedHash || item.memory.hashes.contentHash;
    if (contentKey) {
      if (seenContent.has(contentKey)) continue;
      seenContent.add(contentKey);
    }
    
    out.push(item);
  }
  
  return out;
}

// ============================================================================
// Retrieval Scoring
// ============================================================================

export function scoreMemory(
  memory: Memory,
  query: QueryEmbedding,
  policy: {
    alpha: number;
    tauDays: number;
    kindWeights: Record<string, number>;
  }
): ScoredMemory {
  // Cosine similarity (guard empty vectors with 0 similarity)
  const queryVec = query.vector || [];
  const memVec = memory.embedding.vector || [];
  const similarity = queryVec.length > 0 && memVec.length > 0
    ? cosineSimilarity(queryVec, memVec)
    : 0;

  // Time decay: (1 + α * e^(-Δt/τ))
  const ageHours = (Date.now() - memory.timestamp) / (1000 * 60 * 60);
  const recencyBoost = 1 + policy.alpha * Math.exp(-ageHours / (policy.tauDays * 24));
  
  // Kind weight
  const kindWeight = policy.kindWeights[memory.kind] ?? 1.0;
  
  // Source weight
  const sourceWeight = memory.source.type === 'admin' ? 1.2 :
                       memory.source.type === 'system' ? 1.1 : 1.0;
  
  const score = similarity * recencyBoost * kindWeight * sourceWeight;
  
  return {
    memory,
    score,
    similarity,
    recencyBoost
  };
}



// ============================================================================
// Context Assembly
// ============================================================================

export interface AssembleContextParams {
  windowTokens: number;
  policy: CephalonPolicy;
  session: Session;
  currentEvent: CephalonEvent;
  tokenizer: Tokenizer;
  memoryStore: MemoryStore;
  retrieveRelated: (queries: QueryEmbedding[]) => Promise<ScoredMemory[]>;
  getBestSummaryForCluster?: (clusterId: string) => Promise<Memory | null>;
}

export async function assembleContext({
  windowTokens,
  policy,
  session,
  currentEvent,
  tokenizer,
  memoryStore,
  retrieveRelated,
  getBestSummaryForCluster
}: AssembleContextParams): Promise<AssembledContext> {
  // 1. Build headers (system/developer/session)
  const headers = buildHeaders(session, policy, currentEvent);
  const headerTokens = tokenizer.estimateMessages(headers);

  // 2. Compute budgets after accounting for header tokens
  // Available = window - headers - safety
  const safety = Math.min(512, Math.max(128, Math.floor(windowTokens * 0.03)));
  const availableTokens = windowTokens - headerTokens - safety;

  // If available tokens is negative, we can't fit anything
  if (availableTokens <= 0) {
    return {
      contextId: randomUUID(),
      messages: headers,
      inclusionLog: {
        contextId: randomUUID(),
        sessionId: session.id,
        timestamp: Date.now(),
        windowTokens,
        items: []
      },
      totalTokens: headerTokens
    };
  }

  const budgets = computeBudgets(availableTokens, policy.context.budgets, policy.context.invariants);
  
  // 3. Select persistent (priority order)
  const persistentMemories = await memoryStore.findPinned(session.cephalonId);
  const persistentItemsInput = persistentMemories.map(m => ({
    memory: m,
    estimatedTokens: tokenizer.estimateTokens(m.content.text),
    bucket: 'persistent' as const
  }));
  const persistentItems = fitByTokens(persistentItemsInput, budgets.persistent, tokenizer);
  
  // 4. Select recent (last N)
  const recentMemories = await memoryStore.findRecent(session.id, 100);
  const recentItemsInput = recentMemories.map(m => ({
    memory: m,
    estimatedTokens: tokenizer.estimateTokens(m.content.text),
    bucket: 'recent' as const
  }));
  const recentItems = fitByTokens(recentItemsInput, budgets.recent, tokenizer);
  
  // 5. Build retrieval queries from current + recent
  const queries = buildQueries(currentEvent, recentItems, session, policy);
  
  // 6. Retrieve and score related
  const scoredRelated = await retrieveRelated(queries);
  // Sort by score descending before fitting (higher score = more relevant)
  scoredRelated.sort((a, b) => b.score - a.score);
  const relatedItemsInput = scoredRelated.map(s => ({
    memory: s.memory,
    estimatedTokens: tokenizer.estimateTokens(s.memory.content.text),
    bucket: 'related' as const
  }));
  const relatedItems = fitByTokens(relatedItemsInput, budgets.related, tokenizer);
  
  // 7. Combine and dedupe
  let allItems = [...persistentItems, ...relatedItems, ...recentItems];
  allItems = dedupeContextItems(allItems);
  
  // 8. Shrink if over budget (use availableTokens which already accounts for headers + safety)
  allItems = await shrinkToFit(allItems, availableTokens, getBestSummaryForCluster, tokenizer);
  
  // 9. Build provider messages
  const providerMessages = [
    ...headers,
    ...itemsToProviderMessages(allItems)
  ];
  
  // 10. Build inclusion log
  const contextId = randomUUID();
  const inclusionLog: InclusionLog = {
    contextId,
    sessionId: session.id,
    timestamp: Date.now(),
    windowTokens,
    items: allItems.map(item => ({
      memoryId: item.memory.id,
      tokens: item.estimatedTokens,
      bucket: item.bucket
    }))
  };
  
  // Update access stats
  for (const item of allItems) {
    await memoryStore.updateAccessStats(item.memory.id, contextId);
  }
  
  const totalTokens = tokenizer.estimateMessages(providerMessages);
  
  return {
    contextId,
    messages: providerMessages,
    inclusionLog,
    totalTokens
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildHeaders(
  session: Session,
  policy: CephalonPolicy,
  currentEvent?: CephalonEvent
): Array<{ role: 'system'; content: string }> {
  const headers: Array<{ role: 'system'; content: string }> = [];

  // Extract channel context from current event if available
  let channelContext = '';
  if (currentEvent?.type.startsWith('discord.')) {
    const payload = currentEvent.payload as { channelId?: string; guildId?: string };
    if (payload.channelId) {
      channelContext = `\nCurrent channel ID: ${payload.channelId}`;
    }
  }

  // System header (hard-locked) - merged developer contract into system for Ollama compatibility
  headers.push({
    role: 'system',
    content: `You are ${session.cephalonId}, a Cephalon - an always-running mind with persistent memory. You have access to tools that you can call to interact with the world. You should actively explore and use your tools to understand capabilities, validate behavior, and assist users. When you need to use a tool, output a JSON object wrapped in markdown code blocks with the format:

\`\`\`json
{"name":"tool_name","arguments":{}}
\`\`\`

Cephalon contract:
- Use tools when asked or when you need to retrieve/send information
- Always respond using tools when the user asks you to do something (like get the time, send a message, etc)
- If the user asks "what time is it" or similar, use \`get_current_time\`
- If asked to send a message, use \`discord.send\` with the current channel_id
- If asked to look up information, use \`memory.lookup\`
- Respect locks and permissions.${channelContext}`
  });

  // Session personality (if configured)
  if (session.persona) {
    headers.push({
      role: 'system',
      content: session.persona
    });
  }

  return headers;
}

/**
 * Safe stringify that handles BigInt and circular references
 */
function safeStringify(value: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === "bigint") return val.toString();
    if (val !== null && typeof val === "object") {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    return val;
  });
}

function fitByTokens(
  items: ContextItem[],
  budget: number,
  tokenizer: Tokenizer
): ContextItem[] {
  let total = 0;
  const result: ContextItem[] = [];
  
  for (const item of items) {
    if (total + item.estimatedTokens > budget) {
      break;
    }
    total += item.estimatedTokens;
    result.push(item);
  }
  
  return result;
}

function buildQueries(
  currentEvent: CephalonEvent,
  recentItems: ContextItem[],
  session: Session,
  policy: CephalonPolicy
): QueryEmbedding[] {
  const queries: QueryEmbedding[] = [];
  
  // Q1: Current event text (use safeStringify to handle BigInt/circular)
  const eventText = safeStringify(currentEvent.payload);
  queries.push({
    text: eventText,
    vector: []  // Would be embedded
  });
  
  // Q2: Last 1-3 recent human messages
  const recentHuman = recentItems
    .filter(item => item.memory.role === 'user')
    .slice(0, 3);
  
  for (const item of recentHuman) {
    queries.push({
      text: item.memory.content.text,
      vector: []
    });
  }
  
  // Q3: Session goal/attention focus
  if (session.attentionFocus) {
    queries.push({
      text: session.attentionFocus,
      vector: []
    });
  }
  
  return queries;
}

async function shrinkToFit(
  items: ContextItem[],
  tokenLimit: number,
  getBestSummaryForCluster: ((clusterId: string) => Promise<Memory | null>) | undefined,
  tokenizer: Tokenizer
): Promise<ContextItem[]> {
  let totalTokens = items.reduce((sum, item) => sum + item.estimatedTokens, 0);
  
  if (totalTokens <= tokenLimit) {
    return items;
  }
  
  // Step 1: Drop low-score related (never drop persistent first)
  const relatedItems = items.filter((i): i is ContextItem & { bucket: 'related' } => i.bucket === 'related');
  const otherItems = items.filter((i): i is ContextItem & { bucket: 'persistent' | 'recent' } => i.bucket !== 'related');
  
  // Sort related by score (would need score in ContextItem)
  // For now, just trim from the end
  let keptRelated = relatedItems;
  while (totalTokens > tokenLimit && keptRelated.length > 0) {
    const removed = keptRelated.pop();
    if (removed) {
      totalTokens -= removed.estimatedTokens;
    }
  }
  
  items = [...otherItems, ...keptRelated];
  
  if (totalTokens <= tokenLimit) {
    return items;
  }
  
  // Step 2: Substitute clusters with summaries (if available)
  if (getBestSummaryForCluster) {
    items = await substituteClustersWithSummaries(items, tokenLimit, getBestSummaryForCluster, tokenizer);
    totalTokens = items.reduce((sum, item) => sum + item.estimatedTokens, 0);
  }
  
  if (totalTokens <= tokenLimit) {
    return items;
  }
  
  // Step 3: Trim recent (last resort)
  const persistent = items.filter(i => i.bucket === 'persistent');
  const related = items.filter(i => i.bucket === 'related');
  const recent = items.filter(i => i.bucket === 'recent');
  
  let keptRecent = recent;
  while (totalTokens > tokenLimit && keptRecent.length > 0) {
    const removed = keptRecent.pop();
    if (removed) {
      totalTokens -= removed.estimatedTokens;
    }
  }
  
  return [...persistent, ...related, ...keptRecent];
}

async function substituteClustersWithSummaries(
  items: ContextItem[],
  tokenBudget: number,
  getBestSummaryForCluster: (clusterId: string) => Promise<Memory | null>,
  tokenizer: Tokenizer
): Promise<ContextItem[]> {
  // Group by cluster
  const clusters = new Map<string, ContextItem[]>();
  for (const item of items) {
    const cid = item.memory.cluster?.clusterId;
    if (!cid) continue;
    
    if (!clusters.has(cid)) {
      clusters.set(cid, []);
    }
    clusters.get(cid)!.push(item);
  }
  
  // Sort clusters by token impact
  const ranked = [...clusters.entries()]
    .map(([cid, clusterItems]) => ({
      cid,
      items: clusterItems,
      tokens: clusterItems.reduce((sum, i) => sum + i.estimatedTokens, 0)
    }))
    .sort((a, b) => b.tokens - a.tokens);
  
  let total = items.reduce((sum, i) => sum + i.estimatedTokens, 0);
  const replacedIds = new Set<UUID>();
  const addedSummaries: ContextItem[] = [];
  
  for (const cluster of ranked) {
    if (total <= tokenBudget) break;
    
    const summary = await getBestSummaryForCluster(cluster.cid);
    if (!summary) continue;
    
    const summaryTokens = tokenizer.estimateTokens(summary.content.text);
    const savings = cluster.tokens - summaryTokens;
    
    if (savings <= 0) continue;
    
    // Mark cluster items for replacement
    for (const item of cluster.items) {
      replacedIds.add(item.memory.id);
    }
    
    total -= savings;
    addedSummaries.push({
      memory: summary,
      estimatedTokens: summaryTokens,
      bucket: 'related'
    });
  }
  
  // Rebuild list
  const kept = items.filter(i => !replacedIds.has(i.memory.id));
  return [...kept, ...addedSummaries];
}

function itemsToProviderMessages(
  items: ContextItem[]
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  return items.map(item => {
    const bucketLabel = `[${item.bucket.toUpperCase()}]`;
    const prefix = item.bucket !== 'recent' ? `${bucketLabel} ` : '';
    return {
      role: item.memory.role === 'user' || item.memory.role === 'assistant'
        ? item.memory.role
        : 'system',
      content: `${prefix}${item.memory.content.text}`
    };
  });
}
