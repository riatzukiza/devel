"use strict";
/**
 * Agent OS Protocol Adapter - Emergency Crisis Response Edition
 *
 * CRITICAL: Accelerated implementation for system crisis coordination
 * Focus: Agent coordination, task prioritization, emergency response
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyCrisisSystem = exports.CrisisCoordinator = exports.AgentBusAdapter = exports.CrisisLevel = exports.CrisisMessageType = void 0;
const types_1 = require("../core/types");
// ============================================================================
// Emergency Crisis Response Types
// ============================================================================
var CrisisMessageType;
(function (CrisisMessageType) {
    // Crisis Coordination
    CrisisMessageType["CRISIS_ALERT"] = "crisis_alert";
    CrisisMessageType["EMERGENCY_COORDINATION"] = "emergency_coordination";
    CrisisMessageType["RESOURCE_ALLOCATION"] = "resource_allocation";
    CrisisMessageType["TASK_PRIORITIZATION"] = "task_prioritization";
    // Agent Coordination
    CrisisMessageType["AGENT_STATUS_UPDATE"] = "agent_status_update";
    CrisisMessageType["CAPABILITY_REQUEST"] = "capability_request";
    CrisisMessageType["WORKLOAD_DISTRIBUTION"] = "workload_distribution";
    CrisisMessageType["DUPLICATE_RESOLUTION"] = "duplicate_resolution";
    // System Recovery
    CrisisMessageType["RECOVERY_COORDINATION"] = "recovery_coordination";
    CrisisMessageType["DEPLOYMENT_SYNC"] = "deployment_sync";
    CrisisMessageType["SECURITY_VALIDATION"] = "security_validation";
    CrisisMessageType["BOARD_MANAGEMENT"] = "board_management";
})(CrisisMessageType || (exports.CrisisMessageType = CrisisMessageType = {}));
var CrisisLevel;
(function (CrisisLevel) {
    CrisisLevel["LOW"] = "low";
    CrisisLevel["MEDIUM"] = "medium";
    CrisisLevel["HIGH"] = "high";
    CrisisLevel["CRITICAL"] = "critical";
    CrisisLevel["SYSTEM_EMERGENCY"] = "system_emergency";
})(CrisisLevel || (exports.CrisisLevel = CrisisLevel = {}));
class AgentBusAdapter {
    /**
     * Convert Agent Bus message to Crisis Message
     * CRITICAL: Handle emergency coordination messages
     */
    fromAgentBus(busMessage) {
        const crisisType = this.detectCrisisType(busMessage.topic);
        const crisisLevel = this.assessCrisisLevel(busMessage);
        return {
            // Core Message fields
            id: this.generateId(),
            version: '1.0.0',
            type: types_1.MessageType.EVENT,
            timestamp: new Date().toISOString(),
            sender: this.createAgentAddress(busMessage.agentId || 'unknown'),
            recipient: this.createBroadcastAddress(),
            capabilities: ['crisis_coordination'],
            payload: {
                type: crisisType,
                data: busMessage.payload,
                encoding: 'json',
            },
            metadata: {
                source: 'agent_bus',
                category: 'crisis_response',
                tags: ['emergency', 'coordination'],
                custom: {
                    originalTopic: busMessage.topic,
                    originalTimestamp: busMessage.timestamp,
                },
            },
            headers: {},
            priority: this.mapCrisisLevelToPriority(crisisLevel),
            qos: types_1.QoSLevel.EXACTLY_ONCE,
            // Crisis-specific fields
            crisisType,
            crisisLevel,
            coordinationId: this.generateCoordinationId(),
            affectedAgents: this.identifyAffectedAgents(crisisType),
            requiredActions: this.getRequiredActions(crisisType),
            deadline: this.calculateDeadline(crisisLevel),
            correlationId: busMessage.correlationId,
        };
    }
    /**
     * Convert Crisis Message back to Agent Bus format
     */
    toAgentBus(crisisMessage) {
        return {
            topic: this.mapCrisisTypeToTopic(crisisMessage.crisisType),
            payload: crisisMessage.payload.data,
            timestamp: Date.now(),
            agentId: crisisMessage.sender.id,
            correlationId: crisisMessage.correlationId,
        };
    }
    detectCrisisType(topic) {
        if (topic.includes('crisis') || topic.includes('emergency')) {
            return CrisisMessageType.CRISIS_ALERT;
        }
        if (topic.includes('agent') && topic.includes('status')) {
            return CrisisMessageType.AGENT_STATUS_UPDATE;
        }
        if (topic.includes('task') && topic.includes('priority')) {
            return CrisisMessageType.TASK_PRIORITIZATION;
        }
        if (topic.includes('duplicate')) {
            return CrisisMessageType.DUPLICATE_RESOLUTION;
        }
        if (topic.includes('security') || topic.includes('validation')) {
            return CrisisMessageType.SECURITY_VALIDATION;
        }
        return CrisisMessageType.EMERGENCY_COORDINATION;
    }
    assessCrisisLevel(message) {
        const payload = message.payload;
        // System emergency indicators
        if (payload.critical === true || payload.emergency === true) {
            return CrisisLevel.SYSTEM_EMERGENCY;
        }
        // High priority indicators
        if (payload.priority === 'critical' || payload.urgent === true) {
            return CrisisLevel.CRITICAL;
        }
        // Medium priority indicators
        if (payload.priority === 'high' || payload.important === true) {
            return CrisisLevel.HIGH;
        }
        // Check for system overload
        if (payload.overload === true || payload.capacity === 'full') {
            return CrisisLevel.HIGH;
        }
        return CrisisLevel.MEDIUM;
    }
    mapCrisisLevelToPriority(level) {
        switch (level) {
            case CrisisLevel.SYSTEM_EMERGENCY:
                return types_1.Priority.CRITICAL;
            case CrisisLevel.CRITICAL:
                return types_1.Priority.HIGH;
            case CrisisLevel.HIGH:
                return types_1.Priority.HIGH;
            case CrisisLevel.MEDIUM:
                return types_1.Priority.NORMAL;
            case CrisisLevel.LOW:
                return types_1.Priority.LOW;
            default:
                return types_1.Priority.NORMAL;
        }
    }
    createAgentAddress(agentId) {
        return {
            id: agentId,
            namespace: 'crisis_response',
            domain: 'agent_coordination',
            version: '1.0.0',
        };
    }
    createBroadcastAddress() {
        return {
            id: 'broadcast',
            namespace: 'crisis_response',
            domain: 'all_agents',
            version: '1.0.0',
        };
    }
    generateCoordinationId() {
        return `crisis_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    identifyAffectedAgents(crisisType) {
        const agents = [];
        // Add specific agents based on crisis type
        switch (crisisType) {
            case CrisisMessageType.DUPLICATE_RESOLUTION:
                agents.push(this.createAgentAddress('task-architect'));
                agents.push(this.createAgentAddress('work-prioritizer'));
                break;
            case CrisisMessageType.SECURITY_VALIDATION:
                agents.push(this.createAgentAddress('security-specialist'));
                agents.push(this.createAgentAddress('code-reviewer'));
                break;
            case CrisisMessageType.DEPLOYMENT_SYNC:
                agents.push(this.createAgentAddress('devops-orchestrator'));
                agents.push(this.createAgentAddress('process-debugger'));
                break;
            case CrisisMessageType.BOARD_MANAGEMENT:
                agents.push(this.createAgentAddress('kanban-process-enforcer'));
                agents.push(this.createAgentAddress('task-consolidator'));
                break;
            default:
                // Add all available agents for general crisis
                agents.push(this.createBroadcastAddress());
        }
        return agents;
    }
    getRequiredActions(crisisType) {
        switch (crisisType) {
            case CrisisMessageType.DUPLICATE_RESOLUTION:
                return ['consolidate_tasks', 'remove_duplicates', 'prioritize_unique'];
            case CrisisMessageType.SECURITY_VALIDATION:
                return ['validate_security', 'scan_vulnerabilities', 'approve_deployment'];
            case CrisisMessageType.DEPLOYMENT_SYNC:
                return ['sync_deployment', 'validate_changes', 'coordinate_rollback'];
            case CrisisMessageType.BOARD_MANAGEMENT:
                return ['clean_board', 'consolidate_columns', 'update_status'];
            default:
                return ['acknowledge', 'coordinate', 'respond'];
        }
    }
    calculateDeadline(level) {
        const now = Date.now();
        let deadlineMs;
        switch (level) {
            case CrisisLevel.SYSTEM_EMERGENCY:
                deadlineMs = now + 30 * 1000; // 30 seconds
                break;
            case CrisisLevel.CRITICAL:
                deadlineMs = now + 2 * 60 * 1000; // 2 minutes
                break;
            case CrisisLevel.HIGH:
                deadlineMs = now + 5 * 60 * 1000; // 5 minutes
                break;
            case CrisisLevel.MEDIUM:
                deadlineMs = now + 15 * 60 * 1000; // 15 minutes
                break;
            case CrisisLevel.LOW:
                deadlineMs = now + 60 * 60 * 1000; // 1 hour
                break;
            default:
                deadlineMs = now + 10 * 60 * 1000; // 10 minutes
        }
        return new Date(deadlineMs).toISOString();
    }
    mapCrisisTypeToTopic(crisisType) {
        const topicMap = {
            [CrisisMessageType.CRISIS_ALERT]: 'crisis.alert',
            [CrisisMessageType.EMERGENCY_COORDINATION]: 'emergency.coordination',
            [CrisisMessageType.RESOURCE_ALLOCATION]: 'resource.allocation',
            [CrisisMessageType.TASK_PRIORITIZATION]: 'task.prioritization',
            [CrisisMessageType.AGENT_STATUS_UPDATE]: 'agent.status.update',
            [CrisisMessageType.CAPABILITY_REQUEST]: 'agent.capability.request',
            [CrisisMessageType.WORKLOAD_DISTRIBUTION]: 'agent.workload.distribution',
            [CrisisMessageType.DUPLICATE_RESOLUTION]: 'task.duplicate.resolution',
            [CrisisMessageType.RECOVERY_COORDINATION]: 'recovery.coordination',
            [CrisisMessageType.DEPLOYMENT_SYNC]: 'deployment.sync',
            [CrisisMessageType.SECURITY_VALIDATION]: 'security.validation',
            [CrisisMessageType.BOARD_MANAGEMENT]: 'board.management',
        };
        return topicMap[crisisType] || 'emergency.coordination';
    }
    generateId() {
        return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
}
exports.AgentBusAdapter = AgentBusAdapter;
// ============================================================================
// Emergency Crisis Coordinator
// ============================================================================
class CrisisCoordinator {
    activeCrises = new Map();
    agentCapabilities = new Map();
    agentStatus = new Map();
    constructor() {
        this.initializeCrisisHandlers();
    }
    /**
     * Handle incoming crisis message
     * CRITICAL: Immediate response required for system emergencies
     */
    async handleCrisisMessage(message) {
        const session = this.getOrCreateCrisisSession(message.coordinationId);
        // Log crisis for tracking
        await this.logCrisisEvent(message);
        // Immediate response for system emergencies
        if (message.crisisLevel === CrisisLevel.SYSTEM_EMERGENCY) {
            await this.handleSystemEmergency(message);
            return;
        }
        // Route to appropriate handlers
        await this.routeToHandlers(message);
        // Check for required responses
        await this.trackRequiredResponses(message, session);
    }
    /**
     * Coordinate agent workload distribution
     * CRITICAL: Prevent agent overload during crisis
     */
    async distributeWorkload(crisisId, tasks) {
        if (!this.activeCrises.has(crisisId)) {
            throw new Error(`Crisis session not found: ${crisisId}`);
        }
        const availableAgents = this.getAvailableAgents();
        const distribution = this.calculateOptimalDistribution(tasks, availableAgents);
        // Send work assignment messages
        for (const assignment of distribution.assignments) {
            const workMessage = this.createWorkAssignmentMessage(assignment, crisisId);
            await this.sendCrisisMessage(workMessage);
        }
        return distribution;
    }
    /**
     * Consolidate duplicate tasks across agents
     * CRITICAL: Resolve board gridlock from 147 duplicate tasks
     */
    async consolidateDuplicateTasks(crisisId) {
        console.log(`[CRISIS] Consolidating duplicates for ${crisisId}`);
        // Gather all duplicate tasks from agents
        const duplicateTasks = await this.gatherDuplicateTasks();
        // Consolidate and deduplicate
        const consolidatedTasks = this.deduplicateTasks(duplicateTasks);
        // Create consolidation plan
        const resolution = this.createConsolidationPlan(consolidatedTasks);
        // Execute consolidation
        await this.executeConsolidation(resolution);
        return resolution;
    }
    async handleSystemEmergency(message) {
        // Immediate broadcast to all agents
        const emergencyBroadcast = this.createEmergencyBroadcast(message);
        await this.broadcastToAllAgents(emergencyBroadcast);
        // Activate emergency protocols
        await this.activateEmergencyProtocols(message);
        // Initiate immediate resource allocation
        await this.initiateEmergencyResourceAllocation(message);
    }
    async routeToHandlers(message) {
        for (const agent of message.affectedAgents) {
            if (this.isAgentAvailable(agent.id)) {
                const routedMessage = this.createRoutedMessage(message, agent);
                await this.sendToAgent(agent.id, routedMessage);
            }
        }
    }
    async trackRequiredResponses(message, session) {
        session.expectedResponses = message.requiredActions.length;
        session.deadline = new Date(message.deadline);
        // Set up deadline monitoring
        this.setDeadlineMonitoring(message.coordinationId, message.deadline);
    }
    getOrCreateCrisisSession(coordinationId) {
        if (!this.activeCrises.has(coordinationId)) {
            this.activeCrises.set(coordinationId, {
                id: coordinationId,
                startTime: new Date(),
                status: 'active',
                participants: [],
                expectedResponses: 0,
                receivedResponses: 0,
                deadline: null,
            });
        }
        return this.activeCrises.get(coordinationId);
    }
    async logCrisisEvent(message) {
        console.error(`[CRISIS] ${message.crisisLevel.toUpperCase()}: ${message.crisisType}`, {
            coordinationId: message.coordinationId,
            sender: message.sender.id,
            affectedAgents: message.affectedAgents.map((a) => a.id),
            deadline: message.deadline,
        });
    }
    getAvailableAgents() {
        return Array.from(this.agentStatus.entries())
            .filter(([_, status]) => status === 'running')
            .map(([id, _]) => ({
            id,
            capabilities: this.agentCapabilities.get(id) || [],
            currentLoad: this.getAgentLoad(id),
            maxCapacity: this.getAgentCapacity(id),
        }));
    }
    calculateOptimalDistribution(tasks, agents) {
        const assignments = [];
        // Simple round-robin with capability matching
        let agentIndex = 0;
        for (const task of tasks) {
            const suitableAgent = this.findSuitableAgent(task, agents, agentIndex);
            if (suitableAgent) {
                assignments.push({
                    agentId: suitableAgent.id,
                    taskId: task.id,
                    estimatedLoad: this.estimateTaskLoad(task),
                    priority: task.priority || 'normal',
                });
                agentIndex = (agentIndex + 1) % agents.length;
            }
        }
        return {
            crisisId: '',
            totalTasks: tasks.length,
            assignedTasks: assignments.length,
            assignments,
            unassignedTasks: tasks.length - assignments.length,
        };
    }
    findSuitableAgent(task, agents, startIndex) {
        if (agents.length === 0) {
            return null;
        }
        const requiredCapabilities = task.requiredCapabilities ?? [];
        for (let i = 0; i < agents.length; i++) {
            const index = (startIndex + i) % agents.length;
            const agent = agents[index];
            if (!agent) {
                continue;
            }
            const hasCapabilities = requiredCapabilities.every((cap) => agent.capabilities.includes(cap));
            if (hasCapabilities && agent.currentLoad < agent.maxCapacity) {
                return agent;
            }
        }
        return null;
    }
    async gatherDuplicateTasks() {
        // Implementation would query agents for duplicate tasks
        // For now, return mock data
        return [
            {
                id: 'task_1',
                title: 'Fix authentication bug',
                duplicates: 5,
                agents: ['agent_1', 'agent_2', 'agent_3'],
            },
            // ... more duplicate tasks
        ];
    }
    deduplicateTasks(duplicates) {
        return duplicates.map((dup) => ({
            originalId: dup.id,
            title: dup.title,
            consolidatedId: `consolidated_${dup.id}`,
            assignedAgent: this.selectBestAgent(dup.agents),
            priority: 'high',
        }));
    }
    createConsolidationPlan(tasks) {
        return {
            originalCount: tasks.length * 3, // Average 3 duplicates per task
            consolidatedCount: tasks.length,
            reduction: tasks.length * 2, // Reduced by this many tasks
            tasks,
            estimatedTimeSavings: tasks.length * 30, // minutes
        };
    }
    async executeConsolidation(resolution) {
        // Send consolidation messages to agents
        for (const task of resolution.tasks) {
            const message = this.createConsolidationMessage(task);
            await this.sendToAgent(task.assignedAgent, message);
        }
    }
    createWorkAssignmentMessage(assignment, crisisId) {
        return {
            id: this.generateId(),
            version: '1.0.0',
            type: types_1.MessageType.REQUEST,
            timestamp: new Date().toISOString(),
            sender: this.createCoordinatorAddress(),
            recipient: this.createAgentAddress(assignment.agentId),
            capabilities: ['task_execution'],
            payload: {
                type: 'work_assignment',
                data: assignment,
                encoding: 'json',
            },
            metadata: {
                source: 'crisis_coordinator',
                category: 'work_distribution',
                tags: ['assignment', 'crisis'],
            },
            headers: {},
            priority: types_1.Priority.HIGH,
            qos: types_1.QoSLevel.EXACTLY_ONCE,
            crisisType: CrisisMessageType.WORKLOAD_DISTRIBUTION,
            crisisLevel: CrisisLevel.HIGH,
            coordinationId: crisisId,
            affectedAgents: [this.createAgentAddress(assignment.agentId)],
            requiredActions: ['acknowledge', 'execute'],
            deadline: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        };
    }
    createConsolidationMessage(task) {
        return {
            id: this.generateId(),
            version: '1.0.0',
            type: types_1.MessageType.REQUEST,
            timestamp: new Date().toISOString(),
            sender: this.createCoordinatorAddress(),
            recipient: this.createAgentAddress(task.assignedAgent),
            capabilities: ['task_consolidation'],
            payload: {
                type: 'task_consolidation',
                data: task,
                encoding: 'json',
            },
            metadata: {
                source: 'crisis_coordinator',
                category: 'duplicate_resolution',
                tags: ['consolidation', 'deduplication'],
            },
            headers: {},
            priority: types_1.Priority.HIGH,
            qos: types_1.QoSLevel.EXACTLY_ONCE,
            crisisType: CrisisMessageType.DUPLICATE_RESOLUTION,
            crisisLevel: CrisisLevel.HIGH,
            coordinationId: this.generateCoordinationId(),
            affectedAgents: [this.createAgentAddress(task.assignedAgent)],
            requiredActions: ['consolidate', 'confirm'],
            deadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        };
    }
    createCoordinatorAddress() {
        return {
            id: 'crisis_coordinator',
            namespace: 'system',
            domain: 'coordination',
            version: '1.0.0',
        };
    }
    createAgentAddress(agentId) {
        return {
            id: agentId,
            namespace: 'agent',
            domain: 'worker',
            version: '1.0.0',
        };
    }
    generateId() {
        return `crisis_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    generateCoordinationId() {
        return `coord_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    isAgentAvailable(agentId) {
        return this.agentStatus.get(agentId) === 'running';
    }
    getAgentLoad(agentId) {
        const status = this.agentStatus.get(agentId);
        if (status === AgentStatus.RUNNING) {
            return Math.random() * 100; // Mock load percentage for active agents
        }
        if (status === AgentStatus.MAINTENANCE) {
            return 100; // Treat maintenance agents as fully loaded
        }
        return 0;
    }
    getAgentCapacity(agentId) {
        const capabilities = this.agentCapabilities.get(agentId) ?? [];
        return Math.max(40, 100 - capabilities.length * 5);
    }
    estimateTaskLoad(task) {
        if (typeof task.complexity === 'number') {
            return task.complexity;
        }
        return task.priority === 'critical' ? 30 : 10; // Mock load units
    }
    selectBestAgent(agents) {
        // Select agent with lowest current load
        return agents.reduce((best, current) => this.getAgentLoad(current) < this.getAgentLoad(best) ? current : best);
    }
    async sendCrisisMessage(message) {
        // Implementation would send via transport layer
        console.log(`[CRISIS] Sending message: ${message.crisisType} to ${message.recipient.id}`);
    }
    async sendToAgent(agentId, message) {
        // Implementation would send to specific agent
        console.log(`[CRISIS] Sending to agent ${agentId}: ${message.crisisType}`);
    }
    async broadcastToAllAgents(message) {
        // Implementation would broadcast to all agents
        console.log(`[CRISIS] Broadcasting to all agents: ${message.crisisType}`);
    }
    async activateEmergencyProtocols(message) {
        // Implementation would activate emergency procedures
        console.log(`[CRISIS] Activating emergency protocols for: ${message.crisisType}`);
    }
    async initiateEmergencyResourceAllocation(message) {
        // Implementation would allocate emergency resources
        console.log(`[CRISIS] Initiating emergency resource allocation for ${message.coordinationId}`);
    }
    createRoutedMessage(original, targetAgent) {
        return {
            ...original,
            recipient: targetAgent,
            affectedAgents: [targetAgent],
        };
    }
    createEmergencyBroadcast(original) {
        return {
            ...original,
            recipient: this.createBroadcastAddress(),
            affectedAgents: [this.createBroadcastAddress()],
        };
    }
    createBroadcastAddress() {
        return {
            id: 'broadcast_all',
            namespace: 'emergency',
            domain: 'all_agents',
            version: '1.0.0',
        };
    }
    setDeadlineMonitoring(coordinationId, deadline) {
        const deadlineTime = new Date(deadline).getTime();
        const now = Date.now();
        const timeout = deadlineTime - now;
        if (timeout > 0) {
            setTimeout(() => {
                this.checkDeadline(coordinationId);
            }, timeout);
        }
    }
    async checkDeadline(coordinationId) {
        const session = this.activeCrises.get(coordinationId);
        if (session && session.receivedResponses < session.expectedResponses) {
            // Escalate to next level agents
            await this.escalateCrisis(coordinationId);
        }
    }
    async escalateCrisis(coordinationId) {
        const session = this.activeCrises.get(coordinationId);
        if (session) {
            session.status = 'escalated';
            console.error(`[CRISIS] Escalating crisis due to missed deadline: ${coordinationId}`);
            // Implementation would send escalation messages
        }
    }
    initializeCrisisHandlers() {
        // Initialize crisis-specific handlers
        console.log('[CRISIS] Emergency response coordinator initialized');
    }
}
exports.CrisisCoordinator = CrisisCoordinator;
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["STARTING"] = "starting";
    AgentStatus["RUNNING"] = "running";
    AgentStatus["STOPPING"] = "stopping";
    AgentStatus["STOPPED"] = "stopped";
    AgentStatus["ERROR"] = "error";
    AgentStatus["MAINTENANCE"] = "maintenance";
})(AgentStatus || (AgentStatus = {}));
// ============================================================================
// Export Emergency Crisis Response System
// ============================================================================
exports.EmergencyCrisisSystem = {
    AgentBusAdapter,
    CrisisCoordinator,
    CrisisMessageType,
    CrisisLevel,
};
// CRITICAL: System is ready for emergency coordination
console.log('[CRITICAL] Agent OS Emergency Crisis Response System initialized');
console.log('[CRITICAL] Ready to handle system emergencies and agent coordination');
//# sourceMappingURL=protocol-adapter.js.map