import test from 'ava';

import { SessionManager, createDefaultSessionManagerConfig } from './manager.js';

type PublishedEvent = {
  readonly topic: string;
  readonly payload: unknown;
};

class FakeEventBus {
  public readonly published: PublishedEvent[] = [];
  private readonly handlers = new Map<string, Array<(event: { id: string; topic: string; payload: unknown; ts: number }) => Promise<void> | void>>();
  private sequence = 0;

  public async subscribe(
    topic: string,
    _subscriberId: string,
    handler: (event: { id: string; topic: string; payload: unknown; ts: number }) => Promise<void> | void,
  ): Promise<void> {
    const current = this.handlers.get(topic) ?? [];
    current.push(handler);
    this.handlers.set(topic, current);
  }

  public async publish(topic: string, payload: unknown): Promise<void> {
    this.published.push({ topic, payload });
    const event = { id: `evt-${++this.sequence}`, topic, payload, ts: Date.now() };
    for (const handler of this.handlers.get(topic) ?? []) {
      await handler(event);
    }
  }
}

test('mentions preempt normal queued message events', async (t) => {
  const eventBus = new FakeEventBus();
  const config = createDefaultSessionManagerConfig();
  config.concurrency = 1;

  const manager = new SessionManager(eventBus as never, {} as never, config);
  await manager.start();
  manager.createSession('s1', 'duck', 'interactive');

  const normalOne = {
    id: 'normal-1',
    type: 'discord.message.created' as const,
    timestamp: Date.now(),
    payload: {
      platform: 'irc' as const,
      guildId: 'ussy',
      channelId: 'irc:ussy:%23ussycode',
      messageId: 'msg-1',
      authorId: 'human-1',
      authorIsBot: false,
      content: 'hello',
      embeds: [],
      attachments: [],
      mentionsCephalon: false,
      replyTo: null,
    },
  };
  const normalTwo = {
    id: 'normal-2',
    type: 'discord.message.created' as const,
    timestamp: Date.now(),
    payload: {
      platform: 'irc' as const,
      guildId: 'ussy',
      channelId: 'irc:ussy:%23ussycode',
      messageId: 'msg-2',
      authorId: 'human-2',
      authorIsBot: false,
      content: 'follow up',
      embeds: [],
      attachments: [],
      mentionsCephalon: false,
      replyTo: null,
    },
  };
  const mention = {
    id: 'mention-1',
    type: 'discord.message.created' as const,
    timestamp: Date.now(),
    payload: {
      platform: 'irc' as const,
      guildId: 'ussy',
      channelId: 'irc:ussy:%23ussycode',
      messageId: 'msg-3',
      authorId: 'human-3',
      authorIsBot: false,
      content: 'duck?',
      embeds: [],
      attachments: [],
      mentionsCephalon: true,
      replyTo: null,
    },
  };

  await manager.routeEvent(normalOne);
  await manager.routeEvent(normalTwo);
  await manager.routeEvent(mention);

  await eventBus.publish('session.turn.completed', { sessionId: 's1', timestamp: Date.now() });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const requestedIds = eventBus.published
    .filter((event) => event.topic === 'session.turn.requested')
    .map((event) => (event.payload as { event: { id: string } }).event.id);

  t.deepEqual(requestedIds, ['normal-1', 'mention-1']);

  await eventBus.publish('session.turn.completed', { sessionId: 's1', timestamp: Date.now() });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await eventBus.publish('session.turn.completed', { sessionId: 's1', timestamp: Date.now() });
  await new Promise((resolve) => setTimeout(resolve, 0));
});

test('mentions route only to interactive sessions when available', async (t) => {
  const eventBus = new FakeEventBus();
  const config = createDefaultSessionManagerConfig();
  config.concurrency = 4;

  const manager = new SessionManager(eventBus as never, {} as never, config);
  await manager.start();
  manager.createSession('interactive-1', 'duck', 'interactive');
  manager.createSession('operational-1', 'duck', 'operational');

  await manager.routeEvent({
    id: 'mention-only',
    type: 'discord.message.created',
    timestamp: Date.now(),
    payload: {
      platform: 'irc',
      guildId: 'ussy',
      channelId: 'irc:ussy:%23ussycode',
      messageId: 'msg-4',
      authorId: 'human-4',
      authorIsBot: false,
      content: 'duck?',
      embeds: [],
      attachments: [],
      mentionsCephalon: true,
      replyTo: null,
    },
  });

  const requestedSessionIds = eventBus.published
    .filter((event) => event.topic === 'session.turn.requested')
    .map((event) => (event.payload as { sessionId: string }).sessionId);

  t.deepEqual(requestedSessionIds, ['interactive-1']);

  await eventBus.publish('session.turn.completed', { sessionId: 'interactive-1', timestamp: Date.now() });
  await new Promise((resolve) => setTimeout(resolve, 0));
});

test('mentions prefer circuit three when available', async (t) => {
  const eventBus = new FakeEventBus();
  const config = createDefaultSessionManagerConfig();
  config.concurrency = 4;

  const manager = new SessionManager(eventBus as never, {} as never, config);
  await manager.start();
  manager.createSession('c3-symbolic', 'duck', 'interactive', { circuitIndex: 3 });
  manager.createSession('c4-performance', 'duck', 'interactive', { circuitIndex: 4 });
  manager.createSession('c1-survival', 'duck', 'operational', { circuitIndex: 1 });

  await manager.routeEvent({
    id: 'mention-c3',
    type: 'discord.message.created',
    timestamp: Date.now(),
    payload: {
      platform: 'irc',
      guildId: 'ussy',
      channelId: 'irc:ussy:%23ussycode',
      messageId: 'msg-5',
      authorId: 'human-5',
      authorIsBot: false,
      content: 'duck?',
      embeds: [],
      attachments: [],
      mentionsCephalon: true,
      replyTo: null,
    },
  });

  const requestedSessionIds = eventBus.published
    .filter((event) => event.topic === 'session.turn.requested')
    .map((event) => (event.payload as { sessionId: string }).sessionId);

  t.deepEqual(requestedSessionIds, ['c3-symbolic']);

  await eventBus.publish('session.turn.completed', { sessionId: 'c3-symbolic', timestamp: Date.now() });
  await new Promise((resolve) => setTimeout(resolve, 0));
});

test('non-mention bot messages do not route into session queues', async (t) => {
  const eventBus = new FakeEventBus();
  const config = createDefaultSessionManagerConfig();
  config.concurrency = 4;

  const manager = new SessionManager(eventBus as never, {} as never, config);
  await manager.start();
  manager.createSession('c3-symbolic', 'duck', 'interactive', { circuitIndex: 3 });
  manager.createSession('c4-performance', 'duck', 'interactive', { circuitIndex: 4 });

  await manager.routeEvent({
    id: 'bot-chatter',
    type: 'discord.message.created',
    timestamp: Date.now(),
    payload: {
      platform: 'irc',
      guildId: 'ussy',
      channelId: 'irc:ussy:%23ussycode',
      messageId: 'msg-6',
      authorId: 'conversationbot',
      authorIsBot: true,
      content: 'pong',
      embeds: [],
      attachments: [],
      mentionsCephalon: false,
      replyTo: null,
    },
  });

  const requestedSessionIds = eventBus.published
    .filter((event) => event.topic === 'session.turn.requested')
    .map((event) => (event.payload as { sessionId: string }).sessionId);

  t.deepEqual(requestedSessionIds, []);
});
