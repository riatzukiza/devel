export interface PermissionRequest {
  /** Unique identifier */
  id: string;
  /** Display title */
  title?: string;
  /** Session identifier */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Default response */
  defaultResponse?: 'once' | 'always' | 'reject';
}

export interface InputPrompt {
  /** Unique identifier */
  id: string;
  /** Display title */
  title?: string;
  /** Prompt body (string or object with prompt key) */
  body?: string | { prompt: string };
  /** Input placeholder */
  placeholder?: string;
  /** Multiline input */
  multiline?: boolean;
  /** Session identifier */
  sessionId?: string;
}

export type PermissionResponse = 'once' | 'always' | 'reject';

export function getPromptText(body?: string | { prompt: string }): string {
  if (!body) return 'Enter input';
  if (typeof body === 'string') return body;
  return body.prompt || 'Enter input';
}
