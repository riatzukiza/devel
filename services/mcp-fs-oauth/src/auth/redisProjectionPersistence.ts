import { randomUUID } from "node:crypto";

import type { Redis } from "ioredis";

import { DuckDBPersistence } from "./duckDbPersistence.js";
import type {
  Persistence,
  SerializableClient,
  SerializableCode,
  SerializableRefreshTokenReuse,
  SerializableToken,
} from "./types.js";

type Entity = "code" | "access_token" | "refresh_token" | "refresh_token_reuse" | "client";

type ProjectionMutation = {
  entity: Entity;
  operation: "set" | "delete";
  key: string;
  sourceId: string;
  value?: SerializableCode | SerializableToken | SerializableRefreshTokenReuse | SerializableClient;
};

type PersistenceOptions = {
  redis: Redis;
  keyPrefix: string;
  duckDbPath: string;
  enableDuckDbProjection: boolean;
  lockKey: string;
  lockTtlSeconds: number;
  projectionChannel: string;
};

export class RedisProjectionPersistence implements Persistence {
  private readonly instanceId = randomUUID();
  private readonly redis: Redis;
  private readonly keyPrefix: string;
  private readonly duckDbPath: string;
  private readonly enableDuckDbProjection: boolean;
  private readonly lockKey: string;
  private readonly lockTtlSeconds: number;
  private readonly projectionChannel: string;

  private duckDb: DuckDBPersistence;
  private duckDbReadable = false;
  private projectionOwner = false;
  private lockRefreshTimer?: ReturnType<typeof setInterval>;
  private subscriber?: Redis;

  constructor(options: PersistenceOptions) {
    this.redis = options.redis;
    this.keyPrefix = options.keyPrefix;
    this.duckDbPath = options.duckDbPath;
    this.enableDuckDbProjection = options.enableDuckDbProjection;
    this.lockKey = options.lockKey;
    this.lockTtlSeconds = options.lockTtlSeconds;
    this.projectionChannel = options.projectionChannel;
    this.duckDb = new DuckDBPersistence(this.duckDbPath);
  }

  async init(): Promise<void> {
    if (!this.enableDuckDbProjection) {
      try {
        await this.openDuckDbReadOnly();
        console.log("[oauth-persistence] non-owner DuckDB read-only fallback enabled");
      } catch (error) {
        console.warn("[oauth-persistence] non-owner could not open DuckDB read-only fallback", error);
      }
      return;
    }

    const lockAcquired = await this.acquireProjectionLock();
    if (!lockAcquired) {
      try {
        await this.openDuckDbReadOnly();
        console.warn("[oauth-persistence] DuckDB projection lock held by another process; running non-owner read-only mode");
      } catch (error) {
        console.warn("[oauth-persistence] DuckDB projection lock held by another process; running Redis-only mode", error);
      }
      return;
    }

    await this.openDuckDbWritable();
    this.projectionOwner = true;
    await this.startProjectionSubscription();
    await this.syncRedisToDuckDb();
    this.startLockRefresh();
    console.log("[oauth-persistence] DuckDB projection owner enabled");
  }

  private async openDuckDbWritable(): Promise<void> {
    await this.duckDb.stop();
    const writableDuckDb = new DuckDBPersistence(this.duckDbPath, false);
    await writableDuckDb.init();
    this.duckDbReadable = true;
    this.duckDb = writableDuckDb;
  }

  private async openDuckDbReadOnly(): Promise<void> {
    await this.duckDb.stop();
    const readOnlyDuckDb = new DuckDBPersistence(this.duckDbPath, true);
    await readOnlyDuckDb.init();
    this.duckDbReadable = true;
    this.duckDb = readOnlyDuckDb;
  }

  async stop(): Promise<void> {
    if (this.lockRefreshTimer) {
      clearInterval(this.lockRefreshTimer);
      this.lockRefreshTimer = undefined;
    }

    if (this.subscriber) {
      try {
        await this.subscriber.unsubscribe(this.projectionChannel);
      } catch (error) {
        console.warn("[oauth-persistence] failed to unsubscribe from projection channel", error);
      }
      await this.subscriber.quit();
      this.subscriber = undefined;
    }

    if (this.duckDbReadable) {
      await this.duckDb.stop();
      this.duckDbReadable = false;
    }

    if (this.projectionOwner) {
      this.projectionOwner = false;
      try {
        const lockValue = await this.redis.get(this.lockKey);
        if (lockValue === this.instanceId) {
          await this.redis.del(this.lockKey);
        }
      } catch (error) {
        console.warn("[oauth-persistence] failed to release projection lock", error);
      }
    }
  }

