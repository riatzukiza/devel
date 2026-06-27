export type OpenPlannerSourceRef = {
  project?: string;
  session?: string;
  message?: string;
  turn?: string;
};

export type OpenPlannerEvent = {
  schema: "openplanner.event.v1";
  id: string;
  ts: string;
  source: string;
  kind: string;
  source_ref?: OpenPlannerSourceRef;
  text?: string;
  attachments?: Array<{ blob: string; mime: string; name?: string; size?: number }>;
  meta?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

export type OpenPlannerClient = {
  health(): Promise<unknown>;
  listSessions(): Promise<unknown>;
  getSession(sessionId: string): Promise<unknown>;
  indexEvents(events: OpenPlannerEvent[]): Promise<unknown>;
  searchFts(payload: Record<string, unknown>): Promise<unknown>;
  searchVector(payload: Record<string, unknown>): Promise<unknown>;
  listJobs(): Promise<unknown>;
  getJob(jobId: string): Promise<unknown>;
  createChatgptImportJob(payload: Record<string, unknown>): Promise<unknown>;
  createOpencodeImportJob(payload: Record<string, unknown>): Promise<unknown>;
  createCompilePackJob(payload: Record<string, unknown>): Promise<unknown>;
  getBlob(sha256: string): Promise<ArrayBuffer>;
  uploadBlob(file: Blob, mime?: string, name?: string): Promise<unknown>;
};

export function defaultOpenPlannerConfig(opts?: {
  endpoint?: string;
  apiKey?: string;
  fetch?: typeof fetch;
}): { endpoint: string; apiKey?: string; fetch: typeof fetch };

export function createOpenPlannerClient(opts?: {
  endpoint?: string;
  apiKey?: string;
  fetch?: typeof fetch;
}): OpenPlannerClient;

export function createOpenPlannerEvent(input: {
  sessionId?: string;
  session_id?: string;
  "session-id"?: string;
  messageId?: string;
  message_id?: string;
  "message-id"?: string;
  messageIndex?: number;
  message_index?: number;
  "message-index"?: number;
  text?: string;
  createdAt?: number;
  created_at?: number;
  "created-at"?: number;
  role?: string;
  sessionTitle?: string;
  session_title?: string;
  "session-title"?: string;
  paths?: string[];
}): Promise<OpenPlannerEvent>;

export function createOpenPlannerChunkEvent(input: {
  sessionId?: string;
  session_id?: string;
  "session-id"?: string;
  sessionTitle?: string;
  session_title?: string;
  "session-title"?: string;
  chunkIndex?: number;
  chunk_index?: number;
  "chunk-index"?: number;
  messageIdStart?: string;
  message_id_start?: string;
  "message-id-start"?: string;
  messageIdEnd?: string;
  message_id_end?: string;
  "message-id-end"?: string;
  messageIndexStart?: number;
  message_index_start?: number;
  "message-index-start"?: number;
  messageIndexEnd?: number;
  message_index_end?: number;
  "message-index-end"?: number;
  approxTokens?: number;
  approx_tokens?: number;
  "approx-tokens"?: number;
  text?: string;
  createdAt?: number;
  created_at?: number;
  "created-at"?: number;
  paths?: string[];
}): Promise<OpenPlannerEvent>;
