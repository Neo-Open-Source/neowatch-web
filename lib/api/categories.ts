import type { ApiClient, QueryParams } from "./client";
import { DEFAULT_LANGUAGE } from "./types";
import type { ApiLanguage, CategorySection, CollectionResponse } from "./types";

export function categoriesEndpoints(client: ApiClient) {
  return {
    list: (language: ApiLanguage = DEFAULT_LANGUAGE) =>
      client.get<CategorySection[]>("/api/v1/categories", { language }),

    collection: (id: string, opts: { language?: ApiLanguage; page?: number } = {}) => {
      const params: QueryParams = { language: opts.language ?? DEFAULT_LANGUAGE };
      if (opts.page !== undefined) params.page = opts.page;
      return client.get<CollectionResponse>(`/api/v1/collection/${id}`, params);
    },
  };
}

export type CategoriesApi = ReturnType<typeof categoriesEndpoints>;
