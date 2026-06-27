import fs from "node:fs/promises";
import path from "node:path";
// @ts-ignore - unzipper has no types
import unzipper from "unzipper";
import type { EventEnvelopeV1 } from "../types.js";

type ChatGPTConversation = {
  title?: string;
  create_time?: number;
  update_time?: number;
  mapping?: Record<string, {
    id: string;
    message?: {
      author?: { role?: string };
      content?: { parts?: unknown[]; content_type?: string };
      create_time?: number;
      model?: string;
    };
    parent?: string;
    children?: string[];
  }>;
  current_node?: string;
};

type ImportedEvent = {
  id: string;
  ts: string;
  source: string;
  kind: string;
  project: string | null;
  session: string | null;
  message: string | null;
  role: string | null;
  author: string | null;
  model: string | null;
  tags: unknown | null;
  text: string | null;
  attachments: unknown[] | null;
  extra: unknown | null;
};

function extractTextFromParts(parts: unknown[]): string {
  const texts: string[] = [];
  for (const part of parts) {
    if (typeof part === "string") {
      texts.push(part);
    } else if (typeof part === "object" && part !== null) {
      if ("text" in part && typeof (part as any).text === "string") {
        texts.push((part as any).text);
      } else if ("content" in part && typeof (part as any).content === "string") {
        texts.push((part as any).content);
      }
    }
  }
  return texts.join("\n\n");
}

function parseChatGPTConversation(conversation: ChatGPTConversation): ImportedEvent[] {
  const events: ImportedEvent[] = [];
  const mapping = conversation.mapping ?? {};
  const sessionId = Object.keys(mapping)[0]?.split("-").slice(0, 5).join("-") ?? "unknown";

  for (const [nodeId, node] of Object.entries(mapping)) {
    const message = node.message;
    if (!message) continue;

    const role = message.author?.role ?? "unknown";
    const content = message.content;
    const ts = message.create_time
      ? new Date(message.create_time * 1000).toISOString()
      : new Date().toISOString();

    let text = "";
    if (content?.parts && Array.isArray(content.parts)) {
      text = extractTextFromParts(content.parts);
    }

    if (!text.trim()) continue;

    const eventId = `${nodeId}:${ts}`;

    events.push({
      id: eventId,
      ts,
      source: "chatgpt",
      kind: "chat.message",
      project: null,
      session: sessionId,
      message: null,
      role,
      author: role === "assistant" ? "chatgpt" : "user",
      model: message.model ?? null,
      tags: null,
      text,
      attachments: null,
      extra: {
        conversation_title: conversation.title,
        content_type: content?.content_type,
      },
    });
  }

  return events.sort((a, b) => a.ts.localeCompare(b.ts));
}

async function readConversationsFromZip(zipPath: string): Promise<ChatGPTConversation[]> {
  const conversations: ChatGPTConversation[] = [];
  const directory = await unzipper.Open.file(zipPath);

  for (const entry of directory.files) {
    if (entry.type !== "File") continue;
    if (!entry.path.endsWith(".json")) continue;
    if (entry.path.includes("user.json") || entry.path.includes("settings.json")) continue;

    try {
      const content = await entry.buffer();
      const data = JSON.parse(content.toString("utf-8"));

      // Handle both single conversation and array of conversations
      if (Array.isArray(data)) {
        conversations.push(...data);
      } else if (data.mapping) {
        conversations.push(data);
      }
    } catch (error) {
      console.warn(`[chatgpt-import] Failed to parse ${entry.path}:`, error);
    }
  }

  return conversations;
}

/**
 * Import ChatGPT conversations and emit events to a sink function.
 * Use this for MongoDB ingestion via the /v1/events endpoint.
 */
export async function importChatGPTZipToSink(
  zipPath: string,
  sink: (events: EventEnvelopeV1[]) => Promise<void>,
  onProgress?: (count: number) => void,
): Promise<{ conversationsCount: number; eventsCount: number }> {
  const conversations = await readConversationsFromZip(zipPath);
  let eventsCount = 0;

  for (const conversation of conversations) {
    const events = parseChatGPTConversation(conversation);
    if (events.length === 0) continue;

    const envelopes: EventEnvelopeV1[] = events.map((event) => ({
      schema: "openplanner.event.v1" as const,
      id: event.id,
      ts: event.ts,
      source: event.source,
      kind: event.kind,
      source_ref: {
        project: event.project ?? undefined,
        session: event.session ?? undefined,
        message: event.message ?? undefined,
      },
      meta: {
        role: event.role ?? undefined,
        author: event.author ?? undefined,
        model: event.model ?? undefined,
        tags: event.tags ?? undefined,
      },
      text: event.text ?? "",
      attachments: [] as const,
      extra: (event.extra ?? {}) as Record<string, unknown>,
    }));

    await sink(envelopes);
    eventsCount += events.length;
    onProgress?.(eventsCount);
  }

  return { conversationsCount: conversations.length, eventsCount };
}
