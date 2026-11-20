export type SearchState = "initial" | "loading" | "empty" | "error";

export const SEARCH_PAGE_SIZE = 12;

export interface SearchItem {
  key: string;
  kind: string;
  title: string;
  titleEnglish: string | null;
  titleOriginal: string | null;
  year: number | null;
  poster: string | null;
}

export interface SearchResultPage {
  page: number;
  hasMore: boolean;
  totalResults: number;
  items: SearchItem[];
}
