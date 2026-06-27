/**
 * Agent OS Protocol Adapter - Emergency Crisis Response Edition
 *
 * CRITICAL: Accelerated implementation for system crisis coordination
 * Focus: Agent coordination, task prioritization, emergency response
 */
import { CoreMessage, AgentAddress } from '../core/types';
export declare enum CrisisMessageType {
    CRISIS_ALERT = "crisis_alert",
    EMERGENCY_COORDINATION = "emergency_coordination",
    RESOURCE_ALLOCATION = "resource_allocation",
    TASK_PRIORITIZATION = "task_prioritization",
    AGENT_STATUS_UPDATE = "agent_status_update",
    CAPABILITY_REQUEST = "capability_request",
    WORKLOAD_DISTRIBUTION = "workload_distribution",
    DUPLICATE_RESOLUTION = "duplicate_resolution",
    RECOVERY_COORDINATION = "recovery_coordination",
    DEPLOYMENT_SYNC = "deployment_sync",
    SECURITY_VALIDATION = "security_validation",
    BOARD_MANAGEMENT = "board_management"
}
export declare enum CrisisLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
    SYSTEM_EMERGENCY = "system_emergency"
}
export interface CrisisMessage extends CoreMessage {
    crisisType: CrisisMessageType;
    crisisLevel: CrisisLevel;
    coordinationId: string;
    affectedAgents: AgentAddress[];
    requiredActions: string[];
    deadline: string;
    escalationPath?: AgentAddress[];
}
export interface AgentBusMessage {
    topic: string;
    payload: AgentBusPayload;
    timestamp: number;
    agentId?: string;
    correlationId?: string;
}
interface AgentBusPayload {
    critical?: boolean;
    emergency?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'critical' | string;
    urgent?: boolean;
    important?: boolean;
    overload?: boolean;
    capacity?: string;
    [key: string]: unknown;
}
export declare class AgentBusAdapter {
    /**
     * Convert Agent Bus message to Crisis Message
     * CRITICAL: Handle emergency coordination messages
     */
    fromAgentBus(busMessage: AgentBusMessage): CrisisMessage;
    /**
     * Convert Crisis Message back to Agent Bus format
     */
    toAgentBus(crisisMessage: CrisisMessage): AgentBusMessage;
    private detectCrisisType;
    private assessCrisisLevel;
    private mapCrisisLevelToPriority;
    private createAgentAddress;
    private createBroadcastAddress;
    private generateCoordinationId;
    private identifyAffectedAgents;
    private getRequiredActions;
    private calculateDeadline;
    private mapCrisisTypeToTopic;
    private generateId;
}
export declare class CrisisCoordinator {
    private activeCrises;
    private agentCapabilities;
    private agentStatus;
    constructor();
    /**
     * Handle incoming crisis message
     * CRITICAL: Immediate response required for system emergencies
     */
    handleCrisisMessage(message: CrisisMessage): Promise<void>;
    /**
     * Coordinate agent workload distribution
     * CRITICAL: Prevent agent overload during crisis
     */
    distributeWorkload(crisisId: string, tasks: CrisisTask[]): Promise<WorkDistribution>;
    /**
     * Consolidate duplicate tasks across agents
     * CRITICAL: Resolve board gridlock from 147 duplicate tasks
     */
    consolidateDuplicateTasks(crisisId: string): Promise<DuplicateResolution>;
    private handleSystemEmergency;
    private routeToHandlers;
    private trackRequiredResponses;
    private getOrCreateCrisisSession;
    private logCrisisEvent;
    private getAvailableAgents;
    private calculateOptimalDistribution;
    private findSuitableAgent;
    private gatherDuplicateTasks;
    private deduplicateTasks;
    private createConsolidationPlan;
    private executeConsolidation;
    private createWorkAssignmentMessage;
    private createConsolidationMessage;
    private createCoordinatorAddress;
    private createAgentAddress;
    private generateId;
    private generateCoordinationId;
    private isAgentAvailable;
    private getAgentLoad;
    private getAgentCapacity;
    private estimateTaskLoad;
    private selectBestAgent;
    private sendCrisisMessage;
    private sendToAgent;
    private broadcastToAllAgents;
    private activateEmergencyProtocols;
    private initiateEmergencyResourceAllocation;
    private createRoutedMessage;
    private createEmergencyBroadcast;
    private createBroadcastAddress;
    private setDeadlineMonitoring;
    private checkDeadline;
    private escalateCrisis;
    private initializeCrisisHandlers;
}
interface WorkDistribution {
    crisisId: string;
    totalTasks: number;
    assignedTasks: number;
    assignments: WorkAssignment[];
    unassignedTasks: number;
}
interface WorkAssignment {
    agentId: string;
    taskId: string;
    estimatedLoad: number;
    priority: string;
}
interface CrisisTask {
    id: string;
    requiredCapabilities?: string[];
    priority?: string;
    complexity?: number;
}
interface ConsolidatedTask {
    originalId: string;
    title: string;
    consolidatedId: string;
    assignedAgent: string;
    priority: string;
}
interface DuplicateResolution {
    originalCount: number;
    consolidatedCount: number;
    reduction: number;
    tasks: ConsolidatedTask[];
    estimatedTimeSavings: number;
}
export declare const EmergencyCrisisSystem: {
    AgentBusAdapter: typeof AgentBusAdapter;
    CrisisCoordinator: typeof CrisisCoordinator;
    CrisisMessageType: typeof CrisisMessageType;
    CrisisLevel: typeof CrisisLevel;
};
export {};
//# sourceMappingURL=protocol-adapter.d.ts.map