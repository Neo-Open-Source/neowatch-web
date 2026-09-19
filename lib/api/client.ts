import { RequestCache } from "./cache";
import type { CacheOptions } from "./cache";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface ApiClient {
  get<T>(path: string, params?: QueryParams): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string, params?: QueryParams, body?: unknown): Promise<T>;
  /** Drop cached GET responses whose URL starts with the given path prefix. */
  invalidateCache: (prefix: string) => void;
}

export interface ApiClientOptions {
  baseUrl?: string;
  accessToken?: string | (() => string | null);
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
  cache?: boolean | CacheOptions;
  /** Called once on 401 — return true to retry the request with a fresh token. */
  onUnauthorized?: () => Promise<boolean>;
}

function buildUrl(baseUrl: string, path: string, params?: QueryParams): string {
  const url = new URL(path, baseUrl || "http://localhost");
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return baseUrl ? url.toString() : `${url.pathname}${url.search}`;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const {
    baseUrl = "",
    accessToken,
    headers = {},
    fetchImpl = fetch,
    onUnauthorized,
  } = options;

  const cacheOption = options.cache ?? true;
  const cache =
    cacheOption === false
      ? null
      : new RequestCache(typeof cacheOption === "object" ? cacheOption.ttlMs : undefined);
  const inflight = new Map<string, Promise<unknown>>();

  async function performRequest<T>(
    method: string,
    path: string,
    params?: QueryParams,
    body?: unknown,
    allowRetry = true,
  ): Promise<T> {
    const url = buildUrl(baseUrl, path, params);
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (accessToken) {
      const token = typeof accessToken === "function" ? accessToken() : accessToken;
      if (token) requestHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImpl(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401 && allowRetry && onUnauthorized) {
      const refreshed = await onUnauthorized();
      if (refreshed) {
        return performRequest<T>(method, path, params, body, false);
      }
    }

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      const message =
        (json && typeof json.error === "string" && json.error) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    const json = await response.json().catch(() => null);
    if (!json || json.success !== true) {
      throw new ApiError(
        (json && typeof json.error === "string" && json.error) || "Malformed response",
        response.status,
      );
    }
    return json.data as T;
  }

  async function request<T>(
    method: string,
    path: string,
    params?: QueryParams,
    body?: unknown,
  ): Promise<T> {
    if (method !== "GET" || !cache) {
      return performRequest<T>(method, path, params, body);
    }

    const url = buildUrl(baseUrl, path, params);
    const cacheKey = `${method} ${url}`;

    const cached = cache.get<T>(cacheKey);
    if (cached.hit) return cached.value;

    const pending = inflight.get(cacheKey) as Promise<T> | undefined;
    if (pending) return pending;

    const promise = performRequest<T>(method, path, params, body).then((data) => {
      cache.set(cacheKey, data);
      return data;
    });

    inflight.set(cacheKey, promise);
    promise.then(
      () => inflight.delete(cacheKey),
      () => inflight.delete(cacheKey),
    );

    return promise;
  }

  return {
    get: <T>(path: string, params?: QueryParams) => request<T>("GET", path, params),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, undefined, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, undefined, body),
    delete: <T>(path: string, params?: QueryParams, body?: unknown) =>
      request<T>("DELETE", path, params, body),
    invalidateCache: (prefix: string) => cache?.invalidate(prefix),
  };
}
