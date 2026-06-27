/**
 * Centralized state management for the Agent Management UI
 */
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
export class StateManager {
    agents$ = new BehaviorSubject([]);
    tasks$ = new BehaviorSubject([]);
    events$ = new BehaviorSubject([]);
    filters$ = new BehaviorSubject({
        status: [],
        type: [],
        search: '',
        sortBy: 'name',
        sortOrder: 'asc',
    });
    uiState$ = new BehaviorSubject({
        sidebarOpen: true,
        theme: 'auto',
        view: 'grid',
        autoRefresh: true,
        refreshInterval: 5000,
    });
    systemMetrics$ = new BehaviorSubject({
        totalAgents: 0,
        activeAgents: 0,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        systemLoad: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
    });
    // Public observables
    agents = this.agents$.asObservable();
    tasks = this.tasks$.asObservable();
    events = this.events$.asObservable();
    filters = this.filters$.asObservable();
    uiState = this.uiState$.asObservable();
    systemMetrics = this.systemMetrics$.asObservable();
    // Computed observables
    filteredAgents$ = combineLatest([
        this.agents$,
        this.filters$,
    ]).pipe(map(([agents, filters]) => this.filterAgents(agents, filters)), distinctUntilChanged());
    activeTasks$ = this.tasks$.pipe(map((tasks) => tasks.filter((task) => task.status === 'running' || task.status === 'pending')));
    recentEvents$ = this.events$.pipe(map((events) => events.slice(0, 50).reverse()));
    selectedAgent$ = combineLatest([this.agents$, this.uiState$]).pipe(map(([agents, uiState]) => agents.find((agent) => agent.id === uiState.selectedAgent)));
    constructor() {
        this.initializeAutoRefresh();
    }
    // Agent management
    updateAgents(agents) {
        this.agents$.next(agents);
        this.updateSystemMetrics(agents);
    }
    addAgent(agent) {
        const current = this.agents$.value;
        this.agents$.next([...current, agent]);
        this.updateSystemMetrics([...current, agent]);
    }
    updateAgent(agentId, updates) {
        const current = this.agents$.value;
        const index = current.findIndex((agent) => agent.id === agentId);
        if (index === -1)
            return;
        const existing = current[index];
        if (!existing)
            return;
        const { id: _ignoredId, metrics: metricsUpdates, config: configUpdates, workflow, capabilities, ...rest } = updates;
        const merged = {
            ...existing,
            ...rest,
            metrics: metricsUpdates ? { ...existing.metrics, ...metricsUpdates } : existing.metrics,
            config: configUpdates ? { ...existing.config, ...configUpdates } : existing.config,
            workflow: workflow ?? existing.workflow,
            capabilities: capabilities ?? existing.capabilities,
            updatedAt: new Date(),
        };
        const nextAgents = [...current];
        nextAgents[index] = merged;
        this.agents$.next(nextAgents);
        this.updateSystemMetrics(nextAgents);
    }
    removeAgent(agentId) {
        const current = this.agents$.value;
        const filtered = current.filter((agent) => agent.id !== agentId);
        this.agents$.next(filtered);
        this.updateSystemMetrics(filtered);
    }
    // Task management
    updateTasks(tasks) {
        this.tasks$.next(tasks);
    }
    addTask(task) {
        const current = this.tasks$.value;
        this.tasks$.next([...current, task]);
    }
    updateTask(taskId, updates) {
        const current = this.tasks$.value;
        const index = current.findIndex((task) => task.id === taskId);
        if (index === -1)
            return;
        const existing = current[index];
        if (!existing)
            return;
        const { id: _ignoredId, agentId: _ignoredAgentId, metadata, ...rest } = updates;
        const merged = {
            ...existing,
            ...rest,
            metadata: metadata ? { ...existing.metadata, ...metadata } : existing.metadata,
        };
        const nextTasks = [...current];
        nextTasks[index] = merged;
        this.tasks$.next(nextTasks);
    }
    // Event management
    addEvent(event) {
        const current = this.events$.value;
        this.events$.next([event, ...current].slice(0, 1000)); // Keep last 1000 events
    }
    clearEvents() {
        this.events$.next([]);
    }
    // Filter management
    updateFilters(filters) {
        const current = this.filters$.value;
        this.filters$.next({ ...current, ...filters });
    }
    clearFilters() {
        this.filters$.next({
            status: [],
            type: [],
            search: '',
            sortBy: 'name',
            sortOrder: 'asc',
        });
    }
    // UI state management
    updateUIState(updates) {
        const current = this.uiState$.value;
        this.uiState$.next({ ...current, ...updates });
    }
    selectAgent(agentId) {
        this.updateUIState({ selectedAgent: agentId });
    }
    selectTask(taskId) {
        this.updateUIState({ selectedTask: taskId });
    }
    toggleSidebar() {
        const current = this.uiState$.value;
        this.updateUIState({ sidebarOpen: !current.sidebarOpen });
    }
    setView(view) {
        this.updateUIState({ view });
    }
    // Action dispatch
    dispatchAction(action) {
        this.handleAction(action);
    }
    // Private methods
    filterAgents(agents, filters) {
        let filtered = agents;
        // Status filter
        if (filters.status.length > 0) {
            filtered = filtered.filter((agent) => filters.status.includes(agent.status));
        }
        // Type filter
        if (filters.type.length > 0) {
            filtered = filtered.filter((agent) => filters.type.includes(agent.type));
        }
        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter((agent) => agent.name.toLowerCase().includes(search) ||
                agent.capabilities.some((cap) => cap.toLowerCase().includes(search)));
        }
        // Sort
        filtered.sort((a, b) => {
            const aValue = this.getSortValue(a, filters.sortBy);
            const bValue = this.getSortValue(b, filters.sortBy);
            if (aValue < bValue)
                return filters.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue)
                return filters.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }
    getSortValue(agent, field) {
        switch (field) {
            case 'name':
                return agent.name;
            case 'status':
                return agent.status;
            case 'type':
                return agent.type;
            case 'lastActive':
                return agent.lastActive?.getTime() || 0;
            case 'tasksCompleted':
                return agent.metrics.tasksCompleted;
            case 'errorRate':
                return agent.metrics.errorRate;
            default:
                return agent.name;
        }
    }
    updateSystemMetrics(agents) {
        const tasks = this.tasks$.value;
        const activeAgents = agents.filter((agent) => agent.status === 'active' || agent.status === 'busy').length;
        const completedTasks = tasks.filter((task) => task.status === 'completed').length;
        const failedTasks = tasks.filter((task) => task.status === 'failed').length;
        this.systemMetrics$.next({
            totalAgents: agents.length,
            activeAgents,
            totalTasks: tasks.length,
            completedTasks,
            failedTasks,
            systemLoad: 0, // Would be populated by monitoring system
            memoryUsage: 0, // Would be populated by monitoring system
            cpuUsage: 0, // Would be populated by monitoring system
            uptime: 0, // Would be populated by monitoring system
        });
    }
    handleAction(action) {
        switch (action.type) {
            case 'start':
                this.updateAgent(action.agentId, { status: 'starting' });
                break;
            case 'stop':
                this.updateAgent(action.agentId, { status: 'stopping' });
                break;
            case 'restart':
                this.updateAgent(action.agentId, { status: 'starting' });
                break;
            case 'configure':
                // Handle configuration update
                break;
            case 'assign_task':
                // Handle task assignment
                break;
            case 'cancel_task':
                // Handle task cancellation
                break;
            case 'update_config':
                // Handle config update
                break;
            case 'clear_logs':
                // Handle log clearing
                break;
        }
    }
    initializeAutoRefresh() {
        this.uiState$
            .pipe(map((state) => state.autoRefresh), distinctUntilChanged())
            .subscribe((autoRefresh) => {
            if (autoRefresh) {
                this.startAutoRefresh();
            }
            else {
                this.stopAutoRefresh();
            }
        });
    }
    refreshInterval;
    startAutoRefresh() {
        const interval = this.uiState$.value.refreshInterval;
        this.refreshInterval = setInterval(() => {
            // Trigger data refresh
            this.refreshData();
        }, interval);
    }
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
    }
    async refreshData() {
        // This would be implemented to fetch fresh data from the backend
        // For now, it's a placeholder
        console.log('Refreshing data...');
    }
    // Cleanup
    destroy() {
        this.stopAutoRefresh();
        this.agents$.complete();
        this.tasks$.complete();
        this.events$.complete();
        this.filters$.complete();
        this.uiState$.complete();
        this.systemMetrics$.complete();
    }
}
// Global state instance
export const stateManager = new StateManager();
//# sourceMappingURL=state-manager.js.map