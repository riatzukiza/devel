/**
 * Context Pruning
 *
 * Handles context overflow by pruning old messages while preserving
 * system prompts and recent conversation context.
 *
 * Strategy:
 * 1. Detect context_length_exceeded errors
 * 2. Prune oldest tool call + result pairs first
 * 3. If still too long, prune oldest user/assistant pairs
 * 4. Preserve system messages and recent context
 */

import type { ChatMessage } from "../types/index.js";

export interface PruningResult {
  messages: ChatMessage[];
  pruned: number;
  strategy: "tool-calls" | "user-assistant" | "system-pair";
  remainingTokens: number;
}

export interface ContextPruningConfig {
  /** Maximum tokens to target after pruning */
  targetTokens: number;
  /** Keep at least this many recent messages */
  minRecentMessages: number;
  /** Keep system messages (default: true) */
  keepSystemMessages: boolean;
  /** Token estimation function */
  estimateTokens: (messages: ChatMessage[]) => number;
}

/**
 * Estimate tokens using heuristic (4 chars per token avg)
 */
export function heuristicTokenEstimate(messages: ChatMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    // Base: content length / 4
    const contentLength = typeof msg.content === "string" 
      ? msg.content.length 
      : 0;
    total += Math.ceil(contentLength / 4) + 4; // +4 for role overhead
    
    // Tool calls add overhead (only for assistant messages with tool_calls)
    if (msg.role === "assistant" && "tool_calls" in msg && msg.tool_calls) {
      total += msg.tool_calls.length * 20;
      for (const tc of msg.tool_calls) {
        total += Math.ceil(JSON.stringify(tc.function.arguments).length / 4);
      }
    }
    
    // Tool results add overhead
    if (msg.role === "tool" && msg.content && typeof msg.content === "string") {
      total += Math.ceil(msg.content.length / 4);
    }
  }
  return total;
}

/**
 * Check if error indicates context length exceeded
 */
export function isContextOverflowError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const msg = error.message.toLowerCase();
  return (
    msg.includes("context_length_exceeded") ||
    msg.includes("context length exceeded") ||
    msg.includes("context window") ||
    msg.includes("maximum context") ||
    msg.includes("token limit") ||
    msg.includes("too many tokens") ||
    msg.includes("maximum_tokens") ||
    msg.includes("input length exceeds") ||
    msg.includes("context_too_long") ||
    msg.includes("length_limit") ||
    msg.includes("rate limit") === false && msg.includes("limit")
  );
}

/**
 * Find and remove oldest tool call + result pair
 * Returns the index range to remove, or null if no pair found
 */
function findOldestToolCallPair(messages: ChatMessage[]): { start: number; end: number } | null {
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];
    
    // Look for assistant message with tool_calls followed by tool result
    if (current.role === "assistant" && "tool_calls" in current && current.tool_calls && current.tool_calls.length > 0) {
      // Find all consecutive tool results
      let endIdx = i + 1;
      while (endIdx < messages.length && messages[endIdx].role === "tool") {
        endIdx++;
      }
      
      if (endIdx > i + 1) {
        return { start: i, end: endIdx };
      }
    }
    
    // Also look for user/assistant pairs (non-system)
    if (current.role === "user" && next.role === "assistant" && !("tool_calls" in next && next.tool_calls)) {
      // Skip if this is the most recent exchange
      if (i >= messages.length - 3) continue;
      return { start: i, end: i + 2 };
    }
  }
  
  return null;
}

/**
 * Prune messages to fit within token limit
 * 
 * Strategy:
 * 1. Always keep system messages
 * 2. Remove oldest tool call + result pairs first
 * 3. Remove oldest user/assistant pairs next
 * 4. Keep recent messages (configurable)
 */
