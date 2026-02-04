/**
 * Message Conversion Utilities
 * 
 * Converts ChatMessage format to Ollama API format.
 * Handles multimodal content (text + images).
 */

import type { ChatMessage } from "../types/index.js";

/**
 * Ollama API message format
 */
export interface OllamaApiMessage {
  role: string;
  content: string;
  images?: string[];
  tool_name?: string;
}

/**
 * Convert ChatMessage to Ollama API format
 */
export function messageToOllamaFormat(msg: ChatMessage): OllamaApiMessage {
  // Handle tool messages
  if (msg.role === "tool") {
    return {
      role: "tool",
      content: msg.content,
      tool_name: msg.tool_name,
    };
  }

  // Handle regular messages
  let content: string;
  let images: string[] | undefined;

  if (typeof msg.content === "string") {
    content = msg.content;
    images = msg.images;
  } else if (Array.isArray(msg.content)) {
    // Multimodal content - extract text parts, images are handled separately
    const textParts: string[] = [];
    images = [];
    for (const block of msg.content) {
      if (block.type === "text") {
        textParts.push(block.text);
      } else if (block.type === "image") {
        // For ChatMessageImage blocks, use the data directly
        images.push(block.data);
      }
    }
    content = textParts.join("\n");
    // If we also have images from the message property, append them
    if (msg.images && msg.images.length > 0) {
      images = [...images, ...msg.images];
    }
  } else {
    content = "";
    images = msg.images;
  }

  return {
    role: msg.role,
    content,
    images: images && images.length > 0 ? images : undefined,
  };
}

/**
 * Convert multiple messages to Ollama format
 */
export function messagesToOllamaFormat(
  messages: ChatMessage[]
): OllamaApiMessage[] {
  return messages.map(messageToOllamaFormat);
}
