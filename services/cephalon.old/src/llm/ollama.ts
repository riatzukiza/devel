/**
 * Ollama LLM Provider for Cephalon
 *
 * Integrates with local Ollama instance for qwen3-vl:2b-instruct
 */

import { InMemoryEventBus } from "@promethean-os/event";
import type {
  Session,
  CephalonEvent,
  CephalonPolicy,
  ToolCall,
  ToolResult,
} from "../types/index.js";
import {
  assembleContext,
  createHeuristicTokenizer,
} from "../context/assembler.js";
import { InMemoryMemoryStore } from "../core/memory-store.js";
import {
  mintFromDiscordEvent,
  mintFromLLMResponse,
  mintFromToolCall,
} from "../core/minting.js";
import { DiscordApiClient } from "../discord/api-client.js";

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  complete(messages: Array<{ role: string; content: string }>): Promise<string>;
  completeWithTools(
    messages: import("../types/index.js").ChatMessage[],
    tools: ToolDefinition[],
  ): Promise<{ content?: string; toolCalls?: ToolCall[] }>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required: string[];
  };
}

export class OllamaProvider implements LLMProvider {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  /**
   * Make a chat completion request to Ollama
   */
  async complete(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    console.log(`[LLM] Request to ${this.config.model}`);
    console.log(`[LLM] Messages count: ${messages.length}`);

    // Log each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const preview = msg.content.slice(0, 100).replace(/\n/g, " ");
      console.log(
        `[LLM]   [${i + 1}/${messages.length}] ${msg.role}: ${preview}${msg.content.length > 100 ? "..." : ""}`,
      );
    }

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: false,
        options: {
          temperature: this.config.temperature ?? 0.7,
          num_predict: this.config.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    interface OllamaChatResponse {
      message?: {
        content?: string;
      };
    }

    const data = (await response.json()) as unknown as OllamaChatResponse;
    const content = data.message?.content || "";

    console.log(
      `[LLM] Response: ${content.slice(0, 200)}${content.length > 200 ? "..." : ""}`,
    );
    return content;
  }

  /**
   * Complete with tool calling support
   */
  async completeWithTools(
    messages: import("../types/index.js").ChatMessage[],
    tools: ToolDefinition[],
  ): Promise<{ content?: string; toolCalls?: ToolCall[] }> {
    console.log(`[LLM] Tool request to ${this.config.model}`);
    console.log(`[LLM] Messages: ${messages.length}, Tools: ${tools.length}`);

    // Log tools being sent
    for (const tool of tools) {
      console.log(`[LLM]   Tool: ${tool.name} - ${tool.description}`);
    }

    // Log full prompt for debugging
    const combinedPrompt = messages
      .map((m) => `[${m.role}] ${m.content}`)
      .join("\n");
    console.log(
      `[LLM] Full prompt:\n${combinedPrompt.slice(0, 500)}${combinedPrompt.length > 500 ? "\n..." : ""}`,
    );

    // Ollama's tool calling format
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        tools: tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        stream: false,
        options: {
          temperature: this.config.temperature ?? 0.0, // Low temp for reliable tool calls
          num_predict: this.config.maxTokens ?? 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    interface OllamaResponse {
      message?: {
        content?: string;
        tool_calls?: Array<{ function: { name: string; arguments: string } }>;
      };
    }

    const data = (await response.json()) as unknown as OllamaResponse;
    const message = data.message || { content: "", tool_calls: [] };
    const messageContent = message.content || "";

    console.log(`[LLM] Raw response: ${JSON.stringify(data).slice(0, 300)}...`);

    let toolCalls: ToolCall[] = [];

    // Try native tool_calls array format first
    if (message.tool_calls) {
      console.log(
        `[LLM] Tool calls detected (native format): ${message.tool_calls.length}`,
      );
      toolCalls = parseNativeToolCalls(message.tool_calls);
    }

    // Try parsing markdown-wrapped JSON from content (qwen3 format)
    if (toolCalls.length === 0 && messageContent) {
      console.log(
        `[LLM] Checking for markdown tool calls in content: "${messageContent.slice(0, 100)}..."`,
      );
      toolCalls = parseMarkdownToolCalls(messageContent);
    }

    if (toolCalls.length > 0) {
      console.log(`[LLM] Returning ${toolCalls.length} tool call(s)`);
      return { toolCalls };
    }

    console.log(
      `[LLM] Response: ${messageContent.slice(0, 200)}${messageContent.length > 200 ? "..." : ""}`,
    );
    return { content: messageContent };
  }
}

/**
 * Parse tool calls from Ollama's native tool_calls array format
 */
function parseNativeToolCalls(
  toolCalls: Array<{ function: { name: string; arguments: unknown } }>,
): ToolCall[] {
  const result: ToolCall[] = [];

  for (const tc of toolCalls) {
    console.log(`[LLM]   Tool: ${tc.function.name}`);
    // Arguments can be either an object or a JSON string
    let args: Record<string, unknown> = {};
    if (tc.function.arguments) {
      if (typeof tc.function.arguments === "string") {
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }
      } else if (typeof tc.function.arguments === "object") {
        args = tc.function.arguments as Record<string, unknown>;
      }
    }
    console.log(`[LLM]   Args: ${JSON.stringify(args)}`);
    result.push({
      type: "tool_call",
      name: tc.function.name,
      args,
      callId: crypto.randomUUID(),
    });
  }

