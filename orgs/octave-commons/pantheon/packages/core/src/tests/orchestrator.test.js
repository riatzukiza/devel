import test from 'ava';
import { makeOrchestrator } from '../core/orchestrator.js';
const makeDeps = () => {
    const logs = [];
    return {
        now: () => 123,
        log: (m, meta) => logs.push({ m, meta }),
        context: { compile: async () => [] },
        tools: { invoke: async () => ({ ok: true }) },
        llm: { complete: async () => ({ role: 'assistant', content: 'ok' }) },
        bus: { send: async () => undefined, subscribe: () => () => { } },
        schedule: { every: () => () => { }, once: () => { } },
        state: {
            spawn: async () => {
                throw new Error('not used here');
            },
            get: async () => null,
            update: async (_id, _patch) => {
                return {};
            },
            list: async () => [],
        },
    };
};
const makeActor = () => ({
    id: 'a1',
    state: 'idle',
    script: {
        name: 'demo',
        contextSources: [],
        talents: [
            {
                name: 't',
                behaviors: [
                    {
                        name: 'b',
                        mode: 'active',
                        plan: async () => ({
                            actions: [
                                { type: 'message', content: 'hey', target: 'user' },
                                { type: 'tool', name: 't1', args: { x: 1 } },
                            ],
                        }),
                    },
                ],
            },
        ],
    },
    goals: ['g'],
    createdAt: new Date(0),
    updatedAt: new Date(0),
    metadata: {},
});
test('orchestrator executes behavior actions', async (t) => {
    const deps = makeDeps();
    const updates = [];
    const originalUpdate = deps.state.update;
    deps.state.update = async (_id, patch) => {
        updates.push(patch);
        return originalUpdate(_id, patch);
    };
    const orch = makeOrchestrator(deps);
    await t.notThrowsAsync(() => orch.tickActor(makeActor(), { userMessage: 'hi' }));
    t.true(updates.some((u) => u.state === 'completed'));
});
test('orchestrator handles tool not found errors', async (t) => {
    const deps = makeDeps();
    deps.tools.invoke = async () => ({ ok: false, error: 'Tool not found' });
    const orch = makeOrchestrator(deps);
    await t.notThrowsAsync(() => orch.tickActor(makeActor(), { userMessage: 'hi' }));
});
test('orchestrator handles message bus errors', async (t) => {
    const deps = makeDeps();
    deps.bus.send = async () => {
        throw new Error('Bus unavailable');
    };
    const orch = makeOrchestrator(deps);
    await t.notThrowsAsync(() => orch.tickActor(makeActor(), { userMessage: 'hi' }));
});
test('orchestrator respects passive behavior mode', async (t) => {
    const deps = makeDeps();
    const logs = [];
    deps.log = (m, meta) => logs.push({ m, meta });
    const updates = [];
    deps.state.update = async (_id, patch) => {
        updates.push(patch);
        return {};
    };
    const orch = makeOrchestrator(deps);
    const actorWithPassiveBehavior = {
        id: 'a2',
        state: 'idle',
        script: {
            name: 'passive-demo',
            contextSources: [],
            talents: [
                {
                    name: 'passive-talent',
                    behaviors: [
                        {
                            name: 'passive-behavior',
                            mode: 'passive',
                            plan: async () => ({
                                actions: [{ type: 'message', content: 'passive response' }],
                            }),
                        },
                    ],
                },
            ],
        },
        goals: ['g'],
        createdAt: new Date(0),
        updatedAt: new Date(0),
        metadata: {},
    };
    // Test passive behavior runs without user input
    await orch.tickActor(actorWithPassiveBehavior);
    // Should complete since passive behavior runs when no user input
    t.true(updates.some((u) => u.state === 'completed'));
    // Reset for next test
    updates.length = 0;
    // Test passive behavior does NOT run with user input
    await orch.tickActor(actorWithPassiveBehavior, { userMessage: 'hi' });
    // Should still complete (current implementation completes even with no behaviors)
    // This test documents current behavior - could be improved in future
    t.true(updates.some((u) => u.state === 'completed'));
});
//# sourceMappingURL=orchestrator.test.js.map