export const mockEvent = {
    type: 'test-event',
    agentId: 'agent-123',
    data: { action: 'test', value: 42 },
    metadata: { source: 'unit-test' },
};
export const mockContext = {
    id: 'context-123',
    agentId: 'agent-123',
    state: { status: 'active', counter: 0 },
    version: 1,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    metadata: { environment: 'test' },
};
export const mockSnapshot = {
    id: 'snapshot-123',
    agentId: 'agent-123',
    timestamp: new Date('2023-01-01T00:00:00Z'),
    state: { status: 'active', counter: 5 },
    version: 5,
    eventId: 'event-123',
};
export const mockToken = {
    token: 'jwt-token-123',
    agentId: 'agent-123',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    permissions: ['read', 'write', 'execute'],
};
export const createMockEvent = (overrides = {}) => ({
    id: `event-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date(),
    ...mockEvent,
    ...overrides,
});
export const createMockContext = (overrides = {}) => ({
    ...mockContext,
    ...overrides,
});
export const createMockSnapshot = (overrides = {}) => ({
    id: `snapshot-${Math.random().toString(36).substring(2, 11)}`,
    agentId: 'agent-123',
    timestamp: new Date('2023-01-01T00:00:00Z'),
    state: { status: 'active', counter: 5 },
    version: 5,
    eventId: 'event-123',
    ...overrides,
});
export const createMockToken = (overrides = {}) => ({
    ...mockToken,
    ...overrides,
});
//# sourceMappingURL=fixtures.js.map