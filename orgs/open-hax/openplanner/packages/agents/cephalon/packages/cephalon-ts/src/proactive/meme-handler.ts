/**
 * Meme Channel Handler
 * 
 * Automatically forwards GIFs and images to configured meme channels.
 * 
 * Configuration in policy.edn:
 * {:meme-channels ["123456789012345678" "987654321098765432"]}
 */

import type { InMemoryEventBus } from "@promethean-os/event";
import type { CephalonPolicy } from "../types/index.js";
import type { DiscordApiClient } from "../discord/api-client.js";

export interface MemeChannelConfig {
  memeChannelIds: string[];
}

/**
 * Create meme channel handler with configured channel IDs
 */
export function createMemeChannelHandler(
  eventBus: InMemoryEventBus,
  discordApiClient: DiscordApiClient,
  config: MemeChannelConfig
): () => Promise<void> {
  console.log(`[MemeHandler] Initialized with ${config.memeChannelIds.length} meme channel(s)`);
  console.log(`[MemeHandler] Channels: ${config.memeChannelIds.join(', ')}`);

  let isRunning = false;

  return async () => {
    if (isRunning) {
      console.log(`[MemeHandler] Handler already running, skipping`);
      return;
    }
    isRunning = true;

    console.log(`[MemeHandler] Subscribing to events`);

    // Subscribe to Discord message events
    await eventBus.subscribe("discord.message.created", "meme-handler", async (event) => {
      await handleMessageCreated(event, discordApiClient, config);
    });

    console.log(`[MemeHandler] Subscribed to discord.message.created`);
  };
}

/**
 * Handle new message - detect GIFs and forward to meme channels
 */
async function handleMessageCreated(
  event: { payload: unknown },
  discordApiClient: DiscordApiClient,
  config: MemeChannelConfig
): Promise<void> {
  const payload = event.payload as {
    channelId: string;
    guildId?: string;
    authorId: string;
    attachments?: Array<{
      id: string;
      filename: string;
      contentType?: string;
      url: string;
    }>;
    embeds?: Array<{
      type?: string;
      thumbnail?: { url?: string };
      image?: { url?: string };
      url?: string;
    }>;
  };

  // Check if message is from a meme channel (don't forward from meme channels to avoid loops)
  if (config.memeChannelIds.includes(payload.channelId)) {
    return;
  }

  // Collect GIF/image URLs from attachments
  const imageUrls: string[] = [];

  for (const att of payload.attachments || []) {
    const isGif = att.contentType === 'image/gif' || 
                  att.filename?.toLowerCase().endsWith('.gif');
    
    if (isGif || att.contentType?.startsWith('image/')) {
      console.log(`[MemeHandler] Found image in ${payload.channelId}: ${att.filename}`);
      imageUrls.push(att.url);
    }
  }

  // Collect GIF URLs from embeds
  for (const embed of payload.embeds || []) {
    if (embed.type === 'gifv' || embed.type === 'image') {
      if (embed.url) {
        console.log(`[MemeHandler] Found GIF embed: ${embed.url}`);
        imageUrls.push(embed.url);
      }
    }
    if (embed.thumbnail?.url) {
      console.log(`[MemeHandler] Found embed thumbnail: ${embed.thumbnail.url}`);
      imageUrls.push(embed.thumbnail.url);
    }
    if (embed.image?.url) {
      console.log(`[MemeHandler] Found embed image: ${embed.image.url}`);
      imageUrls.push(embed.image.url);
    }
  }

  if (imageUrls.length === 0) {
    return;
  }

  console.log(`[MemeHandler] Forwarding ${imageUrls.length} image(s) to meme channels`);

  // Forward to each configured meme channel
  for (const memeChannelId of config.memeChannelIds) {
    try {
      for (const imageUrl of imageUrls) {
        const messageId = await sendImageToChannel(discordApiClient, memeChannelId, imageUrl);
        console.log(`[MemeHandler] Sent image to ${memeChannelId}: ${messageId}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[MemeHandler] Failed to send to ${memeChannelId}: ${errorMsg}`);
    }
  }
}

/**
 * Send image URL to a Discord channel
 */
async function sendImageToChannel(
  discordApiClient: DiscordApiClient,
  channelId: string,
  imageUrl: string
): Promise<string> {
  // Discord doesn't support sending images via API without attachment upload
  // So we send a message with the URL
  const result = await discordApiClient.sendMessage(
    channelId,
    `🎭 ${imageUrl}`,
    undefined
  );
  return result.messageId;
}

/**
 * Parse meme channel configuration from policy
 */
export function parseMemeConfig(policy: CephalonPolicy): MemeChannelConfig {
  // Look for meme-channels in policy output config or custom section
  const memeChannelIds: string[] = [];

  // Check output.defaultChannelId as potential meme channel
  if (policy.output?.defaultChannelId) {
    memeChannelIds.push(policy.output.defaultChannelId);
  }

  // In a full implementation, you'd parse from a dedicated :meme-channels key
  // For now, we use the default output channel as the meme channel

  console.log(`[MemeHandler] Parsed config: ${memeChannelIds.length} meme channel(s)`);

  return {
    memeChannelIds
  };
}

/**
 * Check if a URL is a GIF
 */
export function isGifUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith('.gif') || 
         lower.includes('animated') || 
         lower.includes('gifv');
}

/**
 * Check if content type indicates GIF
 */
export function isGifContentType(contentType?: string): boolean {
  return contentType === 'image/gif' || 
         contentType === 'image/gifv';
}
