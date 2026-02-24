import { randomUUID } from "node:crypto";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

type TransportRequest = Parameters<StreamableHTTPServerTransport["handleRequest"]>[0];
type TransportResponse = Parameters<StreamableHTTPServerTransport["handleRequest"]>[1];

type HeaderValue = string | readonly string[] | undefined;

export type McpHttpRequest = TransportRequest & {
  headers: Record<string, HeaderValue>;
  query: Record<string, unknown>;
  body?: unknown;
};

export type McpHttpResponse = TransportResponse & {
  status: (code: number) => McpHttpResponse;
  json: (payload: unknown) => void;
  send: (payload: string) => void;
};

type SessionLifecycleHooks = Readonly<{
  onSessionInitialized?: (sessionId: string, transport: StreamableHTTPServerTransport) => Promise<void> | void;
  onSessionClosed?: (sessionId: string) => Promise<void> | void;
}>;

export type UnknownSessionHandler = (
  sessionId: string,
  req: McpHttpRequest,
  res: McpHttpResponse,
) => Promise<boolean>;

export type McpHttpRouterOptions = Readonly<{
  createServer: () => McpServer;
  sessionIdGenerator?: () => string;
  requireInitializeForNewSession?: boolean;
  onUnknownSession?: UnknownSessionHandler;
}> & SessionLifecycleHooks;

export type McpHttpRouter = Readonly<{
  transports: Map<string, StreamableHTTPServerTransport>;
  handlePost: (req: McpHttpRequest, res: McpHttpResponse) => Promise<void>;
  handleSession: (req: McpHttpRequest, res: McpHttpResponse) => Promise<void>;
}>;

function resolveSessionId(req: McpHttpRequest): string | undefined {
  const headerSessionId = req.headers["mcp-session-id"];
  if (typeof headerSessionId === "string" && headerSessionId.length > 0) {
    return headerSessionId;
  }

  const querySessionId = req.query.sessionId;
  if (typeof querySessionId === "string" && querySessionId.length > 0) {
    return querySessionId;
  }

  return undefined;
}

export function createMcpHttpRouter(options: McpHttpRouterOptions): McpHttpRouter {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const requireInitializeForNewSession = options.requireInitializeForNewSession ?? true;
  const sessionIdGenerator = options.sessionIdGenerator ?? randomUUID;

  const createTransport = (): StreamableHTTPServerTransport => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator,
      onsessioninitialized: async (sessionId) => {
        transports.set(sessionId, transport);
        if (options.onSessionInitialized) {
          await options.onSessionInitialized(sessionId, transport);
        }
      },
    });

    transport.onclose = () => {
      if (!transport.sessionId) {
        return;
      }

      transports.delete(transport.sessionId);

      if (options.onSessionClosed) {
        void options.onSessionClosed(transport.sessionId);
      }
    };

    return transport;
  };

  const handlePost = async (req: McpHttpRequest, res: McpHttpResponse): Promise<void> => {
    const sessionId = resolveSessionId(req);
    const existingTransport = sessionId ? transports.get(sessionId) : undefined;

    if (existingTransport) {
      await existingTransport.handleRequest(req, res, req.body);
      return;
    }

    if (requireInitializeForNewSession && !isInitializeRequest(req.body)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: Server not initialized" },
        id: null,
      });
      return;
    }

    const transport = createTransport();
    const server = options.createServer();

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };

  const handleSession = async (req: McpHttpRequest, res: McpHttpResponse): Promise<void> => {
    const sessionId = resolveSessionId(req);
    if (!sessionId) {
      res.status(400).send("Missing mcp-session-id");
      return;
    }

    const existingTransport = transports.get(sessionId);
    if (existingTransport) {
      await existingTransport.handleRequest(req, res);
      return;
    }

    if (options.onUnknownSession) {
      const handled = await options.onUnknownSession(sessionId, req, res);
      if (handled) {
        return;
      }
    }

    res.status(400).send(`Invalid mcp-session-id: ${sessionId}`);
  };

  return {
    transports,
    handlePost,
    handleSession,
  };
}
