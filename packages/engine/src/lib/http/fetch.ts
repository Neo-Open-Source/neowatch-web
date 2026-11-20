const RETRYABLE = new Set(["terminated", "ECONNRESET", "socket hang up", "fetch failed"]);

export interface FetchOptions {
  timeoutMs?: number;
  attempts?: number;
}

export async function fetchWithRetry(
  input: string,
  init: RequestInit = {},
  { timeoutMs = 20_000, attempts = 2 }: FetchOptions = {},
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      return await fetch(input, { ...init, signal: init.signal ?? signal });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!RETRYABLE.has(message) || attempt === attempts - 1) throw error;
    }
  }

  throw lastError;
}
