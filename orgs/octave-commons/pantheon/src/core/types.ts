export type ActorState = 'idle' | 'running' | 'completed' | 'failed';

export interface ActorConfig {
  name: string;
  type: 'llm' | 'tool' | 'composite';
  parameters: Record<string, unknown>;
}

export interface Actor {
  id: string;
  config: ActorConfig;
  state: ActorState;
  lastTick: number;
  metadata?: Record<string, unknown>;
}

export interface Context {
  id: string;
  sources: string[];
  text: string;
  compiled: unknown;
  timestamp: number;
}

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
  id?: string;
  type?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface ContextSource {
  id: string;
  label?: string;
  metadata?: Record<string, unknown>;
}
