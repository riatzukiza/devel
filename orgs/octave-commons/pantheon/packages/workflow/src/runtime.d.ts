import type { AgentWorkflowGraph, AgentFactoryOptions, MarkdownWorkflowDocument, MarkdownWorkflowOptions } from "./workflow/types.js";
import { type DefinitionResolutionOptions } from "./workflow/loader.js";
export type WorkflowRuntimeOptions = MarkdownWorkflowOptions & DefinitionResolutionOptions & AgentFactoryOptions;
export declare function loadAgentWorkflowsFromMarkdown(content: string, options?: WorkflowRuntimeOptions): Promise<{
    document: MarkdownWorkflowDocument;
    graphs: AgentWorkflowGraph[];
}>;
//# sourceMappingURL=runtime.d.ts.map