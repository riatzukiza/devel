/**
 * Mock store managers for testing
 */
// Create a minimal mock that satisfies the DualStoreManager interface
export const createMockManager = (name) => {
    const mockManager = {
        name,
        chromaCollection: {},
        mongoCollection: {},
        textKey: 'text',
        timeStampKey: 'createdAt',
        supportsImages: false,
        // Mock essential methods
        addEntry: async () => ({ id: 'mock-id' }),
        getMostRecent: async () => [],
        getMostRelevant: async () => [],
        get: async () => null,
        cleanup: async () => undefined,
        close: async () => undefined,
    };
    return mockManager;
};
export const mockManagers = [
    createMockManager('user-context'),
    createMockManager('system-context'),
    createMockManager('assistant-context'),
    createMockManager('shared-context'),
];
export const createFailingManager = (name) => {
    const failingManager = {
        name,
        chromaCollection: {},
        mongoCollection: {},
        textKey: 'text',
        timeStampKey: 'createdAt',
        supportsImages: false,
        addEntry: async () => {
            throw new Error('Add entry failed');
        },
        getMostRecent: async () => {
            throw new Error('Get recent failed');
        },
        getMostRelevant: async () => {
            throw new Error('Get relevant failed');
        },
        get: async () => {
            throw new Error('Get failed');
        },
        cleanup: async () => {
            throw new Error('Cleanup failed');
        },
        close: async () => {
            throw new Error('Close failed');
        },
    };
    return failingManager;
};
export const createSlowManager = (name, delay) => {
    const slowManager = {
        name,
        chromaCollection: {},
        mongoCollection: {},
        textKey: 'text',
        timeStampKey: 'createdAt',
        supportsImages: false,
        addEntry: async () => new Promise((resolve) => setTimeout(() => resolve({ id: 'mock-id' }), delay)),
        getMostRecent: async () => new Promise((resolve) => setTimeout(() => resolve([]), delay)),
        getMostRelevant: async () => new Promise((resolve) => setTimeout(() => resolve([]), delay)),
        get: async () => new Promise((resolve) => setTimeout(() => resolve(null), delay)),
        cleanup: async () => new Promise((resolve) => setTimeout(() => resolve(undefined), delay)),
        close: async () => new Promise((resolve) => setTimeout(() => resolve(undefined), delay)),
    };
    return slowManager;
};
//# sourceMappingURL=mock-managers.js.map