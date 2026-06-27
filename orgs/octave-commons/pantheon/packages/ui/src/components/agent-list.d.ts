/**
 * Agent List Component - Displays agents in a list format
 */
import { LitElement } from 'lit';
import type { Agent } from '../types.js';
export declare class AgentList extends LitElement {
    static styles: any;
    agents: Agent[];
    selectedAgentId?: string;
    compact: boolean;
    private handleItemClick;
    private handleActionClick;
    private formatLastActive;
    render(): any;
}
declare global {
    interface HTMLElementTagNameMap {
        'agent-list': AgentList;
    }
}
//# sourceMappingURL=agent-list.d.ts.map