import Fastify from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import type { ChromaMemoryStore } from "../chroma/client.js";
import type { InMemoryMemoryStore } from "../core/memory-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Point to src/ui/public for static files
const PUBLIC_DIR = join(dirname(__dirname), "ui", "public");

interface SearchQuery {
  query: string;
  limit?: string;
}

interface ListQuery {
  sessionId?: string;
  kind?: string;
  limit?: string;
  offset?: string;
}

interface PinBody {
  priority?: number;
}

export interface MemoryUIConfig {
  port: number;
  chromaStore: ChromaMemoryStore;
  memoryStore: InMemoryMemoryStore;
}

export class MemoryUIServer {
  private fastify: ReturnType<typeof Fastify>;
  private chromaStore: ChromaMemoryStore;
  private memoryStore: InMemoryMemoryStore;
  private port: number;

  constructor(config: MemoryUIConfig) {
    this.port = config.port;
    this.chromaStore = config.chromaStore;
    this.memoryStore = config.memoryStore;
    this.fastify = Fastify({ logger: false });
  }

  async start(): Promise<void> {
    await this.fastify.register(fastifyCors, {
      origin: true,
    });

    await this.fastify.register(fastifyStatic, {
      root: PUBLIC_DIR,
      prefix: "/",
      decorateReply: false,
    });

    this.fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.url.startsWith("/api/")) {
        return reply.status(404).send({ error: "API endpoint not found" });
      }
      const indexPath = join(PUBLIC_DIR, "index.html");
      const content = readFileSync(indexPath, "utf-8");
      return reply.type("text/html").send(content);
    });

    this.registerRoutes();

    await this.fastify.listen({ port: this.port, host: "0.0.0.0" });
    console.log(`[MemoryUI] Server running at http://localhost:${this.port}`);
  }

  async stop(): Promise<void> {
    await this.fastify.close();
  }

  private registerRoutes(): void {
    this.fastify.get("/api/memories/count", async () => {
      const count = await this.chromaStore.getMemoryCount();
      return { count };
    });

    this.fastify.get("/api/memories/search", async (request: FastifyRequest<{ Querystring: SearchQuery }>) => {
      const { query, limit = "10" } = request.query;

      if (!query) {
        return { error: "Query parameter required" };
      }

      const results = await this.chromaStore.search(query, {
        limit: parseInt(limit, 10),
      });

      return { results };
    });

    this.fastify.get("/api/memories/pinned", async () => {
      const allMemories = this.memoryStore.getAllMemories();
      const pinned = allMemories.filter((m) => m.retrieval.pinned);
      return { pinned };
    });

    this.fastify.get("/api/memories/context", async () => {
      const allMemories = this.memoryStore.getAllMemories();
      const recent = allMemories
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);

      const pinned = allMemories.filter((m) => m.retrieval.pinned);

      const bySession = allMemories.reduce(
        (acc, m) => {
          if (!acc[m.sessionId]) acc[m.sessionId] = [];
          acc[m.sessionId].push(m);
          return acc;
        },
        {} as Record<string, typeof allMemories>,
      );

      return {
        recent,
        pinned,
        sessionCount: Object.keys(bySession).length,
        totalCount: allMemories.length,
      };
    });

    this.fastify.get("/api/memories/list", async (request: FastifyRequest<{ Querystring: ListQuery }>) => {
      const { sessionId, kind, limit = "50", offset = "0" } = request.query;

      let memories = this.memoryStore.getAllMemories();

      if (sessionId) {
        memories = memories.filter((m) => m.sessionId === sessionId);
      }

      if (kind) {
        memories = memories.filter((m) => m.kind === kind);
      }

      memories = memories.sort((a, b) => b.timestamp - a.timestamp);

      const total = memories.length;
      const start = parseInt(offset, 10);
      const end = start + parseInt(limit, 10);
      memories = memories.slice(start, end);

      return { memories, total, offset: start, limit: parseInt(limit, 10) };
    });

    this.fastify.get("/api/memories/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const memory = this.memoryStore.getMemoryById(id);

      if (!memory) {
        return reply.status(404).send({ error: "Memory not found" });
      }

      return { memory };
    });

    this.fastify.post("/api/memories/:id/pin", async (request: FastifyRequest<{ Params: { id: string }; Body: PinBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { priority = 10 } = request.body;

      try {
        await this.memoryStore.pinMemory(id, priority);
        return { success: true };
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : "Failed to pin memory",
        });
      }
    });

    this.fastify.post("/api/memories/:id/unpin", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        await this.memoryStore.unpinMemory(id);
        return { success: true };
      } catch (error) {
        return reply.status(500).send({
          error:
            error instanceof Error ? error.message : "Failed to unpin memory",
        });
      }
    });
  }
}
