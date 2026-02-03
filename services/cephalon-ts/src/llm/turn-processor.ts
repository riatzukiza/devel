/**
 * Turn Processor
 *
 * Orchestrates LLM calls and tool execution.
 * Implements the proper tool-calling loop as per Ollama's agent pattern.
 */

import { InMemoryEventBus, type EventBus } from "@promethean-os/event";
import type {
  Session,
  CephalonEvent,
  CephalonPolicy,
  ToolCall,
  ChatMessage,
  OllamaToolCall,
} from "../types/index.js";
import { OllamaProvider, type LLMProvider, createOllamaConfig } from "./provider.js";
import type { ToolExecutor } from "./tools/executor.js";
import type { MemoryStore } from "../core/memory-store.js";
import type { DiscordApiClient } from "../discord/api-client.js";
import {
  assembleContext,
  createHeuristicTokenizer,
  generatePersonaHeader,
  getCurrentPersonaName,
} from "../context/assembler.js";
import {
  mintFromDiscordEvent,
  mintFromLLMResponse,
  mintFromToolCall,
} from "../core/minting.js";

/**
 * Turn processor that orchestrates LLM calls and tool execution
 */
export class TurnProcessor {
  private provider: LLMProvider;
  private executor: ToolExecutor;
  private memoryStore: MemoryStore;
  private eventBus: EventBus;
  private policy: CephalonPolicy;
  private discordApiClient: DiscordApiClient;

  constructor(
    provider: LLMProvider,
    executor: ToolExecutor,
    memoryStore: MemoryStore,
    eventBus: EventBus,
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
      const messages: ChatMessage[] = [...context.messages];
      const tools = this.executor.getToolDefinitions();

      // For tick events, add the entertainment persona header
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

        // Generate entertainment persona header
        const personaHeader = generatePersonaHeader(
          tickPayload.tickNumber,
          tickPayload.recentActivity,
        );

        if (personaHeader) {
          messages.push(personaHeader);
          console.log(
            `[TurnProcessor] Persona: ${getCurrentPersonaName(tickPayload.tickNumber)}`,
          );
        }

        // Add user message with reflection prompt
        messages.push({
          role: "user" as const,
          content: tickPayload.reflectionPrompt || "Respond naturally in this persona.",
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
        const result = await this.provider.completeWithTools(messages, tools, {
          queueKey: session.id,
        });

        // If the model returned tool calls, execute them
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log(
            `[TurnProcessor] Executing ${result.toolCalls.length} tool call(s)`,
          );

          // Create assistant message with tool_calls for the history
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: result.content || "",
            tool_calls: result.toolCalls.map(
              (tc: ToolCall): OllamaToolCall => ({
                type: "function",
                function: {
                  name: tc.name,
                  arguments: tc.args,
                },
              }),
            ),
          };
          messages.push(assistantMessage);

          // Execute each tool call and append results to history
          for (const toolCall of result.toolCalls) {
            const toolResult = await this.executor.execute(
              toolCall,
              session.id,
            );
            console.log(
              `[TurnProcessor] Tool ${toolCall.name}:`,
              toolResult.success ? "success" : toolResult.error,
            );

            // Append tool result to conversation history (Ollama format: role="tool", tool_name, content)
            const toolResultMessage: ChatMessage = {
              role: "tool",
              tool_name: toolCall.name,
              content: toolResult.success
                ? JSON.stringify(toolResult.result ?? null)
                : JSON.stringify({
                    error: toolResult.error ?? "unknown error",
                  }),
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
            eventChannelId === targetChannelId ||
            // Skip if author is in ignored list
            (eventAuthorId &&
              outputConfig?.ignoredAuthorIds?.includes(eventAuthorId)) ||
            // Skip if bot messages and feedback loop prevention enabled
            (outputConfig?.preventFeedbackLoops && isBot);

          if (shouldSkipOutput) {
            console.log(
              `[TurnProcessor] Skipping output to ${targetChannelId} (feedback loop prevention)`,
            );
          } else {
            try {
              await this.discordApiClient.sendMessage(
                targetChannelId,
                finalContent,
              );
            } catch (error) {
              const errorMsg =
                error instanceof Error ? error.message : String(error);
              console.error(
                `[TurnProcessor] Failed to send message to channel ${targetChannelId}: ${errorMsg}`,
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
