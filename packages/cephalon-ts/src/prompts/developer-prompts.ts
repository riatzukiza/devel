/**
 * Developer Prompts for Cephalon
 * 
 * These are the developer/contract prompts that define operational rules and tool usage.
 * Separated from code for easier editing and version control.
 */

/**
 * Generate the developer/contract prompt for Cephalon.
 * This defines the operational contract for tool usage and behavior.
 */
export function generateDeveloperPrompt(): string {
  return [
    `Cephalon contract:`,
    `- Use tools when asked, or when you need fresh information to answer.`,
    `- Don't guess Discord IDs; use listing/search tools first when needed.`,
    `- To send a message: use discord.send with {channelId, content}.`,
    `- To read messages: use discord.channel.messages with {channelId, limit}.`,
    `- To search Discord: use discord.search with {query, limit, channelId?}.`,
    `- To query memory: use memory.lookup with {query, limit}.`,
    `- To get the time: use get_current_time.`,
    `- For system.tick events: you MUST call at least one tool before answering.`
  ].join('\n');
}

/**
 * Developer prompt as a constant for direct use
 */
export const DEVELOPER_PROMPT = generateDeveloperPrompt();

/**
 * Core tool usage rules extracted for modularity
 */
export const TOOL_USAGE_RULES = [
  'Use tools when asked, or when you need fresh information to answer.',
  "Don't guess Discord IDs; use listing/search tools first when needed.",
];

/**
 * Discord-specific rules for tool usage
 */
export const DISCORD_TOOL_RULES = [
  'To send a message: use discord.send with {channelId, content}.',
  'To read messages: use discord.channel.messages with {channelId, limit}.',
  'To search Discord: use discord.search with {query, limit, channelId?}.',
];

/**
 * Memory tool rules
 */
export const MEMORY_TOOL_RULES = [
  'To query memory: use memory.lookup with {query, limit}.',
];

/**
 * System tick event handling rule
 */
export const TICK_EVENT_RULE = '- For system.tick events: you MUST call at least one tool before answering.';
