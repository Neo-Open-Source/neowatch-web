import type { ApiClient, QueryParams } from "./client";
import { DEFAULT_LANGUAGE } from "./types";
import type { ApiLanguage, Paginated, PersonCreditItem, PersonDetails } from "./types";

export interface PersonOptions {
  language?: ApiLanguage;
  page?: number;
}

function withDefaults(opts: PersonOptions = {}): QueryParams {
  const params: QueryParams = { language: opts.language ?? DEFAULT_LANGUAGE };
  if (opts.page !== undefined) params.page = opts.page;
  return params;
}

export function personEndpoints(client: ApiClient) {
  return {
    detail: (id: number, opts?: PersonOptions) =>
      client.get<PersonDetails>(`/api/v1/person/${id}`, withDefaults(opts)),

    credits: (id: number, opts?: PersonOptions) =>
      client.get<Paginated<PersonCreditItem>>(`/api/v1/person/${id}/credits`, withDefaults(opts)),
  };
}

export type PersonApi = ReturnType<typeof personEndpoints>;
