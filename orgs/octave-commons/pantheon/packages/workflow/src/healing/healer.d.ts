/**
 * Core Workflow Healer Implementation
 *
 * Provides automated detection, analysis, and healing of workflow issues
 * by integrating monitoring, alerting, and recovery mechanisms.
 */
import type { WorkflowHealer, HealingAnalysis, WorkflowIssue, HealingResult, WorkflowHealth, HealingConfig, HealingStrategy } from './types.js';
import type { AgentWorkflowGraph } from '../workflow/types.js';
export declare class DefaultWorkflowHealer implements WorkflowHealer {
    private config;
    private activeWorkflows;
    private healingStrategies;
    private activeHealings;
    private metrics;
    constructor(config?: Partial<HealingConfig>);
    analyzeWorkflow(workflow: AgentWorkflowGraph): Promise<HealingAnalysis>;
    detectIssues(workflow: AgentWorkflowGraph): Promise<WorkflowIssue[]>;
    applyHealing(workflowId: string, issue: WorkflowIssue): Promise<HealingResult>;
    startMonitoring(workflowId: string): Promise<void>;
    stopMonitoring(_workflowId: string): Promise<void>;
    getHealthStatus(workflowId: string): Promise<WorkflowHealth>;
    configureHealing(config: HealingConfig): Promise<void>;
    getHealingStrategies(): Promise<HealingStrategy[]>;
    private initializeDefaultStrategies;
    private calculateOverallHealth;
    private calculateHealthScore;
    private getSeverityWeight;
    private generateRecommendations;
    private updateAnalysisMetrics;
    private detectAgentFailures;
    private detectDeadlocks;
    private detectResourceExhaustion;
    private detectPerformanceDegradation;
    private detectTimeoutIssues;
    private detectDependencyFailures;
    private findHealingStrategy;
    private executeHealing;
    private handleAutoHealing;
    private calculateAgentHealth;
    private calculateCommunicationHealth;
    private calculateResourceHealth;
    private calculateDependencyHealth;
    private calculateConfigurationHealth;
    private calculateSecurityHealth;
    private calculatePerformanceMetrics;
    private calculateAvailabilityMetrics;
    private calculateReliabilityMetrics;
    private calculateHealthTrends;
    private calculateHealthPredictions;
}
//# sourceMappingURL=healer.d.ts.map