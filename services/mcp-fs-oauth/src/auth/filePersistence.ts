import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

type SerializableToken = {
  token: string;
  clientId: string;
  scopes: string[];
  resource?: string;
  subject: string;
  extra?: Record<string, unknown>;
  expiresAt: number;
};

type SerializableCode = {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource?: string;
  subject: string;
  extra?: Record<string, unknown>;
  expiresAt: number;
};

type StorageData = {
  version: number;
  codes: Record<string, SerializableCode>;
  accessTokens: Record<string, SerializableToken>;
  refreshTokens: Record<string, SerializableToken>;
  lastSaved: number;
};

function serializeUrl(url?: URL): string | undefined {
  return url?.toString();
}

function deserializeUrl(str?: string): URL | undefined {
  return str ? new URL(str) : undefined;
}

export class FilePersistence {
  private data: StorageData;
  private dirty = false;
  private saveTimer?: NodeJS.Timeout;
  private readonly saveInterval = 5000; // Save every 5 seconds
  private pendingSave: Promise<void> | null = null;

  constructor(private readonly path: string) {
    this.data = this.load();
    this.startAutoSave();
  }

  private load(): StorageData {
    if (existsSync(this.path)) {
      try {
        const content = readFileSync(this.path, "utf-8");
        const parsed = JSON.parse(content) as StorageData;
        console.log(`[persistence] Loaded ${Object.keys(parsed.codes).length} codes, ${Object.keys(parsed.accessTokens).length} access tokens, ${Object.keys(parsed.refreshTokens).length} refresh tokens`);
        return parsed;
      } catch (e) {
        console.error("[persistence] Failed to load, starting fresh:", e);
      }
    }
    return {
      version: 1,
      codes: {},
      accessTokens: {},
      refreshTokens: {},
      lastSaved: Date.now(),
    };
  }

  private save(): void {
    if (!this.dirty) return;
    
    try {
      const dir = dirname(this.path);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(this.path, JSON.stringify(this.data, null, 2));
      this.dirty = false;
      console.log("[persistence] Saved state to disk");
    } catch (e) {
      console.error("[persistence] Failed to save:", e);
    }
  }

  // Force an immediate synchronous save
  flush(): void {
    if (this.dirty) {
      this.save();
    }
  }

  // Async flush for cases where we need to wait for the save to complete
  async flushAsync(): Promise<void> {
    if (this.dirty) {
      this.save();
    }
  }

  private startAutoSave(): void {
    this.saveTimer = setInterval(() => this.save(), this.saveInterval);
  }

  stop(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = undefined;
    }
    this.save(); // Final save
  }

  markDirty(): void {
    this.dirty = true;
  }

  // Codes
  getCode(code: string): SerializableCode | undefined {
    return this.data.codes[code];
  }

  setCode(code: string, value: SerializableCode): void {
    this.data.codes[code] = value;
    this.markDirty();
  }

  deleteCode(code: string): void {
    delete this.data.codes[code];
    this.markDirty();
  }

  // Access Tokens
  getAccessToken(token: string): SerializableToken | undefined {
    return this.data.accessTokens[token];
  }

  setAccessToken(token: string, value: SerializableToken): void {
    this.data.accessTokens[token] = value;
    this.markDirty();
  }

  deleteAccessToken(token: string): void {
    delete this.data.accessTokens[token];
    this.markDirty();
  }

  // Refresh Tokens
  getRefreshToken(token: string): SerializableToken | undefined {
    return this.data.refreshTokens[token];
  }

  setRefreshToken(token: string, value: SerializableToken): void {
    this.data.refreshTokens[token] = value;
    this.markDirty();
  }

  deleteRefreshToken(token: string): void {
    delete this.data.refreshTokens[token];
    this.markDirty();
  }

  // Cleanup expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [code, data] of Object.entries(this.data.codes)) {
      if (data.expiresAt * 1000 < now) {
        delete this.data.codes[code];
        cleaned++;
      }
    }
    
    for (const [token, data] of Object.entries(this.data.accessTokens)) {
      if (data.expiresAt * 1000 < now) {
        delete this.data.accessTokens[token];
        cleaned++;
      }
    }
    
    for (const [token, data] of Object.entries(this.data.refreshTokens)) {
      if (data.expiresAt * 1000 < now) {
        delete this.data.refreshTokens[token];
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[persistence] Cleaned up ${cleaned} expired entries`);
      this.markDirty();
    }
    
    return cleaned;
  }
}
