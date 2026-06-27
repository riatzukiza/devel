/**
 * Mock store managers for testing
 */
import type { DualStoreManager } from '@promethean-os/persistence';
export declare const createMockManager: (name: string) => DualStoreManager;
export declare const mockManagers: DualStoreManager[];
export declare const createFailingManager: (name: string) => DualStoreManager;
export declare const createSlowManager: (name: string, delay: number) => DualStoreManager;
//# sourceMappingURL=mock-managers.d.ts.map