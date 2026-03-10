import type {
  SessionManagerConfig,
  ProactiveBehaviorConfig,
  ChromaConfig,
  EmbeddingConfig,
  OllamaConfig,
} from "../types/index.js";

export interface CephalonConfig {
  sessionManager: SessionManagerConfig;
  proactive: ProactiveBehaviorConfig;
  chroma: ChromaConfig;
  embedding: EmbeddingConfig;
  ollama: OllamaConfig;
}

export function createDefaultSessionManagerConfig(): SessionManagerConfig {
  return {
    concurrency: 4,
    lanes: {
      interactive: { turns: 60, toolCalls: 120 },
      operational: { turns: 30, toolCalls: 60 },
      maintenance: { turns: 10, toolCalls: 20 },
    },
    credits: {
      refillPerSecond: 1.0,
      max: 30,
      cost: {
        interactive: 2,
        operational: 1,
        maintenance: 1,
      },
    },
    queue: {
      maxPerSession: 100,
      dropPolicy: "drop_oldest",
    },
  };
}

export function createDefaultProactiveConfig(): ProactiveBehaviorConfig {
  return {
    pauseMs: 10_000,
    sessionId: "conversational",
    emitToolResultsAsEvents: true,
    tasks: [
      {
        id: "read-bots-channel",
        description:
          "Check on #bots channel for any recent activity or questions.",
        toolCall: {
          name: "discord.channel.messages",
          args: {
            channel_id: "343299242963763200",
            limit: 20,
          },
        },
      },
      {
        id: "read-general-channel",
        description:
          "Check on #general channel for any recent activity or questions.",
        toolCall: {
          name: "discord.channel.messages",
          args: {
            channel_id: "343179912196128792",
            limit: 20,
          },
        },
      },
      {
        id: "lookup-recent-memories",
        description:
          "Search for recent tool results or important memories from the last hour.",
        toolCall: {
          name: "memory.lookup",
          args: {
            query: "recent tool calls important memories",
            limit: 10,
          },
        },
      },
      {
        id: "check-duck-brains",
        description:
          "Check if there are any messages in #duck-brains that might need attention.",
        toolCall: {
          name: "discord.channel.messages",
          args: {
            channel_id: "450688080542695436",
            limit: 10,
          },
        },
      },
    ],
  };
}

export function createDefaultChromaConfig(): ChromaConfig {
  return {
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collectionName: "cephalon_memories",
  };
}

export function createDefaultEmbeddingConfig(): EmbeddingConfig {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:8789",
    model: "qwen3-embedding:0.6b",
    contextSize: 0,
    apiKey: process.env.OLLAMA_API_KEY || process.env.OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN || undefined,
  };
}

export function createOllamaConfig(modelName: string): OllamaConfig {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:8789",
    model: modelName,
    temperature: 0.7,
    maxTokens: 4096,
    apiKey: process.env.OLLAMA_API_KEY || process.env.OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN || undefined,
  };
}

export function createDefaultCephalonConfig(
  modelName = "qwen3.5:4b-q8_0",
): CephalonConfig {
  return {
    sessionManager: createDefaultSessionManagerConfig(),
    proactive: createDefaultProactiveConfig(),
    chroma: createDefaultChromaConfig(),
    embedding: createDefaultEmbeddingConfig(),
    ollama: createOllamaConfig(modelName),
  };
}
