/**
 * Core types for the Pantheon Agent Management Framework
 */
// === Type Guards ===
/**
 * Type guard to check if a value is a valid Message
 * @param value - The value to check
 * @returns True if the value is a Message
 */
export const isMessage = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'role' in value &&
        'content' in value &&
        ['system', 'user', 'assistant'].includes(value.role));
};
/**
 * Type guard to check if a value is a valid ToolSpec
 * @param value - The value to check
 * @returns True if the value is a ToolSpec
 */
export const isToolSpec = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        'description' in value &&
        'runtime' in value &&
        ['mcp', 'local', 'http'].includes(value.runtime));
};
/**
 * Type guard to check if a value is a valid MessageEnvelope
 * @param value - The value to check
 * @returns True if the value is a MessageEnvelope
 */
export const isMessageEnvelope = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'type' in value &&
        'sender' in value &&
        'recipient' in value &&
        'timestamp' in value &&
        'payload' in value);
};
//# sourceMappingURL=types.js.map