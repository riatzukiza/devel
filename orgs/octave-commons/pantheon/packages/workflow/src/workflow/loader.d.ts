import type { AgentWorkflowGraph, AgentFactoryOptions, MarkdownWorkflowDocument, WorkflowDefinition } from "./types.js";
export type DefinitionResolutionOptions = {
    baseDir?: string;
};
export declare function resolveWorkflowDefinitions(document: MarkdownWorkflowDocument, options?: DefinitionResolutionOptions): Promise<WorkflowDefinition[]>;
export declare function createAgentWorkflowGraph(workflow: WorkflowDefinition, options?: AgentFactoryOptions): Promise<AgentWorkflowGraph>;
//# sourceMappingURL=loader.d.ts.map