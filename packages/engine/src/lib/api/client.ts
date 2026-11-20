import { type MemoryCache, sharedCache } from "../http/cache";
import { fetchWithRetry } from "../http/fetch";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type QueryValue = string | number | boolean | null | undefined;

export function query(params: Record<string, QueryValue | readonly string[]>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) search.append(key, item);
      }
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class ApiClient {
  constructor(
    readonly origin: string,
    private readonly bearer: string | null,
    private readonly cache: MemoryCache = sharedCache(),
  ) {}

  async get<T>(path: string, options: { ttlMs?: number } = {}): Promise<T> {
    const ttlMs = options.ttlMs ?? 0;
    const key = `GET ${path}`;
    if (ttlMs > 0) {
      const hit = this.cache.get<T>(key);
      if (hit !== undefined) return hit;
    }
    return this.cache.dedupe(key, async () => {
      const response = await fetchWithRetry(`${this.origin}${path}`, {
        headers: this.headers(),
        cache: "no-store",
      });
      const data = await this.unwrap<T>(response);
      if (ttlMs > 0) this.cache.set(key, data, ttlMs);
      return data;
    });
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  del<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path, null);
  }

  private async request<T>(method: string, path: string, body: unknown | null): Promise<T> {
    const response = await fetchWithRetry(`${this.origin}${path}`, {
      method,
      headers: this.headers(method !== "DELETE"),
      body: body === null ? null : JSON.stringify(body),
      cache: "no-store",
    });
    return this.unwrap<T>(response);
  }

  private headers(withBody = false): Record<string, string> {
    const headers: Record<string, string> = { accept: "application/json" };
    if (withBody) headers["content-type"] = "application/json";
    if (this.bearer) headers.authorization = `Bearer ${this.bearer}`;
    return headers;
  }

  private async unwrap<T>(response: Response): Promise<T> {
    let payload: Envelope<T>;
    try {
      payload = (await response.json()) as Envelope<T>;
    } catch {
      throw new ApiError(response.status, `${response.status} ${response.statusText}`);
    }
    if (!response.ok || payload.success === false) {
      throw new ApiError(response.status, payload.error ?? `${response.status} ${response.statusText}`);
    }
    return payload.data as T;
  }
}
