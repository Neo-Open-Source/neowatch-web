import type { Card } from "./types";

export type WireCard = Omit<
  Card,
  "genres" | "genresRu" | "tags" | "tagsRu" | "countries" | "studios" | "votes"
> & {
  genres?: string[];
  genresRu?: string[];
  tags?: string[];
  tagsRu?: string[];
  countries?: string[];
  studios?: string[];
  votes?: number;
};

export function normalizeCard(card: WireCard): Card {
  return {
    ...card,
    genres: card.genres ?? [],
    genresRu: card.genresRu ?? [],
    tags: card.tags ?? [],
    tagsRu: card.tagsRu ?? [],
    countries: card.countries ?? [],
    studios: card.studios ?? [],
    votes: card.votes ?? 0,
  };
}
