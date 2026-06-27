import { AgentStatus, SessionListResponse, AgentMonitoringSummary, SpawnAgentOptions, AgentOrchestratorConfig } from './types.js';
interface OpenCodeClient {
    session: {
        create: (options: {
            body: {
                title: string;
            };
        }) => Promise<{
            data?: {
                id: string;
                title: string;
            };
            error?: any;
        }>;
        list: () => Promise<{
            data?: Array<{
                id: string;
                title: string;
            }>;
            error?: any;
        }>;
        get: (options: {
            path: {
                id: string;
            };
        }) => Promise<{
            data?: any;
            error?: any;
        }>;
        delete: (options: {
            path: {
                id: string;
            };
        }) => Promise<void>;
        messages: (options: {
            path: {
                id: string;
            };
        }) => Promise<{
            data?: Array<any>;
            error?: any;
        }>;
        prompt: (options: {
            path: {
                id: string;
            };
            body: {
                parts: any[];
            };
        }) => Promise<void>;
    };
    event: {
        subscribe: () => Promise<{
            stream: AsyncIterable<any>;
        }>;
    };
}
export declare class AgentOrchestrator {
    private client;
    private sessionStore?;
    private agentTaskStore?;
    private agentTasks;
    private monitoringInterval?;
    private config;
    constructor(client: OpenCodeClient, config?: AgentOrchestratorConfig);
    initialize(): Promise<void>;
    spawnAgent(options: SpawnAgentOptions): Promise<string>;
    monitorAgents(): Promise<AgentMonitoringSummary>;
    getAgentStatus(sessionId: string): Promise<AgentStatus | string>;
    sendAgentMessage(sessionId: string, message: string, priority?: 'low' | 'medium' | 'high' | 'urgent', messageType?: 'instruction' | 'query' | 'update' | 'coordination' | 'status_request'): Promise<string>;
    listSessions(limit?: number, offset?: number): Promise<SessionListResponse>;
    cleanupCompletedAgents(olderThanMinutes?: number): Promise<string>;
    private updateAgentTaskStatus;
    private monitorAgentTasks;
    private startMonitoring;
    stopMonitoring(): void;
    destroy(): Promise<void>;
}
export {};
//# sourceMappingURL=agent-orchestrator.d.ts.map