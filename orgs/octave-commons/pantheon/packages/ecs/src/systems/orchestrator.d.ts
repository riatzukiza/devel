import type { World } from '@promethean-os/ds/ecs.js';
import type { AgentBus } from '../bus.js';
import type { AgentComponents } from '../types.js';
type ConversationMessage = {
    readonly role: 'user' | 'assistant' | 'system';
    readonly content: string;
};
type ConversationContext = ReadonlyArray<ConversationMessage>;
export type OrchestratorBus = Pick<AgentBus, 'enqueue'>;
type OrchestratorContext = {
    readonly world: World;
    readonly bus: OrchestratorBus;
    readonly components: AgentComponents;
    readonly getContext: (text: string) => Promise<ConversationContext>;
    readonly systemPrompt: () => string;
};
export declare const OrchestratorSystem: ({ world, bus, components, getContext, systemPrompt }: OrchestratorContext) => () => Promise<void>;
export {};
//# sourceMappingURL=orchestrator.d.ts.map