  async getCode(code: string): Promise<SerializableCode | undefined> {
    const fromRedis = await this.getJson<SerializableCode>(this.codeKey(code));
    if (fromRedis) {
      return fromRedis;
    }
    return this.getCodeFromDuckDbFallback(code);
  }

  async setCode(code: string, value: SerializableCode): Promise<void> {
    await this.setJsonWithExpiry(this.codeKey(code), value, value.expiresAt);
    await this.projectMutation({ entity: "code", operation: "set", key: code, value, sourceId: this.instanceId });
  }

  async deleteCode(code: string): Promise<void> {
    await this.redis.del(this.codeKey(code));
    await this.projectMutation({ entity: "code", operation: "delete", key: code, sourceId: this.instanceId });
  }

  async getAccessToken(token: string): Promise<SerializableToken | undefined> {
    const fromRedis = await this.getJson<SerializableToken>(this.accessTokenKey(token));
    if (fromRedis) {
      return fromRedis;
    }
    return this.getAccessTokenFromDuckDbFallback(token);
  }

  async setAccessToken(token: string, value: SerializableToken): Promise<void> {
    await this.setJsonWithExpiry(this.accessTokenKey(token), value, value.expiresAt);
    await this.projectMutation({ entity: "access_token", operation: "set", key: token, value, sourceId: this.instanceId });
  }

  async deleteAccessToken(token: string): Promise<void> {
    await this.redis.del(this.accessTokenKey(token));
    await this.projectMutation({ entity: "access_token", operation: "delete", key: token, sourceId: this.instanceId });
  }

  async getRefreshToken(token: string): Promise<SerializableToken | undefined> {
    const fromRedis = await this.getJson<SerializableToken>(this.refreshTokenKey(token));
    if (fromRedis) {
      return fromRedis;
    }
    return this.getRefreshTokenFromDuckDbFallback(token);
  }

  async setRefreshToken(token: string, value: SerializableToken): Promise<void> {
    await this.setJsonWithExpiry(this.refreshTokenKey(token), value, value.expiresAt);
    await this.projectMutation({ entity: "refresh_token", operation: "set", key: token, value, sourceId: this.instanceId });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.redis.del(this.refreshTokenKey(token));
    await this.projectMutation({ entity: "refresh_token", operation: "delete", key: token, sourceId: this.instanceId });
  }

  async consumeRefreshToken(token: string): Promise<SerializableToken | undefined> {
    const key = this.refreshTokenKey(token);
    const raw = await this.redis.eval(
      "local value = redis.call('GET', KEYS[1]); if value then redis.call('DEL', KEYS[1]); end; return value",
      1,
      key,
    );
    if (!raw || typeof raw !== "string") {
      return undefined;
    }

    let parsed: SerializableToken | undefined;
    try {
      parsed = JSON.parse(raw) as SerializableToken;
    } catch {
      parsed = undefined;
    }
    if (!parsed) {
      return undefined;
    }

    await this.projectMutation({ entity: "refresh_token", operation: "delete", key: token, sourceId: this.instanceId });
    return parsed;
  }

  async getRefreshTokenReuse(oldRefreshToken: string): Promise<SerializableRefreshTokenReuse | undefined> {
    const fromRedis = await this.getJson<SerializableRefreshTokenReuse>(this.refreshTokenReuseKey(oldRefreshToken));
    if (fromRedis) {
      return fromRedis;
    }
    return this.getRefreshTokenReuseFromDuckDbFallback(oldRefreshToken);
  }

  async setRefreshTokenReuse(oldRefreshToken: string, value: SerializableRefreshTokenReuse): Promise<void> {
    await this.setJsonWithExpiry(this.refreshTokenReuseKey(oldRefreshToken), value, value.expiresAt);
    await this.projectMutation({
      entity: "refresh_token_reuse",
      operation: "set",
      key: oldRefreshToken,
      value,
      sourceId: this.instanceId,
    });
  }

  async getClient(clientId: string): Promise<SerializableClient | undefined> {
    const fromRedis = await this.getJson<SerializableClient>(this.clientKey(clientId));
    if (fromRedis) {
      return fromRedis;
    }
    return this.getClientFromDuckDbFallback(clientId);
  }

  async setClient(clientId: string, value: SerializableClient): Promise<void> {
    await this.redis.set(this.clientKey(clientId), JSON.stringify(value));
    await this.projectMutation({ entity: "client", operation: "set", key: clientId, value, sourceId: this.instanceId });
  }

