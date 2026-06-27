/**
 * Context Engine — Dynamic context compilation port adapter
 * Wraps @promethean-os/persistence collections to provide Pantheon-native context
 */
import type { ContextPort } from './ports.js';
import type { ContextSource } from './types.js';
export type ContextPortDeps = {
    getCollectionsFor: (sources: readonly ContextSource[]) => Promise<readonly unknown[]>;
    resolveRole: (meta?: Record<string, unknown>) => 'system' | 'user' | 'assistant';
    resolveName: (meta?: Record<string, unknown>) => string;
    formatTime: (ms: number) => string;
};
export declare const makeContextPort: (deps: ContextPortDeps) => ContextPort;
//# sourceMappingURL=context.d.ts.map