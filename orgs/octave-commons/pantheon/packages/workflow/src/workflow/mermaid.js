const NODE_REGEX = /^(?<id>[A-Za-z0-9_]+)\s*(?:\((?<round>[^)]*)\)|\[(?<square>[^\]]*)\]|\{(?<curly>[^}]*)\}|"(?<quoted>[^"]*)"|\s+"(?<standalone>[^"]*)")?/;
const EDGE_REGEX = /^(?<from>[A-Za-z0-9_]+)\s*--[->]+\s*(?:\|(?<label>[^|]+)\|\s*)?(?<to>[A-Za-z0-9_]+)/;
const COMMENT_PREFIX = "%%";
const DIRECTIVE_REGEX = /^(?:graph|flowchart|classDef|linkStyle|style)\b/i;
function decodeLabel(raw) {
    if (!raw)
        return undefined;
    const text = raw.replace(/&quot;/gu, '"').replace(/\\n/gu, "\n").replace(/"/g, '"');
    const trimmed = text.trim();
    return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed;
}
function parseNode(line) {
    if (!line || line.startsWith(COMMENT_PREFIX) || DIRECTIVE_REGEX.test(line))
        return undefined;
    const match = line.match(NODE_REGEX);
    if (!match?.groups?.id)
        return undefined;
    const { id, round, square, curly, quoted, standalone } = match.groups;
    const rawLabel = round ?? square ?? curly ?? quoted ?? standalone;
    const label = decodeLabel(rawLabel);
    return { id, label };
}
function parseEdge(line) {
    if (!line || line.startsWith(COMMENT_PREFIX) || DIRECTIVE_REGEX.test(line))
        return undefined;
    const match = line.match(EDGE_REGEX);
    if (!match?.groups?.from || !match.groups.to)
        return undefined;
    const { from, to, label } = match.groups;
    return { from, to, label: label?.trim() };
}
// Helpers for processing lines
function addNode(nodes, node) {
    if (!nodes.has(node.id) || (node.label && !nodes.get(node.id)?.label)) {
        nodes.set(node.id, node);
    }
}
function addEdge(nodes, edges, edge) {
    edges.push(edge);
    if (!nodes.has(edge.from))
        nodes.set(edge.from, { id: edge.from });
    if (!nodes.has(edge.to))
        nodes.set(edge.to, { id: edge.to });
}
function processLine(rawLine, nodes, edges) {
    const line = rawLine.trim();
    if (!line)
        return;
    const node = parseNode(line);
    if (node)
        addNode(nodes, node);
    const edge = parseEdge(line);
    if (edge)
        addEdge(nodes, edges, edge);
}
export function parseMermaidGraph(source, id = "workflow") {
    const nodes = new Map();
    const edges = [];
    source.split("\n").forEach((rawLine) => processLine(rawLine, nodes, edges));
    return { id, nodes: Array.from(nodes.values()), edges };
}
//# sourceMappingURL=mermaid.js.map