import type { ApiClient } from "./client";
import { DEFAULT_LANGUAGE } from "./types";
import type { ApiLanguage, GenresResponse } from "./types";

export function genresEndpoints(client: ApiClient) {
  return {
    list: (language: ApiLanguage = DEFAULT_LANGUAGE) =>
      client.get<GenresResponse>("/api/v1/genres", { language }),
  };
}

export type GenresApi = ReturnType<typeof genresEndpoints>;
