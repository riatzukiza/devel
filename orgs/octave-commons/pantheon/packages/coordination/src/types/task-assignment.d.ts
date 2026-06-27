/**
 * Task Assignment System Types
 *
 * Types for intelligent task assignment, capability matching, and workload balancing.
 */
import { AgentInstance } from './agent-instance.js';
export interface TaskAnalysis {
    taskId: string;
    title: string;
    description: string;
    complexity: ComplexityAssessment;
    estimatedDuration: number;
    uncertainty: number;
    requiredCapabilities: CapabilityRequirement[];
    skillRequirements: SkillRequirement[];
    toolRequirements: ToolRequirement[];
    resourceRequirements: ResourceRequirement[];
    deadline?: Date;
    priority: TaskPriority;
    securityLevel: SecurityLevel;
    environmentConstraints: EnvironmentConstraint[];
    dependencies: TaskDependency[];
    collaborationNeeds: CollaborationNeed[];
    taskType: TaskType;
    domain: string;
    learningOpportunities: LearningOpportunity[];
    knowledgeTransfer: KnowledgeTransfer[];
    tags: string[];
    category: string;
    estimatedValue: number;
}
export interface ComplexityAssessment {
    overallScore: number;
    factors: ComplexityFactor[];
    reasoning: string;
    confidence: number;
}
export interface ComplexityFactor {
    type: ComplexityType;
    weight: number;
    score: number;
    description: string;
    impact: string;
}
export type ComplexityType = 'technical' | 'coordination' | 'scope' | 'uncertainty' | 'dependencies' | 'novelty' | 'risk' | 'quality_requirements';
export interface CapabilityRequirement {
    capabilityId: string;
    name: string;
    category: string;
    minimumLevel: number;
    preferredLevel?: number;
    required: boolean;
    weight: number;
    alternatives?: string[];
}
export interface SkillRequirement {
    skill: string;
    category: string;
    proficiency: ProficiencyLevel;
    experience: number;
    required: boolean;
    weight: number;
}
export interface ToolRequirement {
    toolId: string;
    toolName: string;
    category: string;
    accessLevel: ToolAccessLevel;
    required: boolean;
    alternatives?: string[];
}
export type ToolAccessLevel = 'read' | 'write' | 'admin' | 'execute';
export interface ResourceRequirement {
    type: ResourceType;
    amount: number;
    unit: string;
    optional: boolean;
    constraints?: ResourceConstraint[];
}
export type ResourceType = 'cpu' | 'memory' | 'storage' | 'network' | 'gpu' | 'specialized_hardware' | 'software_license' | 'api_quota';
export interface ResourceConstraint {
    type: 'minimum' | 'maximum' | 'exact';
    value: number;
    reason: string;
}
export interface TaskDependency {
    taskId: string;
    type: DependencyType;
    description: string;
    critical: boolean;
}
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
export interface CollaborationNeed {
    type: CollaborationType;
    description: string;
    requiredAgents?: number;
    preferredSkills?: string[];
    coordinationComplexity: number;
}
export type CollaborationType = 'coordination' | 'communication' | 'shared_resources' | 'sequential_work' | 'parallel_work' | 'peer_review' | 'knowledge_transfer';
export type TaskType = 'development' | 'testing' | 'documentation' | 'analysis' | 'design' | 'coordination' | 'communication' | 'research' | 'maintenance' | 'deployment' | 'monitoring' | 'troubleshooting';
export interface LearningOpportunity {
    capabilityId: string;
    learningType: LearningType;
    difficulty: number;
    value: number;
    prerequisites?: string[];
}
export type LearningType = 'new_capability' | 'skill_improvement' | 'mastery_development' | 'cross_domain_learning' | 'tool_familiarity';
export interface KnowledgeTransfer {
    fromDomain: string;
    toDomain: string;
    transferType: TransferType;
    value: number;
}
export type TransferType = 'skill' | 'knowledge' | 'methodology' | 'best_practice' | 'pattern';
export interface AgentDiscoveryQuery {
    requiredCapabilities: string[];
    minimumProficiency?: number;
    excludedCapabilities?: string[];
    agentType?: string[];
    team?: string[];
    status?: AgentStatus[];
    securityLevel?: SecurityLevel;
    availabilityWindow?: TimeWindow;
    maxWorkload?: number;
    locationConstraint?: LocationConstraint;
    costBudget?: number;
    preferredAgents?: string[];
    excludedAgents?: string[];
    learningPreference?: LearningPreference;
    limit?: number;
    offset?: number;
    sortBy?: SortCriteria;
}
export interface TimeWindow {
    start: Date;
    end: Date;
    flexibility: number;
}
export interface LocationConstraint {
    type: 'any' | 'same_region' | 'same_timezone' | 'specific';
    value?: string;
    reason: string;
}
export interface LearningPreference {
    enableLearning: boolean;
    learningWeight: number;
    focusAreas?: string[];
    avoidAreas?: string[];
}
export interface SortCriteria {
    field: SortField;
    direction: 'asc' | 'desc';
    weight?: number;
}
export type SortField = 'capability_match' | 'availability' | 'performance' | 'cost' | 'learning_value' | 'workload' | 'reliability';
export interface AgentCandidate {
    agentId: string;
    agent: AgentInstance;
    overallScore: number;
    capabilityScore: CapabilityMatchScore;
    availabilityScore: number;
    workloadScore: number;
    performanceScore: number;
    costScore: number;
    learningScore: number;
    capabilityGaps: CapabilityGap[];
    riskFactors: RiskFactor[];
    collaborationPotential: CollaborationPotential;
    availability: AvailabilityInfo;
    estimatedCost: CostEstimate;
    estimatedDuration: number;
    confidence: number;
    recommendation: AssignmentRecommendation;
    reasoning: AssignmentReasoning[];
}
export interface CapabilityMatchScore {
    overallScore: number;
    capabilityScores: CapabilityScore[];
    missingCapabilities: string[];
    improvementOpportunities: string[];
    excessCapabilities: string[];
}
export interface CapabilityScore {
    capabilityId: string;
    capabilityName: string;
    requiredLevel: number;
    agentLevel: number;
    score: number;
    experience: number;
    successRate: number;
    recencyBonus: number;
    weight: number;
}
export interface CapabilityGap {
    capabilityId: string;
    capabilityName: string;
    gap: number;
    critical: boolean;
    mitigation?: MitigationStrategy;
}
export interface MitigationStrategy {
    type: 'training' | 'collaboration' | 'tool_assistance' | 'alternative_approach';
    description: string;
    feasibility: number;
    costImpact: number;
    timeImpact: number;
}
export interface RiskFactor {
    type: RiskType;
    severity: RiskSeverity;
    probability: number;
    impact: string;
    description: string;
    mitigation?: string;
}
export type RiskType = 'capability_gap' | 'workload_overload' | 'availability_risk' | 'cost_overrun' | 'quality_risk' | 'dependency_risk' | 'communication_risk';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface CollaborationPotential {
    score: number;
    factors: CollaborationFactor[];
    recommendedPartners: string[];
    communicationStyle: CommunicationStyle;
}
export interface CollaborationFactor {
    factor: string;
    score: number;
    description: string;
}
export interface AvailabilityInfo {
    currentStatus: AvailabilityStatus;
    availableCapacity: number;
    nextAvailable?: Date;
    schedule: ScheduleEntry[];
    flexibility: number;
}
export type AvailabilityStatus = 'immediately' | 'soon' | 'scheduled' | 'limited' | 'unavailable';
export interface ScheduleEntry {
    start: Date;
    end: Date;
    available: boolean;
    reason?: string;
}
export interface CostEstimate {
    estimatedCost: number;
    costBreakdown: CostBreakdown[];
    confidence: number;
    currency: string;
    billingModel: BillingModel;
}
export interface CostBreakdown {
    category: string;
    amount: number;
    calculation: string;
    variables: Record<string, any>;
}
export type BillingModel = 'fixed' | 'hourly' | 'per_task' | 'performance_based' | 'subscription';
export interface AssignmentRecommendation {
    recommendation: RecommendationType;
    confidence: number;
    reasoning: string;
    conditions?: string[];
    alternatives?: AlternativeAssignment[];
}
export type RecommendationType = 'highly_recommended' | 'recommended' | 'acceptable' | 'conditional' | 'not_recommended';
export interface AlternativeAssignment {
    agentId: string;
    score: number;
    reason: string;
    tradeoffs: string[];
    requirements: string[];
}
export interface AssignmentReasoning {
    factor: string;
    weight: number;
    score: number;
    explanation: string;
    evidence?: string;
}
export interface AssignmentDecision {
    taskId: string;
    selectedAgent: string;
    assignmentId: string;
    confidence: number;
    reasoning: AssignmentReasoning[];
    alternatives: AlternativeAssignment[];
    riskAssessment: RiskAssessment;
    expectedOutcome: ExpectedOutcome;
    assignedAt: Date;
    assignedBy: string;
    algorithmVersion: string;
    strategy: AssignmentStrategy;
    auditLog: AuditEntry[];
}
export interface RiskAssessment {
    overallRisk: number;
    riskFactors: RiskFactor[];
    mitigationStrategies: MitigationStrategy[];
    contingencyPlans: ContingencyPlan[];
    riskTolerance: number;
}
export interface ContingencyPlan {
    trigger: string;
    plan: string;
    resources: string[];
    timeline: string;
    probability: number;
}
export interface ExpectedOutcome {
    successProbability: number;
    estimatedDuration: number;
    qualityScore: number;
    learningValue: number;
    costEstimate: number;
    deliverables: string[];
}
export interface AssignmentStrategy {
    name: string;
    description: string;
    weights: AssignmentWeights;
    constraints: AssignmentConstraint[];
    optimizationGoal: OptimizationGoal;
    adaptationEnabled: boolean;
}
export interface AssignmentWeights {
    capability: number;
    availability: number;
    workload: number;
    performance: number;
    cost: number;
    learning: number;
    collaboration: number;
    risk: number;
}
export interface AssignmentConstraint {
    type: ConstraintType;
    name: string;
    description: string;
    parameters: Record<string, any>;
    priority: number;
    flexible: boolean;
}
export type ConstraintType = 'hard' | 'soft' | 'preference' | 'optimization';
export type OptimizationGoal = 'efficiency' | 'quality' | 'learning' | 'cost' | 'balance' | 'throughput' | 'reliability' | 'satisfaction';
export interface AuditEntry {
    timestamp: Date;
    action: string;
    actor: string;
    details: string;
    data?: Record<string, any>;
}
export interface AssignmentPerformance {
    assignmentId: string;
    taskId: string;
    agentId: string;
    assignedAt: Date;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    predictedDuration: number;
    actualDuration?: number;
    predictedQuality: number;
    actualQuality?: number;
    predictedCost: number;
    actualCost?: number;
    efficiency: number;
    effectiveness: number;
    satisfaction: number;
    capabilityImprovements: CapabilityImprovement[];
    newSkillsAcquired: string[];
    knowledgeGained: KnowledgeGain[];
    issues: AssignmentIssue[];
    resolutions: IssueResolution[];
    agentFeedback?: string;
    requestorFeedback?: string;
    systemFeedback?: string;
}
export interface CapabilityImprovement {
    capabilityId: string;
    beforeLevel: number;
    afterLevel: number;
    improvementAmount: number;
    context: string;
    evidence: string;
}
export interface KnowledgeGain {
    domain: string;
    topic: string;
    depth: number;
    applicability: number;
    source: string;
}
export interface AssignmentIssue {
    type: IssueType;
    severity: IssueSeverity;
    description: string;
    timestamp: Date;
    impact: string;
    resolved: boolean;
}
export type IssueType = 'capability_gap' | 'resource_shortage' | 'communication_breakdown' | 'dependency_delay' | 'quality_issue' | 'scope_change' | 'technical_challenge';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface IssueResolution {
    issueId: string;
    resolution: string;
    resolvedAt: Date;
    resolver: string;
    effectiveness: number;
    lessons: string[];
}
export interface AssignmentLearningModel {
    version: string;
    lastTrained: Date;
    trainingDataSize: number;
    accuracy: number;
    updateModel(performance: AssignmentPerformance): Promise<void>;
    predictScore(agent: AgentInstance, task: TaskAnalysis): Promise<number>;
    identifyPatterns(): Promise<AssignmentPattern[]>;
    suggestWeights(): Promise<AssignmentWeights>;
    adaptStrategy(currentStrategy: AssignmentStrategy): Promise<AssignmentStrategy>;
    detectAnomalies(): Promise<AssignmentAnomaly[]>;
    recommendImprovements(): Promise<ImprovementRecommendation[]>;
}
export interface AssignmentPattern {
    pattern: string;
    frequency: number;
    successRate: number;
    confidence: number;
    recommendation: string;
    context: string;
    evidence: string[];
}
export interface AssignmentAnomaly {
    type: AnomalyType;
    description: string;
    severity: AnomalySeverity;
    frequency: number;
    impact: string;
    recommendedAction: string;
}
export type AnomalyType = 'consistently_poor_performance' | 'systematic_underestimation' | 'capability_mismatch' | 'communication_failure' | 'resource_bottleneck';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export interface ImprovementRecommendation {
    category: ImprovementCategory;
    recommendation: string;
    expectedImpact: number;
    implementation: string;
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
}
export type ImprovementCategory = 'algorithm' | 'data_quality' | 'feature_engineering' | 'model_architecture' | 'evaluation_metrics' | 'feedback_loop';
export type AgentStatus = 'initializing' | 'idle' | 'available' | 'busy' | 'overloaded' | 'offline' | 'maintenance' | 'error' | 'terminated';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'secret' | 'top_secret';
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;
export interface EnvironmentConstraint {
    type: 'os' | 'runtime' | 'network' | 'security' | 'location' | 'hardware';
    requirement: string;
    strictness: 'required' | 'preferred' | 'optional';
    alternatives?: string[];
}
export type CommunicationStyle = 'formal' | 'informal' | 'technical' | 'collaborative' | 'independent' | 'leadership';
//# sourceMappingURL=task-assignment.d.ts.map