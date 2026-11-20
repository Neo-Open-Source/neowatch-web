const MAX_ENTRIES = 200;

type Entry = { value: unknown; expiresAt: number };

export class MemoryCache {
  #entries = new Map<string, Entry>();
  #inflight = new Map<string, Promise<unknown>>();

  get<T>(key: string): T | undefined {
    const hit = this.#entries.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.#entries.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.#entries.size >= MAX_ENTRIES) {
      const oldest = this.#entries.keys().next().value;
      if (oldest !== undefined) this.#entries.delete(oldest);
    }
    this.#entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
    const pending = this.#inflight.get(key);
    if (pending) return pending as Promise<T>;
    const task = run().finally(() => this.#inflight.delete(key));
    this.#inflight.set(key, task);
    return task;
  }
}

const isolateCache = new MemoryCache();

export function sharedCache(): MemoryCache {
  return isolateCache;
}
