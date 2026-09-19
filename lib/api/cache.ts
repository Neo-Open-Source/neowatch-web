export interface CacheOptions {
  ttlMs?: number;
}

interface CacheEntry<T> {
  value: T;
  expires: number;
}

export type CacheResult<T> = { hit: true; value: T } | { hit: false };

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export class RequestCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;

  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get<T>(key: string): CacheResult<T> {
    const entry = this.store.get(key);
    if (!entry) return { hit: false };

    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return { hit: false };
    }

    return { hit: true, value: entry.value as T };
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }

  /**
   * Drop cached entries whose cache key contains the given path prefix.
   * Keys are `${method} ${url}` — the URL is absolute when a baseUrl is set,
   * so match on the path segment anywhere in the key.
   */
  invalidate(prefix: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.includes(prefix)) this.store.delete(key);
    }
  }
}
