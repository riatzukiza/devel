/**
 * Integration Layer for Workflow Healing System
 *
 * Integrates the healing system with monitoring, kanban, and alerting systems
 * to provide a comprehensive workflow enhancement and healing solution.
 */
import { DefaultWorkflowHealer } from './healer.js';
import { DefaultWorkflowMonitor } from './monitor.js';
import { DefaultRecoveryManager } from './recovery.js';
export class DefaultWorkflowHealingIntegration {
    config;
    healer;
    monitor;
    // @ts-ignore - Unused in placeholder implementation
    _recoveryManager;
    workflows = new Map();
    monitoringIntervals = new Map();
    isInitialized = false;
    constructor(config = {}) {
        this.config = this.createDefaultConfig(config);
        this.healer = new DefaultWorkflowHealer(this.config);
        this.monitor = new DefaultWorkflowMonitor(this.config);
        this._recoveryManager = new DefaultRecoveryManager();
    }
    async initialize(config) {
        if (this.isInitialized) {
            throw new Error('Integration already initialized');
        }
        this.config = { ...this.config, ...config };
        // Update healer configuration
        await this.healer.configureHealing(this.config);
        // Initialize external integrations
        if (this.config.enableKanbanIntegration) {
            await this.initializeKanbanIntegration();
        }
        if (this.config.enableMonitoringIntegration) {
            await this.initializeMonitoringIntegration();
        }
        if (this.config.enableAlertingIntegration) {
            await this.initializeAlertingIntegration();
        }
        this.isInitialized = true;
        console.log('Workflow Healing Integration initialized successfully');
    }
    async shutdown() {
        if (!this.isInitialized)
            return;
        // Stop all monitoring
        for (const [workflowId, interval] of this.monitoringIntervals) {
            clearInterval(interval);
            await this.monitor.stopMonitoring(workflowId);
        }
        this.monitoringIntervals.clear();
        // Unregister all workflows
        for (const workflowId of this.workflows.keys()) {
            await this.unregisterWorkflow(workflowId);
        }
        this.isInitialized = false;
        console.log('Workflow Healing Integration shut down successfully');
    }
    async registerWorkflow(workflow) {
        if (!this.isInitialized) {
            throw new Error('Integration not initialized');
        }
        const workflowId = workflow.id;
        if (this.workflows.has(workflowId)) {
            throw new Error(`Workflow ${workflowId} already registered`);
        }
        this.workflows.set(workflowId, workflow);
        // Start monitoring
        await this.monitor.startMonitoring(workflow);
        // Start periodic health checks
        const healthInterval = setInterval(async () => {
            try {
                const health = await this.getWorkflowHealth(workflowId);
                await this.handleHealthUpdate(workflowId, health);
            }
            catch (error) {
                console.error(`Health check failed for workflow ${workflowId}:`, error);
            }
        }, this.config.healthCheckInterval);
        this.monitoringIntervals.set(workflowId, healthInterval);
        console.log(`Workflow ${workflowId} registered and monitoring started`);
    }
    async unregisterWorkflow(workflowId) {
        if (!this.workflows.has(workflowId)) {
            return;
        }
        // Stop monitoring
        await this.monitor.stopMonitoring(workflowId);
        // Clear health check interval
        const interval = this.monitoringIntervals.get(workflowId);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(workflowId);
        }
        // Remove from registry
        this.workflows.delete(workflowId);
        console.log(`Workflow ${workflowId} unregistered`);
    }
    async analyzeWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        return await this.healer.analyzeWorkflow(workflow);
    }
    async healWorkflow(workflowId, issueId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        const analysis = await this.healer.analyzeWorkflow(workflow);
        const issuesToHeal = issueId
            ? analysis.issues.filter((issue) => issue.id === issueId)
            : analysis.issues.filter((issue) => issue.confidence >= this.config.autoHealingThreshold &&
                !this.config.requireApprovalFor.includes(issue.severity));
        const results = [];
        for (const issue of issuesToHeal) {
            try {
                const result = await this.healer.applyHealing(workflowId, issue);
                results.push(result);
                // Handle healing result
                await this.handleHealingResult(workflowId, issue, result);
            }
            catch (error) {
                console.error(`Healing failed for issue ${issue.id}:`, error);
                // Create failure result
                const failureResult = {
                    success: false,
                    strategy: 'unknown',
                    executionTime: 0,
                    changes: [],
                    sideEffects: [],
                    newIssues: [],
                    resolvedIssues: [],
                    metrics: {
                        executionTime: 0,
                        resourceUsage: { cpu: 0, memory: 0, network: 0 },
                        successProbability: 0,
                        confidence: 0,
                        riskScore: 1,
                    },
                    summary: `Healing failed: ${error}`,
                };
                results.push(failureResult);
            }
        }
        return results;
    }
    async getWorkflowHealth(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        return await this.healer.getHealthStatus(workflowId);
    }
    async getAllWorkflowHealth() {
        const healthStatus = {};
        for (const workflowId of this.workflows.keys()) {
            try {
                healthStatus[workflowId] = await this.getWorkflowHealth(workflowId);
            }
            catch (error) {
                console.error(`Failed to get health for workflow ${workflowId}:`, error);
            }
        }
        return healthStatus;
    }
    async updateConfiguration(config) {
        this.config = { ...this.config, ...config };
        await this.healer.configureHealing(this.config);
    }
    async getConfiguration() {
        return { ...this.config };
    }
    // Private methods
    createDefaultConfig(userConfig) {
        return {
            // Base healing config
            enabled: true,
            automationLevel: 'assisted',
            detectionInterval: 30000,
            issueRetentionPeriod: 86400000,
            maxConcurrentHealings: 3,
            healingTimeout: 300000,
            autoHealThreshold: 0.8,
            requireApprovalFor: ['critical'],
            blacklistStrategies: [],
            rollbackOnError: true,
            enablePredictiveAnalysis: true,
            healthCheckInterval: 60000,
            metricsRetentionPeriod: 604800000,
            monitoringIntegration: {
                enabled: true,
                metricsEndpoint: '',
                alertEndpoint: '',
                healthCheckEndpoint: '',
            },
            kanbanIntegration: {
                enabled: true,
                boardId: '',
                createHealingTasks: true,
                updateTaskStatus: true,
                taskPriority: 'P1',
                customFields: {},
            },
            alertingIntegration: {
                enabled: true,
                channels: [],
                severityThresholds: {
                    low: 0.1,
                    medium: 0.3,
                    high: 0.7,
                    critical: 0.9,
                },
                cooldownPeriod: 300000,
                escalationPolicy: {
                    enabled: true,
                    levels: [],
                    timeout: 600000,
                },
            },
            // Integration config
            enableKanbanIntegration: true,
            enableMonitoringIntegration: true,
            enableAlertingIntegration: true,
            kanbanBoardId: '',
            kanbanApiEndpoint: '',
            createHealingTasks: true,
            healingTaskPriority: 'P1',
            metricsCollectionInterval: 30000,
            anomalyDetectionSensitivity: 0.7,
            alertChannels: [],
            alertCooldownPeriod: 300000,
            escalationPolicy: {
                enabled: true,
                levels: [],
                timeout: 600000,
            },
            autoHealingEnabled: true,
            autoHealingThreshold: 0.8,
            ...userConfig,
        };
    }
    async initializeKanbanIntegration() {
        if (!this.config.kanbanBoardId) {
            console.warn('Kanban integration enabled but no board ID provided');
            return;
        }
        // In a real implementation, this would initialize the kanban client
        console.log('Kanban integration initialized');
    }
    async initializeMonitoringIntegration() {
        // In a real implementation, this would initialize the monitoring client
        console.log('Monitoring integration initialized');
    }
    async initializeAlertingIntegration() {
        // In a real implementation, this would initialize the alerting client
        console.log('Alerting integration initialized');
    }
    async handleHealthUpdate(workflowId, health) {
        // Check if auto-healing should be triggered
        if (this.config.autoHealingEnabled && health.status !== 'healthy') {
            const criticalIssues = health.activeIssues.filter((_issueId) => {
                // In a real implementation, we'd get the issue details
                return true; // Simplified for demo
            });
            if (criticalIssues.length > 0) {
                try {
                    await this.healWorkflow(workflowId);
                }
                catch (error) {
                    console.error(`Auto-healing failed for workflow ${workflowId}:`, error);
                }
            }
        }
        // Send alerts if needed
        if (this.config.enableAlertingIntegration) {
            await this.sendHealthAlerts(workflowId, health);
        }
        // Update kanban if needed
        if (this.config.enableKanbanIntegration && this.config.createHealingTasks) {
            await this.updateKanbanTasks(workflowId, health);
        }
    }
    async handleHealingResult(workflowId, issue, result) {
        if (result.success) {
            console.log(`Successfully healed issue ${issue.id} in workflow ${workflowId}`);
            // Send success notification
            if (this.config.enableAlertingIntegration) {
                await this.sendHealingAlert(workflowId, issue, result, 'success');
            }
        }
        else {
            console.error(`Failed to heal issue ${issue.id} in workflow ${workflowId}`);
            // Send failure notification and potentially escalate
            if (this.config.enableAlertingIntegration) {
                await this.sendHealingAlert(workflowId, issue, result, 'failure');
                await this.escalateIssue(workflowId, issue, result);
            }
        }
        // Update kanban tasks
        if (this.config.enableKanbanIntegration) {
            await this.updateHealingTasks(workflowId, issue, result);
        }
    }
    async sendHealthAlerts(workflowId, health) {
        // In a real implementation, this would send alerts to configured channels
        console.log(`Health alert for workflow ${workflowId}: ${health.status}`);
    }
    async updateKanbanTasks(workflowId, _health) {
        // In a real implementation, this would create/update kanban tasks
        console.log(`Updating kanban tasks for workflow ${workflowId}`);
    }
    async sendHealingAlert(workflowId, issue, _result, status) {
        // In a real implementation, this would send healing alerts
        console.log(`Healing ${status} alert for workflow ${workflowId}, issue ${issue.id}`);
    }
    async escalateIssue(workflowId, issue, _result) {
        // In a real implementation, this would escalate the issue
        console.log(`Escalating issue ${issue.id} in workflow ${workflowId}`);
    }
    async updateHealingTasks(workflowId, issue, _result) {
        // In a real implementation, this would update kanban tasks
        console.log(`Updating healing tasks for workflow ${workflowId}, issue ${issue.id}`);
    }
}
//# sourceMappingURL=integration.js.map