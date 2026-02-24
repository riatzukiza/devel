/**
 * CephalonApp
 *
 * Library-friendly wrapper around the Cephalon runtime.
 *
 * - No process.exit()
 * - Exposes start()/stop()
 */

import { InMemoryEventBus, type EventBus } from "@promethean-os/event";
import { loadDefaultPolicy } from "./config/policy.js";
import { InMemoryMemoryStore, type MemoryStore } from "./core/memory-store.js";
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
import type { CephalonPolicy, CephalonEvent, CephalonEventType, EventPayload } from "./types/index.js";
import type { ChromaMemoryStore } from "./chroma/client.js";
import { MemoryUIServer } from "./ui/server.js";
import { OpenPlannerClient, createDefaultOpenPlannerConfig } from "./openplanner/client.js";

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

export interface CephalonAppOptions {
  discordToken?: string;
  policy?: CephalonPolicy;
  uiPort?: number;
  enableProactiveLoop?: boolean;
  tickIntervalMs?: number;
  mongoUri?: string;
}

export interface CephalonApp {
  policy: CephalonPolicy;
  eventBus: EventBus;
  memoryStore: MemoryStore;
  chromaStore?: ChromaMemoryStore;
  sessionManager: SessionManager;
  discord: DiscordIntegration;
  start(): Promise<void>;
  stop(signal?: string): Promise<void>;
}

