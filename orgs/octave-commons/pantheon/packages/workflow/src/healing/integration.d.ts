/**
 * Integration Layer for Workflow Healing System
 *
 * Integrates the healing system with monitoring, kanban, and alerting systems
 * to provide a comprehensive workflow enhancement and healing solution.
 */
import type { HealingConfig, HealingResult, WorkflowHealth, HealingAnalysis, AlertChannel, EscalationPolicy } from './types.js';
import type { AgentWorkflowGraph } from '../workflow/types.js';
export interface WorkflowHealingIntegration {
    initialize(config: HealingIntegrationConfig): Promise<void>;
    shutdown(): Promise<void>;
    registerWorkflow(workflow: AgentWorkflowGraph): Promise<void>;
    unregisterWorkflow(workflowId: string): Promise<void>;
    analyzeWorkflow(workflowId: string): Promise<HealingAnalysis>;
    healWorkflow(workflowId: string, issueId?: string): Promise<HealingResult[]>;
    getWorkflowHealth(workflowId: string): Promise<WorkflowHealth>;
    getAllWorkflowHealth(): Promise<Record<string, WorkflowHealth>>;
    updateConfiguration(config: Partial<HealingIntegrationConfig>): Promise<void>;
    getConfiguration(): Promise<HealingIntegrationConfig>;
}
export interface HealingIntegrationConfig extends HealingConfig {
    enableKanbanIntegration: boolean;
    enableMonitoringIntegration: boolean;
    enableAlertingIntegration: boolean;
    kanbanBoardId: string;
    kanbanApiEndpoint: string;
    createHealingTasks: boolean;
    healingTaskPriority: 'P0' | 'P1' | 'P2' | 'P3';
    metricsCollectionInterval: number;
    healthCheckInterval: number;
    anomalyDetectionSensitivity: number;
    alertChannels: AlertChannel[];
    alertCooldownPeriod: number;
    escalationPolicy: EscalationPolicy;
    autoHealingEnabled: boolean;
    autoHealingThreshold: number;
    maxConcurrentHealings: number;
    healingTimeout: number;
}
export type { AlertChannel, EscalationPolicy, EscalationLevel, EscalationCondition, } from './types.js';
export declare class DefaultWorkflowHealingIntegration implements WorkflowHealingIntegration {
    private config;
    private healer;
    private monitor;
    private _recoveryManager;
    private workflows;
    private monitoringIntervals;
    private isInitialized;
    constructor(config?: Partial<HealingIntegrationConfig>);
    initialize(config: HealingIntegrationConfig): Promise<void>;
    shutdown(): Promise<void>;
    registerWorkflow(workflow: AgentWorkflowGraph): Promise<void>;
    unregisterWorkflow(workflowId: string): Promise<void>;
    analyzeWorkflow(workflowId: string): Promise<HealingAnalysis>;
    healWorkflow(workflowId: string, issueId?: string): Promise<HealingResult[]>;
    getWorkflowHealth(workflowId: string): Promise<WorkflowHealth>;
    getAllWorkflowHealth(): Promise<Record<string, WorkflowHealth>>;
    updateConfiguration(config: Partial<HealingIntegrationConfig>): Promise<void>;
    getConfiguration(): Promise<HealingIntegrationConfig>;
    private createDefaultConfig;
    private initializeKanbanIntegration;
    private initializeMonitoringIntegration;
    private initializeAlertingIntegration;
    private handleHealthUpdate;
    private handleHealingResult;
    private sendHealthAlerts;
    private updateKanbanTasks;
    private sendHealingAlert;
    private escalateIssue;
    private updateHealingTasks;
}
//# sourceMappingURL=integration.d.ts.map