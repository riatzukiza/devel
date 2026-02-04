/**
 * Proactive Behavior System
 *
 * Cycles through a list of proactive tasks to maintain context
 * and initiate conversations when appropriate.
 *
 * Architecture:
 * - ProactiveBehavior emits events via EventBus
 * - SessionManager routes events to appropriate sessions
 * - TurnProcessor processes turns through the standard pipeline
 * - Tool results are published as events and can feed back into context
 */

import { randomUUID } from "node:crypto";

import type { EventBus } from "@promethean-os/event";
import type { SessionManager } from "../sessions/manager.js";
import type { TurnProcessor } from "../llm/ollama.js";
import type { CephalonEvent, ProactivePayload, ProactiveBehaviorConfig, ProactiveTask } from "../types/index.js";
export { createDefaultProactiveConfig } from "../config/defaults.js";

type Session = NonNullable<ReturnType<SessionManager["getSession"]>>;

const MIN_PAUSE_MS = 250;

export class ProactiveBehavior {
  private eventBus: EventBus;
  private sessionManager: SessionManager;
  private turnProcessor: TurnProcessor;
  private config: ProactiveBehaviorConfig;

  private isRunning = false;
  private taskIndex = 0;

  private abortController: AbortController | null = null;
  private loopPromise: Promise<void> | null = null;

  // Concurrency protection - per-session inflight tracking
  private inflightTasks = new Map<string, Promise<void>>();

  constructor(
    eventBus: EventBus,
    sessionManager: SessionManager,
    turnProcessor: TurnProcessor,
    config: ProactiveBehaviorConfig,
  ) {
    this.eventBus = eventBus;
    this.sessionManager = sessionManager;
    this.turnProcessor = turnProcessor;
    this.config = config;
  }

