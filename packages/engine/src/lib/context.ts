import type { APIContext } from "astro";
import { createApi } from "./api";
import { resolveSession, type SessionInfo } from "./auth/session";
import { siteOrigin } from "./config";

export interface RequestContext {
  site: string;
  session: SessionInfo | null;
  favorites: Set<string>;
  api: ReturnType<typeof createApi>;
}

export async function requestContext({ cookies, request }: APIContext): Promise<RequestContext> {
  const anonymous = createApi();
  const session = await resolveSession(cookies, anonymous);
  if (!session) {
    return { site: siteOrigin(request), session: null, favorites: new Set(), api: anonymous };
  }

  const api = createApi(session.accessToken);
  const favorites = await api.account.favorites("media");
  return { site: siteOrigin(request), session, favorites: new Set(favorites.map((item) => item.id)), api };
}
