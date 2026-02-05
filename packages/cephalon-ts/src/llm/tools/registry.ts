/**
 * Tool Registry
 *
 * Single source of truth for all tools.
 * Prevents drift between tool definitions (schema) and implementations (handler).
 */

import type { ToolDefinition } from "../../prompts/index.js";
import type { ToolResult } from "../../types/index.js";
import type { ToolRegistryEntry, ToolDependencies } from "./types.js";

/**
 * Single source of truth for all tools.
 * Prevents drift between tool definitions (schema) and implementations (handler).
 */
export const TOOL_REGISTRY: Record<string, ToolRegistryEntry> = {
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

      let results: Array<{ id: string; content: string; similarity: number }> =
        [];

      try {
        if (deps.openPlannerClient) {
          const searchResults = await deps.openPlannerClient.searchFts(query, {
            limit,
            session: deps.sessionId,
          });
          results = searchResults.map((r) => ({
            id: r.id,
            content: r.text ?? "",
            similarity: r.score,
          }));
          console.log(`[TOOL]   Found ${results.length} memories from OpenPlanner`);
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
      const { memory_id, priority = 10 } = args as {
        memory_id: string;
        priority: number;
      };

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
        "Fetch messages from a Discord channel. CRITICAL: You MUST use discord.list.channels FIRST to discover available channels. Do NOT guess channel IDs - you will get 'Missing Access' errors. If you receive 'Missing Access', use one of the channels returned in available_channels.",
      parameters: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
            description:
              "The Discord channel ID. CRITICAL: Call discord.list.channels FIRST to get valid IDs. Guessing will fail with 'Missing Access'.",
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
      const {
        channel_id,
        limit = 50,
        before,
        after,
        around,
      } = args as {
        channel_id: string;
        limit?: number;
        before?: string;
        after?: string;
        around?: string;
      };

      try {
        const result = await deps.discordApiClient.fetchChannelMessages(
          channel_id,
          {
            limit,
            before,
            after,
            around,
          },
        );

        // [ImageLogger] Log images found in channel messages
        let totalImages = 0;
        const imageTypes: Record<string, number> = {};

        for (const msg of result.messages) {
          if (msg.attachments && msg.attachments.length > 0) {
            for (const att of msg.attachments) {
              const isImage =
                att.contentType?.startsWith("image/") ||
                /\.(jpg|jpeg|png|gif|webp|bmp|webp|avif)$/i.test(
                  att.filename || "",
                );

              if (isImage) {
                totalImages++;
                const ext = (att.filename?.split(".").pop()?.toLowerCase() ||
                  att.contentType?.split("/")[1] ||
                  "unknown") as string;
                imageTypes[ext] = (imageTypes[ext] || 0) + 1;

                console.log(
                  `[ImageLogger] discord.channel.messages found image: <${att.contentType || "unknown"}> ${att.filename || "unnamed"} URL: ${att.url}`,
                );
              }
            }
          }

          // Also check embeds for images (rich media)
          // Cast embeds to extended DiscordEmbed type for thumbnail/image access
          const embeds = msg.embeds as Array<{
            type?: string;
            thumbnail?: { url?: string };
            image?: { url?: string };
          }>;

          if (embeds && embeds.length > 0) {
            for (const embed of embeds) {
              if (embed.type === "image" || embed.type === "gifv") {
                totalImages++;
                const ext = embed.type === "gifv" ? "gif" : "embed_image";
                imageTypes[ext] = (imageTypes[ext] || 0) + 1;
                console.log(
                  `[ImageLogger] discord.channel.messages found embed image: <${embed.type}>`,
                );
              }
              // Check thumbnail in non-image embeds
              if (embed.thumbnail?.url && embed.type !== "image") {
                totalImages++;
                imageTypes["thumbnail"] = (imageTypes["thumbnail"] || 0) + 1;
                console.log(
                  `[ImageLogger] discord.channel.messages found embed thumbnail: ${embed.thumbnail.url}`,
                );
              }
              // Check for images in embed.image property
              if (embed.image?.url) {
                totalImages++;
                imageTypes["embed_image"] =
                  (imageTypes["embed_image"] || 0) + 1;
                console.log(
                  `[ImageLogger] discord.channel.messages found embed.image: ${embed.image.url}`,
                );
              }
            }
          }
        }

        if (totalImages > 0) {
          console.log(
            `[ImageLogger] discord.channel.messages summary: ${totalImages} total images found`,
          );
          console.log(
            `[ImageLogger] Breakdown by type: ${JSON.stringify(imageTypes)}`,
          );
        } else {
          console.log(
            `[ImageLogger] discord.channel.messages: No images found in ${result.messages.length} messages`,
          );
        }

        return {
          toolName: "discord.channel.messages",
          success: true,
          result: { messages: result.messages, count: result.count },
        };
      } catch (error) {
        // On error, return available channels so the LLM can discover correct ones
        let accessibleChannels: Array<{
          id: string;
          name: string;
          guildId: string;
          type: string;
        }> = [];
        try {
          const channelsResult = await deps.discordApiClient.listChannels();
          accessibleChannels = channelsResult.channels;
        } catch {
          // Best effort - if we can't list channels, just return the error
        }

        return {
          toolName: "discord.channel.messages",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          available_channels: accessibleChannels,
          available_channels_count: accessibleChannels.length,
          hint:
            accessibleChannels.length > 0
              ? "Channel not accessible. Use one of the available_channels above. Call discord.list.channels to get more details."
              : "No accessible channels found. Make sure the bot is in the server and has proper permissions.",
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
      const {
        channel_id,
        oldest_seen_id,
        limit = 50,
      } = args as {
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
      const {
        user_id,
        limit = 50,
        before,
      } = args as {
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
      const {
        scope,
        channel_id,
        user_id,
        query,
        limit = 50,
        before,
        after,
      } = args as {
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
      const { channel_id, text: rawText, reply_to } = args as {
        channel_id: string;
        text: string;
        reply_to?: string;
      };

      const MAX_LENGTH = 3900;
      if (rawText.length > MAX_LENGTH) {
        console.warn(
          `[TOOL] discord.send: Truncating text from ${rawText.length} to ${MAX_LENGTH} characters`,
        );
      }
      const text = rawText.substring(0, MAX_LENGTH);

      try {
        const result = await deps.discordApiClient.sendMessage(
          channel_id,
          text,
          reply_to,
        );
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

  get_current_time: {
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
