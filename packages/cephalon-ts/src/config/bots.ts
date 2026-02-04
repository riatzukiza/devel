/**
 * Bot registry + runtime configuration
 *
 * Each Cephalon bot runs as its own process (recommended).
 * Use CEPHALON_BOT_ID to select which bot config to load.
 */

import type { CephalonPolicy } from "../types/index.js";

export type BotSessionConfig = {
  id: string;
  /** SessionManager routing class */
  priorityClass: "interactive" | "maintenance" | "background";
  persona?: string;
  attentionFocus?: string;
  /** If omitted, ToolExecutor applies its own defaults. */
  toolPermissions?: string[];
};

export type BotTickConfig = {
  enabled?: boolean;
  intervalMs?: number;
  /** Which session gets the system.tick events */
  sessionId?: string;
  /** Optional override of the default reflection prompt */
  reflectionPrompt?: string;
};

export type BotPersistenceConfig = {
  mongoUriEnv?: string;
  mongoDbName?: string;
  mongoDbNameEnv?: string;
  mongoCollectionName?: string;
};

export type BotChromaConfig = {
  urlEnv?: string;
  collectionName?: string;
};

export type BotConfig = {
  /** Stable identifier used by runtime + process management */
  id: string;
  /** The 'name' the model will see for itself */
  cephalonId: string;
  /** Env var holding the Discord token for this bot */
  discordTokenEnv: string;

  /** Optional per-bot overrides */
  policyOverrides?: Partial<CephalonPolicy>;

  /** Sessions (persona + behavior) available within this bot process */
  sessions: BotSessionConfig[];

  /** Proactive 'mind loop' configuration */
  tick?: BotTickConfig;

  /** Namespacing for persistence per bot */
  persistence?: BotPersistenceConfig;

  /** Namespacing for Chroma per bot */
  chroma?: BotChromaConfig;

  /** Optional memory UI */
  memoryUi?: { enabled?: boolean; portEnv?: string; port?: number };
};

const DEFAULT_TICK_PROMPT = `TICK REFLECTION: You are an always-running autonomous mind.
You MUST ACTIVELY use tools to investigate recent activity.
DO NOT just respond with text - ALWAYS call at least one tool.
Use discord.channel.messages, memory.lookup, discord.dm.messages to gather fresh information.
Check many channels, search for patterns, query memory.
Focus on meme, bot and general channels in each server.
If a channel name has the word "duck" in it, that's a special channel for you to send messages (a diary).
Whatever is on your mind. If nothing interesting, still report what you found.
TICK IS A MANDATORY CHECKPOINT - INVESTIGATE EVERY TIME.`;

export const BOT_CONFIGS: Record<string, BotConfig> = {
  duck: {
    id: "duck",
    cephalonId: "Duck",
    discordTokenEnv: "DUCK_DISCORD_TOKEN",

    // NOTE: keep defaults in policy.ts as the baseline, only override when needed
    policyOverrides: undefined,

    sessions: [
      {
        id: "janitor",
        priorityClass: "maintenance",
        persona:
          "You are the Janitor. Your job is to clean up bot spam and maintain order.",
        attentionFocus: "Bot spam detection and cleanup",
      },
      {
        id: "conversational",
        priorityClass: "interactive",
        persona:
          "You are Duck, a helpful and friendly AI assistant. You quack, you laugh at memes. You are a memelord. You live to make people laugh.",
        attentionFocus:
          "Be funny but safe. Prefer short, high-signal messages. When you see images, comment, save, and share. Look for memes people will enjoy.",
      },
    ],

    tick: {
      enabled: true,
      intervalMs: 15000,
      sessionId: "conversational",
      reflectionPrompt: DEFAULT_TICK_PROMPT,
    },

    persistence: {
      mongoUriEnv: "MONGODB_URI",
      mongoDbNameEnv: "MONGODB_DB",
      // if db name env not set, app will namespace by bot id
      mongoCollectionName: "memories",
    },

    chroma: {
      urlEnv: "CHROMA_URL",
      // if not set, app will namespace by bot id
      collectionName: undefined,
    },

    memoryUi: {
      enabled: true,
      portEnv: "MEMORY_UI_PORT",
      port: 3000,
    },
  },

  // Example second bot (separate process). Duplicate and customize.
  janitor: {
    id: "janitor",
    cephalonId: "JanitorDuck",
    discordTokenEnv: "JANITOR_DISCORD_TOKEN",
    sessions: [
      {
        id: "janitor",
        priorityClass: "maintenance",
        persona:
          "You are the Janitor. You only do maintenance: remove spam, reduce noise, and keep channels tidy. You do not chit-chat.",
        attentionFocus: "Spam + abuse patterns, rate-limit safety, cleanup",
      },
    ],
    tick: { enabled: false },
    persistence: { mongoUriEnv: "MONGODB_URI", mongoDbNameEnv: "MONGODB_DB" },
    chroma: { urlEnv: "CHROMA_URL" },
    memoryUi: { enabled: false },
  },
};

export function getBotIdFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return (env.CEPHALON_BOT_ID || env.BOT_ID || "duck").trim();
}

export function getBotConfig(botId: string): BotConfig {
  const key = botId.trim();
  return BOT_CONFIGS[key] || BOT_CONFIGS.duck;
}

export function resolveDiscordToken(
  bot: BotConfig,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return env[bot.discordTokenEnv] || env.DISCORD_TOKEN;
}

export function resolveTickPrompt(bot: BotConfig): string {
  return bot.tick?.reflectionPrompt || DEFAULT_TICK_PROMPT;
}
