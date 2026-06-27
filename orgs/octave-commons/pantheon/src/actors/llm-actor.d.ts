/**
 * LLM-powered Actor Implementation
 * An actor that uses LLM to process messages and make decisions
 */
import type { ActorPort, ActorConfig, LlmPort, Message } from '../core/ports.js';
export interface LLMActorConfig extends ActorConfig {
    llm: LlmPort;
    systemPrompt?: string;
    maxMessages?: number;
}
export declare function makeLLMActorAdapter(): ActorPort & {
    addMessage(actorId: string, message: Message): Promise<void>;
    getMessages(actorId: string): Promise<Message[]>;
};
//# sourceMappingURL=llm-actor.d.ts.map