/**
 * Design system for Agent Management UI
 * Extends base Promethean design tokens with agent-specific theming
 */
export declare const agentDesignTokens: {
    readonly statusIdle: "#6B7280";
    readonly statusActive: "#10B981";
    readonly statusBusy: "#F59E0B";
    readonly statusError: "#EF4444";
    readonly statusOffline: "#374151";
    readonly statusMaintenance: "#8B5CF6";
    readonly statusStarting: "#3B82F6";
    readonly statusStopping: "#F97316";
    readonly typeGeneral: "#6366F1";
    readonly typeSpecialist: "#EC4899";
    readonly typeOrchestrator: "#14B8A6";
    readonly typeMonitor: "#F59E0B";
    readonly typeWorkflow: "#8B5CF6";
    readonly typeUI: "#10B981";
    readonly typeBackend: "#EF4444";
    readonly priorityLow: "#6B7280";
    readonly priorityMedium: "#F59E0B";
    readonly priorityHigh: "#F97316";
    readonly priorityCritical: "#DC2626";
    readonly metricsSuccess: "#10B981";
    readonly metricsWarning: "#F59E0B";
    readonly metricsError: "#EF4444";
    readonly metricsInfo: "#3B82F6";
    readonly sidebarWidth: "280px";
    readonly headerHeight: "64px";
    readonly cardGap: "16px";
    readonly borderRadius: "8px";
    readonly spacingXSmall: "2px";
    readonly spacingSmall: "4px";
    readonly spacingMedium: "8px";
    readonly spacingLarge: "16px";
    readonly spacingXLarge: "24px";
    readonly spacingXXLarge: "32px";
    readonly fontFamily: "Inter, system-ui, -apple-system, sans-serif";
    readonly fontFamilyMono: "JetBrains Mono, Consolas, monospace";
    readonly shadowSmall: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
    readonly shadowMedium: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
    readonly shadowLarge: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
    readonly transitionFast: "150ms ease-in-out";
    readonly transitionNormal: "250ms ease-in-out";
    readonly transitionSlow: "350ms ease-in-out";
    readonly zIndexDropdown: 1000;
    readonly zIndexModal: 1050;
    readonly zIndexToast: 1100;
    readonly zIndexTooltip: 1200;
};
export declare const agentStatusConfig: {
    readonly idle: {
        readonly color: "#6B7280";
        readonly label: "Idle";
        readonly icon: "⏸️";
        readonly description: "Agent is idle and waiting for tasks";
    };
    readonly active: {
        readonly color: "#10B981";
        readonly label: "Active";
        readonly icon: "✅";
        readonly description: "Agent is actively processing tasks";
    };
    readonly busy: {
        readonly color: "#F59E0B";
        readonly label: "Busy";
        readonly icon: "🔄";
        readonly description: "Agent is busy with multiple tasks";
    };
    readonly error: {
        readonly color: "#EF4444";
        readonly label: "Error";
        readonly icon: "❌";
        readonly description: "Agent has encountered an error";
    };
    readonly offline: {
        readonly color: "#374151";
        readonly label: "Offline";
        readonly icon: "🔌";
        readonly description: "Agent is offline";
    };
    readonly maintenance: {
        readonly color: "#8B5CF6";
        readonly label: "Maintenance";
        readonly icon: "🔧";
        readonly description: "Agent is under maintenance";
    };
    readonly starting: {
        readonly color: "#3B82F6";
        readonly label: "Starting";
        readonly icon: "🚀";
        readonly description: "Agent is starting up";
    };
    readonly stopping: {
        readonly color: "#F97316";
        readonly label: "Stopping";
        readonly icon: "🛑";
        readonly description: "Agent is shutting down";
    };
};
export declare const agentTypeConfig: {
    readonly general: {
        readonly color: "#6366F1";
        readonly label: "General";
        readonly icon: "🤖";
        readonly description: "General purpose agent";
    };
    readonly specialist: {
        readonly color: "#EC4899";
        readonly label: "Specialist";
        readonly icon: "🎯";
        readonly description: "Specialized agent for specific tasks";
    };
    readonly orchestrator: {
        readonly color: "#14B8A6";
        readonly label: "Orchestrator";
        readonly icon: "🎼";
        readonly description: "Orchestrates other agents";
    };
    readonly monitor: {
        readonly color: "#F59E0B";
        readonly label: "Monitor";
        readonly icon: "📊";
        readonly description: "Monitors system health";
    };
    readonly workflow: {
        readonly color: "#8B5CF6";
        readonly label: "Workflow";
        readonly icon: "⚡";
        readonly description: "Workflow automation agent";
    };
    readonly ui: {
        readonly color: "#10B981";
        readonly label: "UI";
        readonly icon: "🎨";
        readonly description: "UI/UX focused agent";
    };
    readonly backend: {
        readonly color: "#EF4444";
        readonly label: "Backend";
        readonly icon: "⚙️";
        readonly description: "Backend services agent";
    };
};
export declare function applyAgentDesignTokens(root?: HTMLElement | Document): void;
export declare function getStatusColor(status: string): string;
export declare function getTypeColor(type: string): string;
export declare function getPriorityColor(priority: string): string;
//# sourceMappingURL=design-system.d.ts.map