export async function createCephalonApp(
  options: CephalonAppOptions = {},
): Promise<CephalonApp> {
  const policy = options.policy ?? loadDefaultPolicy();

  const cephalonName = process.env.CEPHALON_NAME ?? "DUCK";
  const discordToken =
    options.discordToken ??
    process.env[`${cephalonName}_DISCORD_TOKEN`] ??
    process.env.DISCORD_TOKEN;

  if (!discordToken) {
    throw new Error(
      `Discord token not set. Set ${cephalonName}_DISCORD_TOKEN (or DISCORD_TOKEN).`,
    );
  }

  // Event bus (in-memory for now; upgrade to persisted bus later)
  const eventBus = new InMemoryEventBus();

  // Initialize LLM provider (Ollama)
  const ollamaConfig = createOllamaConfig(policy.models.actor.name);
  const llmProvider = new OllamaProvider(ollamaConfig);

  const openPlannerClient = new OpenPlannerClient(createDefaultOpenPlannerConfig());

  // Choose memory store (MongoDB if configured)
  const mongoUri =
    options.mongoUri ??
    process.env.CEPHALON_MONGODB_URI ??
    process.env.MONGODB_URI;

  const memoryStore: MemoryStore & { initialize?: () => Promise<void>; close?: () => Promise<void> } =
    mongoUri
        ? new MongoDBMemoryStore({
          cephalonId: "duck-cephalon",
          uri: mongoUri,
          databaseName: process.env.CEPHALON_MONGODB_DB || "promethean",
          collectionName: process.env.CEPHALON_MONGODB_COLLECTION || "cephalon_memories",
          openPlannerClient,
        })
      : new InMemoryMemoryStore(undefined, openPlannerClient);

  if (memoryStore.initialize) {
    await memoryStore.initialize();
  }

  const discordApiClient = new DiscordApiClient({ token: discordToken });

  const toolExecutor = new ToolExecutor(eventBus, {
    openPlannerClient,
    discordApiClient,
  });

  const turnProcessor = new TurnProcessor(
    llmProvider,
    toolExecutor,
    memoryStore,
    eventBus,
    policy,
    discordApiClient,
  );

  const sessionManager = new SessionManager(
    eventBus,
    policy,
    createDefaultSessionManagerConfig(),
  );

  const defaultSubscriptionFilter = (eventType: CephalonEventType): boolean =>
    eventType.startsWith("discord.message.") ||
    eventType === "system.tick" ||
    eventType === "admin.command";

  sessionManager.createSession("janitor", "Duck", "maintenance", {
    persona:
      "You are the Janitor. Your job is to clean up bot spam and maintain order.",
    attentionFocus: "Bot spam detection and cleanup",
    subscriptionFilter: defaultSubscriptionFilter,
  });

  sessionManager.createSession("conversational", "Duck", "interactive", {
    persona:
      "You are Duck, a helpful and friendly AI assistant. You quack, you laugh at memes. You are a memelord.",
    attentionFocus:
      "Be funny but safe. Explore channels, comment on content, and save useful memories.",
    subscriptionFilter: defaultSubscriptionFilter,
  });

  const forcedChannels = Object.keys(policy.channels);
  const discord = new DiscordIntegration(eventBus, policy, {
    token: discordToken,
    forcedChannels,
  });

  const uiPort =
    options.uiPort ?? parseInt(process.env.MEMORY_UI_PORT || "3000", 10);
  const memoryUI = new MemoryUIServer({
    port: uiPort,
    openPlannerClient,
    memoryStore,
  });

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

  // Timers / loops
  let tickNumber = 0;
  let tickTimeout: NodeJS.Timeout | null = null;
  let creditInterval: NodeJS.Timeout | null = null;
  let statsInterval: NodeJS.Timeout | null = null;
  let isRunning = false;
  // Track whether a tick is currently being processed to prevent overlapping ticks
  let tickInProgress = false;

  const enableProactiveLoop = options.enableProactiveLoop ?? true;
  const tickIntervalMs = options.tickIntervalMs ?? 15000;

  const runTick = async () => {
    if (!isRunning || !enableProactiveLoop) return;

    // Skip this tick if the previous one is still being processed
    // A tick represents a complete Ollama generation cycle until "done"
    if (tickInProgress) {
      console.log("[Tick] Skipping - previous tick still processing");
      if (isRunning) {
        tickTimeout = setTimeout(runTick, tickIntervalMs);
      }
      return;
    }

    tickInProgress = true;
    tickNumber++;
    const session = sessionManager.getSession("conversational");
    if (!session) {
      tickInProgress = false;
      if (isRunning) {
        tickTimeout = setTimeout(runTick, tickIntervalMs);
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
      type: "system.tick",
      timestamp: Date.now(),
      payload: {
        intervalMs: tickIntervalMs,
        tickNumber,
        recentActivity,
        reflectionPrompt:
          "TICK REFLECTION: You are an always-running autonomous mind. Use tools to investigate recent activity. Always call at least one tool.",
      } satisfies EventPayload,
    };

    try {
      await sessionManager.routeEvent(tickEvent);
      // Note: tickInProgress will be set to false when the turn completes
      // See the session.turn.completed subscription below
    } catch (error) {
      console.error("[Tick] Error:", error);
      tickInProgress = false;
      if (isRunning) {
        tickTimeout = setTimeout(runTick, tickIntervalMs);
      }
    }
  };

  async function start(): Promise<void> {
    if (isRunning) return;

    console.log("[EventBus] Initializing subscriptions...");

    await eventBus.subscribe(
      "discord.message.created",
      "cephalon",
      async (event) => {
        const payloadPreview = JSON.stringify(event.payload, (_key, value) => {
          if (typeof value === "bigint") return value.toString();
          return value;
        }).slice(0, 200);
        console.log(`[Event] ${event.topic}: ${payloadPreview}...`);

        await sessionManager.routeEvent({
          id: event.id,
          type: event.topic as "discord.message.created",
          timestamp: event.ts,
          payload: event.payload as EventPayload,
        });
      },
    );

    await eventBus.subscribe("session.turn.started", "cephalon", async (event) => {
      const payload = event.payload as {
        sessionId: string;
        event: CephalonEvent;
        timestamp: number;
      };

      if (!payload || !payload.sessionId || !payload.event) {
        console.error("[CephalonApp] Invalid session.turn.started payload:", payload);
        return;
      }

      const session = sessionManager.getSession(payload.sessionId);
      if (session) {
        await enqueueTurn(payload.sessionId, () =>
          turnProcessor.processTurn(session, payload.event),
        );
      }
    });

    // Track tick completion to schedule the next tick only after the current one finishes
    // This ensures a tick represents ONE complete Ollama generation cycle
    await eventBus.subscribe("session.turn.completed", "cephalon", async (event) => {
      const payload = event.payload as {
        sessionId: string;
        eventType: string;
        timestamp: number;
      };

      if (payload?.eventType === "system.tick") {
        // The tick's turn has completed, now schedule the next one
        tickInProgress = false;
        if (isRunning && enableProactiveLoop) {
          tickTimeout = setTimeout(runTick, tickIntervalMs);
        }
      }
    });

    await eventBus.subscribe("session.turn.error", "cephalon", async (_event) => {
      if (tickInProgress) {
        tickInProgress = false;
        if (isRunning && enableProactiveLoop) {
          tickTimeout = setTimeout(runTick, tickIntervalMs);
        }
      }
    });

    isRunning = true;

    await sessionManager.start();

    await discord.start();
    await discord.waitForReady();

    toolExecutor.setDiscordClient(discord.getClient());
    discordApiClient.setClient(discord.getClient());

    await memoryUI.start();

    // Start proactive loop
    if (enableProactiveLoop) {
      tickTimeout = setTimeout(runTick, tickIntervalMs);
    }

    // Start credit refill loop
    creditInterval = setInterval(() => {
      sessionManager.refillCredits();
    }, 1000);

    // Start stats reporting
    statsInterval = setInterval(() => {
      const stats = sessionManager.getStats();
      console.log("[Stats]", JSON.stringify(stats));
    }, 30000);

    console.log("✓ Cephalon started");
  }

  async function stop(signal = "stop"): Promise<void> {
    if (!isRunning) return;
    console.log(`[Shutdown] ${signal} ...`);

    isRunning = false;

    if (tickTimeout) clearTimeout(tickTimeout);
    if (creditInterval) clearInterval(creditInterval);
    if (statsInterval) clearInterval(statsInterval);

    try {
      await memoryUI.stop();
    } catch (err) {
      console.error("[Shutdown] Error stopping Memory UI:", err);
    }

    try {
      await discord.stop();
    } catch (err) {
      console.error("[Shutdown] Error stopping Discord:", err);
    }

    try {
      if ((memoryStore as any).close) {
        await (memoryStore as any).close();
      }
    } catch (err) {
      console.error("[Shutdown] Error closing memory store:", err);
    }

    console.log("[Shutdown] Done.");
  }

  return {
    policy,
    eventBus,
    memoryStore,
    sessionManager,
    discord,
    start,
    stop,
  };
}
