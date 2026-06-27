import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { parseMermaidGraph } from './mermaid.js';
const headingText = (node) => (node.children ?? [])
    .map((child) => (typeof child.value === 'string' ? child.value : ''))
    .join('')
    .trim();
function isMermaidLang(lang) {
    return lang === 'mermaid';
}
function isJsonLang(lang) {
    return ['json', 'jsonc', 'application/json'].includes(lang ?? '');
}
function processMermaidNode(code, currentHeading, index) {
    const id = (code.meta?.trim() || currentHeading || `workflow-${index}`).toString();
    const graph = parseMermaidGraph(code.value ?? '', id);
    graph.metadata = currentHeading ? { heading: currentHeading } : undefined;
    return graph;
}
function parseJson(value, label) {
    const text = value.trim();
    if (!text) {
        return {};
    }
    try {
        return JSON.parse(text);
    }
    catch (error) {
        throw new Error(`Failed to parse JSON block "${label}": ${error.message}`);
    }
}
export function parseMarkdownWorkflows(content, _options = {}) {
    const parsed = unified().use(remarkParse).parse(content);
    const tree = parsed;
    const workflows = [];
    const jsonBlocks = {};
    let currentHeading;
    let workflowIndex = 0;
    let jsonIndex = 0;
    for (const node of tree.children ?? []) {
        if (node.type === 'heading') {
            currentHeading = headingText(node);
            continue;
        }
        if (node.type !== 'code') {
            continue;
        }
        const code = node;
        const lang = typeof code.lang === 'string' ? code.lang.toLowerCase() : undefined;
        if (isMermaidLang(lang)) {
            workflowIndex += 1;
            workflows.push(processMermaidNode(code, currentHeading, workflowIndex));
        }
        else if (isJsonLang(lang)) {
            jsonIndex += 1;
            const key = code.meta?.trim() || `config-${jsonIndex}`;
            jsonBlocks[key] = parseJson(code.value ?? '', key);
        }
    }
    return { workflows, jsonBlocks };
}
//# sourceMappingURL=markdown.js.map