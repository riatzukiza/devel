export interface EmbeddingCacheEntry {
  embedding: number[];
  cachedAt: number;
}

export function makeEmbeddingCacheKey(params: {
  model: string;
  text: string;
}): string {
  const model = params.model;
  const text = params.text.slice(0, 128);
  return `${model}::${text}`;
}

export class PersistentEmbeddingCache {
  private map = new Map<string, number[]>();
  private flushing = false;
  private readonly maxEntries = 10000;

  constructor(private _cachePath: string) {}

  async getMany(keys: string[]): Promise<Map<string, number[]>> {
    const result = new Map<string, number[]>();
    for (const key of keys) {
      const entry = this.map.get(key);
      if (entry) {
        result.set(key, entry);
        this.map.delete(key);
        this.map.set(key, entry);
      }
    }
    return result;
  }

  set(_key: string, _value: EmbeddingCacheEntry): void {
    // no-op stub
  }

  has(_key: string): boolean {
    return false;
  }

  delete(_key: string): void {
    // no-op stub
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  async putMany(entries: Array<{ key: string; vector: number[] }>): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    try {
      for (const { key, vector } of entries) {
        this.map.delete(key);
        this.map.set(key, vector);
      }
      while (this.map.size > this.maxEntries) {
        const firstKey = this.map.keys().next().value;
        if (firstKey) this.map.delete(firstKey);
      }
    } finally {
      this.flushing = false;
    }
  }

  async flush(): Promise<void> {
    // no-op stub
  }
}
