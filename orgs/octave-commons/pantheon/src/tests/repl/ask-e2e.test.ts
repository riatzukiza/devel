import test from 'ava';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { executeAsk } from '../../repl.js';

const noopFetch = async () => ({ ok: true, json: async () => ({ data: [] }) });

async function buildInstructionFixture(prefix: string): Promise<{
  cwd: string;
  globPattern: string;
  filePath: string;
}> {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const packageDir = path.join(cwd, 'packages', 'demo');
  await fs.mkdir(packageDir, { recursive: true });
  const filePath = path.join(packageDir, 'AGENTS.md');
  await fs.writeFile(filePath, '# Agent\nInstruction text for the agent.');
  const globPattern = path.join(cwd, 'packages', '*', 'AGENTS.md');
  return { cwd, globPattern, filePath };
}

function escapeForAsk(input: string): string {
  return input.replace(/\\/g, '\\\\');
}

function restore(fetchRef: typeof fetch | undefined, env: Record<string, string | undefined>) {
  if (fetchRef) {
    (globalThis as any).fetch = fetchRef;
  }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete (process.env as Record<string, string | undefined>)[key];
    } else {
      process.env[key] = value;
    }
  }
}

test('ask works with opencode harness and instruction files', async (t) => {
  const { cwd, globPattern } = await buildInstructionFixture('pantheon-opencode-');

  const previousFetch = globalThis.fetch;
  (globalThis as any).fetch = noopFetch as any;
  t.teardown(() => restore(previousFetch, {}));

  let receivedBody: any = null;
  const sdkMock = {
    createOpencodeClient: ({ baseUrl }: { baseUrl: string }) => {
      t.is(baseUrl, 'http://localhost:4096');
      return {
        session: {
          create: async () => ({ id: 'session-123' }),
          prompt: async ({ body }: any) => {
            receivedBody = body;
            return { parts: [{ text: 'ok-opencode' }] };
          },
        },
      };
    },
  };

  const expression = `(ask :query "questions" :harness 'opencode :instructions ["${escapeForAsk(globPattern)}"] :cwd "${escapeForAsk(cwd)}" :model 'opencode/big-pickle :role 'opencode/agent-name)`;
  const output = await executeAsk(expression, {
    opencode: { createOpencodeClient: sdkMock.createOpencodeClient },
  });

  t.is(output, 'ok-opencode');
  t.truthy(receivedBody);
  const promptText = String(receivedBody?.parts?.[0]?.text ?? '');
  t.regex(promptText, /Instruction text for the agent/i);
  t.regex(promptText, /questions/i);
});

test('ask works with openai harness and openai-compatible endpoint', async (t) => {
  const { cwd, globPattern } = await buildInstructionFixture('pantheon-openai-');
  const baseUrl = 'https://opencode.ai/zen/v1/responses';

  const previousFetch = globalThis.fetch;
  const previousEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  };
  (globalThis as any).fetch = noopFetch as any;
  process.env.OPENAI_API_KEY = 'test-key';
  t.teardown(() => restore(previousFetch, previousEnv));

  const runCalls: any[] = [];
  class AgentMock {
    name?: string;
    instructions?: string;
    model?: string;

    constructor(config: any) {
      this.name = config.name;
      this.instructions = config.instructions;
      this.model = config.model;
    }
  }

  const run = async (agent: any, prompt: string) => {
    runCalls.push({ agent, prompt });
    return {
      toTextStream: () =>
        (async function* stream() {
          yield 'ok-openai';
        })(),
      completed: Promise.resolve(),
    };
  };

  const expression = `(ask :query "questions" :harness 'openai :instructions ["${escapeForAsk(globPattern)}"] :cwd "${escapeForAsk(cwd)}" :model 'opencode/big-pickle :role 'opencode/agent-name :environment { :OPENAI_COMPATABLE_API "${baseUrl}" })`;
  const output = await executeAsk(expression, {
    openai: { Agent: AgentMock, run },
  });

  t.is(output, 'ok-openai');
  t.true(runCalls.length > 0);
  t.is(runCalls[0].prompt, 'questions');
  t.is(process.env.OPENAI_BASE_URL, baseUrl);
  t.regex(String(runCalls[0].agent.instructions ?? ''), /Instruction text for the agent/i);
});