  start(): void {
    if (this.isRunning) return;

    if (!Array.isArray(this.config.tasks) || this.config.tasks.length === 0) {
      console.error("[Proactive] Refusing to start: no tasks configured");
      return;
    }
    if (!Number.isFinite(this.config.pauseMs) || this.config.pauseMs < 0) {
      console.error(
        "[Proactive] Refusing to start: pauseMs must be a non-negative number",
      );
      return;
    }
    if (!this.config.sessionId || typeof this.config.sessionId !== "string") {
      console.error(
        "[Proactive] Refusing to start: sessionId must be a non-empty string",
      );
      return;
    }

    const effectivePauseMs = Math.max(MIN_PAUSE_MS, this.config.pauseMs);

    console.log("[Proactive] Starting task loop");
    console.log(`[Proactive] Target session: ${this.config.sessionId}`);
    console.log(`[Proactive] Pause between tasks: ${effectivePauseMs}ms`);
    console.log(`[Proactive] Tasks to cycle: ${this.config.tasks.length}`);

    this.isRunning = true;
    this.taskIndex = 0;

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.loopPromise = this.runLoop(signal).catch((err) => {
      console.error("[Proactive] Loop crashed:", err);
      // Ensure we can restart cleanly
      this.isRunning = false;
      this.abortController = null;
      this.loopPromise = null;
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log("[Proactive] Stopping task loop");
    this.isRunning = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Wait for the loop to complete for clean shutdown
    if (this.loopPromise) {
      try {
        await this.loopPromise;
      } catch {
        // Ignore errors during shutdown
      }
      this.loopPromise = null;
    }

    // Wait for any inflight tasks to complete
    const inflight = Array.from(this.inflightTasks.values());
    if (inflight.length > 0) {
      console.log(`[Proactive] Waiting for ${inflight.length} inflight tasks...`);
      await Promise.allSettled(inflight);
      this.inflightTasks.clear();
    }
  }

  private async runLoop(signal: AbortSignal): Promise<void> {
    const effectivePauseMs = Math.max(MIN_PAUSE_MS, this.config.pauseMs);

    while (this.isRunning && !signal.aborted) {
      const session = this.sessionManager.getSession(this.config.sessionId) as
        | Session
        | null
        | undefined;

      if (!session) {
        console.warn(
          `[Proactive] No session found with id "${this.config.sessionId}"; retrying soon`,
        );
        await this.sleep(effectivePauseMs, signal);
        continue;
      }

      const task = this.config.tasks[this.taskIndex];
      if (!task) {
        // Should never happen with a non-empty tasks array, but keep it safe.
        console.error("[Proactive] Task index out of range; resetting");
        this.taskIndex = 0;
        await this.sleep(effectivePauseMs, signal);
        continue;
      }

      console.log(
        `[Proactive] Executing task [${this.taskIndex + 1}/${this.config.tasks.length}] ${task.id}: ${task.description}`,
      );

      // Concurrency protection: wait if this session already has an inflight proactive task
      while (this.inflightTasks.has(session.id)) {
        console.log(`[Proactive] Waiting for previous task on session ${session.id}...`);
        try {
          await this.inflightTasks.get(session.id);
        } catch {
          // Previous task failed, continue anyway
        }
      }

      if (signal.aborted) return;

      // Execute the task with concurrency tracking
      const taskPromise = this.executeTask(session, task, signal);
      this.inflightTasks.set(session.id, taskPromise);

      try {
        await taskPromise;
      } finally {
        this.inflightTasks.delete(session.id);
      }

      this.taskIndex = (this.taskIndex + 1) % this.config.tasks.length;

      await this.sleep(effectivePauseMs, signal);
    }
  }

  private async executeTask(
    session: Session,
    task: ProactiveTask,
    signal: AbortSignal,
  ): Promise<void> {
    if (task.toolCall) {
      await this.executeToolCall(session, task, signal);
    } else {
      await this.executeContextTask(session, task);
    }
  }

  private async executeToolCall(
    session: Session,
    task: ProactiveTask,
    signal: AbortSignal,
  ): Promise<void> {
    const toolCall = task.toolCall!;
    const executor = this.turnProcessor.getExecutor();
    const callId = randomUUID();

    try {
      console.log(`[Proactive] Executing tool: ${toolCall.name}`);

      const result = await this.withTimeoutAndAbort(
        executor.execute({
          type: "tool_call",
          name: toolCall.name,
          args: toolCall.args,
          callId,
        }),
        30_000,
        "tool call timeout",
        signal,
      );

      console.log(
        `[Proactive] Tool result: ${result.success ? "success" : "failed"}`,
      );

      if (result.success && result.result !== undefined) {
        console.log(
          `[Proactive] Result preview: ${this.safePreview(result.result, 400)}`,
        );

        // Emit tool result as event so it can feed back into agent context
        if (this.config.emitToolResultsAsEvents !== false) {
          await this.emitToolResultEvent(session, task, toolCall.name, result);
        }
      } else if (!result.success && result.error) {
        console.log(`[Proactive] Error: ${String(result.error)}`);

        // Emit error as event for observability
        await this.eventBus.publish("proactive.tool.error", {
          sessionId: session.id,
          taskId: task.id,
          toolName: toolCall.name,
          error: result.error,
          timestamp: Date.now(),
        });
      }

      if (signal.aborted) return;
    } catch (error) {
      console.error(
        `[Proactive] Error executing tool ${toolCall.name}:`,
        error,
      );

      // Emit error as event
      await this.eventBus.publish("proactive.tool.error", {
        sessionId: session.id,
        taskId: task.id,
        toolName: toolCall.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  }

  private async emitToolResultEvent(
    session: Session,
    task: ProactiveTask,
    toolName: string,
    result: { success: boolean; result?: unknown; error?: string },
  ): Promise<void> {
    const payload: ProactivePayload = {
      channelId: "system-proactive",
      content: `Proactive tool result: ${toolName}\nTask: ${task.id}\nResult: ${this.safePreview(result.result, 2000)}`,
      authorId: "system",
      authorIsBot: true,
    };

    const syntheticEvent: CephalonEvent = {
      id: `proactive-result-${Date.now()}-${randomUUID()}`,
      type: "system.proactive",
      timestamp: Date.now(),
      sessionId: session.id,
      payload,
    };

    // Route through the standard pipeline instead of bypassing
    await this.sessionManager.routeEvent(syntheticEvent);

    // Also publish to event bus for other subscribers
    await this.eventBus.publish("proactive.tool.result", {
      sessionId: session.id,
      taskId: task.id,
      toolName,
      result: result.result,
      success: result.success,
      timestamp: Date.now(),
    });
  }

  private async executeContextTask(
    session: Session,
    task: ProactiveTask,
  ): Promise<void> {
    const now = Date.now();

    const payload: ProactivePayload = {
      channelId: "system-proactive",
      content: task.description,
      authorId: "system",
      authorIsBot: true,
    };

    const syntheticEvent: CephalonEvent = {
      id: `task-${task.id}-${now}`,
      type: "system.proactive",
      timestamp: now,
      sessionId: session.id,
      payload,
    };

    try {
      // Route through the standard pipeline instead of calling TurnProcessor directly
      await this.sessionManager.routeEvent(syntheticEvent);
    } catch (error) {
      console.error("[Proactive] Error routing context task:", error);
    }
  }

  private async sleep(ms: number, signal: AbortSignal): Promise<void> {
    if (signal.aborted) return;

    await new Promise<void>((resolve) => {
      const id = setTimeout(resolve, ms);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(id);
          resolve();
        },
        { once: true },
      );
    });
  }

  private async withTimeoutAndAbort<T>(
    promise: Promise<T>,
    ms: number,
    label: string,
    signal: AbortSignal,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(label)), ms);
    });

    // Create an abort promise that rejects when signal aborts
    const abortPromise = new Promise<never>((_, reject) => {
      if (signal.aborted) {
        reject(new Error("Operation aborted"));
        return;
      }
      const handler = () => {
        reject(new Error("Operation aborted"));
      };
      signal.addEventListener("abort", handler, { once: true });
    });

    try {
      return await Promise.race([promise, timeout, abortPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private safePreview(value: unknown, maxLen: number): string {
    try {
      const seen = new WeakSet();
      const s = typeof value === "string"
        ? value
        : JSON.stringify(value, (_key, val) => {
            if (typeof val === "bigint") return val.toString();
            if (val !== null && typeof val === "object") {
              if (seen.has(val)) return "[Circular]";
              seen.add(val);
            }
            return val;
          });
      if (s.length <= maxLen) return s;
      return `${s.slice(0, maxLen)}...`;
    } catch {
      try {
        return String(value);
      } catch {
        return "[unprintable]";
      }
    }
  }
}
