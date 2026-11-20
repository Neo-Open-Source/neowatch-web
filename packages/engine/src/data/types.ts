import type { CatalogKind } from "../lib/api/types";
import type { EntryStatus } from "../lib/entry-status";
import type { PosterItem } from "../lib/poster-item";

export interface DetailRelated {
  badge: string;
  name: string;
  meta: string;
  href: string;
}

export interface DetailCharacter {
  name: string;
  role: string;
  va: string;
}

export interface DetailData {
  title: string;
  titleOriginal: string;
  poster?: string | undefined;
  banner?: string | undefined;
  rating: number;
  votes: string;
  entry: { status: EntryStatus; eps: number; score: number } | null;
  progress: { done: number; total: number };
  voiceLanguage: string;
  names: { ru: string; en: string; original: string; alternatives: string[] };
  info: [string, string][];
  tags: string[];
  description: string;
  related: DetailRelated[];
  similar: DetailRelated[];
  mainChars: DetailCharacter[];
  sideChars: DetailCharacter[];
}

export interface EpisodeItem {
  key: string;
  title: string;
  poster: string | null;
  kind: CatalogKind;
  label: string;
  time: string;
  day: string;
  month: string;
  weekday: string;
  date: string;
}

export interface CollectionSummary {
  slug: string;
  title: string;
  kind: CatalogKind;
  total: number;
  covers: string[];
}

export interface HomeData {
  recent: PosterItem[];
  popular: PosterItem[];
  episodes: EpisodeItem[];
  collections: CollectionSummary[];
  genres: string[];
}

export interface ContentSource {
  home(kinds: CatalogKind[]): Promise<HomeData>;
  catalog(kind?: CatalogKind): Promise<PosterItem[]>;
  calendar(): Promise<EpisodeItem[]>;
  collections(): Promise<CollectionSummary[]>;
}
