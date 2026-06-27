/**
 * Kanban Integration Types
 *
 * Types for integrating agent coordination with the kanban system for
 * task tracking, status management, and workflow automation.
 */
import { AssignmentDecision } from './task-assignment.js';
export interface KanbanIntegrationManager {
    syncTaskToKanban(taskId: string, agentId: string, assignment: AssignmentDecision): Promise<void>;
    syncAgentStatusToKanban(agentId: string, status: AgentKanbanStatus): Promise<void>;
    syncTaskProgress(taskId: string, progress: TaskProgress): Promise<void>;
    createAgentBoard(agentId: string, config: AgentBoardConfig): Promise<AgentBoard>;
    updateAgentBoard(agentId: string, updates: Partial<AgentBoard>): Promise<void>;
    getAgentBoard(agentId: string): Promise<AgentBoard>;
    setAgentWIPLimit(agentId: string, limit: WIPLimit): Promise<void>;
    getAgentWIPLimit(agentId: string): Promise<WIPLimit>;
    checkWIPLimit(agentId: string): Promise<WIPStatus>;
    setupTaskAutomation(config: TaskAutomationConfig): Promise<TaskAutomation>;
    updateTaskAutomation(automationId: string, updates: Partial<TaskAutomationConfig>): Promise<void>;
    removeTaskAutomation(automationId: string): Promise<void>;
    getAgentAnalytics(agentId: string, period: AnalyticsPeriod): Promise<AgentAnalytics>;
    getTeamAnalytics(teamId: string, period: AnalyticsPeriod): Promise<TeamAnalytics>;
    getSystemAnalytics(period: AnalyticsPeriod): Promise<SystemAnalytics>;
}
export interface AgentKanbanStatus {
    agentId: string;
    status: AgentStatus;
    currentTasks: AgentTask[];
    workload: AgentWorkload;
    wipStatus: WIPStatus;
    availability: AgentAvailability;
    lastUpdated: Date;
}
export interface AgentTask {
    taskId: string;
    title: string;
    status: TaskStatus;
    column: string;
    priority: TaskPriority;
    assignedAt: Date;
    startedAt?: Date;
    estimatedCompletion: Date;
    progress: number;
    blocked: boolean;
    blockers: TaskBlocker[];
    dependencies: string[];
    assignee: string;
}
export interface AgentWorkload {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    blockedTasks: number;
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    stressLevel: number;
    efficiency: number;
}
export interface WIPStatus {
    currentLoad: number;
    limit: number;
    status: WIPStatusType;
    overloadReason?: string;
    recommendations: string[];
}
export type WIPStatusType = 'under_limit' | 'at_limit' | 'over_limit' | 'critical';
export interface AgentAvailability {
    available: boolean;
    nextAvailable?: Date;
    capacity: number;
    flexibility: number;
    preferredTasks: string[];
    avoidedTasks: string[];
}
export interface AgentBoard {
    agentId: string;
    boardId: string;
    name: string;
    columns: BoardColumn[];
    wipLimits: ColumnWIPLimit[];
    automation: TaskAutomation[];
    tasks: BoardTask[];
    backlog: BacklogTask[];
    settings: BoardSettings;
    filters: TaskFilter[];
    status: BoardStatus;
    lastSync: Date;
    metrics: BoardMetrics;
}
export interface BoardColumn {
    id: string;
    name: string;
    type: ColumnType;
    position: number;
    wipLimit?: number;
    autoAssign?: boolean;
    color?: string;
    description?: string;
}
export type ColumnType = 'backlog' | 'ready' | 'in_progress' | 'review' | 'testing' | 'done' | 'blocked' | 'custom';
export interface ColumnWIPLimit {
    columnId: string;
    limit: number;
    current: number;
    status: WIPStatusType;
    flexible: boolean;
    overrideReason?: string;
}
export interface BoardTask {
    id: string;
    title: string;
    description: string;
    columnId: string;
    position: number;
    assigneeId?: string;
    assigneeName?: string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    createdAt: Date;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    dueDate?: Date;
    dependencies: string[];
    blockers: string[];
    tags: string[];
    estimatedHours?: number;
    actualHours?: number;
    cycleTime?: number;
    leadTime?: number;
    blockedTime?: number;
}
export interface BacklogTask {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    estimatedHours?: number;
    tags: string[];
    createdAt: Date;
    rank: number;
    ready: boolean;
}
export interface BoardSettings {
    autoArchive: boolean;
    archiveAfterDays: number;
    showBlockedTasks: boolean;
    enableSwimlanes: boolean;
    swimlaneBy?: string;
    colorCoding: boolean;
    timeTracking: boolean;
    progressTracking: boolean;
}
export interface TaskFilter {
    id: string;
    name: string;
    field: string;
    operator: FilterOperator;
    value: any;
    active: boolean;
}
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
export type BoardStatus = 'active' | 'archived' | 'suspended';
export interface BoardMetrics {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    averageCycleTime: number;
    averageLeadTime: number;
    throughput: number;
    completionRate: number;
    onTimeDeliveryRate: number;
    blockageRate: number;
    wipEfficiency: number;
    flowEfficiency: number;
    resourceUtilization: number;
}
export interface AgentBoardConfig {
    name: string;
    columns: BoardColumnConfig[];
    wipLimits?: ColumnWIPLimitConfig[];
    settings?: Partial<BoardSettings>;
    initialTasks?: BoardTask[];
}
export interface BoardColumnConfig {
    name: string;
    type: ColumnType;
    position: number;
    wipLimit?: number;
    autoAssign?: boolean;
    color?: string;
    description?: string;
}
export interface ColumnWIPLimitConfig {
    columnName: string;
    limit: number;
    flexible: boolean;
}
export interface TaskAutomation {
    id: string;
    name: string;
    description: string;
    trigger: AutomationTrigger;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    enabled: boolean;
    status: AutomationStatus;
    executionHistory: AutomationExecution[];
    lastExecuted?: Date;
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
}
export interface AutomationTrigger {
    type: TriggerType;
    configuration: Record<string, any>;
}
export type TriggerType = 'task_created' | 'task_updated' | 'task_moved' | 'task_assigned' | 'task_completed' | 'task_blocked' | 'agent_available' | 'agent_overloaded' | 'time_based' | 'manual';
export interface AutomationCondition {
    type: ConditionType;
    field: string;
    operator: ConditionOperator;
    value: any;
    weight?: number;
}
export type ConditionType = 'field_comparison' | 'task_property' | 'agent_property' | 'time_condition' | 'custom_function';
export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in' | 'matches';
export interface AutomationAction {
    type: ActionType;
    configuration: Record<string, any>;
    order: number;
}
export type ActionType = 'assign_task' | 'move_task' | 'update_task' | 'create_task' | 'send_notification' | 'update_agent_status' | 'adjust_wip_limit' | 'escalate_task' | 'create_subtask' | 'add_dependency' | 'remove_dependency' | 'custom_webhook';
export type AutomationStatus = 'active' | 'paused' | 'error' | 'disabled';
export interface AutomationExecution {
    id: string;
    timestamp: Date;
    trigger: string;
    conditions: ConditionEvaluation[];
    actions: ActionResult[];
    status: ExecutionStatus;
    duration: number;
    error?: string;
}
export interface ConditionEvaluation {
    condition: string;
    result: boolean;
    value: any;
    duration: number;
}
export interface ActionResult {
    action: string;
    status: ActionStatus;
    result?: any;
    error?: string;
    duration: number;
}
export type ActionStatus = 'success' | 'failed' | 'skipped' | 'pending';
export type ExecutionStatus = 'success' | 'failed' | 'partial' | 'skipped';
export interface TaskAutomationConfig {
    name: string;
    description: string;
    trigger: AutomationTrigger;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    enabled?: boolean;
}
export interface TaskProgress {
    taskId: string;
    agentId: string;
    percentage: number;
    status: TaskStatus;
    column: string;
    startedAt?: Date;
    currentPhase: TaskPhase;
    phaseProgress: PhaseProgress[];
    completedWork: WorkItem[];
    remainingWork: WorkItem[];
    blockedWork: WorkItem[];
    qualityChecks: QualityCheck[];
    issues: TaskIssue[];
    dependenciesCompleted: string[];
    dependenciesRemaining: string[];
    lastUpdate: Date;
    updateHistory: ProgressUpdate[];
}
export interface TaskPhase {
    id: string;
    name: string;
    description: string;
    estimatedDuration: number;
    actualDuration?: number;
    status: PhaseStatus;
    startedAt?: Date;
    completedAt?: Date;
}
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
export interface PhaseProgress {
    phaseId: string;
    percentage: number;
    completedItems: string[];
    remainingItems: string[];
    blockedItems: string[];
}
export interface WorkItem {
    id: string;
    title: string;
    description: string;
    type: WorkItemType;
    status: WorkItemStatus;
    estimatedEffort: number;
    actualEffort?: number;
    assignee?: string;
    completedAt?: Date;
}
export type WorkItemType = 'development' | 'testing' | 'documentation' | 'review' | 'deployment' | 'communication' | 'research' | 'planning';
export type WorkItemStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
export interface QualityCheck {
    id: string;
    name: string;
    type: QualityCheckType;
    status: QualityCheckStatus;
    result?: QualityCheckResult;
    performedBy?: string;
    performedAt?: Date;
}
export type QualityCheckType = 'automated_test' | 'code_review' | 'security_scan' | 'performance_test' | 'documentation_check' | 'compliance_check';
export type QualityCheckStatus = 'pending' | 'passed' | 'failed' | 'skipped';
export interface QualityCheckResult {
    score: number;
    issues: QualityIssue[];
    metrics: QualityMetric[];
    recommendations: string[];
}
export interface QualityIssue {
    type: QualityIssueType;
    severity: QualityIssueSeverity;
    description: string;
    location?: string;
    suggestion?: string;
}
export type QualityIssueType = 'bug' | 'vulnerability' | 'performance' | 'maintainability' | 'documentation' | 'standards' | 'security';
export type QualityIssueSeverity = 'info' | 'warning' | 'error' | 'critical';
export interface QualityMetric {
    name: string;
    value: number;
    unit: string;
    threshold?: number;
    status: 'good' | 'warning' | 'critical';
}
export interface TaskIssue {
    id: string;
    type: TaskIssueType;
    severity: TaskIssueSeverity;
    description: string;
    reportedBy: string;
    reportedAt: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolution?: string;
    impact: string;
}
export type TaskIssueType = 'blocker' | 'dependency' | 'resource' | 'technical' | 'communication' | 'scope' | 'quality';
export type TaskIssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface ProgressUpdate {
    id: string;
    timestamp: Date;
    updateType: UpdateType;
    message: string;
    data?: Record<string, any>;
    author: string;
}
export type UpdateType = 'status_change' | 'progress_update' | 'issue_reported' | 'issue_resolved' | 'phase_completed' | 'milestone_reached' | 'quality_check' | 'general';
export interface WIPLimit {
    agentId: string;
    limits: ColumnWIPLimit[];
    globalLimit?: number;
    flexibleLimits: boolean;
    autoAdjustment: boolean;
    adjustmentCriteria: WIPAdjustmentCriteria[];
}
export interface WIPAdjustmentCriteria {
    factor: WIPAdjustmentFactor;
    condition: string;
    adjustment: number;
    maxAdjustment: number;
}
export type WIPAdjustmentFactor = 'performance' | 'workload' | 'complexity' | 'deadline_pressure' | 'team_capacity' | 'resource_availability';
export interface AnalyticsPeriod {
    start: Date;
    end: Date;
    type: PeriodType;
}
export type PeriodType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
export interface AgentAnalytics {
    agentId: string;
    period: AnalyticsPeriod;
    tasksCompleted: number;
    tasksInProgress: number;
    completionRate: number;
    averageTaskDuration: number;
    onTimeCompletionRate: number;
    productivity: number;
    efficiency: number;
    qualityScore: number;
    reliabilityScore: number;
    averageWorkload: number;
    peakWorkload: number;
    wipEfficiency: number;
    overtimeHours: number;
    averageCycleTime: number;
    averageLeadTime: number;
    flowEfficiency: number;
    blockageRate: number;
    capabilitiesImproved: number;
    newSkillsAcquired: number;
    learningVelocity: number;
    trends: AnalyticsTrend[];
    insights: AnalyticsInsight[];
    recommendations: AnalyticsRecommendation[];
}
export interface TeamAnalytics {
    teamId: string;
    period: AnalyticsPeriod;
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    teamProductivity: number;
    teamEfficiency: number;
    averageQualityScore: number;
    collaborationScore: number;
    workloadBalance: number;
    utilizationRate: number;
    bottlenecks: TeamBottleneck[];
    teamCycleTime: number;
    teamLeadTime: number;
    throughput: number;
    agentMetrics: AgentAnalytics[];
    trends: AnalyticsTrend[];
    insights: AnalyticsInsight[];
    recommendations: AnalyticsRecommendation[];
}
export interface SystemAnalytics {
    period: AnalyticsPeriod;
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    systemProductivity: number;
    systemEfficiency: number;
    averageQualityScore: number;
    resourceUtilization: number;
    costEfficiency: number;
    scalability: number;
    systemCycleTime: number;
    systemLeadTime: number;
    systemThroughput: number;
    agentTypeDistribution: AgentTypeDistribution[];
    taskTypeDistribution: TaskTypeDistribution[];
    statusDistribution: StatusDistribution[];
    trends: AnalyticsTrend[];
    insights: AnalyticsInsight[];
    recommendations: AnalyticsRecommendation[];
}
export interface AnalyticsTrend {
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    period: string;
    confidence: number;
    significance: 'low' | 'medium' | 'high';
}
export interface AnalyticsInsight {
    type: InsightType;
    title: string;
    description: string;
    impact: InsightImpact;
    data: Record<string, any>;
    confidence: number;
    timestamp: Date;
}
export type InsightType = 'performance' | 'efficiency' | 'quality' | 'workload' | 'collaboration' | 'learning' | 'resource' | 'anomaly';
export type InsightImpact = 'low' | 'medium' | 'high' | 'critical';
export interface AnalyticsRecommendation {
    type: RecommendationType;
    title: string;
    description: string;
    priority: RecommendationPriority;
    effort: RecommendationEffort;
    expectedImpact: number;
    implementation: string;
    metrics: string[];
}
export type RecommendationType = 'process_improvement' | 'resource_allocation' | 'skill_development' | 'tool_optimization' | 'workflow_automation' | 'team_restructure' | 'capacity_planning';
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationEffort = 'low' | 'medium' | 'high';
export interface TeamBottleneck {
    type: BottleneckType;
    description: string;
    impact: number;
    affectedAgents: string[];
    affectedTasks: string[];
    suggestedResolution: string;
}
export type BottleneckType = 'skill_gap' | 'resource_shortage' | 'workload_imbalance' | 'communication_delay' | 'process_inefficiency' | 'tool_limitation';
export interface AgentTypeDistribution {
    agentType: string;
    count: number;
    percentage: number;
    avgPerformance: number;
    avgWorkload: number;
}
export interface TaskTypeDistribution {
    taskType: string;
    count: number;
    percentage: number;
    avgDuration: number;
    completionRate: number;
}
export interface StatusDistribution {
    status: string;
    count: number;
    percentage: number;
    avgDuration: number;
}
export type AgentStatus = 'initializing' | 'idle' | 'available' | 'busy' | 'overloaded' | 'offline' | 'maintenance' | 'error' | 'terminated';
export type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'testing' | 'done' | 'blocked' | 'cancelled';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export interface TaskBlocker {
    id: string;
    type: BlockerType;
    description: string;
    severity: BlockerSeverity;
    reportedBy: string;
    reportedAt: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolution?: string;
}
export type BlockerType = 'dependency' | 'resource' | 'technical' | 'communication' | 'approval' | 'external';
export type BlockerSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface TaskDependency {
    taskId: string;
    type: DependencyType;
    description: string;
    critical: boolean;
}
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
//# sourceMappingURL=kanban-integration.d.ts.map