/**
 * Actor Model — Core actor behaviors and talent management
 */
import type { Actor, ActorScript, Behavior, Talent } from './types.js';
export type ActorFactory = {
    createActor: (script: ActorScript, goals: readonly string[]) => Actor;
    createBehavior: (name: string, mode: Behavior['mode'], plan: Behavior['plan']) => Behavior;
    createTalent: (name: string, behaviors: readonly Behavior[]) => Talent;
};
export declare const makeActorFactory: () => ActorFactory;
//# sourceMappingURL=actors.d.ts.map