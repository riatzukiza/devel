import { ContextEvent, ContextSnapshot, AgentContext, AuthToken } from '../../types';
export declare const mockEvent: Omit<ContextEvent, 'id' | 'timestamp'>;
export declare const mockContext: AgentContext;
export declare const mockSnapshot: ContextSnapshot;
export declare const mockToken: AuthToken;
export declare const createMockEvent: (overrides?: Partial<ContextEvent>) => ContextEvent;
export declare const createMockContext: (overrides?: Partial<AgentContext>) => AgentContext;
export declare const createMockSnapshot: (overrides?: Partial<ContextSnapshot>) => ContextSnapshot;
export declare const createMockToken: (overrides?: Partial<AuthToken>) => AuthToken;
//# sourceMappingURL=fixtures.d.ts.map