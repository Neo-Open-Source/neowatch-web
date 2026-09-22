/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { getConfig } from "@/lib/constants/config";
import { getStoredAccessToken } from "@/lib/state/auth-session";

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
      typePolicies: {
        Query: {
          fields: {
            trending: {
              keyArgs: ["type"],
              merge(existing: any, incoming: any) {
                if (!existing) return incoming;
                return {
                  ...incoming,
                  items: [...existing.items, ...incoming.items],
                };
              },
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
