export interface RecentItem {
  key: string;
  kind: string;
  title: string;
  titleEnglish: string | null;
  titleOriginal: string | null;
  poster: string | null;
}

const HISTORY_KEY = "nw_search_history";
const RECENT_KEY = "nw_search_recent";
const HISTORY_LIMIT = 8;
const RECENT_LIMIT = 6;
const HISTORY_MIN_LENGTH = 3;

function read<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readHistory(): string[] {
  return read<string>(HISTORY_KEY).filter((item) => typeof item === "string" && item !== "");
}

export function addHistory(query: string): void {
  const value = query.trim().replace(/\s+/g, " ");
  if (value.length < HISTORY_MIN_LENGTH) return;
  const next = [value, ...readHistory().filter((item) => item.toLowerCase() !== value.toLowerCase())];
  write(HISTORY_KEY, next.slice(0, HISTORY_LIMIT));
}

export function removeHistory(query: string): void {
  write(
    HISTORY_KEY,
    readHistory().filter((item) => item !== query),
  );
}

export function clearHistory(): void {
  write(HISTORY_KEY, []);
}

export function readRecent(): RecentItem[] {
  return read<RecentItem>(RECENT_KEY).filter(
    (item) => typeof item?.key === "string" && typeof item?.title === "string",
  );
}

export function addRecent(item: RecentItem): void {
  if (!item.key || !item.title) return;
  const next = [item, ...readRecent().filter((entry) => entry.key !== item.key)];
  write(RECENT_KEY, next.slice(0, RECENT_LIMIT));
}
