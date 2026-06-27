import { World } from '@promethean-os/ds/ecs.js';
import { sleep } from '@promethean-os/utils/sleep.js';
import { defineAgentComponents } from './components.js';
import { SpeechArbiterSystem } from './systems/speechArbiter.js';
import { TurnDetectionSystem } from './systems/turn.js';
import { VADUpdateSystem } from './systems/vad.js';
class AgentTicker {
    world;
    systems;
    running = false;
    tickPromise = Promise.resolve();
    startPromise = Promise.resolve();
    resolveStart;
    constructor(world, systems) {
        this.world = world;
        this.systems = systems;
    }
    async tick(dtMs = 50) {
        const command = this.world.beginTick();
        await this.systems.reduce((promise, system) => promise.then(() => Promise.resolve(system(dtMs))).then(() => undefined), Promise.resolve());
        command.flush();
        this.world.endTick();
    }
    addSystem(system) {
        this.systems = [...this.systems, system];
    }
    async start(delay) {
        if (this.running)
            return this.startPromise;
        this.running = true;
        this.startPromise = new Promise((resolve) => {
            this.resolveStart = resolve;
        });
        const schedule = (elapsed) => {
            if (!this.running)
                return;
            void iterate(elapsed).catch((error) => {
                console.error('[agent-ecs] ticker loop failed', error);
                this.running = false;
                this.resolveStart?.();
                this.resolveStart = undefined;
            });
        };
        const iterate = async (previousDelta) => {
            if (!this.running)
                return;
            const tickStart = Date.now();
            await this.tickPromise;
            if (!this.running)
                return;
            this.tickPromise = this.tick(previousDelta);
            const tickStop = Date.now();
            const elapsed = tickStop - tickStart;
            const remaining = delay - elapsed;
            if (remaining > 0)
                await sleep(remaining);
            schedule(elapsed);
        };
        schedule(0);
        return this.startPromise;
    }
    async stop() {
        if (!this.running)
            throw new Error('There is no ticker to stop');
        await this.tickPromise;
        this.running = false;
        this.resolveStart?.();
        this.resolveStart = undefined;
    }
}
export const createAgentWorld = (audioPlayer) => {
    const world = new World();
    const components = defineAgentComponents(world);
    const command = world.beginTick();
    const agent = command.createEntity();
    command.add(agent, components.Turn);
    command.add(agent, components.PlaybackQ, { items: [] });
    command.add(agent, components.Policy, { defaultBargeIn: 'pause' });
    command.add(agent, components.AudioRef, { player: audioPlayer });
    command.add(agent, components.RawVAD);
    command.add(agent, components.VAD);
    command.add(agent, components.TranscriptFinal);
    command.add(agent, components.BargeState);
    command.add(agent, components.VisionRing);
    command.add(agent, components.VoiceState);
    command.flush();
    world.endTick();
    const ticker = new AgentTicker(world, [
        VADUpdateSystem(world, components),
        TurnDetectionSystem(world, components),
        SpeechArbiterSystem(world, components),
    ]);
    return {
        w: world,
        agent,
        C: components,
        tick: (dtMs = 50) => ticker.tick(dtMs),
        addSystem: (system) => ticker.addSystem(system),
        start: (delay) => ticker.start(delay),
        stop: () => ticker.stop(),
    };
};
//# sourceMappingURL=world.js.map