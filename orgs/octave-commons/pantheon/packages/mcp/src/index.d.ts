/**
 * MCP (Model Context Protocol) Tool Adapter for Pantheon
 *
 * This adapter provides MCP tool interfaces that can be used by LLMs
 * to interact with the Pantheon Agent Management Framework.
 */
import type { ToolPort } from '@promethean-os/pantheon-core';
export interface MCPToolPort extends ToolPort {
    list(): Promise<string[]>;
    getSchema(toolName: string): Promise<any>;
    execute(command: string, args?: Record<string, unknown>): Promise<unknown>;
}
export type MCPTool = {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    handler: (args: any) => Promise<any>;
};
export type MCPToolResult = {
    success: boolean;
    result?: any;
    error?: string;
};
export declare function makeMCPToolAdapter(): MCPToolPort;
export declare const createActorTool: MCPTool;
export declare const tickActorTool: MCPTool;
export declare const compileContextTool: MCPTool;
export declare function makeMCPAdapterWithDefaults(): MCPToolPort;
//# sourceMappingURL=index.d.ts.map