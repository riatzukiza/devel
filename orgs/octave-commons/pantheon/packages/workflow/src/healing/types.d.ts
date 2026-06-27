/**
 * Types for Agent Workflow Healing System
 */
import type { AgentWorkflowGraph } from '../workflow/types.js';
export interface AgentPerformanceMetrics {
    readonly agentId: string;
    readonly agentType: string;
    readonly executionTime: number;
    readonly memoryUsage: number;
    readonly cpuUsage: number;
    readonly status: 'success' | 'error' | 'timeout';
    readonly errorType?: string;
    readonly timestamp: number;
}
export interface AlertEvent {
    readonly id: string;
    readonly ruleId: string;
    readonly metricName: string;
    readonly currentValue: number;
    readonly threshold: number;
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly message: string;
    readonly timestamp: number;
    readonly resolved: boolean;
    readonly resolvedAt?: number;
}
export interface HealthCheck {
    readonly status: 'healthy' | 'degraded' | 'unhealthy';
    readonly timestamp: number;
    readonly checks: ReadonlyArray<{
        readonly name: string;
        readonly status: 'pass' | 'fail' | 'warn';
        readonly message?: string;
        readonly duration: number;
    }>;
    readonly uptime: number;
}
export interface WorkflowHealer {
    analyzeWorkflow(workflow: AgentWorkflowGraph): Promise<HealingAnalysis>;
    detectIssues(workflow: AgentWorkflowGraph): Promise<WorkflowIssue[]>;
    applyHealing(workflowId: string, issue: WorkflowIssue): Promise<HealingResult>;
    startMonitoring(workflowId: string): Promise<void>;
    stopMonitoring(workflowId: string): Promise<void>;
    getHealthStatus(workflowId: string): Promise<WorkflowHealth>;
    configureHealing(config: HealingConfig): Promise<void>;
    getHealingStrategies(): Promise<HealingStrategy[]>;
}
export interface HealingAnalysis {
    workflowId: string;
    timestamp: Date;
    overallHealth: 'healthy' | 'degraded' | 'critical' | 'failed';
    issues: WorkflowIssue[];
    recommendations: HealingRecommendation[];
    metrics: WorkflowHealingMetrics;
    nextCheckTime: Date;
}
export interface WorkflowIssue {
    id: string;
    workflowId: string;
    type: IssueType;
    severity: IssueSeverity;
    title: string;
    description: string;
    detectedAt: Date;
    detectionMethod: DetectionMethod;
    confidence: number;
    affectedNodes: string[];
    affectedAgents: string[];
    impactAssessment: ImpactAssessment;
    context: IssueContext;
    metadata: Record<string, unknown>;
    status: IssueStatus;
    healingAttempts: HealingAttempt[];
    resolvedAt?: Date;
}
export type IssueType = 'agent_failure' | 'workflow_deadlock' | 'resource_exhaustion' | 'communication_failure' | 'performance_degradation' | 'timeout_exceeded' | 'dependency_failure' | 'configuration_error' | 'security_violation' | 'data_corruption' | 'memory_leak' | 'cascade_failure';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'detected' | 'analyzing' | 'healing' | 'resolved' | 'failed' | 'escalated';
export interface ImpactAssessment {
    businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    userImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    systemImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    estimatedDowntime: number;
    affectedUsers: number;
    financialImpact?: number;
}
export interface IssueContext {
    workflowState: Record<string, unknown>;
    environmentVariables: Record<string, string>;
    systemMetrics: Partial<AgentPerformanceMetrics>;
    recentEvents: WorkflowEvent[];
    dependencies: DependencyStatus[];
    configuration: Record<string, unknown>;
}
export interface WorkflowEvent {
    id: string;
    type: string;
    timestamp: Date;
    source: string;
    data: Record<string, unknown>;
    severity: 'info' | 'warning' | 'error' | 'critical';
}
export interface DependencyStatus {
    name: string;
    type: 'agent' | 'service' | 'resource' | 'external';
    status: 'healthy' | 'degraded' | 'failed';
    lastCheck: Date;
    responseTime?: number;
    errorRate?: number;
}
export interface HealingAttempt {
    id: string;
    strategy: string;
    startedAt: Date;
    completedAt?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: HealingResult;
    error?: string;
    metadata: Record<string, unknown>;
}
export interface HealingResult {
    success: boolean;
    strategy: string;
    executionTime: number;
    changes: WorkflowChange[];
    sideEffects: SideEffect[];
    newIssues: string[];
    resolvedIssues: string[];
    metrics: HealingMetrics;
    summary: string;
}
export interface WorkflowChange {
    type: 'agent_restart' | 'configuration_update' | 'resource_reallocation' | 'workflow_restructure' | 'dependency_update';
    target: string;
    previousValue: unknown;
    newValue: unknown;
    timestamp: Date;
    rollbackPossible: boolean;
}
export interface SideEffect {
    type: 'performance_impact' | 'resource_change' | 'state_change' | 'communication_change';
    description: string;
    severity: 'positive' | 'negative' | 'neutral';
    impact: string;
    temporary: boolean;
}
export interface HealingMetrics {
    executionTime: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
    };
    successProbability: number;
    confidence: number;
    riskScore: number;
}
export interface HealingRecommendation {
    id: string;
    type: RecommendationType;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    description: string;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
    prerequisites: string[];
    steps: RecommendationStep[];
    estimatedTime: number;
    confidence: number;
}
export type RecommendationType = 'preventive' | 'corrective' | 'adaptive' | 'optimization' | 'security' | 'performance';
export interface RecommendationStep {
    order: number;
    action: string;
    description: string;
    expectedResult: string;
    rollbackAction?: string;
    estimatedTime: number;
}
export interface HealingStrategy {
    id: string;
    name: string;
    description: string;
    type: StrategyType;
    supportedIssues: IssueType[];
    config: StrategyConfig;
    parameters: StrategyParameter[];
    executor: string;
    timeout: number;
    retryPolicy: RetryPolicy;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    prerequisites: string[];
    sideEffects: SideEffect[];
    rollbackSupported: boolean;
    successRate: number;
    averageExecutionTime: number;
    lastUsed?: Date;
}
export type StrategyType = 'restart' | 'reconfigure' | 'scale' | 'reroute' | 'degrade' | 'isolate' | 'repair' | 'rebuild' | 'escalate';
export interface StrategyConfig {
    automated: boolean;
    requiresApproval: boolean;
    maxConcurrentExecutions: number;
    cooldownPeriod: number;
    successThreshold: number;
}
export interface StrategyParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    defaultValue: unknown;
    description: string;
    validation?: ParameterValidation;
}
export interface ParameterValidation {
    min?: number;
    max?: number;
    pattern?: RegExp;
    allowedValues?: unknown[];
    custom?: string;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    initialDelay: number;
    maxDelay: number;
    multiplier?: number;
}
export interface WorkflowHealth {
    workflowId: string;
    timestamp: Date;
    status: 'healthy' | 'degraded' | 'critical' | 'failed';
    overallScore: number;
    componentScores: ComponentHealthScores;
    activeIssues: string[];
    criticalIssues: string[];
    performance: WorkflowPerformanceMetrics;
    availability: AvailabilityMetrics;
    reliability: ReliabilityMetrics;
    trends: HealthTrends;
    predictions: HealthPredictions;
}
export interface ComponentHealthScores {
    agents: number;
    communication: number;
    resources: number;
    dependencies: number;
    configuration: number;
    security: number;
}
export interface WorkflowPerformanceMetrics {
    averageExecutionTime: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: number;
    responseTime: number;
}
export interface AvailabilityMetrics {
    uptime: number;
    downtime: number;
    mtbf: number;
    mttr: number;
}
export interface ReliabilityMetrics {
    successRate: number;
    failureRate: number;
    cascadeFailureRate: number;
    recoveryRate: number;
}
export interface HealthTrends {
    performance: 'improving' | 'stable' | 'degrading';
    availability: 'improving' | 'stable' | 'degrading';
    reliability: 'improving' | 'stable' | 'degrading';
    issueFrequency: 'decreasing' | 'stable' | 'increasing';
}
export interface HealthPredictions {
    nextFailureProbability: number;
    estimatedTimeToFailure: number;
    recommendedActions: string[];
    riskFactors: RiskFactor[];
}
export interface RiskFactor {
    factor: string;
    impact: number;
    probability: number;
    mitigation: string;
}
export interface HealingConfig {
    enabled: boolean;
    automationLevel: 'manual' | 'assisted' | 'automated';
    detectionInterval: number;
    issueRetentionPeriod: number;
    maxConcurrentHealings: number;
    healingTimeout: number;
    autoHealThreshold: number;
    requireApprovalFor: IssueSeverity[];
    blacklistStrategies: string[];
    rollbackOnError: boolean;
    enablePredictiveAnalysis: boolean;
    healthCheckInterval: number;
    metricsRetentionPeriod: number;
    monitoringIntegration: MonitoringIntegrationConfig;
    kanbanIntegration: KanbanIntegrationConfig;
    alertingIntegration: AlertingIntegrationConfig;
}
export interface MonitoringIntegrationConfig {
    enabled: boolean;
    metricsEndpoint: string;
    alertEndpoint: string;
    healthCheckEndpoint: string;
    authentication?: {
        type: 'bearer' | 'basic';
        token?: string;
        username?: string;
        password?: string;
    };
}
export interface KanbanIntegrationConfig {
    enabled: boolean;
    boardId: string;
    createHealingTasks: boolean;
    updateTaskStatus: boolean;
    taskPriority: 'P0' | 'P1' | 'P2' | 'P3';
    assignToAgent?: string;
    customFields: Record<string, string>;
}
export interface AlertingIntegrationConfig {
    enabled: boolean;
    channels: AlertChannel[];
    severityThresholds: Record<IssueSeverity, number>;
    cooldownPeriod: number;
    escalationPolicy: EscalationPolicy;
}
export interface AlertChannel {
    id: string;
    type: 'email' | 'slack' | 'webhook' | 'sms';
    config: Record<string, unknown>;
    enabled: boolean;
}
export interface EscalationPolicy {
    enabled: boolean;
    levels: EscalationLevel[];
    timeout: number;
}
export interface EscalationLevel {
    level: number;
    channels: string[];
    conditions: EscalationCondition[];
}
export interface EscalationCondition {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: unknown;
}
export type DetectionMethod = 'metric_threshold' | 'pattern_matching' | 'anomaly_detection' | 'health_check' | 'dependency_check' | 'log_analysis' | 'user_report' | 'external_alert';
export interface WorkflowHealingMetrics {
    totalIssues: number;
    criticalIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
    healingAttempts: number;
    successfulHealings: number;
    healingSuccessRate: number;
    averageHealingTime: number;
    workflowUptime: number;
    averageExecutionTime: number;
    errorRate: number;
    resourceUtilization: number;
    alertFrequency: number;
    falsePositiveRate: number;
}
export type DetectionMethodConfig = Record<DetectionMethod, {
    enabled: boolean;
    sensitivity: number;
    threshold?: number;
    parameters: Record<string, unknown>;
}>;
//# sourceMappingURL=types.d.ts.map