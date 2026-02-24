export type OpencodeClient = {
  listSessions(): Promise<unknown>;
  getSession(sessionId: string): Promise<unknown>;
  listSessionStatus(): Promise<unknown>;
  listMessages(sessionId: string): Promise<unknown>;
  getMessage(sessionId: string, messageId: string): Promise<unknown>;
  sendMessage(sessionId: string, payload: Record<string, unknown>): Promise<unknown>;
  promptAsync(sessionId: string, payload: Record<string, unknown>): Promise<unknown>;
  lspStatus(): Promise<unknown>;
  lspDiagnostics(): Promise<unknown>;
};

export type OllamaMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "assistant";
      content?: string;
      tool_calls?: Array<{
        type: "function";
        function: { index: number; name: string; arguments: Record<string, unknown> };
      }>;
    }
  | { role: "tool"; tool_name: string; content: string };

export function createOpencodeClient(opts?: {
  baseUrl?: string;
  apiKey?: string;
  fetch?: typeof fetch;
}): OpencodeClient;

export function opencodeMessageToOllamaParts(entry: Record<string, unknown>): OllamaMessage[];

export function flattenForEmbedding(messages: OllamaMessage[]): string;

export function extractPathsLoose(text: string): string[];
