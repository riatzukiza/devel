import type { JsonSchemaDefinition, Model, ModelProvider, ModelSettings, Tool } from "@openai/agents";
import { z } from "zod";
export declare const ModelReferenceSchema: z.ZodUnion<[z.ZodString, z.ZodObject<{
    provider: z.ZodString;
    name: z.ZodString;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    name: string;
    options?: Record<string, unknown> | undefined;
    settings?: Record<string, unknown> | undefined;
}, {
    provider: string;
    name: string;
    options?: Record<string, unknown> | undefined;
    settings?: Record<string, unknown> | undefined;
}>]>;
export type ModelReference = z.infer<typeof ModelReferenceSchema>;
export declare const ToolDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    strict: z.ZodOptional<z.ZodBoolean>;
    handler: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    parameters?: Record<string, unknown> | undefined;
    strict?: boolean | undefined;
    handler?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    name: string;
    description?: string | undefined;
    parameters?: Record<string, unknown> | undefined;
    strict?: boolean | undefined;
    handler?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const AgentDefinitionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    instructions: z.ZodOptional<z.ZodString>;
    handoffDescription: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        provider: z.ZodString;
        name: z.ZodString;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        name: string;
        options?: Record<string, unknown> | undefined;
        settings?: Record<string, unknown> | undefined;
    }, {
        provider: string;
        name: string;
        options?: Record<string, unknown> | undefined;
        settings?: Record<string, unknown> | undefined;
    }>]>>;
    modelSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    output: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"text">, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
    tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        strict: z.ZodOptional<z.ZodBoolean>;
        handler: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
        parameters?: Record<string, unknown> | undefined;
        strict?: boolean | undefined;
        handler?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        name: string;
        description?: string | undefined;
        parameters?: Record<string, unknown> | undefined;
        strict?: boolean | undefined;
        handler?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    instructions?: string | undefined;
    handoffDescription?: string | undefined;
    model?: string | {
        provider: string;
        name: string;
        options?: Record<string, unknown> | undefined;
        settings?: Record<string, unknown> | undefined;
    } | undefined;
    modelSettings?: Record<string, unknown> | undefined;
    output?: Record<string, unknown> | "text" | undefined;
    tools?: {
        name: string;
        description?: string | undefined;
        parameters?: Record<string, unknown> | undefined;
        strict?: boolean | undefined;
        handler?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    name?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    instructions?: string | undefined;
    handoffDescription?: string | undefined;
    model?: string | {
        provider: string;
        name: string;
        options?: Record<string, unknown> | undefined;
        settings?: Record<string, unknown> | undefined;
    } | undefined;
    modelSettings?: Record<string, unknown> | undefined;
    output?: Record<string, unknown> | "text" | undefined;
    tools?: {
        name: string;
        description?: string | undefined;
        parameters?: Record<string, unknown> | undefined;
        strict?: boolean | undefined;
        handler?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
}>;
export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ResolvedAgentDefinition = AgentDefinition & {
    name: string;
    instructions: string;
};
export type WorkflowNode = {
    id: string;
    label?: string;
    definition?: ResolvedAgentDefinition;
    source?: "inline" | "reference" | "config";
};
export type WorkflowEdge = {
    from: string;
    to: string;
    label?: string;
};
export type WorkflowDefinition = {
    id: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    metadata?: Record<string, unknown>;
};
export type MarkdownWorkflowDocument = {
    workflows: WorkflowDefinition[];
    jsonBlocks: Record<string, unknown>;
};
export type ResolvedAgentConfig = {
    name: string;
    instructions: string;
    handoffDescription: string;
    model: string | Model;
    modelSettings?: ModelSettings;
    tools: Tool[];
    outputType?: JsonSchemaDefinition | "text";
};
export type AgentGraphNode = {
    id: string;
    definition: ResolvedAgentDefinition;
    config: ResolvedAgentConfig;
};
export type AgentWorkflowGraph = {
    id: string;
    nodes: Map<string, AgentGraphNode>;
    edges: WorkflowEdge[];
    metadata?: Record<string, unknown>;
};
export type ModelResolverMap = {
    [provider: string]: ModelProvider | ((name: string, definition: AgentDefinition) => Promise<Model | string>);
};
export type AgentFactoryOptions = {
    defaultModel?: string;
    modelResolvers?: ModelResolverMap;
    toolRegistry?: Record<string, Tool>;
};
export type MarkdownWorkflowOptions = {
    baseDir?: string;
};
//# sourceMappingURL=types.d.ts.map