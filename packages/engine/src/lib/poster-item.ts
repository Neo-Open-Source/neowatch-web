import type { CatalogKind } from "./api/types";

export interface PosterItem {
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
  ageRating: string | null;
  description: string | null;
  available: boolean;
}
