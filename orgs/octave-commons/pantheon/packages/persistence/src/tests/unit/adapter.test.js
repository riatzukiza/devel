/**
 * Unit tests for makePantheonPersistenceAdapter function
 */
import test from 'ava';
import { makePantheonPersistenceAdapter } from '../../index.js';
import { mockManagers, createMockManager } from '../fixtures/mock-managers.js';
test('should create adapter with valid dependencies', (t) => {
    const deps = {
        getStoreManagers: async () => mockManagers,
    };
    const adapter = makePantheonPersistenceAdapter(deps);
    t.truthy(adapter);
    t.is(typeof adapter, 'object');
});
test('should create adapter with custom resolvers', (t) => {
    const customResolveRole = () => 'user';
    const customResolveName = () => 'Custom Name';
    const customFormatTime = () => '2023-01-01T00:00:00.000Z';
    const deps = {
        getStoreManagers: async () => mockManagers,
        resolveRole: customResolveRole,
        resolveName: customResolveName,
        formatTime: customFormatTime,
    };
    const adapter = makePantheonPersistenceAdapter(deps);
    t.truthy(adapter);
    t.is(typeof adapter, 'object');
});
test('should create adapter with minimal dependencies', (t) => {
    const deps = {
        getStoreManagers: async () => [],
    };
    const adapter = makePantheonPersistenceAdapter(deps);
    t.truthy(adapter);
    t.is(typeof adapter, 'object');
});
test('should throw error with invalid getStoreManagers', (t) => {
    const deps = {
        getStoreManagers: 'not-a-function',
    };
    t.throws(() => makePantheonPersistenceAdapter(deps), {
        message: /getStoreManagers must be a function/,
    });
});
test('should handle null dependencies gracefully', (t) => {
    t.throws(() => makePantheonPersistenceAdapter(null), {
        message: /deps must be an object/,
    });
});
test('should handle undefined dependencies gracefully', (t) => {
    t.throws(() => makePantheonPersistenceAdapter(undefined), {
        message: /deps must be an object/,
    });
});
test('should create adapter with async getStoreManagers returning empty array', async (t) => {
    const deps = {
        getStoreManagers: async () => [],
    };
    const adapter = makePantheonPersistenceAdapter(deps);
    t.truthy(adapter);
    t.is(typeof adapter, 'object');
});
test('should create adapter with getStoreManagers that throws', (t) => {
    const deps = {
        getStoreManagers: async () => {
            throw new Error('Store managers unavailable');
        },
    };
    const adapter = makePantheonPersistenceAdapter(deps);
    t.truthy(adapter);
    t.is(typeof adapter, 'object');
});
test('should create adapter with mixed valid and invalid resolvers', (t) => {
    const deps = {
        getStoreManagers: async () => mockManagers,
        resolveRole: null,
        resolveName: undefined,
        formatTime: 'not-a-function',
    };
    // Should not throw during creation, but may throw during usage
    t.notThrows(() => makePantheonPersistenceAdapter(deps));
});
test('should create adapter with getStoreManagers returning non-array', (t) => {
    const deps = {
        getStoreManagers: async () => null,
    };
    const adapter = makePantheonPersistenceAdapter(deps);
    t.truthy(adapter);
    t.is(typeof adapter, 'object');
});
test('should create adapter with getStoreManagers returning mixed types', (t) => {
    const deps = {
        getStoreManagers: async () => [createMockManager('valid-manager'), null, undefined, 'not-a-manager'],
    };
    const adapter = makePantheonPersistenceAdapter(deps);
    t.truthy(adapter);
    t.is(typeof adapter, 'object');
});
//# sourceMappingURL=adapter.test.js.map