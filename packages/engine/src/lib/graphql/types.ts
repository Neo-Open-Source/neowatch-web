import type { CatalogKind, Page } from "../api/types";

export interface ShelfCard {
  key: string;
  kind: CatalogKind;
  title: string;
  titleOriginal: string | null;
  titleEnglish: string | null;
  year: number | null;
  poster: string | null;
  backdrop?: string | null;
  rating: number;
  genresRu: string[];
  tagsRu: string[];
  ageRating: string | null;
  description: string | null;
  available: boolean;
}

export interface SearchData {
  search: Page<ShelfCard>;
}
