import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Redis } from "ioredis";

import { DuckDBPersistence } from "../auth/duckDbPersistence.js";
import { RedisProjectionPersistence } from "../auth/redisProjectionPersistence.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((target) => rm(target, { recursive: true, force: true })));
});

async function createTempDbPath(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "mcp-fs-oauth-redis-projection-"));
  cleanupPaths.push(dir);
  return path.join(dir, "oauth.db");
}

class InMemoryRedisLike {
  private readonly data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async set(key: string, value: string, ..._args: Array<string | number>): Promise<string> {
    this.data.set(key, value);
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.data.delete(key)) {
        removed += 1;
      }
    }
    return removed;
  }
}

describe("RedisProjectionPersistence non-owner fallback", () => {
  it("opens DuckDB read-only and serves fallback reads", async () => {
    const dbPath = await createTempDbPath();
    const writable = new DuckDBPersistence(dbPath);
    await writable.init();
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    await writable.setCode("fallback-code", {
      code: "fallback-code",
      clientId: "client-a",
      redirectUri: "https://example.com/callback",
      codeChallenge: "challenge",
      scopes: ["mcp"],
      subject: "user:1",
      expiresAt,
    });
    await writable.stop();

    const redis = new InMemoryRedisLike() as unknown as Redis;
    const persistence = new RedisProjectionPersistence({
      redis,
      keyPrefix: "oauth-test",
      duckDbPath: dbPath,
      enableDuckDbProjection: false,
      lockKey: "oauth-test:lock",
      lockTtlSeconds: 30,
      projectionChannel: "oauth-test:events",
    });

    await persistence.init();
    const code = await persistence.getCode("fallback-code");
    expect(code).toBeDefined();
    expect(code?.clientId).toBe("client-a");
    expect(code?.redirectUri).toBe("https://example.com/callback");
    await persistence.stop();
  });
});
