import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

import { openLmdbCache } from '@promethean-os/lmdb-cache';

const DEFAULT_PORT = parseInt(process.env.PANTHEON_REGISTRY_PORT ?? '4097', 10);
const DB_PATH =
  process.env.PANTHEON_REGISTRY_PATH || path.join(os.homedir(), '.cache', 'pantheon', 'workspaces');

export type WorkspaceRecord = {
  path: string;
  providers: string[];
  updatedAt: string;
};

const cache = openLmdbCache<WorkspaceRecord>({ path: DB_PATH, namespace: 'workspaces' });

function writeJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function listWorkspaces(): Promise<WorkspaceRecord[]> {
  const entries: WorkspaceRecord[] = [];
  for await (const [, value] of cache.entries()) {
    if (value) entries.push(value);
  }
  return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function saveWorkspace(record: WorkspaceRecord): Promise<void> {
  await cache.set(record.path, record, { ttlMs: 7 * 24 * 60 * 60 * 1000 });
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req
      .on('data', (chunk) => chunks.push(chunk as Buffer))
      .on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8');
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export function startRegistryServer(port = DEFAULT_PORT): http.Server {
  mkdirSync(DB_PATH, { recursive: true });

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        writeJson(res, 400, { error: 'Bad request' });
        return;
      }

      if (req.url === '/health' && req.method === 'GET') {
        writeJson(res, 200, { status: 'ok' });
        return;
      }

      if (req.url === '/workspaces' && req.method === 'GET') {
        const data = await listWorkspaces();
        writeJson(res, 200, { data });
        return;
      }

      if (req.url === '/workspaces' && (req.method === 'POST' || req.method === 'PUT')) {
        const body = (await parseBody(req)) as Partial<WorkspaceRecord>;
        if (!body.path) {
          writeJson(res, 400, { error: 'path is required' });
          return;
        }

        const record: WorkspaceRecord = {
          path: body.path,
          providers: body.providers ?? [],
          updatedAt: new Date().toISOString(),
        };

        await saveWorkspace(record);
        writeJson(res, 200, { data: record });
        return;
      }

      writeJson(res, 404, { error: 'Not found' });
    } catch (error) {
      writeJson(res, 500, { error: (error as Error).message });
    }
  });

  server.listen(port, () => {
    console.log(`Pantheon workspace registry listening on http://127.0.0.1:${port}`);
    console.log(`DB path: ${DB_PATH}`);
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startRegistryServer();
}
