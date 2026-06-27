/**
 * Recovery System for Workflow Healing
 *
 * Provides automated recovery mechanisms to restore workflow functionality
 * after issues are detected and healing strategies are applied.
 */
import type { WorkflowIssue, HealingResult, HealingStrategy } from './types.js';
import type { AgentWorkflowGraph } from '../workflow/types.js';
export interface RecoveryManager {
    executeRecovery(workflow: AgentWorkflowGraph, issue: WorkflowIssue, strategy: HealingStrategy): Promise<HealingResult>;
    rollbackRecovery(recoveryId: string): Promise<boolean>;
    getRecoveryStatus(recoveryId: string): Promise<RecoveryStatus>;
    listRecoveries(workflowId: string): Promise<RecoveryRecord[]>;
}
export interface RecoveryStatus {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
    progress: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
}
export interface RecoveryRecord {
    id: string;
    workflowId: string;
    issueId: string;
    strategyId: string;
    status: RecoveryStatus['status'];
    result?: HealingResult;
    rollbackAvailable: boolean;
    createdAt: Date;
    completedAt?: Date;
}
export declare class DefaultRecoveryManager implements RecoveryManager {
    private activeRecoveries;
    private recoveryHistory;
    private rollbackStack;
    executeRecovery(workflow: AgentWorkflowGraph, issue: WorkflowIssue, strategy: HealingStrategy): Promise<HealingResult>;
    rollbackRecovery(recoveryId: string): Promise<boolean>;
    getRecoveryStatus(recoveryId: string): Promise<RecoveryStatus>;
    listRecoveries(workflowId: string): Promise<RecoveryRecord[]>;
    private executeStrategy;
    private executeRestartStrategy;
    private executeScaleStrategy;
    private executeReconfigureStrategy;
    private executeRerouteStrategy;
    private executeIsolateStrategy;
    private executeRepairStrategy;
    private createGenericResult;
    private takeSnapshot;
    private restoreSnapshot;
    private findRecoveryInHistory;
    private calculateProgress;
}
//# sourceMappingURL=recovery.d.ts.map