import { RateLimiter } from './security.js';
import { ContextShare, ContextShareStore } from './types.js';
export declare class ContextSharingHelpers {
    static validateShareInputs(sourceAgentId: string, targetAgentId: string, shareType: 'read' | 'write' | 'admin'): Promise<{
        sourceId: string;
        targetId: string;
        type: 'read' | 'write' | 'admin';
    }>;
    static checkRateLimit(rateLimiter: RateLimiter, agentId: string, action: string): Promise<void>;
    static createShareRecord(sourceId: string, targetId: string, shareType: 'read' | 'write' | 'admin', contextSnapshotId: string, options: {
        permissions?: Record<string, unknown>;
        expiresAt?: Date;
        createdBy?: string;
    }): Omit<ContextShare, 'id' | 'createdAt'>;
    static logShareSuccess(sourceId: string, targetId: string, shareId: string, shareType: string): void;
    static logSecurityError(agentId: string, action: string, error: unknown): void;
    static validateShareAccess(shareStore: ContextShareStore, agentId: string, shareId: string, requiredPermission?: 'read' | 'write' | 'admin'): Promise<ContextShare>;
    private static hasPermission;
}
//# sourceMappingURL=context-sharing-helpers.d.ts.map