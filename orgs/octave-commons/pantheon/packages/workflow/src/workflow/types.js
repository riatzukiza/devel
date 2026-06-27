import { z } from "zod";
export const ModelReferenceSchema = z.union([
    z.string().min(1, "model name cannot be empty"),
    z.object({
        provider: z.string().min(1, "model provider cannot be empty"),
        name: z.string().min(1, "model name cannot be empty"),
        options: z.record(z.unknown()).optional(),
        settings: z.record(z.unknown()).optional(),
    }),
]);
export const ToolDefinitionSchema = z.object({
    name: z.string().min(1, "tool name cannot be empty"),
    description: z.string().optional(),
    parameters: z.record(z.unknown()).optional(),
    strict: z.boolean().optional(),
    handler: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const AgentDefinitionSchema = z.object({
    name: z.string().optional(),
    instructions: z.string().optional(),
    handoffDescription: z.string().optional(),
    model: ModelReferenceSchema.optional(),
    modelSettings: z.record(z.unknown()).optional(),
    output: z.union([z.literal("text"), z.record(z.unknown())]).optional(),
    tools: z.array(ToolDefinitionSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=types.js.map