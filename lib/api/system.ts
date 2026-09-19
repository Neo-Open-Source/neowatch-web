import type { ApiClient } from "./client";
import type { HealthResponse, Supporter } from "./types";

export function systemEndpoints(client: ApiClient) {
  return {
    health: () => client.get<HealthResponse>("/api/v1/health"),
    supporters: () => client.get<Supporter[]>("/api/v1/support/list"),
  };
}

export type SystemApi = ReturnType<typeof systemEndpoints>;
