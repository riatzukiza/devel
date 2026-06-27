/**
 * Simple in-memory context adapter
 */
import type { ContextPort, ContextSource, Message } from './ports.js';

export function makeContextAdapter(): ContextPort {
  return {
    async compile({ texts = [], sources, limit, recentLimit, queryLimit }): Promise<Message[]> {
      const sourceMessages = sources.map((source: ContextSource) => ({
        role: 'system' as const,
        content: source.label ?? source.id,
      }));

      const textMessages = texts.map((text) => ({ role: 'user' as const, content: text }));

      const messages = [...sourceMessages, ...textMessages];
      const cap = limit ?? queryLimit ?? recentLimit ?? messages.length;

      return messages.slice(-cap);
    },
  };
}
