/**
 * Centralized state management for the Agent Management UI
 */
import type { Agent, AgentTask, AgentEvent, DashboardFilters, UIState, SystemMetrics, AgentAction } from '../types.js';
export declare class StateManager {
    private agents$;
    private tasks$;
    private events$;
    private filters$;
    private uiState$;
    private systemMetrics$;
    readonly agents: import("rxjs").Observable<Agent[]>;
    readonly tasks: import("rxjs").Observable<AgentTask[]>;
    readonly events: import("rxjs").Observable<AgentEvent[]>;
    readonly filters: import("rxjs").Observable<DashboardFilters>;
    readonly uiState: import("rxjs").Observable<UIState>;
    readonly systemMetrics: import("rxjs").Observable<SystemMetrics>;
    readonly filteredAgents$: import("rxjs").Observable<Agent[]>;
    readonly activeTasks$: import("rxjs").Observable<AgentTask[]>;
    readonly recentEvents$: import("rxjs").Observable<AgentEvent[]>;
    readonly selectedAgent$: import("rxjs").Observable<Agent | undefined>;
    constructor();
    updateAgents(agents: Agent[]): void;
    addAgent(agent: Agent): void;
    updateAgent(agentId: string, updates: Partial<Agent>): void;
    removeAgent(agentId: string): void;
    updateTasks(tasks: AgentTask[]): void;
    addTask(task: AgentTask): void;
    updateTask(taskId: string, updates: Partial<AgentTask>): void;
    addEvent(event: AgentEvent): void;
    clearEvents(): void;
    updateFilters(filters: Partial<DashboardFilters>): void;
    clearFilters(): void;
    updateUIState(updates: Partial<UIState>): void;
    selectAgent(agentId?: string): void;
    selectTask(taskId?: string): void;
    toggleSidebar(): void;
    setView(view: 'grid' | 'list' | 'metrics'): void;
    dispatchAction(action: AgentAction): void;
    private filterAgents;
    private getSortValue;
    private updateSystemMetrics;
    private handleAction;
    private initializeAutoRefresh;
    private refreshInterval?;
    private startAutoRefresh;
    private stopAutoRefresh;
    private refreshData;
    destroy(): void;
}
export declare const stateManager: StateManager;
//# sourceMappingURL=state-manager.d.ts.map