export function pruneContext(
  messages: ChatMessage[],
  config: ContextPruningConfig,
): PruningResult {
  const targetTokens = config.targetTokens;
  const minRecent = config.minRecentMessages;
  const keepSystem = config.keepSystemMessages ?? true;
  
  let currentMessages = [...messages];
  let currentTokens = config.estimateTokens(currentMessages);
  let totalPruned = 0;
  let lastStrategy: PruningResult["strategy"] = "tool-calls";
  
  // If already under target, return as-is
  if (currentTokens <= targetTokens) {
    return {
      messages: currentMessages,
      pruned: 0,
      strategy: "tool-calls",
      remainingTokens: currentTokens,
    };
  }
  
  // Separate system messages from the rest
  const systemMessages: ChatMessage[] = [];
  const conversationMessages: ChatMessage[] = [];
  
  for (const msg of currentMessages) {
    if (msg.role === "system" && keepSystem) {
      systemMessages.push(msg);
    } else {
      conversationMessages.push(msg);
    }
  }
  
  // Keep trying to prune until under target or can't prune anymore
  while (currentTokens > targetTokens) {
    // Ensure we keep minimum recent messages
    const availableMessages = conversationMessages.slice(0, conversationMessages.length - minRecent);
    
    if (availableMessages.length === 0) {
      // Can't prune anymore, would violate minRecent
      console.warn(`[ContextPruning] Cannot prune further without violating minRecent (${minRecent})`);
      break;
    }
    
    // Find oldest tool call pair
    const pair = findOldestToolCallPair(availableMessages);
    
    if (pair) {
      // Remove the pair
      conversationMessages.splice(pair.start, pair.end - pair.start);
      lastStrategy = pair.end - pair.start > 2 ? "tool-calls" : "user-assistant";
      totalPruned += pair.end - pair.start;
      console.log(
        `[ContextPruning] Removed ${pair.end - pair.start} messages (${lastStrategy} strategy)`
      );
    } else if (systemMessages.length > 1 && keepSystem) {
      // Try to compact system messages (merge older ones)
      // Keep only the first system message (usually main persona)
      const removedSystemCount = systemMessages.length - 1;
      if (removedSystemCount > 0) {
        systemMessages.splice(1); // Keep only first
        lastStrategy = "system-pair";
        totalPruned += removedSystemCount;
        console.log(`[ContextPruning] Compacted ${removedSystemCount} system messages`);
      } else {
        break;
      }
    } else {
      // No more pairs to remove
      break;
    }
    
    // Recombine and recalculate
    currentMessages = [...systemMessages, ...conversationMessages];
    currentTokens = config.estimateTokens(currentMessages);
  }
  
  return {
    messages: currentMessages,
    pruned: totalPruned,
    strategy: lastStrategy,
    remainingTokens: currentTokens,
  };
}

/**
 * Create a summary context message to replace pruned messages
 * This helps maintain continuity without losing all context
 */
export function createSummaryContext(
  prunedMessages: ChatMessage[],
  reason: string,
): ChatMessage {
  // Count tool calls in pruned messages
  const toolCallCount = prunedMessages.filter(
    (m) => m.role === "assistant" && "tool_calls" in m && m.tool_calls && m.tool_calls.length > 0
  ).length;
  
  const userMessageCount = prunedMessages.filter((m) => m.role === "user").length;
  const assistantMessageCount = prunedMessages.filter((m) => m.role === "assistant").length;
  
  const summary = [
    `[Context pruned: ${reason}]`,
    `Removed ${userMessageCount} user messages, ${assistantMessageCount} assistant messages.`,
    toolCallCount > 0 ? `Compressed ${toolCallCount} tool call interactions.` : "",
    "Continue from this point with the remaining context.",
  ].filter(Boolean).join(" ");
  
  return {
    role: "system",
    content: summary,
  };
}

/**
 * Prune with summary - creates a summary message instead of completely losing context
 */
export function pruneWithSummary(
  messages: ChatMessage[],
  config: ContextPruningConfig,
): { result: PruningResult; summaryMessage?: ChatMessage } {
  const originalTokens = config.estimateTokens(messages);
  const result = pruneContext(messages, config);
  
  // If we pruned significant amount, add a summary message
  if (result.pruned > 2) {
    const summaryMessage = createSummaryContext(
      messages.slice(0, Math.min(result.pruned, messages.length - result.messages.length)),
      "Context window exceeded",
    );
    
    // Insert summary after system messages
    const insertIdx = result.messages.findIndex((m) => m.role !== "system");
    if (insertIdx > 0) {
      result.messages.splice(insertIdx, 0, summaryMessage);
      result.remainingTokens = config.estimateTokens(result.messages);
    }
    
    return { result, summaryMessage };
  }
  
  return { result };
}