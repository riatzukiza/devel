import test from 'ava';

import { makeOrchestrator } from '../../core/orchestrator.js';
import type { OrchestratorDeps } from '../../core/orchestrator.js';
import type { ActorConfig, Message } from '../../core/types.js';

// Mock implementations
const createMockToolPort = () => ({
  invoke: async (name: string, args: Record<string, unknown>) => ({
    name,
    args,
    executed: true,
  }),
});

const createMockContextPort = () => ({
  compile: async ({
    sources,
    texts = [],
  }: {
    texts?: readonly string[];
    sources: readonly { id: string; label?: string }[];
    recentLimit?: number;
    queryLimit?: number;
    limit?: number;
  }): Promise<Message[]> => {
    const sourceMessages = sources.map((source) => ({
      role: 'system' as const,
      content: source.label ?? source.id,
    }));

    const textMessages = texts.map((text) => ({
      role: 'user' as const,
      content: text,
    }));

    return [...sourceMessages, ...textMessages];
  },
});

const createMockActorPort = () => ({
  tick: async (_actorId: string) => {
    // Mock tick implementation
  },
  create: async (_config: ActorConfig) => `actor-${Date.now()}`,
  get: async () => null,
});

test('makeOrchestrator creates orchestrator with all methods', (t) => {
  const deps: OrchestratorDeps = {
    toolPort: createMockToolPort(),
    contextPort: createMockContextPort(),
    actorPort: createMockActorPort(),
  };

  const orchestrator = makeOrchestrator(deps);

  t.is(typeof orchestrator.processCommand, 'function');
  t.is(typeof orchestrator.compileContext, 'function');
  t.is(typeof orchestrator.tickActor, 'function');
  t.is(typeof orchestrator.createActor, 'function');
  t.is(typeof orchestrator.getActor, 'function');
});

test('orchestrator.processCommand delegates to toolPort', async (t) => {
  const mockToolPort = createMockToolPort();
  const deps: OrchestratorDeps = {
    toolPort: mockToolPort,
    contextPort: createMockContextPort(),
    actorPort: createMockActorPort(),
  };

  const orchestrator = makeOrchestrator(deps);
  const result = await orchestrator.processCommand('test-command', { param: 'value' });

  t.deepEqual(result, {
    name: 'test-command',
    args: { param: 'value' },
    executed: true,
  });
});

test('orchestrator.processCommand without args', async (t) => {
  const mockToolPort = createMockToolPort();
  const deps: OrchestratorDeps = {
    toolPort: mockToolPort,
    contextPort: createMockContextPort(),
    actorPort: createMockActorPort(),
  };

  const orchestrator = makeOrchestrator(deps);
  const result = await orchestrator.processCommand('simple-command');

  t.deepEqual(result, {
    name: 'simple-command',
    args: {},
    executed: true,
  });
});

test('orchestrator.compileContext delegates to contextPort', async (t) => {
  const mockContextPort = createMockContextPort();
  const deps: OrchestratorDeps = {
    toolPort: createMockToolPort(),
    contextPort: mockContextPort,
    actorPort: createMockActorPort(),
  };

  const orchestrator = makeOrchestrator(deps);
  const result = await orchestrator.compileContext(['source1'], 'test text');

  t.is(result.length, 2);
  t.deepEqual(result[0], { role: 'system', content: 'source1' });
  t.deepEqual(result[1], { role: 'user', content: 'test text' });
});

test('orchestrator.tickActor delegates to actorPort', async (t) => {
  const mockActorPort = createMockActorPort();
  const deps: OrchestratorDeps = {
    toolPort: createMockToolPort(),
    contextPort: createMockContextPort(),
    actorPort: mockActorPort,
  };

  const orchestrator = makeOrchestrator(deps);

  await t.notThrowsAsync(() => orchestrator.tickActor('actor-123'));
});

test('orchestrator.createActor delegates to actorPort', async (t) => {
  const mockActorPort = createMockActorPort();
  const deps: OrchestratorDeps = {
    toolPort: createMockToolPort(),
    contextPort: createMockContextPort(),
    actorPort: mockActorPort,
  };

  const orchestrator = makeOrchestrator(deps);
  const config: ActorConfig = {
    name: 'test-actor',
    type: 'llm',
    parameters: { model: 'gpt-4' },
  };

  const actorId = await orchestrator.createActor(config);

  t.is(typeof actorId, 'string');
  t.true(actorId.startsWith('actor-'));
});

test('orchestrator.getActor delegates to actorPort', async (t) => {
  const mockActorPort = createMockActorPort();
  const deps: OrchestratorDeps = {
    toolPort: createMockToolPort(),
    contextPort: createMockContextPort(),
    actorPort: mockActorPort,
  };

  const orchestrator = makeOrchestrator(deps);
  const result = await orchestrator.getActor('non-existing');

  t.is(result, null);
});

test('orchestrator handles all actor types', async (t) => {
  const mockActorPort = createMockActorPort();
  const deps: OrchestratorDeps = {
    toolPort: createMockToolPort(),
    contextPort: createMockContextPort(),
    actorPort: mockActorPort,
  };

  const orchestrator = makeOrchestrator(deps);
  const actorTypes: ActorConfig['type'][] = ['llm', 'tool', 'composite'];

  for (const type of actorTypes) {
    const config: ActorConfig = {
      name: `test-${type}`,
      type,
      parameters: {},
    };

    const actorId = await orchestrator.createActor(config);
    t.is(typeof actorId, 'string');
  }
});
