/**
 * Cephalon Prompts Index
 * 
 * Central export point for all prompt definitions.
 * System prompts, developer prompts, tool definitions, and personas are
 * separated from code for easier editing and version control.
 */

// System prompts
export {
  generateSystemPrompt,
  getSystemPromptForSession,
  BASE_SYSTEM_PROMPT,
  TOOL_CALLING_RULES,
} from './system-prompts.js';

// Developer/contract prompts
export {
  generateDeveloperPrompt,
  DEVELOPER_PROMPT,
  TOOL_USAGE_RULES,
  DISCORD_TOOL_RULES,
  MEMORY_TOOL_RULES,
  TICK_EVENT_RULE,
} from './developer-prompts.js';

// Tool definitions
export {
  type ToolDefinition,
  type ToolRegistryEntry,
  TOOL_DEFINITIONS,
  getAllToolDefinitions,
  getToolDefinition,
  getAllToolNames,
  TOOL_ALIASES,
} from './tool-definitions.js';

// Duck persona prompts (entertainment personas)
export {
  DUCK_ENTERTAINMENT_PROMPTS,
  getCyclingPrompt,
  getPromptName,
  formatRecentActivityForPrompt,
} from './duck-persona.js';
