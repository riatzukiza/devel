import { parseMarkdownWorkflows } from "./workflow/markdown.js";
import { createAgentWorkflowGraph, resolveWorkflowDefinitions, } from "./workflow/loader.js";
export async function loadAgentWorkflowsFromMarkdown(content, options = {}) {
    const document = parseMarkdownWorkflows(content, options);
    const workflows = await resolveWorkflowDefinitions(document, options);
    const graphs = [];
    for (const workflow of workflows) {
        const graph = await createAgentWorkflowGraph(workflow, options);
        graphs.push(graph);
    }
    return { document, graphs };
}
//# sourceMappingURL=runtime.js.map