  return result;
}

/**
 * Parse tool calls from markdown-wrapped JSON in content (qwen3 format)
 * Matches ```json {"name": "..."} ``` or ``` {"name": "..."} ```
 */
function parseMarkdownToolCalls(content: string): ToolCall[] {
  const result: ToolCall[] = [];

  // Match ```json {"name": "..."} ``` or ``` {"name": "..."} ``` with optional whitespace
  // Handles malformed output like ```\njson\n\n{"name": "..."}\n```
  const markdownToolCalls = content.match(
    /```(?:json)?\s*(\{[^}]*"name"[^}]*\})\s*```/g,
  );

  if (!markdownToolCalls) {
    return result;
  }

  console.log(`[LLM] Found ${markdownToolCalls.length} markdown tool call(s)`);

  for (const match of markdownToolCalls) {
    const jsonContent = match
      .replace(/```(?:json)?\s*/, "")
      .replace(/\s*```$/, "");
    try {
      const parsed = JSON.parse(jsonContent);
      console.log(`[LLM] Parsed JSON: ${JSON.stringify(parsed)}`);
      if (parsed.name) {
        // Normalize tool name (memory_lookup -> memory.lookup)
        const normalizedName = parsed.name.replace(/_/g, ".");
        const args = parsed.arguments || parsed.args || {};
        console.log(
          `[LLM] Tool call detected (markdown format): ${normalizedName}`,
        );
        console.log(`[LLM]   Args: ${JSON.stringify(args)}`);
        result.push({
          type: "tool_call",
          name: normalizedName,
          args,
          callId: crypto.randomUUID(),
        });
      }
    } catch (e) {
      console.log(`[LLM] Failed to parse markdown tool call: ${e}`);
    }
  }

  return result;
}

// Tool registry entry: combines schema (ToolDefinition) with handler
type ToolRegistryEntry = {
  schema: ToolDefinition;
  handler: (args: Record<string, unknown>, deps: ToolDependencies) => Promise<ToolResult>;
};

type ToolDependencies = {
  chromaStore?: import("../chroma/client.js").ChromaMemoryStore;
  discordApiClient: DiscordApiClient;
};

/**
 * Single source of truth for all tools.
 * Prevents drift between tool definitions (schema) and implementations (handler).
 */
