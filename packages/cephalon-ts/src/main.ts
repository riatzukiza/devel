/**
 * Main Cephalon service entry point
 *
 * Initializes all components and starts the service
 */

import "dotenv/config";
import { InMemoryEventBus } from "@promethean-os/event";
import { loadDefaultPolicy } from "./config/policy.js";
import { InMemoryMemoryStore } from "./core/memory-store.js";
import { MongoDBMemoryStore } from "./core/mongodb-memory-store.js";
import { DiscordIntegration } from "./discord/integration.js";
import {
  SessionManager,
  createDefaultSessionManagerConfig,
} from "./sessions/manager.js";
import {
  OllamaProvider,
  ToolExecutor,
  TurnProcessor,
  createOllamaConfig,
} from "./llm/index.js";
import { DiscordApiClient } from "./discord/api-client.js";
import type {
  CephalonPolicy,
  CephalonEvent,
  CephalonEventType,
  EventPayload,
} from "./types/index.js";
import {
  ChromaMemoryStore,
  createDefaultChromaConfig,
} from "./chroma/client.js";
import {
  EmbeddingService,
  createDefaultEmbeddingConfig,
} from "./embeddings/service.js";
import { MemoryUIServer } from "./ui/server.js";

function safeStringify(value: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === "bigint") return val.toString();
    if (val !== null && typeof val === "object") {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    return val;
  });
}

