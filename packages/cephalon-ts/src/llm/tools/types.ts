/**
 * Tool Types
 * 
 * Type definitions for tool execution system.
 */

import type { ToolResult } from "../../types/index.js";
import type { ToolDefinition } from "../../prompts/index.js";
import type { DiscordApiClient } from "../../discord/api-client.js";
import type { ChromaMemoryStore } from "../../chroma/client.js";

/**
 * Tool call interface
 */
export interface ToolCall {
  type: "tool_call";
  name: string;
  args: Record<string, unknown>;
  callId: string;
}

/**
 * Tool registry entry: combines schema (ToolDefinition) with handler
 */
export type ToolRegistryEntry = {
  schema: ToolDefinition;
  handler: (
    args: Record<string, unknown>,
    deps: ToolDependencies,
  ) => Promise<ToolResult>;
};

/**
 * Tool dependencies injected at runtime
 */
export type ToolDependencies = {
  chromaStore?: ChromaMemoryStore;
  discordApiClient: DiscordApiClient;
  sessionId?: string;
};

/**
 * Tool executor options
 */
export interface ToolExecutorOptions {
  chromaStore?: ChromaMemoryStore;
  discordApiClient: DiscordApiClient;
}