  async cleanup(): Promise<number> {
    if (!this.projectionOwner) {
      return 0;
    }
    return this.duckDb.cleanup();
  }

  private codeKey(code: string): string {
    return `${this.keyPrefix}:codes:${code}`;
  }

  private accessTokenKey(token: string): string {
    return `${this.keyPrefix}:access_tokens:${token}`;
  }

  private refreshTokenKey(token: string): string {
    return `${this.keyPrefix}:refresh_tokens:${token}`;
  }

  private clientKey(clientId: string): string {
    return `${this.keyPrefix}:clients:${clientId}`;
  }

  private refreshTokenReuseKey(oldRefreshToken: string): string {
    return `${this.keyPrefix}:refresh_token_reuse:${oldRefreshToken}`;
  }

  private async acquireProjectionLock(): Promise<boolean> {
    const result = await this.redis.set(this.lockKey, this.instanceId, "EX", this.lockTtlSeconds, "NX");
    return result === "OK";
  }

  private startLockRefresh(): void {
    const refreshMs = Math.max(1000, Math.floor((this.lockTtlSeconds * 1000) / 3));
    this.lockRefreshTimer = setInterval(async () => {
      try {
        const current = await this.redis.get(this.lockKey);
        if (current !== this.instanceId) {
          if (this.projectionOwner) {
            console.error("[oauth-persistence] lost DuckDB projection lock; disabling projection");
            this.projectionOwner = false;
            await this.duckDb.stop();
            this.duckDbReadable = false;
            try {
              await this.openDuckDbReadOnly();
            } catch (error) {
              console.warn("[oauth-persistence] failed to reopen DuckDB in read-only mode after lock loss", error);
            }
          }
          return;
        }
        await this.redis.expire(this.lockKey, this.lockTtlSeconds);
      } catch (error) {
        console.warn("[oauth-persistence] failed to refresh projection lock", error);
      }
    }, refreshMs);
  }

  private async startProjectionSubscription(): Promise<void> {
    this.subscriber = this.redis.duplicate();
    this.subscriber.on("message", (_channel, message) => {
      void this.onProjectionMessage(message);
    });
    await this.subscriber.subscribe(this.projectionChannel);
  }

  private async onProjectionMessage(message: string): Promise<void> {
    const mutation = this.tryParseMutation(message);
    if (!mutation) {
      return;
    }
    if (mutation.sourceId === this.instanceId) {
      return;
    }
    await this.applyMutationToDuckDb(mutation);
  }

