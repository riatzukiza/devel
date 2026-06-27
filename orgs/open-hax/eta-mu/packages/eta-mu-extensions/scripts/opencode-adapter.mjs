#!/usr/bin/env node
/**
 * OpenCode adapter template generator.
 *
 * Generates .mjs plugin files that bridge eta-mu pi-style extensions
 * to the modern OpenCode plugin API (v1.14+).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate an OpenCode plugin adapter for an eta-mu extension.
 *
 * The adapter:
 * 1. Imports the compiled CJS runtime (which exports an `init(pi)` function)
 * 2. Creates a "pi proxy" that captures registerTool/registerCommand/on calls
 * 3. Converts captured definitions to OpenCode's Hooks format
 * 4. Adapts tool execute signatures (OpenCode: (args, ctx) => pi: (tcid, params, signal, onUpdate, ctx))
 * 5. Adapts context objects (OpenCode ToolContext -> pi-style context)
 */
export function generateAdapter(extName, runtimePath) {
  const runtimeRel = path.posix.relative("dist/opencode", runtimePath).replace(/^\.\//, "");

  return `import runtimeModule from "${runtimeRel}";
import { z } from "zod";

const runtime = runtimeModule.default ?? runtimeModule;

// ── JSON Schema → Zod converter ───────────────────────────────────────────

function jsonSchemaToZod(schema) {
  if (!schema) return z.any();
  if (schema.type === "string") {
    if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
      let base = z.enum(schema.enum);
      if (schema.description) base = base.describe(schema.description);
      return base;
    }
    let base = z.string();
    if (schema.description) base = base.describe(schema.description);
    return base;
  }
  if (schema.type === "number" || schema.type === "integer") {
    let base = z.number();
    if (schema.description) base = base.describe(schema.description);
    if (schema.min !== undefined) base = base.min(schema.min);
    if (schema.max !== undefined) base = base.max(schema.max);
    return base;
  }
  if (schema.type === "boolean") {
    let base = z.boolean();
    if (schema.description) base = base.describe(schema.description);
    return base;
  }
  if (schema.type === "array") {
    let base = z.array(z.any());
    if (schema.description) base = base.describe(schema.description);
    return base;
  }
  if (schema.type === "object") {
    const shape = {};
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        let field = jsonSchemaToZod(prop);
        const isRequired = schema.required?.includes(key);
        if (!isRequired) field = field.optional();
        shape[key] = field;
      }
    }
    let base = z.object(shape).strict();
    if (schema.description) base = base.describe(schema.description);
    return base;
  }
  // Fallback: any
  let base = z.any();
  if (schema.description) base = base.describe(schema.description);
  return base;
}

// ── Pi proxy that captures registrations ──────────────────────────────────

function createPiProxy(toolFn) {
  const tools = {};
  const commands = {};
  const events = {};
  const providers = {};

  const pi = {
    registerTool(def) {
      const zodShape = {};
      if (def.parameters && def.parameters.properties) {
        for (const [key, prop] of Object.entries(def.parameters.properties)) {
          let field = jsonSchemaToZod(prop);
          const isRequired = def.parameters.required?.includes(key);
          if (!isRequired) field = field.optional();
          zodShape[key] = field;
        }
      }

      const argsSchema = Object.keys(zodShape).length > 0
        ? z.object(zodShape).strict()
        : z.object({}).strict();

      tools[def.name] = toolFn({
        description: def.description || def.label || def.name,
        args: argsSchema,
        async execute(args, ctx) {
          // Adapt OpenCode ToolContext -> pi context
          const piCtx = {
            cwd: ctx.directory || process.cwd(),
            directory: ctx.directory,
            worktree: ctx.worktree,
            sessionID: ctx.sessionID,
            messageID: ctx.messageID,
            agent: ctx.agent,
            hasUI: false,
            ui: null,
            model: null,
            sessionManager: null,
            // Allow metadata calls to be no-ops
            metadata() {},
          };

          // pi execute: (_tcid, params, signal, onUpdate, ctx)
          // OpenCode execute: (args, ctx)
          return def.execute(null, args, ctx.abort || null, null, piCtx);
        },
      });
    },

    registerCommand(name, def) {
      // OpenCode commands are handled differently; for now, log them
      commands[name] = def;
    },

    registerProvider(name, config) {
      // OpenCode provider registration is handled via provider hook
      providers[name] = config;
    },

    on(event, handler) {
      if (!events[event]) events[event] = [];
      events[event].push(handler);
    },
  };

  return { pi, tools, commands, events, providers };
}

// ── Plugin export ─────────────────────────────────────────────────────────

export default async function(input, options) {
  // Dynamic import of @opencode-ai/plugin to get the tool() helper
  const pluginModule = await import("@opencode-ai/plugin");
  const toolFn = pluginModule.tool;

  if (!toolFn) {
    throw new Error("@opencode-ai/plugin tool() not available");
  }

  const { pi, tools, commands, events, providers } = createPiProxy(toolFn);

  // Initialize the eta-mu extension with our pi proxy
  runtime(pi);

  // Build Hooks object
  const hooks = {};

  if (Object.keys(tools).length > 0) {
    hooks.tool = tools;
  }

  // Wire up lifecycle events
  const eventHooks = [];

  if (events.session_start) {
    eventHooks.push(async ({ event }) => {
      if (event.type === "session_start") {
        for (const h of events.session_start) {
          await h(event, input);
        }
      }
    });
  }

  if (events.turn_start) {
    eventHooks.push(async ({ event }) => {
      if (event.type === "turn_start") {
        for (const h of events.turn_start) {
          await h(event, input);
        }
      }
    });
  }

  if (eventHooks.length > 0) {
    hooks.event = async (input) => {
      for (const h of eventHooks) {
        await h(input);
      }
    };
  }

  if (Object.keys(providers).length > 0) {
    hooks.provider = {
      id: "${extName}",
      async models(provider, ctx) {
        const result = {};
        for (const [name, config] of Object.entries(providers)) {
          if (config.models) {
            for (const model of config.models) {
              result[model.id] = {
                id: model.id,
                name: model.name || model.id,
                reasoning: model.reasoning || false,
                contextWindow: model.contextWindow || 200000,
                maxTokens: model.maxTokens || 16384,
              };
            }
          }
        }
        return result;
      }
    };
  }

  return hooks;
}
`;
}
