/**
 * Agent Card Component - Displays agent information in a card format
 */
import { LitElement } from 'lit';
import type { Agent } from '../types.js';
export declare class AgentCard extends LitElement {
    static styles: any;
    agent: Agent;
    selected: boolean;
    compact: boolean;
    private handleCardClick;
    private handleActionClick;
    private formatLastActive;
    private getTaskProgress;
    render(): any;
}
declare global {
    interface HTMLElementTagNameMap {
        'agent-card': AgentCard;
    }
}
//# sourceMappingURL=agent-card.d.ts.map