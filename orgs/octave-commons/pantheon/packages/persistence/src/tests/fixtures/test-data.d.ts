/**
 * Test data for pantheon-persistence tests
 */
import type { ContextSource } from '@promethean-os/pantheon-core';
export declare const validContextSources: ContextSource[];
export declare const emptyContextSources: ContextSource[];
export declare const mixedContextSources: ContextSource[];
export declare const testMetadata: {
    user: {
        role: string;
        displayName: string;
        name: string;
        id: string;
    };
    assistant: {
        role: string;
        type: string;
        displayName: string;
        name: string;
        id: string;
    };
    system: {
        role: string;
        type: string;
        displayName: string;
        name: string;
        id: string;
    };
    minimal: {
        id: string;
    };
    empty: {};
    null: any;
    undefined: any;
};
export declare const testTimestamps: {
    now: number;
    past: number;
    future: number;
    zero: number;
    negative: number;
    string: string;
    invalid: string;
};
export declare const performanceTestData: {
    smallSourceCount: number;
    mediumSourceCount: number;
    largeSourceCount: number;
    concurrentRequests: number;
    timeoutMs: number;
};
//# sourceMappingURL=test-data.d.ts.map