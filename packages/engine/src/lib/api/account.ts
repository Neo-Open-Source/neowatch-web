import type {
  EntryInput,
  EntryView,
  FavoriteInput,
  FavoriteType,
  FavoriteView,
  LoginTicket,
  Session,
  User,
} from "./account-types";
import type { ApiClient } from "./client";
import { query } from "./client";

export function createAccountApi(client: ApiClient) {
  return {
    login(params: { redirectUri: string; state: string }): Promise<LoginTicket> {
      const path = `/api/v1/auth/login${query({ redirect_uri: params.redirectUri, state: params.state })}`;
      return client.get<LoginTicket>(path);
    },

    callback(code: string, redirectUri: string): Promise<Session> {
      const path = `/api/v1/auth/mobile-callback${query({ code, redirect_uri: redirectUri })}`;
      return client.get<Session>(path);
    },

    refresh(refreshToken: string): Promise<Session> {
      return client.post<Session>("/api/v1/auth/refresh", { refreshToken });
    },

    logout(refreshToken: string): Promise<void> {
      return client.post<void>("/api/v1/auth/logout", { refreshToken });
    },

    me(): Promise<User> {
      return client.get<User>("/api/v1/auth/me");
    },

    favorites(type: FavoriteType): Promise<FavoriteView[]> {
      return client.get<FavoriteView[]>(`/api/v1/me/favorites${query({ type })}`);
    },

    addFavorite(type: FavoriteType, id: string, snapshot: FavoriteInput): Promise<FavoriteView> {
      return client.put<FavoriteView>(`/api/v1/me/favorites/${type}/${encodeURIComponent(id)}`, snapshot);
    },

    removeFavorite(type: FavoriteType, id: string): Promise<void> {
      return client.del<void>(`/api/v1/me/favorites/${type}/${encodeURIComponent(id)}`);
    },

    upsertEntry(key: string, input: EntryInput): Promise<EntryView> {
      return client.put<EntryView>(`/api/v1/me/entries/${encodeURIComponent(key)}`, input);
    },
  };
}