async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                    CEPHALON STARTING                       ║");
  console.log("║              Always-running mind with memory               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  // Load configuration
  const policy: CephalonPolicy = loadDefaultPolicy();
  console.log("[Config] Policy loaded");
  console.log(`[Config] Actor model: ${policy.models.actor.name}`);
  console.log(
    `[Config] Max context: ${policy.models.actor.maxContextTokens} tokens`,
  );

  // Get Discord token from environment
  // DUCK_DISCORD_TOKEN is the main bot (Cephalon itself)
  // OPENHAX_DISCORD_TOKEN is used for testing (sends messages to trigger Duck)
  const cephalonName = process.env.CEPHALON_NAME ?? "DUCK";
  const discordToken =
    process.env[`${cephalonName}_DISCORD_TOKEN`] ?? process.env.DISCORD_TOKEN;
  if (!discordToken) {
    console.error(`[Error] ${cephalonName}_DISCORD_TOKEN not set`);
    console.error("[Error] Please set the Discord bot token and try again");
    process.exit(1);
  }

  // Initialize event bus
  const eventBus = new InMemoryEventBus();
  console.log("[EventBus] Initialized");

  // Initialize memory store (use InMemory for development)
  const memoryStore = new InMemoryMemoryStore();
await memoryStore.initialize();
  console.log("[MemoryStore] Initialized");

  // Initialize LLM provider (Ollama)
  const ollamaConfig = createOllamaConfig(policy.models.actor.name);
  const llmProvider = new OllamaProvider(ollamaConfig);
  console.log(`[LLM] Ollama configured: ${ollamaConfig.model}`);

  // Initialize ChromaDB
  const embeddingService = new EmbeddingService(createDefaultEmbeddingConfig());
  const chromaStore = new ChromaMemoryStore(
    createDefaultChromaConfig(),
    embeddingService,
  );
  await chromaStore.initialize();
  console.log("[MemoryStore] Chroma initialized");

  const discordApiClient = new DiscordApiClient({ token: discordToken });
  console.log("[Discord] API client initialized");

  const toolExecutor = new ToolExecutor(eventBus, {
    chromaStore,
    discordApiClient,
  });
  console.log("[Tools] Executor initialized");

  // Initialize turn processor
  const turnProcessor = new TurnProcessor(
    llmProvider,
    toolExecutor,
    memoryStore,
    eventBus,
    policy,
    discordApiClient,
  );
  console.log("[TurnProcessor] Initialized");

  // Initialize session manager
  const sessionManager = new SessionManager(
    eventBus,
    policy,
    createDefaultSessionManagerConfig(),
  );
  console.log("[SessionManager] Initialized");

  // Start session manager internal subscriptions (turn completion, tool usage)
  await sessionManager.start();

  // Create sessions
  const defaultSubscriptionFilter = (eventType: CephalonEventType): boolean =>
    eventType.startsWith("discord.message.") ||
    eventType === "system.tick" ||
    eventType === "admin.command";

  const janitorSession = sessionManager.createSession(
    "janitor",
    "Duck",
    "maintenance",
    {
      persona:
        "You are the Janitor. Your job is to clean up bot spam and maintain order.",
      attentionFocus: "Bot spam detection and cleanup",
      subscriptionFilter: defaultSubscriptionFilter,
    },
  );
  console.log(`[SessionManager] Created session: ${janitorSession.id}`);

  const conversationalSession = sessionManager.createSession(
    "conversational",
    "Duck",
    "interactive",
    {
      persona:
        "You are Duck, a helpful and friendly AI assistant. You quack, you laugh at memes. You are a memelord. You live to make people laugh.",
      attentionFocus:
        "Being hilarious and disruptive. Look for images, comment on them, save them, and share them. Find the most hillarious memes, and share them with everyone. Every where, all the time.",
      subscriptionFilter: defaultSubscriptionFilter,
    },
  );
  console.log(`[SessionManager] Created session: ${conversationalSession.id}`);

  // Initialize Discord integration
  const forcedChannels = Object.keys(policy.channels);
  const discord = new DiscordIntegration(eventBus, policy, {
    token: discordToken,
    forcedChannels,
  });
  console.log("[Discord] Integration initialized");
  console.log(`[Discord] Monitoring ${forcedChannels.length} channels:`);
  for (const [channelId, config] of Object.entries(policy.channels)) {
    console.log(`  - ${config.name} (${channelId})`);
  }

  // Subscribe to events and process turns
  await eventBus.subscribe(
    "discord.message.created",
    "cephalon",
    async (event) => {
      // Safe serialization for logging (avoids BigInt issues)
      const payloadPreview = JSON.stringify(event.payload, (_key, value) => {
        if (typeof value === "bigint") return value.toString();
        return value;
      }).slice(0, 100);
      console.log(`[Event] ${event.topic}: ${payloadPreview}...`);

      // Route to session manager
      await sessionManager.routeEvent({
        id: event.id,
        type: event.topic as "discord.message.created",
        timestamp: event.ts,
        payload: event.payload as EventPayload,
      });
    },
  );

  await eventBus.subscribe(
    "discord.message.edited",
    "cephalon",
    async (event) => {
      console.log(`[Event] ${event.topic}`);
    },
  );

  await eventBus.subscribe(
    "discord.message.deleted",
    "cephalon",
    async (event) => {
      console.log(`[Event] ${event.topic}`);
    },
  );

  const turnQueues = new Map<string, Promise<void>>();

  const enqueueTurn = (
    sessionId: string,
    fn: () => Promise<void>,
  ): Promise<void> => {
    const prev = turnQueues.get(sessionId) ?? Promise.resolve();
    const next = prev.then(fn).catch((err) => {
      console.error(`[TurnQueue] Error for session ${sessionId}:`, err);
    });
    turnQueues.set(sessionId, next);
    return next;
  };

  await eventBus.subscribe(
    "session.turn.started",
    "cephalon",
    async (event) => {
      const payload = event.payload as {
        sessionId: string;
        event: CephalonEvent;
        timestamp: number;
      };

      if (!payload || !payload.sessionId || !payload.event) {
        console.error("[Main] Invalid session.turn.started payload:", payload);
        return;
      }

      const session = sessionManager.getSession(payload.sessionId);

      if (session && payload.event) {
        await enqueueTurn(payload.sessionId, () =>
          turnProcessor.processTurn(session, payload.event),
        );
      }
    },
  );

  // Track tick completion to schedule the next tick only after the current one finishes
  // This ensures a tick represents ONE complete Ollama generation cycle
  await eventBus.subscribe(
    "session.turn.completed",
    "cephalon",
    async (event) => {
      const payload = event.payload as {
        sessionId: string;
        eventType: string;
        timestamp: number;
      };

      if (payload?.eventType === "system.tick") {
        // The tick's turn has completed, now schedule the next one
        tickInProgress = false;
        if (isRunning) {
          tickTimeout = setTimeout(runTick, 15000);
        }
      }
    },
  );

  await eventBus.subscribe("session.turn.error", "cephalon", async (_event) => {
    if (tickInProgress) {
      tickInProgress = false;
      if (isRunning) {
        tickTimeout = setTimeout(runTick, 15000);
      }
    }
  });

  console.log("[EventBus] Subscribed to events");

  // Start Discord integration
  await discord.start();

  // Wait for Discord client to be ready before using it
  await discord.waitForReady();
  console.log("[Discord] Connected");

  // Get discovered channels from Discord
  const discordAccessibleChannels = discord.getAccessibleChannels();
  const discordSpecialChannels = discord.getSpecialChannels();

  toolExecutor.setDiscordClient(discord.getClient());
  discordApiClient.setClient(discord.getClient());

  console.log(
    `[Main] Discord accessible channels: ${discordAccessibleChannels.length}`,
  );
  console.log(
    `[Main] Discord special channels: ${discordSpecialChannels.length}`,
  );

  const uiPort = parseInt(process.env.MEMORY_UI_PORT || "3000", 10);
  const memoryUI = new MemoryUIServer({
    port: uiPort,
    chromaStore,
    memoryStore,
  });
  await memoryUI.start();

  // Start active mind loop - continuous tick prompts with accumulated context
  // Discord messages arrive via gateway events, no polling needed
  let tickNumber = 0;
  let tickTimeout: NodeJS.Timeout | null = null;
  let isRunning = true;
  // Track whether a tick is currently being processed to prevent overlapping ticks
  // A tick should represent one complete Ollama generation cycle until "done"
  let tickInProgress = false;

  const runTick = async () => {
    if (!isRunning) return;

    // Skip this tick if the previous one is still being processed
    if (tickInProgress) {
      console.log("[Tick] Skipping - previous tick still processing");
      if (isRunning) {
        tickTimeout = setTimeout(runTick, 15000);
      }
      return;
    }

    tickInProgress = true;
    tickNumber++;
    const session = sessionManager.getSession("conversational");
    if (!session) {
      tickInProgress = false;
      if (isRunning) {
        tickTimeout = setTimeout(runTick, 15000);
      }
      return;
    }

    const recentActivity = session.recentBuffer.slice(-10).map((m) => ({
      type: m.kind,
      preview:
        typeof m.content?.text === "string"
          ? m.content.text.slice(0, 100)
          : safeStringify(m.content).slice(0, 100),
      timestamp: m.timestamp,
    }));

    const tickEvent: CephalonEvent = {
      id: `tick-${Date.now()}`,
      sessionId: "conversational",
      type: "system.tick",
      timestamp: Date.now(),
      payload: {
        intervalMs: 15000,
        tickNumber,
        recentActivity,
        reflectionPrompt: `TICK REFLECTION: You are an always-running autonomous mind.
        You MUST ACTIVELY use tools to investigate recent activity.
        DO NOT just respond with text - ALWAYS call at least one tool.
        Use discord.channel.messages, memory.lookup, discord.dm.messages to gather fresh information.
        Check many channels, search for patterns, query memory.
        Focus on meme, bot and general channels in each server.
        If a channel name has the word "duck" in it,
        that's a special channel for you to send messages.
        it's a little diary.
        Whatever is on your mind.
        If nothing interesting, still report what you found.
        TICK IS A MANDATORY CHECKPOINT - INVESTIGATE EVERY TIME.`,
      },
    };

    try {
      await sessionManager.routeEvent(tickEvent);
      // Note: tickInProgress will be set to false when the turn completes
      // See the session.turn.completed subscription below
    } catch (error) {
      console.error("[Tick] Error:", error);
      tickInProgress = false;
      if (isRunning) {
        tickTimeout = setTimeout(runTick, 15000);
      }
    }
  };

  tickTimeout = setTimeout(runTick, 15000);

  // Start credit refill loop
  const creditInterval = setInterval(() => {
    sessionManager.refillCredits();
  }, 1000);

  // Start stats reporting
  const statsInterval = setInterval(() => {
    const stats = sessionManager.getStats();
    console.log("[Stats]", JSON.stringify(stats));
  }, 30000);

  console.log();
  console.log("✓ Cephalon is running");
  console.log("  Press Ctrl+C to stop");
  console.log();

  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log();
    console.log(`[Shutdown] Received ${signal}, shutting down gracefully...`);

    isRunning = false;
    if (tickTimeout) clearTimeout(tickTimeout);
    clearInterval(creditInterval);
    clearInterval(statsInterval);

    const forceExitTimeout = setTimeout(() => {
      console.error("[Shutdown] Force exit after timeout");
      process.exit(1);
    }, 5000);

    try {
      await memoryStore.cleanup();
      await memoryUI.stop();
      await discord.stop();
      console.log("[Shutdown] MongoDB and Discord disconnected");
    } catch (err) {
      console.error("[Shutdown] Error during cleanup:", err);
    } finally {
      clearTimeout(forceExitTimeout);
    }

    console.log("[Shutdown] Goodbye!");
    process.exit(0);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

// Run main
main().catch((error) => {
  console.error("[Fatal]", error);
  process.exit(1);
});