  private tryParseMutation(raw: string): ProjectionMutation | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const candidate = parsed as Record<string, unknown>;
    const entity = candidate.entity;
    const operation = candidate.operation;
    const key = candidate.key;
    const sourceId = candidate.sourceId;
    if (
      (entity !== "code" && entity !== "access_token" && entity !== "refresh_token" && entity !== "refresh_token_reuse" && entity !== "client")
      || (operation !== "set" && operation !== "delete")
      || typeof key !== "string"
      || key.length === 0
      || typeof sourceId !== "string"
    ) {
      return null;
    }
    return {
      entity,
      operation,
      key,
      sourceId,
      value: candidate.value as SerializableCode | SerializableToken | SerializableRefreshTokenReuse | SerializableClient | undefined,
    };
  }

  private async setJsonWithExpiry(key: string, value: unknown, expiresAtSeconds: number): Promise<void> {
    const ttlSeconds = Math.max(1, Math.floor(expiresAtSeconds - (Date.now() / 1000)));
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  private async getJson<T>(key: string): Promise<T | undefined> {
    const raw = await this.redis.get(key);
    if (!raw) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  private async projectMutation(mutation: ProjectionMutation): Promise<void> {
    await this.redis.publish(this.projectionChannel, JSON.stringify(mutation));
    await this.applyMutationToDuckDb(mutation);
  }

  private async applyMutationToDuckDb(mutation: ProjectionMutation): Promise<void> {
    if (!this.projectionOwner) {
      return;
    }

    if (mutation.operation === "delete") {
      if (mutation.entity === "code") {
        await this.duckDb.deleteCode(mutation.key);
        return;
      }
      if (mutation.entity === "access_token") {
        await this.duckDb.deleteAccessToken(mutation.key);
        return;
      }
      if (mutation.entity === "refresh_token") {
        await this.duckDb.deleteRefreshToken(mutation.key);
        return;
      }
      if (mutation.entity === "refresh_token_reuse") {
        return;
      }
      return;
    }

    if (!mutation.value) {
      return;
    }

    if (mutation.entity === "code") {
      await this.duckDb.setCode(mutation.key, mutation.value as SerializableCode);
      return;
    }
    if (mutation.entity === "access_token") {
      await this.duckDb.setAccessToken(mutation.key, mutation.value as SerializableToken);
      return;
    }
    if (mutation.entity === "refresh_token") {
      await this.duckDb.setRefreshToken(mutation.key, mutation.value as SerializableToken);
      return;
    }
    if (mutation.entity === "refresh_token_reuse") {
      await this.duckDb.setRefreshTokenReuse(mutation.key, mutation.value as SerializableRefreshTokenReuse);
      return;
    }
    await this.duckDb.setClient(mutation.key, mutation.value as SerializableClient);
  }

  private async getCodeFromDuckDbFallback(key: string): Promise<SerializableCode | undefined> {
    if (!this.duckDbReadable) {
      return undefined;
    }

    const value = await this.duckDb.getCode(key);
    if (value) {
      await this.setJsonWithExpiry(this.codeKey(key), value, value.expiresAt);
    }
    return value;
  }

  private async getAccessTokenFromDuckDbFallback(key: string): Promise<SerializableToken | undefined> {
    if (!this.duckDbReadable) {
      return undefined;
    }

    const value = await this.duckDb.getAccessToken(key);
    if (value) {
      await this.setJsonWithExpiry(this.accessTokenKey(key), value, value.expiresAt);
    }
    return value;
  }

  private async getRefreshTokenFromDuckDbFallback(key: string): Promise<SerializableToken | undefined> {
    if (!this.duckDbReadable) {
      return undefined;
    }

    const value = await this.duckDb.getRefreshToken(key);
    if (value) {
      await this.setJsonWithExpiry(this.refreshTokenKey(key), value, value.expiresAt);
    }
    return value;
  }

  private async getClientFromDuckDbFallback(key: string): Promise<SerializableClient | undefined> {
    if (!this.duckDbReadable) {
      return undefined;
    }

    const value = await this.duckDb.getClient(key);
    if (value) {
      await this.redis.set(this.clientKey(key), JSON.stringify(value));
    }
    return value;
  }

  private async getRefreshTokenReuseFromDuckDbFallback(key: string): Promise<SerializableRefreshTokenReuse | undefined> {
    if (!this.duckDbReadable) {
      return undefined;
    }

    const value = await this.duckDb.getRefreshTokenReuse(key);
    if (value) {
      await this.setJsonWithExpiry(this.refreshTokenReuseKey(key), value, value.expiresAt);
    }
    return value;
  }

  private async syncRedisToDuckDb(): Promise<void> {
    if (!this.projectionOwner) {
      return;
    }

    await this.syncEntity("code");
    await this.syncEntity("access_token");
    await this.syncEntity("refresh_token");
    await this.syncEntity("refresh_token_reuse");
    await this.syncEntity("client");
  }

  private async syncEntity(entity: Entity): Promise<void> {
    const pattern = entity === "code"
      ? `${this.keyPrefix}:codes:*`
      : entity === "access_token"
        ? `${this.keyPrefix}:access_tokens:*`
        : entity === "refresh_token"
          ? `${this.keyPrefix}:refresh_tokens:*`
          : entity === "refresh_token_reuse"
            ? `${this.keyPrefix}:refresh_token_reuse:*`
          : `${this.keyPrefix}:clients:*`;

    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = nextCursor;
      if (keys.length === 0) {
        continue;
      }

      const values = await this.redis.mget(keys);
      for (let index = 0; index < keys.length; index += 1) {
        const raw = values[index];
        if (!raw) {
          continue;
        }
        const value = this.parseRawValue(raw, entity);
        if (!value) {
          continue;
        }
        const key = keys[index].slice(keys[index].lastIndexOf(":") + 1);
        await this.applyMutationToDuckDb({
          entity,
          operation: "set",
          key,
          sourceId: "sync",
          value,
        });
      }
    } while (cursor !== "0");
  }

  private parseRawValue(
    raw: string,
    entity: Entity,
  ): SerializableCode | SerializableToken | SerializableRefreshTokenReuse | SerializableClient | undefined {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return undefined;
      }
      if (entity === "code") {
        return parsed as SerializableCode;
      }
      if (entity === "client") {
        return parsed as SerializableClient;
      }
      if (entity === "refresh_token_reuse") {
        return parsed as SerializableRefreshTokenReuse;
      }
      return parsed as SerializableToken;
    } catch {
      return undefined;
    }
  }
}
