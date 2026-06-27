/**
 * Agent Coordination Types
 *
 * Types for real-time agent coordination, communication, and collaboration.
 */
import { AgentInstance, AgentEvent } from './agent-instance.js';
export interface AgentCoordinator {
    registerAgent(agent: AgentInstance): Promise<void>;
    unregisterAgent(agentId: string): Promise<void>;
    getAgent(agentId: string): Promise<AgentInstance | null>;
    listAgents(filter?: AgentFilter): Promise<AgentInstance[]>;
    assignTask(taskId: string, requirements: TaskRequirements): Promise<TaskAssignment>;
    reassignTask(taskId: string, newAgentId: string): Promise<TaskAssignment>;
    unassignTask(taskId: string): Promise<void>;
    getAgentTasks(agentId: string): Promise<AssignedTask[]>;
    createTeam(config: TeamConfig): Promise<Team>;
    dissolveTeam(teamId: string): Promise<void>;
    addToTeam(teamId: string, agentId: string): Promise<void>;
    removeFromTeam(teamId: string, agentId: string): Promise<void>;
    sendMessage(message: AgentMessage): Promise<void>;
    broadcastMessage(message: BroadcastMessage): Promise<void>;
    createChannel(config: ChannelConfig): Promise<CommunicationChannel>;
    getCoordinationStatus(): Promise<CoordinationStatus>;
    getAgentMetrics(agentId: string): Promise<AgentMetrics>;
    getTeamMetrics(teamId: string): Promise<TeamMetrics>;
}
export interface AgentFilter {
    status?: string[];
    agentType?: string[];
    capability?: string[];
    team?: string[];
    availability?: 'available' | 'busy' | 'all';
    limit?: number;
}
export interface TaskRequirements {
    taskId: string;
    title: string;
    description: string;
    requiredCapabilities: CapabilityRequirement[];
    skillLevel: SkillLevel;
    securityLevel: SecurityLevel;
    resourceRequirements: ResourceRequirement[];
    deadline?: Date;
    priority: TaskPriority;
    estimatedDuration: number;
    location?: string;
    preferredAgents?: string[];
    excludedAgents?: string[];
    teamPreference?: string;
    dependencies: string[];
    collaborationNeeds: CollaborationNeed[];
    taskType: TaskType;
}
export interface CapabilityRequirement {
    capabilityId: string;
    name: string;
    minimumLevel: number;
    preferredLevel?: number;
    required: boolean;
    weight: number;
}
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'secret' | 'top_secret';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export interface ResourceRequirement {
    type: 'cpu' | 'memory' | 'storage' | 'network' | 'specialized';
    amount: number;
    unit: string;
    optional: boolean;
}
export interface CollaborationNeed {
    type: 'coordination' | 'communication' | 'shared_resources' | 'sequential' | 'parallel';
    description: string;
    requiredAgents?: number;
    preferredSkills?: string[];
}
export type TaskType = 'development' | 'testing' | 'documentation' | 'analysis' | 'design' | 'coordination' | 'communication' | 'research' | 'maintenance' | 'deployment';
export interface TaskAssignment {
    id: string;
    taskId: string;
    agentId: string;
    assignedAt: Date;
    assignedBy: string;
    confidence: number;
    reasoning: AssignmentReasoning[];
    alternatives: AlternativeAssignment[];
    estimatedDuration: number;
    estimatedQuality: number;
    successProbability: number;
    status: AssignmentStatus;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    actualDuration?: number;
    actualQuality?: number;
    feedback?: string;
}
export type AssignmentStatus = 'assigned' | 'accepted' | 'rejected' | 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export interface AssignmentReasoning {
    factor: string;
    weight: number;
    score: number;
    explanation: string;
}
export interface AlternativeAssignment {
    agentId: string;
    score: number;
    reason: string;
    tradeoffs: string[];
}
export interface AssignedTask {
    id: string;
    taskId: string;
    agentId: string;
    assignmentId: string;
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    assignedAt: Date;
    startedAt?: Date;
    estimatedCompletion: Date;
    actualCompletion?: Date;
    status: TaskStatus;
    progress: number;
    estimatedEffort: number;
    actualEffort?: number;
    qualityScore?: number;
    dependencies: string[];
    dependents: string[];
}
export type TaskStatus = 'assigned' | 'accepted' | 'started' | 'in_progress' | 'blocked' | 'completed' | 'failed' | 'cancelled' | 'rejected';
export interface Team {
    id: string;
    name: string;
    description: string;
    members: TeamMember[];
    leadAgentId?: string;
    purpose: TeamPurpose;
    collaborationStyle: CollaborationStyle;
    decisionMaking: DecisionMakingStyle;
    maxMembers: number;
    requiredCapabilities: string[];
    securityLevel: SecurityLevel;
    status: TeamStatus;
    createdAt: Date;
    lastActive: Date;
    metrics: TeamMetrics;
}
export interface TeamMember {
    agentId: string;
    role: TeamRole;
    joinedAt: Date;
    permissions: TeamPermission[];
    contribution: number;
}
export type TeamRole = 'leader' | 'coordinator' | 'specialist' | 'contributor' | 'reviewer' | 'observer';
export interface TeamPermission {
    action: string;
    scope: string;
    granted: boolean;
}
export interface TeamPurpose {
    primary: string;
    secondary?: string[];
    objectives: string[];
    successCriteria: string[];
}
export type CollaborationStyle = 'hierarchical' | 'flat' | 'consensus' | 'competitive' | 'cooperative' | 'adaptive';
export type DecisionMakingStyle = 'autocratic' | 'democratic' | 'consensus' | 'delegated' | 'hybrid';
export type TeamStatus = 'forming' | 'storming' | 'norming' | 'performing' | 'adjourning' | 'inactive';
export interface TeamConfig {
    name: string;
    description: string;
    purpose: TeamPurpose;
    collaborationStyle: CollaborationStyle;
    decisionMaking: DecisionMakingStyle;
    maxMembers: number;
    requiredCapabilities: string[];
    securityLevel: SecurityLevel;
    initialMembers?: string[];
    leadAgentId?: string;
}
export interface TeamMetrics {
    taskCompletionRate: number;
    averageTaskDuration: number;
    qualityScore: number;
    communicationFrequency: number;
    coordinationEfficiency: number;
    conflictResolutionRate: number;
    memberSatisfaction: number;
    contributionBalance: number;
    skillUtilization: number;
    cohesionScore: number;
    adaptabilityScore: number;
    learningVelocity: number;
}
export interface AgentMessage {
    id: string;
    from: string;
    to: string | string[];
    type: MessageType;
    priority: MessagePriority;
    subject?: string;
    content: string;
    attachments?: MessageAttachment[];
    metadata?: Record<string, any>;
    taskId?: string;
    teamId?: string;
    channelId?: string;
    threadId?: string;
    sentAt: Date;
    expiresAt?: Date;
    readAt?: Date[];
    status: MessageStatus;
    deliveryReceipts?: DeliveryReceipt[];
}
export type MessageType = 'task_assignment' | 'task_update' | 'coordination_request' | 'collaboration_invite' | 'status_update' | 'error_report' | 'knowledge_sharing' | 'decision_notification' | 'resource_request' | 'general_communication';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';
export interface MessageAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    data?: any;
}
export interface DeliveryReceipt {
    recipientId: string;
    status: 'delivered' | 'read' | 'failed';
    timestamp: Date;
    error?: string;
}
export interface BroadcastMessage extends Omit<AgentMessage, 'to'> {
    audience: MessageAudience;
    filters?: MessageFilter[];
}
export interface MessageAudience {
    type: 'all' | 'team' | 'role' | 'capability' | 'custom';
    target: string | string[];
}
export interface MessageFilter {
    field: string;
    operator: 'equals' | 'contains' | 'in' | 'not_in';
    value: any;
}
export interface CommunicationChannel {
    id: string;
    name: string;
    type: ChannelType;
    purpose: string;
    members: string[];
    permissions: ChannelPermission[];
    settings: ChannelSettings;
    status: ChannelStatus;
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
    memberCount: number;
    activityLevel: number;
}
export type ChannelType = 'team_chat' | 'task_coordination' | 'knowledge_sharing' | 'emergency_alert' | 'decision_making' | 'resource_allocation';
export interface ChannelPermission {
    agentId: string;
    permissions: ('read' | 'write' | 'moderate' | 'admin')[];
}
export interface ChannelSettings {
    isPublic: boolean;
    allowThreads: boolean;
    messageRetention: number;
    maxMembers?: number;
    moderationLevel: 'none' | 'basic' | 'strict';
}
export type ChannelStatus = 'active' | 'inactive' | 'archived' | 'suspended';
export interface ChannelConfig {
    name: string;
    type: ChannelType;
    purpose: string;
    isPublic: boolean;
    initialMembers: string[];
    settings?: Partial<ChannelSettings>;
}
export interface CoordinationStatus {
    totalAgents: number;
    activeAgents: number;
    availableAgents: number;
    busyAgents: number;
    totalTasks: number;
    assignedTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    totalTeams: number;
    activeTeams: number;
    averageTaskDuration: number;
    taskCompletionRate: number;
    agentUtilization: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
    activeIssues: CoordinationIssue[];
    timestamp: Date;
}
export interface CoordinationIssue {
    id: string;
    type: IssueType;
    severity: IssueSeverity;
    description: string;
    affectedAgents: string[];
    affectedTasks: string[];
    affectedTeams: string[];
    status: IssueStatus;
    assignedTo?: string;
    resolution?: string;
    resolvedAt?: Date;
    detectedAt: Date;
    lastUpdated: Date;
}
export type IssueType = 'agent_failure' | 'task_timeout' | 'resource_exhaustion' | 'communication_failure' | 'coordination_conflict' | 'security_violation' | 'performance_degradation';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export interface AgentMetrics {
    agentId: string;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    taskSuccessRate: number;
    utilizationRate: number;
    efficiencyScore: number;
    qualityScore: number;
    reliabilityScore: number;
    messagesSent: number;
    messagesReceived: number;
    collaborationsInitiated: number;
    collaborationsParticipated: number;
    capabilitiesImproved: number;
    newSkillsAcquired: number;
    learningVelocity: number;
    resourceUtilization: number;
    costEfficiency: number;
    period: string;
    timestamp: Date;
}
export interface CoordinationEvent extends AgentEvent {
    coordinationType: CoordinationEventType;
}
export type CoordinationEventType = 'task_assigned' | 'task_reassigned' | 'task_completed' | 'team_formed' | 'team_dissolved' | 'agent_joined_team' | 'agent_left_team' | 'message_sent' | 'message_received' | 'coordination_conflict' | 'resource_allocated' | 'resource_deallocated' | 'performance_alert' | 'security_incident';
export interface CoordinationStrategy {
    name: string;
    description: string;
    assignmentStrategy: AssignmentStrategy;
    teamFormationStrategy: TeamFormationStrategy;
    communicationStrategy: CommunicationStrategy;
    optimizationGoal: OptimizationGoal;
    constraints: CoordinationConstraint[];
    adaptationEnabled: boolean;
    learningRate: number;
}
export interface AssignmentStrategy {
    type: 'capability_based' | 'workload_balanced' | 'learning_focused' | 'cost_optimized' | 'hybrid';
    weights: AssignmentWeights;
    algorithm: string;
}
export interface AssignmentWeights {
    capability: number;
    workload: number;
    learning: number;
    cost: number;
    performance: number;
    availability: number;
    collaboration: number;
}
export interface TeamFormationStrategy {
    type: 'static' | 'dynamic' | 'adaptive';
    criteria: TeamFormationCriteria[];
    maxSize: number;
    diversityRequirement: number;
}
export interface TeamFormationCriteria {
    factor: string;
    weight: number;
    target: number;
    tolerance: number;
}
export interface CommunicationStrategy {
    type: 'centralized' | 'decentralized' | 'hybrid';
    protocols: CommunicationProtocol[];
    routing: MessageRouting;
    moderation: ModerationPolicy;
}
export interface CommunicationProtocol {
    messageType: MessageType;
    protocol: string;
    encryption: boolean;
    persistence: boolean;
}
export interface MessageRouting {
    strategy: 'direct' | 'broadcast' | 'topic_based' | 'intelligent';
    rules: RoutingRule[];
}
export interface RoutingRule {
    condition: string;
    action: string;
    priority: number;
}
export interface ModerationPolicy {
    level: 'none' | 'basic' | 'strict';
    rules: ModerationRule[];
    autoActions: ModerationAction[];
}
export interface ModerationRule {
    pattern: string;
    action: 'warn' | 'block' | 'escalate';
    severity: 'low' | 'medium' | 'high';
}
export interface ModerationAction {
    trigger: string;
    action: string;
    parameters: Record<string, any>;
}
export type OptimizationGoal = 'efficiency' | 'quality' | 'learning' | 'cost' | 'balance' | 'throughput' | 'reliability';
export interface CoordinationConstraint {
    type: 'hard' | 'soft';
    name: string;
    description: string;
    parameters: Record<string, any>;
    priority: number;
}
//# sourceMappingURL=coordination.d.ts.map