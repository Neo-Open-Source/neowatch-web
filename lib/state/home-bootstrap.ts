import type { CategorySection } from "@/lib/api/types";
import type { EnrichedSyncProgressItem, FavoriteItem, Paginated } from "@/lib/api/types";
import type { AuthUser } from "@/lib/api/auth";

export interface HomePersonalSnapshot {
  user: AuthUser;
  syncProgress: EnrichedSyncProgressItem[];
  favorites: Paginated<FavoriteItem>;
  language: string;
}

let personal: HomePersonalSnapshot | null = null;
let categories: { language: string; sections: CategorySection[] } | null = null;

export function setHomePersonal(snapshot: HomePersonalSnapshot | null): void {
  personal = snapshot;
}

export function getHomePersonal(): HomePersonalSnapshot | null {
  return personal;
}

export function clearHomePersonal(): void {
  personal = null;
}

export function setHomeCategories(language: string, sections: CategorySection[]): void {
  categories = { language, sections };
}

export function getHomeCategories(language: string): CategorySection[] | null {
  if (!categories || categories.language !== language) return null;
  return categories.sections;
}
