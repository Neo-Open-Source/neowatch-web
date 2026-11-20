import { apiOrigin } from "../config";
import { fetchWithRetry } from "../http/fetch";

export class GraphQLError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GraphQLError";
  }
}

interface GraphQLPayload<T> {
  data?: T;
  errors?: { message: string }[];
}

export async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetchWithRetry(`${apiOrigin()}/api/v1/graphql`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as GraphQLPayload<T> | null;
  const message = payload?.errors?.[0]?.message ?? `${response.status} ${response.statusText}`;
  if (!response.ok || !payload?.data) throw new GraphQLError(response.status, message);
  return payload.data;
}
