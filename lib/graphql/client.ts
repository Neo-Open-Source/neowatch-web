import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { getConfig } from "@/lib/constants/config";
import { getStoredAccessToken } from "@/lib/state/auth-session";

type PaginatedItems = {
  items?: ReadonlyArray<{ tmdbId?: number; mediaType?: string | null } | null>;
  page?: number;
  [key: string]: unknown;
};

// Page 1 is a full snapshot (replace); later pages append. Without this,
// network-only refetches merge page 1 onto itself and triple the shelf.
function mergePaginated(
  existing: PaginatedItems | undefined,
  incoming: PaginatedItems,
  { args }: { args?: { page?: number | null } | null },
): PaginatedItems {
  if (!existing?.items) return incoming;
  const page = args?.page ?? incoming.page ?? 1;
  if (page <= 1) return incoming;
  const seen = new Set(
    existing.items.map((item) => `${item?.mediaType ?? ""}:${item?.tmdbId ?? ""}`),
  );
  const appended = (incoming.items ?? []).filter((item) => {
    const key = `${item?.mediaType ?? ""}:${item?.tmdbId ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    ...incoming,
    items: [...existing.items, ...appended],
  };
}

export function createApolloClient() {
  const apiUrl = getConfig().apiUrl;

  const wrappedLink = new HttpLink({
    uri: `${apiUrl}/graphql`,
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      const token = getStoredAccessToken();
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    },
  });

  return new ApolloClient({
    link: wrappedLink,
    cache: new InMemoryCache({
      // Without this Apollo drops interface-fragment fields (MediaItemFields on
      // MediaFields) on cache reads — poster/title/tmdbId go missing, cards go
      // gray, and list dedupe collapses items that share tmdbId=undefined.
      possibleTypes: {
        MediaFields: ["MediaItem", "FavoriteMediaItem"],
        MediaDetail: ["MovieDetail", "TVDetail"],
        SearchItem: ["MediaItem", "PersonSearchItem"],
      },
      typePolicies: {
        Query: {
          fields: {
            trending: {
              keyArgs: ["type", "language"],
              merge: mergePaginated,
            },
            movieList: {
              keyArgs: ["list", "language"],
              merge: mergePaginated,
            },
            tvList: {
              keyArgs: ["list", "language"],
              merge: mergePaginated,
            },
            search: {
              keyArgs: ["q", "type", "genre", "language"],
              merge: mergePaginated,
            },
            similar: {
              keyArgs: ["type", "id", "language"],
              merge: mergePaginated,
            },
            recommendations: {
              keyArgs: ["type", "id", "language"],
              merge: mergePaginated,
            },
            relatedByCast: {
              keyArgs: ["type", "id", "language"],
              merge: mergePaginated,
            },
            relatedByStudio: {
              keyArgs: ["type", "id", "language"],
              merge: mergePaginated,
            },
            favorites: {
              keyArgs: false,
              merge: mergePaginated,
            },
            genres: {
              merge: () => undefined,
            },
            categories: {
              merge: () => undefined,
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
      query: { fetchPolicy: "cache-first" },
    },
  });
}
