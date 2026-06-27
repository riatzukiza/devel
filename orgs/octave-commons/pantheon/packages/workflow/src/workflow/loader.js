import { readFile } from "node:fs/promises";
import path from "node:path";
import { AgentDefinitionSchema } from "./types.js";
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function mergeDefinitions(base, update) {
    if (!update)
        return base;
    const merged = { ...base, ...update };
    const mergeObjects = (a, b) => {
        if (!isRecord(a) && !isRecord(b))
            return undefined;
        return { ...(isRecord(a) ? a : {}), ...(isRecord(b) ? b : {}) };
    };
    const ms = mergeObjects(base.modelSettings, update.modelSettings);
    if (ms)
        merged.modelSettings = ms;
    const md = mergeObjects(base.metadata, update.metadata);
    if (md)
        merged.metadata = md;
    if (update.tools)
        merged.tools = update.tools;
    return merged;
}
async function loadReferencedDefinition(reference, baseDir) {
    const relative = reference.replace(/^(?:ref|file):/iu, "").trim();
    if (!relative) {
        throw new Error("Reference path cannot be empty.");
    }
    const resolved = path.isAbsolute(relative)
        ? relative
        : path.join(baseDir, relative);
    const content = await readFile(resolved, "utf8");
    if (/\.jsonc?$/iu.test(relative)) {
        return JSON.parse(content);
    }
    return { instructions: content.trim() };
}
function parseInlineDefinition(label) {
    if (!label) {
        return {};
    }
    const trimmed = label.trim();
    if (!trimmed) {
        return {};
    }
    const referenceMatch = trimmed.match(/^(ref|file):(.+)$/iu);
    if (referenceMatch) {
        return { reference: referenceMatch[0] };
    }
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);
            return { definition: parsed };
        }
        catch (error) {
            throw new Error(`Failed to parse inline JSON for node: ${error.message}`);
        }
    }
    return { fallbackInstructions: trimmed };
}
function gatherConfigDefinition(nodeId, jsonBlocks) {
    let definition;
    for (const block of Object.values(jsonBlocks)) {
        if (!isRecord(block)) {
            continue;
        }
        if (isRecord(block.agents) && isRecord(block.agents[nodeId])) {
            definition = mergeDefinitions(definition ?? {}, block.agents[nodeId]);
        }
        if (isRecord(block[nodeId])) {
            definition = mergeDefinitions(definition ?? {}, block[nodeId]);
        }
    }
    return definition;
}
async function resolveNodeDefinition(node, jsonBlocks, options) {
    const baseDir = options.baseDir ?? process.cwd();
    const inline = parseInlineDefinition(node.label);
    let definition = inline.definition ?? {};
    let source;
    if (inline.reference) {
        const referenced = await loadReferencedDefinition(inline.reference, baseDir);
        definition = mergeDefinitions(definition, referenced);
        source = "reference";
    }
    const fromConfig = gatherConfigDefinition(node.id, jsonBlocks);
    if (fromConfig) {
        definition = mergeDefinitions(definition, fromConfig);
        if (!source) {
            source = "config";
        }
    }
    if (inline.fallbackInstructions && !definition.instructions) {
        definition.instructions = inline.fallbackInstructions;
        if (!source) {
            source = "inline";
        }
    }
    const validated = AgentDefinitionSchema.parse(definition);
    const instructions = validated.instructions ?? inline.fallbackInstructions;
    if (!instructions) {
        throw new Error(`Agent node "${node.id}" is missing instructions.`);
    }
    return {
        definition: {
            ...validated,
            instructions,
            name: validated.name ?? node.id,
        },
        source: source ?? (inline.definition ? "inline" : undefined),
    };
}
export async function resolveWorkflowDefinitions(document, options = {}) {
    const resolved = [];
    for (const workflow of document.workflows) {
        const nodes = [];
        for (const node of workflow.nodes) {
            const { definition, source } = await resolveNodeDefinition(node, document.jsonBlocks, options);
            nodes.push({ ...node, definition, source });
        }
        resolved.push({ ...workflow, nodes });
    }
    return resolved;
}
async function resolveModel(nodeId, definition, options) {
    const reference = definition.model;
    if (!reference) {
        return options.defaultModel ?? "gpt-4.1-mini";
    }
    if (typeof reference === "string") {
        return reference;
    }
    const providerKey = reference.provider;
    const resolvers = options.modelResolvers ?? {};
    const resolver = resolvers[providerKey];
    if (!resolver) {
        if (providerKey === "openai") {
            return reference.name;
        }
        throw new Error(`No model resolver registered for provider "${providerKey}" (agent "${nodeId}").`);
    }
    if (typeof resolver.getModel === "function") {
        return await resolver.getModel(reference.name);
    }
    return await resolver(reference.name, definition);
}
function resolveTools(definition, options) {
    if (!definition.tools || definition.tools.length === 0) {
        return [];
    }
    const registry = options.toolRegistry ?? {};
    const tools = [];
    for (const toolDef of definition.tools) {
        if (!toolDef.handler) {
            continue;
        }
        const tool = registry[toolDef.handler];
        if (!tool) {
            throw new Error(`No tool registered for handler "${toolDef.handler}".`);
        }
        tools.push(tool);
    }
    return tools;
}
function mergeModelSettings(definition) {
    const explicit = definition.modelSettings;
    if (!definition.model || typeof definition.model === "string") {
        return explicit;
    }
    const providerSettings = isRecord(definition.model.settings)
        ? (definition.model.settings)
        : undefined;
    if (!providerSettings && !explicit) {
        return undefined;
    }
    return {
        ...(providerSettings ?? {}),
        ...(explicit ?? {}),
    };
}
function resolveOutput(definition) {
    if (!definition.output) {
        return undefined;
    }
    if (definition.output === "text") {
        return "text";
    }
    return definition.output;
}
export async function createAgentWorkflowGraph(workflow, options = {}) {
    const nodes = new Map();
    for (const node of workflow.nodes) {
        if (!node.definition) {
            throw new Error(`Workflow node "${node.id}" is missing a resolved agent definition.`);
        }
        const definition = node.definition;
        const model = await resolveModel(node.id, definition, options);
        const modelSettings = mergeModelSettings(definition);
        const outputType = resolveOutput(definition);
        const config = {
            name: definition.name ?? node.id,
            instructions: definition.instructions,
            handoffDescription: definition.handoffDescription ?? definition.instructions,
            model,
            ...(modelSettings ? { modelSettings } : {}),
            tools: resolveTools(definition, options),
            ...(outputType ? { outputType } : {}),
        };
        nodes.set(node.id, {
            id: node.id,
            definition: {
                ...definition,
                name: definition.name ?? node.id,
                instructions: definition.instructions,
            },
            config,
        });
    }
    return {
        id: workflow.id,
        nodes,
        edges: workflow.edges,
        metadata: workflow.metadata,
    };
}
//# sourceMappingURL=loader.js.map