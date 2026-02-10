import { Database, OPEN_READONLY } from "duckdb";
import { promisify } from "util";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type {
  Persistence,
  SerializableClient,
  SerializableCode,
  SerializableRefreshTokenReuse,
  SerializableToken,
} from "./types.js";

export class DuckDBPersistence implements Persistence {
  private db?: Database;
  private readonly path: string;
  private readonly readOnly: boolean;

  constructor(path: string, readOnly = false) {
    this.path = path;
    this.readOnly = readOnly;
  }

  async init(): Promise<void> {
    const dir = dirname(this.path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const openCallback = (err: Error | null): void => {
        if (err) {
          reject(err);
          return;
        }
        if (this.readOnly) {
          resolve();
          return;
        }
        this.runMigrations().then(resolve).catch(reject);
      };

      if (this.readOnly) {
        this.db = new Database(this.path, OPEN_READONLY, openCallback);
        return;
      }
      this.db = new Database(this.path, openCallback);
    });
  }

  private ensureWritable(): void {
    if (this.readOnly) {
      throw new Error("DuckDB persistence is read-only");
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const run = promisify(this.db.run.bind(this.db));

    // Create tables
    await run(`
      CREATE TABLE IF NOT EXISTS codes (
        code VARCHAR PRIMARY KEY,
        client_id VARCHAR NOT NULL,
        redirect_uri VARCHAR NOT NULL,
        code_challenge VARCHAR NOT NULL,
        scopes VARCHAR NOT NULL, -- JSON array
        resource VARCHAR,
        subject VARCHAR NOT NULL,
        extra VARCHAR, -- JSON object
        expires_at BIGINT NOT NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS access_tokens (
        token VARCHAR PRIMARY KEY,
        client_id VARCHAR NOT NULL,
        scopes VARCHAR NOT NULL, -- JSON array
        resource VARCHAR,
        subject VARCHAR NOT NULL,
        extra VARCHAR, -- JSON object
        expires_at BIGINT NOT NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token VARCHAR PRIMARY KEY,
        client_id VARCHAR NOT NULL,
        scopes VARCHAR NOT NULL, -- JSON array
        resource VARCHAR,
        subject VARCHAR NOT NULL,
        extra VARCHAR, -- JSON object
        expires_at BIGINT NOT NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        client_id VARCHAR PRIMARY KEY,
        client_secret VARCHAR NOT NULL,
        client_name VARCHAR NOT NULL,
        redirect_uris VARCHAR NOT NULL,
        token_endpoint_auth_method VARCHAR NOT NULL,
        grant_types VARCHAR NOT NULL,
        response_types VARCHAR NOT NULL,
        client_id_issued_at BIGINT,
        client_secret_expires_at BIGINT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS refresh_token_reuse (
        old_refresh_token VARCHAR PRIMARY KEY,
        client_id VARCHAR NOT NULL,
        resource VARCHAR,
        scope_key VARCHAR NOT NULL,
        tokens VARCHAR NOT NULL,
        expires_at BIGINT NOT NULL
      )
    `);
  }

  async stop(): Promise<void> {
    // DuckDB close is synchronous in the bindings usually, but we can wrap it if needed.
    // Actually the node-duckdb API close() takes a callback.
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => resolve());
        this.db = undefined;
      } else {
        resolve();
      }
    });
  }

  // --- Helpers for query execution ---

  private async get<T>(sql: string, ...params: any[]): Promise<T | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      this.db!.all(sql, ...params, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.length > 0 ? (rows[0] as T) : undefined);
      });
    });
  }

  private async run(sql: string, ...params: any[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      this.db!.run(sql, ...params, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // --- Codes ---

  async getCode(code: string): Promise<SerializableCode | undefined> {
    const row = await this.get<{
      code: string;
      client_id: string;
      redirect_uri: string;
      code_challenge: string;
      scopes: string;
      resource: string | null;
      subject: string;
      extra: string | null;
      expires_at: number; // DuckDB BIGINT comes back as number or BigInt depending on driver version, usually number if safe
    }>("SELECT * FROM codes WHERE code = ?", code);

    if (!row) return undefined;

    return {
      code: row.code,
      clientId: row.client_id,
      redirectUri: row.redirect_uri,
      codeChallenge: row.code_challenge,
      scopes: JSON.parse(row.scopes),
      resource: row.resource || undefined,
      subject: row.subject,
      extra: row.extra ? JSON.parse(row.extra) : undefined,
      expiresAt: Number(row.expires_at),
    };
  }

  async setCode(code: string, value: SerializableCode): Promise<void> {
    this.ensureWritable();
    await this.run(
      `INSERT OR REPLACE INTO codes (code, client_id, redirect_uri, code_challenge, scopes, resource, subject, extra, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      value.code,
      value.clientId,
      value.redirectUri,
      value.codeChallenge,
      JSON.stringify(value.scopes),
      value.resource || null,
      value.subject,
      value.extra ? JSON.stringify(value.extra) : null,
      value.expiresAt
    );
  }

  async deleteCode(code: string): Promise<void> {
    this.ensureWritable();
    await this.run("DELETE FROM codes WHERE code = ?", code);
  }

  // --- Access Tokens ---

  async getAccessToken(token: string): Promise<SerializableToken | undefined> {
    const row = await this.get<{
      token: string;
      client_id: string;
      scopes: string;
      resource: string | null;
      subject: string;
      extra: string | null;
      expires_at: number;
    }>("SELECT * FROM access_tokens WHERE token = ?", token);

    if (!row) return undefined;

    return {
      token: row.token,
      clientId: row.client_id,
      scopes: JSON.parse(row.scopes),
      resource: row.resource || undefined,
      subject: row.subject,
      extra: row.extra ? JSON.parse(row.extra) : undefined,
      expiresAt: Number(row.expires_at),
    };
  }

  async setAccessToken(token: string, value: SerializableToken): Promise<void> {
    this.ensureWritable();
    await this.run(
      `INSERT OR REPLACE INTO access_tokens (token, client_id, scopes, resource, subject, extra, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      value.token,
      value.clientId,
      JSON.stringify(value.scopes),
      value.resource || null,
      value.subject,
      value.extra ? JSON.stringify(value.extra) : null,
      value.expiresAt
    );
  }

  async deleteAccessToken(token: string): Promise<void> {
    this.ensureWritable();
    await this.run("DELETE FROM access_tokens WHERE token = ?", token);
  }

  // --- Refresh Tokens ---

  async getRefreshToken(token: string): Promise<SerializableToken | undefined> {
    const row = await this.get<{
      token: string;
      client_id: string;
      scopes: string;
      resource: string | null;
      subject: string;
      extra: string | null;
      expires_at: number;
    }>("SELECT * FROM refresh_tokens WHERE token = ?", token);

    if (!row) return undefined;

    return {
      token: row.token,
      clientId: row.client_id,
      scopes: JSON.parse(row.scopes),
      resource: row.resource || undefined,
      subject: row.subject,
      extra: row.extra ? JSON.parse(row.extra) : undefined,
      expiresAt: Number(row.expires_at),
    };
  }

  async setRefreshToken(token: string, value: SerializableToken): Promise<void> {
    this.ensureWritable();
    await this.run(
      `INSERT OR REPLACE INTO refresh_tokens (token, client_id, scopes, resource, subject, extra, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      value.token,
      value.clientId,
      JSON.stringify(value.scopes),
      value.resource || null,
      value.subject,
      value.extra ? JSON.stringify(value.extra) : null,
      value.expiresAt
    );
  }

  async deleteRefreshToken(token: string): Promise<void> {
    this.ensureWritable();
    await this.run("DELETE FROM refresh_tokens WHERE token = ?", token);
  }

  async consumeRefreshToken(token: string): Promise<SerializableToken | undefined> {
    const existing = await this.getRefreshToken(token);
    if (!existing) {
      return undefined;
    }
    this.ensureWritable();
    await this.deleteRefreshToken(token);
    return existing;
  }

  async getRefreshTokenReuse(oldRefreshToken: string): Promise<SerializableRefreshTokenReuse | undefined> {
    const row = await this.get<{
      old_refresh_token: string;
      client_id: string;
      resource: string | null;
      scope_key: string;
      tokens: string;
      expires_at: number;
    }>("SELECT * FROM refresh_token_reuse WHERE old_refresh_token = ?", oldRefreshToken);

    if (!row) return undefined;

    return {
      oldRefreshToken: row.old_refresh_token,
      clientId: row.client_id,
      resource: row.resource || undefined,
      scopeKey: row.scope_key,
      tokens: JSON.parse(row.tokens) as SerializableRefreshTokenReuse["tokens"],
      expiresAt: Number(row.expires_at),
    };
  }

  async setRefreshTokenReuse(oldRefreshToken: string, value: SerializableRefreshTokenReuse): Promise<void> {
    this.ensureWritable();
    await this.run(
      `INSERT OR REPLACE INTO refresh_token_reuse (old_refresh_token, client_id, resource, scope_key, tokens, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      oldRefreshToken,
      value.clientId,
      value.resource || null,
      value.scopeKey,
      JSON.stringify(value.tokens),
      value.expiresAt,
    );
  }

  async getClient(clientId: string): Promise<SerializableClient | undefined> {
    const row = await this.get<{
      client_id: string;
      client_secret: string;
      client_name: string;
      redirect_uris: string;
      token_endpoint_auth_method: string;
      grant_types: string;
      response_types: string;
      client_id_issued_at: number | null;
      client_secret_expires_at: number | null;
    }>("SELECT * FROM oauth_clients WHERE client_id = ?", clientId);

    if (!row) return undefined;

    return {
      clientId: row.client_id,
      clientSecret: row.client_secret,
      clientName: row.client_name,
      redirectUris: JSON.parse(row.redirect_uris),
      tokenEndpointAuthMethod: row.token_endpoint_auth_method,
      grantTypes: JSON.parse(row.grant_types),
      responseTypes: JSON.parse(row.response_types),
      clientIdIssuedAt: row.client_id_issued_at === null ? undefined : Number(row.client_id_issued_at),
      clientSecretExpiresAt: row.client_secret_expires_at === null ? undefined : Number(row.client_secret_expires_at),
    };
  }

  async setClient(clientId: string, value: SerializableClient): Promise<void> {
    this.ensureWritable();
    await this.run(
      `INSERT OR REPLACE INTO oauth_clients (
         client_id,
         client_secret,
         client_name,
         redirect_uris,
         token_endpoint_auth_method,
         grant_types,
         response_types,
         client_id_issued_at,
         client_secret_expires_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      value.clientId,
      value.clientSecret,
      value.clientName,
      JSON.stringify(value.redirectUris),
      value.tokenEndpointAuthMethod,
      JSON.stringify(value.grantTypes),
      JSON.stringify(value.responseTypes),
      value.clientIdIssuedAt ?? null,
      value.clientSecretExpiresAt ?? null,
    );
  }

  // --- Cleanup ---

  async cleanup(): Promise<number> {
    this.ensureWritable();
    const now = Date.now() / 1000; // Unix timestamp in seconds
    let totalCleaned = 0;

    // We can't easily get the count of deleted rows from a generic run() wrapper with node-duckdb easily
    // without checking changes() which might not be reliable or exposed in the callback.
    // But we can do it in separate queries if we really care about the count, or just DELETE.
    // For now, let's just DELETE and not worry too much about the precise count return unless needed.
    
    // However, the interface demands a number.
    // We can count expired first.
    
    const countQuery = `
      SELECT 
        (SELECT COUNT(*) FROM codes WHERE expires_at < ?) +
        (SELECT COUNT(*) FROM access_tokens WHERE expires_at < ?) +
        (SELECT COUNT(*) FROM refresh_tokens WHERE expires_at < ?) +
        (SELECT COUNT(*) FROM refresh_token_reuse WHERE expires_at < ?) as total
    `;

    const countRow = await this.get<{ total: number }>(countQuery, now, now, now, now);
    totalCleaned = Number(countRow?.total || 0);

    await this.run("DELETE FROM codes WHERE expires_at < ?", now);
    await this.run("DELETE FROM access_tokens WHERE expires_at < ?", now);
    await this.run("DELETE FROM refresh_tokens WHERE expires_at < ?", now);
    await this.run("DELETE FROM refresh_token_reuse WHERE expires_at < ?", now);

    if (totalCleaned > 0) {
      console.log(`[persistence] Cleaned up ${totalCleaned} expired entries from DuckDB`);
    }

    return totalCleaned;
  }
}