const TOOL_REGISTRY: Record<string, ToolRegistryEntry> = {
  "memory.lookup": {
    schema: {
      name: "memory.lookup",
      description:
        "Semantic search for memories in the database using a query string. Returns relevant memories with similarity scores. Ask natural language questions.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant memories",
          },
          limit: {
            type: "number",
            description: "Maximum number of memories to return (default: 5)",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args, deps) => {
      const { query, limit = 5 } = args as { query: string; limit: number };

      console.log(`[TOOL] memory.lookup called`);
      console.log(`[TOOL]   query: "${query}"`);
      console.log(`[TOOL]   limit: ${limit}`);

      let results: Array<{ id: string; content: string; similarity: number }> = [];

      try {
        if (deps.chromaStore) {
          const searchResults = await deps.chromaStore.search(query, { limit });
          results = searchResults.map((r) => ({
            id: r.id,
            content: r.content,
            similarity: r.distance,
          }));
          console.log(`[TOOL]   Found ${results.length} memories from Chroma`);
        }

        return {
          toolName: "memory.lookup",
          success: true,
          result: {
            query,
            limit,
            results,
            note: results.length === 0 ? "No matches found" : undefined,
          },
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[TOOL] memory.lookup failed: ${errorMsg}`);
        return {
          toolName: "memory.lookup",
          success: false,
          error: errorMsg,
        };
      }
    },
  },

  "memory.pin": {
    schema: {
      name: "memory.pin",
      description:
        "Pin a memory to keep it in the context window. Use memory.lookup to find memory IDs",
      parameters: {
        type: "object",
        properties: {
          memory_id: {
            type: "string",
            description: "The ID of the memory to pin",
          },
          priority: {
            type: "number",
            description: "Priority level for the pinned memory (default: 10)",
          },
        },
        required: ["memory_id"],
      },
    },
    handler: async (args) => {
      const { memory_id, priority = 10 } = args as { memory_id: string; priority: number };

      console.log(`[TOOL] memory.pin called`);
      console.log(`[TOOL]   memory_id: ${memory_id}`);
      console.log(`[TOOL]   priority: ${priority}`);

      return {
        toolName: "memory.pin",
        success: true,
        result: { memory_id, priority, pinned: true },
      };
    },
  },

  "discord.channel.messages": {
    schema: {
      name: "discord.channel.messages",
      description:
        "Fetch messages from a Discord channel. Use discord.list.channels to find a channel.",
      parameters: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
            description:
              "The Discord channel ID to fetch messages from. Use discord.list.channels to find a channel",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of messages to fetch (default: 50, max: 100)",
          },
          before: {
            type: "string",
            description: "Fetch messages before this message ID",
          },
          after: {
            type: "string",
            description: "Fetch messages after this message ID",
          },
          around: {
            type: "string",
            description: "Fetch messages around this message ID",
          },
        },
        required: ["channel_id"],
      },
    },
    handler: async (args, deps) => {
      const { channel_id, limit = 50, before, after, around } = args as {
        channel_id: string;
        limit?: number;
        before?: string;
        after?: string;
        around?: string;
      };

      try {
        const result = await deps.discordApiClient.fetchChannelMessages(channel_id, {
          limit,
          before,
          after,
          around,
        });
        return {
          toolName: "discord.channel.messages",
          success: true,
          result: { messages: result.messages, count: result.count },
        };
      } catch (error) {
        return {
          toolName: "discord.channel.messages",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  "discord.channel.scroll": {
    schema: {
      name: "discord.channel.scroll",
      description:
        "Scroll through channel messages (sugar over messages with before=oldest-seen-id). Use discord.list.channels to find a channel",
      parameters: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
            description: "The Discord channel ID to scroll through",
          },
          oldest_seen_id: {
            type: "string",
            description:
              "The oldest message ID already seen - fetch messages before this",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of messages to fetch (default: 50, max: 100)",
          },
        },
        required: ["channel_id", "oldest_seen_id"],
      },
    },
    handler: async (args, deps) => {
      const { channel_id, oldest_seen_id, limit = 50 } = args as {
        channel_id: string;
        oldest_seen_id: string;
        limit?: number;
      };

      try {
        const result = await deps.discordApiClient.scrollChannelMessages(
          channel_id,
          oldest_seen_id,
          limit,
        );
        return {
          toolName: "discord.channel.scroll",
          success: true,
          result: {
            messages: result.messages,
            count: result.count,
            oldest_seen_id,
          },
        };
      } catch (error) {
        return {
          toolName: "discord.channel.scroll",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  "discord.dm.messages": {
    schema: {
      name: "discord.dm.messages",
      description: "Fetch messages from a DM channel with a user",
      parameters: {
        type: "object",
        properties: {
          user_id: {
            type: "string",
            description: "The Discord user ID to open DM with",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of messages to fetch (default: 50, max: 100)",
          },
          before: {
            type: "string",
            description: "Fetch messages before this message ID",
          },
        },
        required: ["user_id"],
      },
    },
    handler: async (args, deps) => {
      const { user_id, limit = 50, before } = args as {
        user_id: string;
        limit?: number;
        before?: string;
      };

      try {
        const result = await deps.discordApiClient.fetchDMMessages(user_id, {
          limit,
          before,
        });
        return {
          toolName: "discord.dm.messages",
          success: true,
          result: {
            messages: result.messages,
            count: result.count,
            dm_channel_id: result.dmChannelId,
          },
        };
      } catch (error) {
        return {
          toolName: "discord.dm.messages",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  "discord.search": {
    schema: {
      name: "discord.search",
      description:
        "Search messages in a Discord channel or DM. Supports filtering by query text and user ID. Falls back to client-side filtering if native search unavailable.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            description: 'Search scope: "channel" or "dm"',
            enum: ["channel", "dm"],
          },
          channel_id: {
            type: "string",
            description: "Channel ID to search (required if scope=channel)",
          },
          user_id: {
            type: "string",
            description: "User ID for DM search (required if scope=dm)",
          },
          query: {
            type: "string",
            description: "Optional text to search for in message content",
          },
          limit: {
            type: "number",
            description: "Maximum results to return (default: 50, max: 100)",
          },
          before: {
            type: "string",
            description: "Fetch messages before this message ID",
          },
          after: {
            type: "string",
            description: "Fetch messages after this message ID",
          },
        },
        required: ["scope"],
      },
    },
    handler: async (args, deps) => {
      const { scope, channel_id, user_id, query, limit = 50, before, after } = args as {
        scope: "channel" | "dm";
        channel_id?: string;
        user_id?: string;
        query?: string;
        limit?: number;
        before?: string;
        after?: string;
      };

      try {
        const result = await deps.discordApiClient.searchMessages(scope, {
          channelId: channel_id,
          userId: user_id,
          query,
          limit,
          before,
          after,
        });
        return {
          toolName: "discord.search",
          success: true,
          result: {
            messages: result.messages,
            count: result.count,
            source: result.source,
          },
        };
      } catch (error) {
        return {
          toolName: "discord.search",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  "discord.send": {
    schema: {
      name: "discord.send",
      description:
        "Send a message to a Discord channel from discord.list.channels.",
      parameters: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
            description:
              "The Discord channel ID to send the message to. Obtained from discord.list.channels",
          },
          text: {
            type: "string",
            description: "The message text to send",
          },
          reply_to: {
            type: "string",
            description: "Optional message ID to reply to",
          },
        },
        required: ["channel_id", "text"],
      },
    },
    handler: async (args, deps) => {
      const { channel_id, text, reply_to } = args as {
        channel_id: string;
        text: string;
        reply_to?: string;
      };

      try {
        const result = await deps.discordApiClient.sendMessage(channel_id, text, reply_to);
        return {
          toolName: "discord.send",
          success: true,
          result: {
            messageId: result.messageId,
            channel_id: result.channelId,
            sent: result.sent,
            timestamp: result.timestamp,
          },
        };
      } catch (error) {
        return {
          toolName: "discord.send",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  "discord.list.servers": {
    schema: {
      name: "discord.list.servers",
      description:
        "List all Discord servers/guilds the bot is a member of. Use this BEFORE discord.list.channels",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    handler: async (_args, deps) => {
      try {
        const result = await deps.discordApiClient.listServers();
        return {
          toolName: "discord.list.servers",
          success: true,
          result: { servers: result.servers, count: result.count },
        };
      } catch (error) {
        return {
          toolName: "discord.list.servers",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  "discord.list.channels": {
    schema: {
      name: "discord.list.channels",
      description: "List all channels in a Discord server/guild",
      parameters: {
        type: "object",
        properties: {
          guild_id: {
            type: "string",
            description: `The Discord guild/server ID to list channels for (optional - if not provided, lists all accessible channels).
              Don't guess, use discord.list.servers first.
`,
          },
        },
        required: [],
      },
    },
    handler: async (args, deps) => {
      const { guild_id } = args as { guild_id?: string };

      try {
        const result = await deps.discordApiClient.listChannels(guild_id);
        return {
          toolName: "discord.list.channels",
          success: true,
          result: { channels: result.channels, count: result.count },
        };
      } catch (error) {
        return {
          toolName: "discord.list.channels",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  "get_current_time": {
    schema: {
      name: "get_current_time",
      description: "Get the current timestamp and ISO date",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    handler: async () => {
      return {
        toolName: "get_current_time",
        success: true,
        result: { timestamp: Date.now(), iso: new Date().toISOString() },
      };
    },
  },
};

/**
 * Tool executor that handles tool calls
 */
export class ToolExecutor {
  private tools: Map<
    string,
    (args: Record<string, unknown>) => Promise<ToolResult>
  > = new Map();
  private eventBus: InMemoryEventBus;
  private chromaStore?: import("../chroma/client.js").ChromaMemoryStore;
  private discordApiClient: DiscordApiClient;

  constructor(
    eventBus: InMemoryEventBus,
    chromaStore?: import("../chroma/client.js").ChromaMemoryStore,
    discordApiClient?: DiscordApiClient,
  ) {
    this.eventBus = eventBus;
    this.chromaStore = chromaStore;
    if (!discordApiClient) {
      throw new Error(
        "DiscordApiClient is required. Pass a single shared instance from main.ts",
      );
    }
    this.discordApiClient = discordApiClient;
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
    handler: (args: Record<string, unknown>) => Promise<ToolResult>,
  ): void {
    this.tools.set(name, handler);
  }

  async execute(toolCall: ToolCall, sessionId?: string): Promise<ToolResult> {
    const handler = this.tools.get(toolCall.name);

    console.log(`[TOOL] Executing: ${toolCall.name}`);
    console.log(`[TOOL]   callId: ${toolCall.callId}`);
    console.log(`[TOOL]   sessionId: ${sessionId || 'none'}`);
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
      const result = await handler(toolCall.args);
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
   * Uses TOOL_REGISTRY to ensure schema/handler alignment
   */
  getToolDefinitions(): ToolDefinition[] {
    return Object.values(TOOL_REGISTRY).map((entry) => entry.schema);
  }

  /**
   * Register default tools from TOOL_REGISTRY
   * Wraps handlers to inject dependencies (chromaStore, discordApiClient)
   */
  private registerDefaultTools(): void {
    const deps: ToolDependencies = {
      chromaStore: this.chromaStore,
      discordApiClient: this.discordApiClient,
    };

    for (const [name, entry] of Object.entries(TOOL_REGISTRY)) {
      this.registerTool(name, (args) => entry.handler(args, deps));
    }
  }
}

/**
 * Turn processor that orchestrates LLM calls and tool execution
 */
export class TurnProcessor {
  private provider: LLMProvider;
  private executor: ToolExecutor;
  private memoryStore: InMemoryMemoryStore;
  private eventBus: InMemoryEventBus;
  private policy: CephalonPolicy;
  private discordApiClient: DiscordApiClient;

  constructor(
    provider: LLMProvider,
    executor: ToolExecutor,
    memoryStore: InMemoryMemoryStore,
    eventBus: InMemoryEventBus,
    policy: CephalonPolicy,
    discordApiClient: DiscordApiClient,
  ) {
    this.provider = provider;
    this.executor = executor;
    this.memoryStore = memoryStore;
    this.eventBus = eventBus;
    this.policy = policy;
    this.discordApiClient = discordApiClient;
  }

  /**
   * Get the executor for direct tool calls (used by proactive behavior)
   */
  getExecutor(): ToolExecutor {
    return this.executor;
  }

  /**
   * Process a turn: receive event, assemble context, call LLM, execute tools
   * Implements the proper tool-calling loop as per Ollama's agent pattern
   */
  async processTurn(session: Session, event: CephalonEvent): Promise<void> {
    console.log(`[TurnProcessor] Processing turn for session ${session.id}`);

    // Validate inputs
    if (!event || typeof event !== "object") {
      console.error(
        `[TurnProcessor] Error: event is undefined or not an object`,
      );
      return;
    }
    if (!event.type) {
      console.error(`[TurnProcessor] Error: event.type is undefined`);
      return;
    }

    // Mint memory from the user's message
    const mintingConfig = {
      cephalonId: session.cephalonId,
      sessionId: session.id,
      schemaVersion: 1,
    };

    try {
      // Mint memory from the Discord event (user message)
      if (event.type.startsWith("discord.")) {
        await mintFromDiscordEvent(this.memoryStore, event, mintingConfig);
      }

      // Assemble context
      const tokenizer = createHeuristicTokenizer();
      const context = await assembleContext({
        windowTokens: this.policy.models.actor.maxContextTokens,
        policy: this.policy,
        session,
        currentEvent: event,
        tokenizer,
        memoryStore: this.memoryStore,
        retrieveRelated: async () => [], // TODO: Implement vector retrieval
      });

      // Build conversation history for tool loop
      const messages: import("../types/index.js").ChatMessage[] = [...context.messages];
      const tools = this.executor.getToolDefinitions();

      // For tick events, add the reflection prompt as a user message
      if (event.type === "system.tick") {
        const tickPayload = event.payload as {
          intervalMs: number;
          tickNumber: number;
          reflectionPrompt?: string;
          recentActivity?: Array<{
            type: string;
            preview: string;
            timestamp?: number;
          }>;
        };
        const recentPreview =
          tickPayload.recentActivity
            ?.map((a) => `[${a.type}] ${a.preview}`)
            .join("\n") || "No recent activity";
        messages.push({
          role: "user" as const,
          content: `TICK #${tickPayload.tickNumber}\n\nRecent activity:\n${recentPreview}\n\n${tickPayload.reflectionPrompt || "Reflect on this and respond naturally."}`,
        });
      }

      // Tool-calling loop: continue until no more tool calls
      let maxIterations = 10; // Prevent infinite loops
      let finalContent: string | undefined;

      while (maxIterations-- > 0) {
        console.log(
          `[TurnProcessor] LLM call (iteration ${10 - maxIterations})`,
        );

        // Call LLM with current conversation history
        const result = await this.provider.completeWithTools(messages, tools);

        // If the model returned tool calls, execute them
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log(
            `[TurnProcessor] Executing ${result.toolCalls.length} tool call(s)`,
          );

          // Create assistant message with tool_calls for the history
          const assistantMessage: import("../types/index.js").ChatMessage = {
            role: "assistant",
            content: result.content || "",
            tool_calls: result.toolCalls.map((tc): import("../types/index.js").OllamaToolCall => ({
              type: "function",
              function: {
                name: tc.name,
                arguments: tc.args,
              },
            })),
          };
          messages.push(assistantMessage);

          // Execute each tool call and append results to history
          for (const toolCall of result.toolCalls) {
            const toolResult = await this.executor.execute(toolCall, session.id);
            console.log(
              `[TurnProcessor] Tool ${toolCall.name}:`,
              toolResult.success ? "success" : toolResult.error,
            );

            // Append tool result to conversation history (Ollama format: role="tool", tool_name, content)
            const toolResultMessage: import("../types/index.js").ChatMessage = {
              role: "tool",
              tool_name: toolCall.name,
              content: toolResult.success
                ? JSON.stringify(toolResult.result ?? null)
                : JSON.stringify({ error: toolResult.error ?? "unknown error" }),
            };
            messages.push(toolResultMessage);

            // Mint memories for tool call and result
            await mintFromToolCall(
              this.memoryStore,
              {
                toolName: toolCall.name,
                args: toolCall.args,
                callId: crypto.randomUUID(),
              },
              {
                toolName: toolCall.name,
                callId: toolCall.callId,
                result: toolResult.result,
                error: toolResult.error,
              },
              mintingConfig,
              {
                eventId: event.id,
                timestamp: Date.now(),
              },
            );
          }

          // Continue the loop to get final response from LLM
          continue;
        }

        // No more tool calls - this is the final response
        finalContent = result.content;
        console.log(
          `[TurnProcessor] Final response: ${finalContent?.slice(0, 100) ?? "(empty)"}...`,
        );
        break;
      }

      if (maxIterations <= 0) {
        console.warn(`[TurnProcessor] Tool loop hit max iterations, stopping`);
      }

      // Mint memory from the final LLM response
      if (finalContent) {
        await mintFromLLMResponse(
          this.memoryStore,
          finalContent,
          mintingConfig,
        );

        // Output to configured channel with feedback loop prevention
        const outputConfig = this.policy.output;
        const targetChannelId = outputConfig?.defaultChannelId;

        if (targetChannelId) {
          // Check for feedback loop: don't respond if event came from target channel or from ignored author
          const eventPayload = event.payload as {
            channelId?: string;
            authorId?: string;
            authorIsBot?: boolean;
          };
          const eventChannelId = eventPayload?.channelId;
          const eventAuthorId = eventPayload?.authorId;
          const isBot = eventPayload?.authorIsBot;

          const shouldSkipOutput =
            // Skip if event came from the same channel (prevent echo)
            (eventChannelId === targetChannelId) ||
            // Skip if author is in ignored list
            (eventAuthorId && outputConfig?.ignoredAuthorIds?.includes(eventAuthorId)) ||
            // Skip if bot messages and feedback loop prevention enabled
            (outputConfig?.preventFeedbackLoops && isBot);

          if (shouldSkipOutput) {
            console.log(
              `[TurnProcessor] Skipping output to ${targetChannelId} (feedback loop prevention)`
            );
          } else {
            try {
              await this.discordApiClient.sendMessage(
                targetChannelId,
                finalContent,
              );
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              console.error(
                `[TurnProcessor] Failed to send message to channel ${targetChannelId}: ${errorMsg}`
              );
            }
          }
        }
      }

      // Log inclusion
      await this.memoryStore.logInclusion(context.inclusionLog);

      // Publish turn completed event for proactive behavior tracking
      const channelId =
        event.type.startsWith("discord.") || event.type === "system.proactive"
          ? (event.payload as { channelId?: string }).channelId
          : undefined;

      await this.eventBus.publish("session.turn.completed", {
        sessionId: session.id,
        eventType: event.type,
        channelId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`[TurnProcessor] Error:`, error);
      await this.eventBus.publish("session.turn.error", {
        sessionId: session.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  }
}

export { createOllamaConfig } from '../config/defaults.js';
