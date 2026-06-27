import { ContextShare, ContextShareStore, ContextSnapshot, SnapshotStore } from './types.js';
export declare class ContextSharingService {
    private shareStore;
    private snapshotStore;
    private rateLimiter;
    constructor(shareStore: ContextShareStore, snapshotStore: SnapshotStore);
    shareContext(sourceAgentId: string, targetAgentId: string, shareType?: 'read' | 'write' | 'admin', options?: {
        permissions?: Record<string, unknown>;
        expiresAt?: Date;
        createdBy?: string;
    }): Promise<ContextShare>;
    private getLatestSnapshotForAgent;
    getSharedContexts(agentId: string): Promise<Array<ContextShare & {
        snapshot: ContextSnapshot;
    }>>;
    private batchFetchSnapshots;
    private combineSharesWithSnapshots;
    revokeShare(shareId: string, requestingAgentId: string): Promise<void>;
    private findShareForAgent;
    updateSharePermissions(shareId: string, updates: Partial<Pick<ContextShare, 'shareType' | 'permissions' | 'expiresAt'>>, requestingAgentId: string): Promise<ContextShare>;
    checkShareAccess(agentId: string, snapshotId: string, requiredPermission?: 'read' | 'write' | 'admin'): Promise<boolean>;
    private getSharesForSnapshot;
    private checkPermissionLevel;
    getShareStatistics(agentId: string): Promise<{
        created: number;
        received: number;
        active: number;
        expired: number;
    }>;
}
//# sourceMappingURL=context-sharing.d.ts.map