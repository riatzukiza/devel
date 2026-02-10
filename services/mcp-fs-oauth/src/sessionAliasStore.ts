export type IdAliasKind = "session" | "message";

type AliasEntry = {
  alias: string;
  realId: string;
  expiresAtMs: number;
};

type GlobalAliasState = {
  counter: number;
  byAlias: Map<string, AliasEntry>;
  byRealId: Map<string, AliasEntry>;
};

type ScopedAliasState = {
  counter: number;
  expiresAtMs: number;
  byAlias: Map<string, string>;
  byRealId: Map<string, string>;
};

export class SessionAliasStore {
  private readonly aliasesByScope = new Map<string, ScopedAliasState>();

  private readonly globalByKind = new Map<IdAliasKind, GlobalAliasState>();

  private readonly ttlMsProvider: () => number;

  private readonly nowProvider: () => number;

  public constructor(args: {
    ttlMsProvider: () => number;
    nowProvider?: () => number;
  }) {
    this.ttlMsProvider = args.ttlMsProvider;
    this.nowProvider = args.nowProvider ?? (() => Date.now());
  }

  public aliasFor(kind: IdAliasKind, realId: string, mcpSessionId?: string): string {
    this.gc();
    const globalState = this.ensureGlobalState(kind);

    const existing = globalState.byRealId.get(realId);
    if (existing) {
      this.touchGlobalEntry(kind, existing);
      this.writeScopedAlias(kind, existing.alias, realId, mcpSessionId);
      return existing.alias;
    }

    const alias = this.nextAlias(kind, globalState);
    this.writeGlobalAlias(kind, alias, realId);
    this.writeScopedAlias(kind, alias, realId, mcpSessionId);
    return alias;
  }

  public resolveAlias(kind: IdAliasKind, maybeAlias: string, mcpSessionId?: string): string | null {
    this.gc();

    const globalState = this.globalByKind.get(kind);
    const global = globalState?.byAlias.get(maybeAlias);
    if (global) {
      this.touchGlobalEntry(kind, global);
      this.writeScopedAlias(kind, maybeAlias, global.realId, mcpSessionId);
      return global.realId;
    }

    if (!mcpSessionId) {
      return null;
    }

    const scoped = this.aliasesByScope.get(mcpSessionId);
    if (!scoped) {
      return null;
    }

    scoped.expiresAtMs = this.expiresAt();
    return scoped.byAlias.get(`${kind}:alias:${maybeAlias}`) ?? null;
  }

  private gc(): void {
    const now = this.nowProvider();

    for (const [scopeId, state] of this.aliasesByScope) {
      if (state.expiresAtMs <= now) {
        this.aliasesByScope.delete(scopeId);
      }
    }

    for (const [kind, state] of this.globalByKind) {
      for (const [alias, entry] of state.byAlias) {
        if (entry.expiresAtMs <= now) {
          state.byAlias.delete(alias);
          state.byRealId.delete(entry.realId);
        }
      }
      if (state.byAlias.size === 0 && state.byRealId.size === 0) {
        state.counter = 0;
        this.globalByKind.set(kind, state);
      }
    }
  }

  private expiresAt(): number {
    const ttlMs = Math.max(1_000, this.ttlMsProvider());
    return this.nowProvider() + ttlMs;
  }

  private ensureGlobalState(kind: IdAliasKind): GlobalAliasState {
    const existing = this.globalByKind.get(kind);
    if (existing) {
      return existing;
    }
    const created: GlobalAliasState = {
      counter: 0,
      byAlias: new Map<string, AliasEntry>(),
      byRealId: new Map<string, AliasEntry>(),
    };
    this.globalByKind.set(kind, created);
    return created;
  }

  private nextAlias(kind: IdAliasKind, state: GlobalAliasState): string {
    state.counter += 1;
    const prefix = kind === "session" ? "S" : "M";
    return `${prefix}${String(state.counter).padStart(4, "0")}`;
  }

  private touchGlobalEntry(kind: IdAliasKind, entry: AliasEntry): void {
    const state = this.ensureGlobalState(kind);
    const refreshed: AliasEntry = {
      alias: entry.alias,
      realId: entry.realId,
      expiresAtMs: this.expiresAt(),
    };
    state.byAlias.set(entry.alias, refreshed);
    state.byRealId.set(entry.realId, refreshed);
  }

  private writeGlobalAlias(kind: IdAliasKind, alias: string, realId: string): void {
    const state = this.ensureGlobalState(kind);
    const entry: AliasEntry = {
      alias,
      realId,
      expiresAtMs: this.expiresAt(),
    };
    state.byAlias.set(alias, entry);
    state.byRealId.set(realId, entry);
  }

  private ensureScopedState(mcpSessionId: string): ScopedAliasState {
    const existing = this.aliasesByScope.get(mcpSessionId);
    if (existing) {
      existing.expiresAtMs = this.expiresAt();
      return existing;
    }
    const created: ScopedAliasState = {
      counter: 0,
      expiresAtMs: this.expiresAt(),
      byAlias: new Map<string, string>(),
      byRealId: new Map<string, string>(),
    };
    this.aliasesByScope.set(mcpSessionId, created);
    return created;
  }

  private writeScopedAlias(kind: IdAliasKind, alias: string, realId: string, mcpSessionId?: string): void {
    if (!mcpSessionId) {
      return;
    }
    const scoped = this.ensureScopedState(mcpSessionId);
    const counterPrefix = kind === "session" ? "S" : "M";
    const aliasNumber = Number(alias.slice(counterPrefix.length));
    if (Number.isFinite(aliasNumber) && aliasNumber > scoped.counter) {
      scoped.counter = aliasNumber;
    }
    scoped.byRealId.set(`${kind}:${realId}`, alias);
    scoped.byAlias.set(`${kind}:alias:${alias}`, realId);
  }
}
