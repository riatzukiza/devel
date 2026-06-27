/**
 * Monitoring Integration for Workflow Healing
 *
 * Integrates with the monitoring system to collect metrics, detect anomalies,
 * and trigger healing actions based on performance data.
 */
import type { AgentPerformanceMetrics } from './types.js';
import type { AgentWorkflowGraph } from '../workflow/types.js';
import type { WorkflowIssue, HealingConfig } from './types.js';
export interface WorkflowMonitor {
    startMonitoring(workflow: AgentWorkflowGraph): Promise<void>;
    stopMonitoring(workflowId: string): Promise<void>;
    getMetrics(workflowId: string): Promise<AgentPerformanceMetrics[]>;
    detectAnomalies(workflowId: string): Promise<WorkflowIssue[]>;
    setupAlerts(workflowId: string, config: AlertConfig): Promise<void>;
}
export interface AlertConfig {
    metrics: string[];
    thresholds: Record<string, number>;
    conditions: AlertCondition[];
    channels: string[];
}
export interface AlertCondition {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export declare class DefaultWorkflowMonitor implements WorkflowMonitor {
    private config;
    private monitoringIntervals;
    private metricsHistory;
    private alertRules;
    constructor(config: HealingConfig);
    startMonitoring(workflow: AgentWorkflowGraph): Promise<void>;
    stopMonitoring(workflowId: string): Promise<void>;
    getMetrics(workflowId: string): Promise<AgentPerformanceMetrics[]>;
    detectAnomalies(workflowId: string): Promise<WorkflowIssue[]>;
    setupAlerts(workflowId: string, config: AlertConfig): Promise<void>;
    private collectMetrics;
    private checkAlerts;
    private evaluateCondition;
    private triggerAlert;
    private getMetricValue;
    private sendHealthCheck;
    private detectPerformanceDegradation;
    private detectResourceExhaustion;
    private detectIncreasingErrors;
    private detectMemoryLeak;
    private calculateTrend;
}
//# sourceMappingURL=monitor.d.ts.map