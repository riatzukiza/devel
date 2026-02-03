/**
 * Ollama LLM Provider
 * 
 * Integrates with local Ollama instance for qwen3-vl:2instruct.
 */

import type {
  Session,
  CephalonEvent,
  CephalonPolicy,
  ToolCall,
  ToolResult,
  ChatMessage,
} from "../types/index.js";
import type { ToolDefinition } from "../prompts/index.js";
import { messageToOllamaFormat } from "./message.js";
import { ollamaRequestQueue } from "./ollama-request-queue.js";

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  complete(
    messages: ChatMessage[],
    options?: { queueKey?: string },
  ): Promise<string>;
  completeWithTools(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    options?: { queueKey?: string },
  ): Promise<{ content?: string; toolCalls?: ToolCall[] }>;
}

/**
 * Parse tool calls from Ollama's native tool_calls array format
 */
export function parseNativeToolCalls(
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

// ============================================================================
// Ollama Provider
// ============================================================================

export class OllamaProvider implements LLMProvider {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  /**
   * Make a chat completion request to Ollama
   */
  async complete(
    messages: ChatMessage[],
    options: { queueKey?: string } = {},
  ): Promise<string> {
    const queueKey = options.queueKey ?? "default";

    return ollamaRequestQueue.enqueue(queueKey, async () => {
    console.log(`[LLM] Request to ${this.config.model}`);
    console.log(`[LLM] Messages count: ${messages.length}`);

    // Log each message and detect images
    let totalImages = 0;
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const ollamaMsg = messageToOllamaFormat(msg);

      // Log image count
      if (ollamaMsg.images && ollamaMsg.images.length > 0) {
        totalImages += ollamaMsg.images.length;
        console.log(
          `[LLM]   [${i + 1}/${messages.length}] ${msg.role}: ${ollamaMsg.images.length} image(s)`,
        );
      } else {
        const preview = ollamaMsg.content.slice(0, 100).replace(/\n/g, " ");
        console.log(
          `[LLM]   [${i + 1}/${messages.length}] ${msg.role}: ${preview}${ollamaMsg.content.length > 100 ? "..." : ""}`,
        );
      }
    }

    if (totalImages > 0) {
      console.log(`[LLM] Total images in request: ${totalImages}`);
    }

    // Convert messages to Ollama format
    const ollamaMessages = messages.map(messageToOllamaFormat);

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          messages: ollamaMessages,
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
    });
  }

  /**
   * Complete with tool calling support
   */
  async completeWithTools(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    options: { queueKey?: string } = {},
  ): Promise<{ content?: string; toolCalls?: ToolCall[] }> {
    const queueKey = options.queueKey ?? "default";

    return ollamaRequestQueue.enqueue(queueKey, async () => {
    console.log(`[LLM] Tool request to ${this.config.model}`);
    console.log(`[LLM] Messages: ${messages.length}, Tools: ${tools.length}`);

    // Log tools being sent
    for (const tool of tools) {
      console.log(`[LLM]   Tool: ${tool.name} - ${tool.description}`);
    }

    // Log messages with image detection
    let totalImages = 0;
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const ollamaMsg = messageToOllamaFormat(msg);
      if (ollamaMsg.images && ollamaMsg.images.length > 0) {
        totalImages += ollamaMsg.images.length;
        console.log(
          `[LLM]   [${i + 1}/${messages.length}] ${msg.role}: ${ollamaMsg.images.length} image(s)`,
        );
      }
    }
    if (totalImages > 0) {
      console.log(`[LLM] Total images in request: ${totalImages}`);
    }

    // Convert messages to Ollama format
    const ollamaMessages = messages.map(messageToOllamaFormat);

    // Log full prompt (text only)
    const combinedPrompt = ollamaMessages
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
          messages: ollamaMessages,
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
            temperature: this.config.temperature ?? 0.5,
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

      if (message.tool_calls) {
        console.log(
          `[LLM] Tool calls detected (native format): ${message.tool_calls.length}`,
        );
        toolCalls = parseNativeToolCalls(message.tool_calls as Array<{ function: { name: string; arguments: unknown } }>);
      }

      if (toolCalls.length > 0) {
        console.log(`[LLM] Returning ${toolCalls.length} tool call(s)`);
        return { toolCalls };
      }

      console.log(
        `[LLM] Response: ${messageContent.slice(0, 200)}${messageContent.length > 200 ? "..." : ""}`,
      );
      return { content: messageContent };
    });
  }
}

export { createOllamaConfig } from "../config/defaults.js";
