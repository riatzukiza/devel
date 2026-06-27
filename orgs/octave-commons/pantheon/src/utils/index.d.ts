/**
 * Pantheon Utilities Module
 * Common utility functions and helpers
 */
import type { Actor, Message, ContextSource } from '@promethean-os/pantheon-core';
export declare const generateId: () => string;
export declare const generateActorId: (name: string) => string;
export declare const createMessage: (role: "system" | "user" | "assistant", content: string, images?: string[]) => Message;
export declare const createSystemMessage: (content: string) => Message;
export declare const createUserMessage: (content: string) => Message;
export declare const createAssistantMessage: (content: string) => Message;
export declare const truncateMessages: (messages: Message[], maxTokens?: number, avgTokensPerChar?: number) => Message[];
export declare const createContextSource: (id: string, label: string, where?: Record<string, unknown>, metadata?: Record<string, unknown>) => ContextSource;
export declare const mergeContextSources: (...sources: ContextSource[][]) => ContextSource[];
export declare const createActorSummary: (actor: Actor) => string;
export declare const isActorActive: (actor: Actor) => boolean;
export declare const isActorCompleted: (actor: Actor) => boolean;
export declare const getActorAge: (actor: Actor) => number;
export declare const getActorIdleTime: (actor: Actor) => number;
export declare const mergeConfigs: <T extends Record<string, any>>(defaultConfig: T, userConfig: Partial<T>) => T;
export declare const validateConfig: <T extends Record<string, any>>(config: any, requiredKeys: (keyof T)[]) => config is T;
export declare class PantheonError extends Error {
    code: string;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
    toJSON(): Record<string, unknown>;
}
export declare const createError: (code: string, message: string, details?: Record<string, unknown>) => PantheonError;
export declare const isError: (error: unknown) => error is PantheonError;
export declare const withTimeout: <T>(promise: Promise<T>, timeoutMs: number, timeoutError?: Error) => Promise<T>;
export declare const retry: <T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number, backoff?: "linear" | "exponential") => Promise<T>;
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface Logger {
    debug: (message: string, meta?: unknown) => void;
    info: (message: string, meta?: unknown) => void;
    warn: (message: string, meta?: unknown) => void;
    error: (message: string, meta?: unknown) => void;
}
export declare const createConsoleLogger: (level?: LogLevel) => Logger;
export declare const createNullLogger: () => Logger;
export declare const createTimer: () => (() => number);
export declare const measureAsync: <T>(fn: () => Promise<T>, label?: string) => Promise<[T, number]>;
//# sourceMappingURL=index.d.ts.map