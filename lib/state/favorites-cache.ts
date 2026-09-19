import type { FavoriteItem, MediaType } from "@/lib/api/types";
import { getStoredUser } from "@/lib/state/auth-session";

const FAVORITES_KEY = "nw_favorites";
// Per-title favorite checks/toggles, keyed `userId → mediaType:mediaId` — lets
// the detail-page button render the correct state instantly (no network wait)
// and only reconciles with the server in the background. Scoped by user so
// signing in as a different person never leaks the previous owner's state.
const CHECK_KEY = "nw_fav_checks";

export interface FavoritesSnapshot {
  items: FavoriteItem[];
  totalResults: number;
  updatedAt: number;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Best-known favorites snapshot, persisted so the home watchlist row can
 * render instantly on the next visit (the site "knows" the count up front).
 */
export function getFavoritesSnapshot(): FavoritesSnapshot | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return null;
  try {
    const snap = JSON.parse(raw) as Partial<FavoritesSnapshot>;
    if (!Array.isArray(snap.items) || typeof snap.totalResults !== "number") {
      return null;
    }
    return snap as FavoritesSnapshot;
  } catch {
    return null;
  }
}

export function setFavoritesSnapshot(items: FavoriteItem[], totalResults: number): void {
  if (!canUseStorage()) return;
  const snapshot: FavoritesSnapshot = { items, totalResults, updatedAt: Date.now() };
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(snapshot));
  } catch {
    /* storage full / unavailable — ignore, the row falls back to skeletons */
  }
}

export function clearFavoritesSnapshot(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(FAVORITES_KEY);
}

function readCheckStore(): Record<string, Record<string, boolean>> {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(CHECK_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Record<string, boolean>>) : {};
  } catch {
    return {};
  }
}

/** Remember the last known favorite state for a title (from toggle/check). */
export function rememberFavoriteState(mediaId: number, mediaType: MediaType, isFavorite: boolean): void {
  if (!canUseStorage()) return;
  const userId = getStoredUser()?.id;
  if (!userId) return;
  const store = readCheckStore();
  store[userId] = { ...(store[userId] ?? {}), [`${mediaType}:${mediaId}`]: isFavorite };
  try {
    localStorage.setItem(CHECK_KEY, JSON.stringify(store));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

/** Last known favorite state for a title, or null when never seen locally. */
export function recalledFavoriteState(mediaId: number, mediaType: MediaType): boolean | null {
  const userId = getStoredUser()?.id;
  if (!userId) return null;
  const value = readCheckStore()[userId]?.[`${mediaType}:${mediaId}`];
  return typeof value === "boolean" ? value : null;
}

/** Forget all per-title states (sign-out / account switch). */
export function clearFavoriteChecks(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(CHECK_KEY);
  } catch {
    /* ignore */
  }
}
