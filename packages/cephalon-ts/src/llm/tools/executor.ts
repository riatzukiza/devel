/**
 * Tool Executor
 * 
 * Handles tool registration, execution, and definition retrieval.
 * Uses the tool registry to manage all available tools.
 */

import { InMemoryEventBus, type EventBus } from "@promethean-os/event";
import type { ToolResult } from "../../types/index.js";
import type { ToolDefinition } from "../../prompts/index.js";
import type { ToolCall, ToolDependencies, ToolExecutorOptions } from "./types.js";
import { TOOL_REGISTRY } from "./registry.js";

/**
 * Tool executor that handles tool calls
 */
export class ToolExecutor {
  private tools: Map<
    string,
    (args: Record<string, unknown>, sessionId?: string) => Promise<ToolResult>
  > = new Map();
  private eventBus: InMemoryEventBus;
  private chromaStore?: import("../../chroma/client.js").ChromaMemoryStore;
  private openPlannerClient?: import("../../openplanner/client.js").OpenPlannerClient;
  private discordApiClient: import("../../discord/api-client.js").DiscordApiClient;

  constructor(
    eventBus: InMemoryEventBus,
    options: ToolExecutorOptions,
  ) {
    this.eventBus = eventBus;
    this.chromaStore = options.chromaStore;
    this.openPlannerClient = options.openPlannerClient;
    if (!options.discordApiClient) {
      throw new Error(
        "DiscordApiClient is required. Pass a single shared instance from main.ts",
      );
    }
    this.discordApiClient = options.discordApiClient;
    this.registerDefaultTools();
  }

  setDiscordClient(client: import("discord.js").Client): void {
    this.discordApiClient.setClient(client);
  }

  /**
   * Register a tool handler
   */
  registerTool(
    name: string,
    handler: (args: Record<string, unknown>, sessionId?: string) => Promise<ToolResult>,
  ): void {
    this.tools.set(name, handler);
  }

  async execute(toolCall: ToolCall, sessionId?: string): Promise<ToolResult> {
    const handler = this.tools.get(toolCall.name);

    console.log(`[TOOL] Executing: ${toolCall.name}`);
    console.log(`[TOOL]   callId: ${toolCall.callId}`);
    console.log(`[TOOL]   sessionId: ${sessionId || "none"}`);
    console.log(`[TOOL]   args: ${JSON.stringify(toolCall.args)}`);

    if (!handler) {
      console.error(`[TOOL] Unknown tool: ${toolCall.name}`);
      return {
        toolName: toolCall.name,
        success: false,
        error: `Unknown tool: ${toolCall.name}`,
      };
    }

    try {
      console.log(`[TOOL] Running handler for ${toolCall.name}...`);
      const startTime = Date.now();
      const result = await handler(toolCall.args, sessionId);
      const duration = Date.now() - startTime;

      console.log(`[TOOL] ${toolCall.name} completed in ${duration}ms`);
      console.log(`[TOOL]   success: ${result.success}`);
      if (result.success && result.result) {
        console.log(
          `[TOOL]   result: ${JSON.stringify(result.result).slice(0, 200)}${JSON.stringify(result.result).length > 200 ? "..." : ""}`,
        );
      }
      if (!result.success && result.error) {
        console.log(`[TOOL]   error: ${result.error}`);
      }

      await this.eventBus.publish("tool.result", {
        toolName: toolCall.name,
        callId: toolCall.callId,
        sessionId,
        result: result.result,
        error: result.error,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[TOOL] ${toolCall.name} failed: ${errorMsg}`);
      const result = {
        toolName: toolCall.name,
        success: false,
        error: errorMsg,
      };

      await this.eventBus.publish("tool.result", {
        toolName: toolCall.name,
        callId: toolCall.callId,
        sessionId,
        result: undefined,
        error: result.error,
      });

      return result;
    }
  }

  /**
   * Get all registered tool definitions for the LLM
   * Uses tool definitions from prompts module to prevent schema/handler drift
   */
  getToolDefinitions(): ToolDefinition[] {
    return Object.values(TOOL_REGISTRY).map((entry) => entry.schema);
  }

  /**
   * Register default tools from TOOL_REGISTRY
   * Wraps handlers to inject dependencies (chromaStore, discordApiClient)
   */
  private registerDefaultTools(): void {
    const baseDeps: ToolDependencies = {
      chromaStore: this.chromaStore,
      openPlannerClient: this.openPlannerClient,
      discordApiClient: this.discordApiClient,
    };

    const toolAliases: Record<string, string> = {
      // LLM may generate singular form, but tools are registered with plural
      "discord.channel.message": "discord.channel.messages",
    };

    for (const [name, entry] of Object.entries(TOOL_REGISTRY)) {
      this.registerTool(name, (args, sessionId) =>
        entry.handler(args, { ...baseDeps, sessionId }),
      );
    }

    // Register tool aliases for common typos/variations
    for (const [alias, actual] of Object.entries(toolAliases)) {
      if (TOOL_REGISTRY[actual]) {
        this.registerTool(alias, (args, sessionId) =>
          TOOL_REGISTRY[actual].handler(args, { ...baseDeps, sessionId }),
        );
      }
    }
  }
}

export type { ToolCall, ToolDependencies, ToolExecutorOptions } from "./types.js";
