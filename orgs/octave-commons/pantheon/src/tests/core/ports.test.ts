import test from 'ava';
import type {
  ToolPort,
  ContextPort,
  ActorPort,
  LlmPort,
  Message,
  ContextSource,
} from '../../core/ports.js';

// Mock implementations for testing
const createMockToolPort = (): ToolPort => ({
  register: () => {},
  invoke: async (name: string, args: Record<string, unknown>) => {
    return { name, args, result: 'mock_result' };
  },
});

const createMockContextPort = (): ContextPort => ({
  compile: async ({
    texts = [],
    sources,
  }: {
    texts?: readonly string[];
    sources: readonly ContextSource[];
  }): Promise<Message[]> => {
    const sourceMessages = sources.map((source) => ({
      role: 'system' as const,
      content: `source:${source.id}`,
    }));

    const textMessages = texts.map((text) => ({
      role: 'user' as const,
      content: text,
    }));

    return [...sourceMessages, ...textMessages];
  },
});

const createMockActorPort = (): ActorPort => ({
  tick: async (_actorId: string) => {
    // Mock tick operation
  },
  create: async (_config) => `actor-${Date.now()}`,
  get: async (id: string) =>
    id === 'existing'
      ? {
          id,
          config: { name: 'test', type: 'tool', parameters: {} },
          state: 'running',
          lastTick: Date.now(),
        }
      : null,
});

const createMockLlmPort = (): LlmPort => ({
  complete: async (messages, _opts) => ({
    role: 'assistant',
    content: `Mock response to ${messages.length} messages`,
  }),
});

test('ToolPort invoke method', async (t) => {
  const toolPort = createMockToolPort();

  const result = await toolPort.invoke('test-command', { param: 'value' });

  t.deepEqual(result, {
    name: 'test-command',
    args: { param: 'value' },
    result: 'mock_result',
  });
});

test('ToolPort invoke without args', async (t) => {
  const toolPort = createMockToolPort();

  const result = await toolPort.invoke('simple-command', {});

  t.deepEqual(result, {
    name: 'simple-command',
    args: {},
    result: 'mock_result',
  });
});

test('ContextPort compile method', async (t) => {
  const contextPort = createMockContextPort();

  const result = await contextPort.compile({
    sources: [
      { id: 'source1', label: 'Source 1' },
      { id: 'source2', label: 'Source 2' },
    ],
    texts: ['Test text'],
  });

  t.is(result.length, 3);
  t.deepEqual(result[0], { role: 'system', content: 'source:source1' });
  t.deepEqual(result[1], { role: 'system', content: 'source:source2' });
  t.deepEqual(result[2], { role: 'user', content: 'Test text' });
});

test('ActorPort create method', async (t) => {
  const actorPort = createMockActorPort();

  const config = {
    name: 'test-actor',
    type: 'llm' as const,
    parameters: { model: 'gpt-4' },
  };

  const actorId = await actorPort.create(config);

  t.is(typeof actorId, 'string');
  t.true(actorId.startsWith('actor-'));
});

test('ActorPort get existing actor', async (t) => {
  const actorPort = createMockActorPort();

  const result = await actorPort.get('existing');

  t.not(result, null);
  t.is(result?.id, 'existing');
  t.is(result?.config.name, 'test');
  t.is(result?.config.type, 'tool');
  t.is(result?.state, 'running');
  t.true((result?.lastTick ?? 0) > 0);
});

test('ActorPort get non-existing actor', async (t) => {
  const actorPort = createMockActorPort();

  const result = await actorPort.get('non-existing');

  t.is(result, null);
});

test('ActorPort tick method', async (t) => {
  const actorPort = createMockActorPort();

  await t.notThrowsAsync(() => actorPort.tick('actor-id'));
});

test('LlmPort complete method', async (t) => {
  const llmPort = createMockLlmPort();

  const messages = [
    { role: 'user' as const, content: 'Hello' },
    { role: 'assistant' as const, content: 'Hi there!' },
  ];

  const result = await llmPort.complete(messages, { model: 'gpt-4', temperature: 0.7 });

  t.is(result.role, 'assistant');
  t.true(result.content.includes('2 messages'));
});

test('LlmPort complete without options', async (t) => {
  const llmPort = createMockLlmPort();

  const messages = [{ role: 'user' as const, content: 'Test' }];

  const result = await llmPort.complete(messages);

  t.is(result.role, 'assistant');
  t.true(result.content.includes('1 messages'));
});
