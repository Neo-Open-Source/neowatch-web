import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createApi, proxiedImage } from "../lib/api";
import { normalizeCard } from "../lib/api/normalize";
import { resolveSession } from "../lib/auth/session";
import { gql } from "../lib/graphql/client";
import { SEARCH_QUERY } from "../lib/graphql/documents";
import type { SearchData } from "../lib/graphql/types";
import { catalogKinds } from "../lib/kinds";
import { entryStatuses } from "../lib/entry-status";
import { SEARCH_PAGE_SIZE } from "../lib/search/types";

export const server = {
  catalog: {
    toggleFavorite: defineAction({
      accept: "json",
      input: z.object({
        key: z.string(),
        title: z.string(),
        poster: z.string().optional(),
        subtitle: z.string().optional(),
      }),
      handler: async (input, context) => {
        const session = await resolveSession(context.cookies, createApi());
        if (!session) return { signedIn: false, favorite: false };

        const api = createApi(session.accessToken);
        const favorites = await api.account.favorites("media");
        if (favorites.some((favorite) => favorite.id === input.key)) {
          await api.account.removeFavorite("media", input.key);
          return { signedIn: true, favorite: false };
        }

        await api.account.addFavorite("media", input.key, {
          title: input.title,
          ...(input.poster ? { image: input.poster } : {}),
          ...(input.subtitle ? { subtitle: input.subtitle } : {}),
        });
        return { signedIn: true, favorite: true };
      },
    }),

    setEntryStatus: defineAction({
      accept: "json",
      input: z.object({
        key: z.string(),
        kind: z.string(),
        title: z.string(),
        poster: z.string().optional(),
        status: z.enum(entryStatuses),
      }),
      handler: async (input, context) => {
        const session = await resolveSession(context.cookies, createApi());
        if (!session) return { signedIn: false, status: null };

        const api = createApi(session.accessToken);
        const entry = await api.account.upsertEntry(input.key, {
          status: input.status,
          kind: input.kind,
          title: input.title,
          poster: input.poster,
        });
        return { signedIn: true, status: entry.status };
      },
    }),

    search: defineAction({
      accept: "json",
      input: z.object({
        q: z.string().min(2).max(120),
        kind: z.enum(catalogKinds).optional(),
        page: z.number().int().min(1).max(50).optional(),
      }),
      handler: async (input) => {
        const api = createApi();
        const page = input.page ?? 1;
        const limit = SEARCH_PAGE_SIZE;
        const variables = { q: input.q, kind: input.kind, page, limit };

        const result = await gql<SearchData>(SEARCH_QUERY, variables).then((data) => ({
          items: data.search.items,
          hasMore: data.search.totalPages > page,
          totalResults: data.search.totalResults,
        }));

        return {
          page,
          hasMore: result.hasMore,
          totalResults: result.totalResults,
          items: result.items.map((card) => ({
            key: card.key,
            kind: card.kind,
            title: card.title,
            titleEnglish: card.titleEnglish,
            titleOriginal: card.titleOriginal,
            year: card.year,
            poster: proxiedImage(api.origin, card.poster),
          })),
        };
      },
    }),
  },
};
