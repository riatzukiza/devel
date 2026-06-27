import { SecurityValidator, SecurityLogger } from './security.js';
export class ContextSharingHelpers {
    static async validateShareInputs(sourceAgentId, targetAgentId, shareType) {
        const validatedSourceAgentId = SecurityValidator.validateAgentId(sourceAgentId);
        const validatedTargetAgentId = SecurityValidator.validateAgentId(targetAgentId);
        const validatedShareType = SecurityValidator.validateShareType(shareType);
        return {
            sourceId: validatedSourceAgentId,
            targetId: validatedTargetAgentId,
            type: validatedShareType,
        };
    }
    static async checkRateLimit(rateLimiter, agentId, action) {
        if (!rateLimiter.isAllowed(`${action}:${agentId}`)) {
            SecurityLogger.log({
                type: 'rate_limit',
                severity: 'medium',
                agentId,
                action,
                details: { reason: 'Rate limit exceeded' },
            });
            throw new Error('Rate limit exceeded. Please try again later.');
        }
    }
    static createShareRecord(sourceId, targetId, shareType, contextSnapshotId, options) {
        return {
            sourceAgentId: sourceId,
            targetAgentId: targetId,
            shareType,
            contextSnapshotId,
            permissions: options.permissions || {},
            expiresAt: options.expiresAt,
            createdBy: options.createdBy || sourceId,
        };
    }
    static logShareSuccess(sourceId, targetId, shareId, shareType) {
        SecurityLogger.log({
            type: 'data_access',
            severity: 'low',
            agentId: sourceId,
            action: 'shareContext',
            details: {
                targetAgentId: targetId,
                shareId,
                shareType,
            },
        });
    }
    static logSecurityError(agentId, action, error) {
        SecurityLogger.log({
            type: 'data_access',
            severity: 'high',
            agentId,
            action,
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
    }
    static async validateShareAccess(shareStore, agentId, shareId, requiredPermission) {
        // Since ContextShareStore doesn't have getShare method, we need to search through shares
        const shares = await shareStore.getSharesForAgent(agentId);
        const share = shares.find((s) => s.id === shareId);
        if (!share) {
            SecurityLogger.log({
                type: 'authorization',
                severity: 'medium',
                agentId,
                action: 'validateShareAccess',
                details: { shareId, reason: 'Share not found' },
            });
            throw new Error('Share not found');
        }
        if (share.expiresAt && share.expiresAt < new Date()) {
            SecurityLogger.log({
                type: 'authorization',
                severity: 'medium',
                agentId,
                action: 'validateShareAccess',
                details: { shareId, reason: 'Share has expired' },
            });
            throw new Error('Share has expired');
        }
        if (share.targetAgentId !== agentId && share.sourceAgentId !== agentId) {
            SecurityLogger.log({
                type: 'authorization',
                severity: 'high',
                agentId,
                action: 'validateShareAccess',
                details: { shareId, reason: 'Access denied' },
            });
            throw new Error('Access denied');
        }
        if (requiredPermission && !this.hasPermission(share, requiredPermission)) {
            SecurityLogger.log({
                type: 'authorization',
                severity: 'medium',
                agentId,
                action: 'validateShareAccess',
                details: { shareId, requiredPermission, reason: 'Insufficient permissions' },
            });
            throw new Error('Insufficient permissions');
        }
        return share;
    }
    static hasPermission(share, requiredPermission) {
        const permissionHierarchy = { read: 1, write: 2, admin: 3 };
        const shareLevel = permissionHierarchy[share.shareType];
        const requiredLevel = permissionHierarchy[requiredPermission];
        return shareLevel >= requiredLevel;
    }
}
//# sourceMappingURL=context-sharing-helpers.js.map