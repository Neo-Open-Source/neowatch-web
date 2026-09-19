"use client";

import { useState, useRef, useEffect, useCallback, startTransition, type KeyboardEvent } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { SearchItem } from "@/lib/api/types";
import { releaseYear } from "@/lib/utils/media-format";
import { cx } from "@/lib/utils/cx";
import { NAVBAR_SEARCH_FOCUS_KEY, NAVBAR_FOCUS_KEY, CONTENT_FOCUS_KEY } from "@/components/Header";
import { markHeaderNav } from "@/lib/state/navigation-source";

const MAX_RESULTS = 6;

const itemLabel = (item: SearchItem) =>
  item.mediaType === "person" ? item.name : item.title;

const itemSubtitle = (item: SearchItem) => {
  if (item.mediaType === "person") return item.department ?? "";
  const year = releaseYear(item.releaseDate);
  const typeLabel = item.mediaType === "movie" ? "Movie" : "TV";
  return [year, typeLabel].filter(Boolean).join(" · ");
};

const itemThumb = (item: SearchItem) =>
  item.mediaType === "person" ? item.profile : item.poster;

export function SearchBar() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<SearchItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 300);

  // Spatial nav — only for navigating between header items with arrow keys
  const { ref, focused } = useFocusable({
    focusKey: NAVBAR_SEARCH_FOCUS_KEY,
    onEnterPress: () => inputRef.current?.focus(),
    onArrowPress: (dir) => {
      // While input is focused — keyboard handles everything, block spatial nav
      if (inputFocused) return false;
      if (dir === "down") { setFocus(CONTENT_FOCUS_KEY); return false; }
      if (dir === "up") { setFocus(NAVBAR_FOCUS_KEY); return false; }
      return true;
    },
  });

  // Fetch results
  useEffect(() => {
    const q = debouncedQuery.trim();
    let cancelled = false;
    if (q.length === 0) { startTransition(() => { setResults(null); setActiveIndex(-1); }); return; }
    api.media
      .search({ q, language: toApiLanguage(locale), type: "multi", page: 1 })
      .then((res) => { if (!cancelled) { setResults(res.items.slice(0, MAX_RESULTS)); setActiveIndex(-1); } })
      .catch(() => { if (!cancelled) setResults([]); });
    return () => { cancelled = true; };
  }, [debouncedQuery, locale]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = useCallback((value: string) => {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
    inputRef.current?.blur();
    markHeaderNav(`/search`);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }, [router]);

  const openItem = useCallback((item: SearchItem) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
    inputRef.current?.blur();
    const path = item.mediaType === "person" ? `/person/${item.tmdbId}` : `/${item.mediaType}/${item.tmdbId}`;
    markHeaderNav(path);
    router.push(path);
  }, [router]);

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const count = results?.length ?? 0;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && query.trim()) { setOpen(true); setActiveIndex(0); return; }
      if (count > 0) setActiveIndex((i) => Math.min(i + 1, count - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeIndex <= 0) { setOpen(false); setActiveIndex(-1); }
      else setActiveIndex((i) => i - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results?.[activeIndex]) {
        openItem(results[activeIndex]);
      } else {
        submit(query);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="search-bar-root">
      <div
        ref={ref}
        className={cx(
          "search-bar",
          (inputFocused || showDropdown) && "search-bar--focused",
          focused && !inputFocused && !showDropdown && "search-bar--spatial",
        )}
      >
        <Search size={13} className="search-bar__icon" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          aria-label={t.nav.search}
          className="search-bar__input"
          onFocus={() => { setInputFocused(true); if (query.trim()) setOpen(true); }}
          onBlur={() => setInputFocused(false)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={onInputKeyDown}
        />
        <button
          type="button"
          className="search-bar__clear"
          aria-label={t.search.clear}
          onClick={() => { setQuery(""); setResults(null); setOpen(false); inputRef.current?.focus(); }}
          style={{ visibility: query.length > 0 ? "visible" : "hidden", pointerEvents: query.length > 0 ? "auto" : "none" }}
        >
          <X size={12} />
        </button>
      </div>

      {showDropdown && (
        <div className="search-bar__dropdown">
          {results === null ? (
            <div className="search-bar__dropdown-status">
              <Loader2 size={13} className="search-bar__dropdown-spinner" />
              <span>{t.search.loading}</span>
            </div>
          ) : results.length === 0 ? (
            <p className="search-bar__dropdown-status">{t.search.noResults}</p>
          ) : (
            <div className="search-bar__results">
              {results.map((item, i) => (
                <button
                  key={`${item.mediaType}-${item.tmdbId}`}
                  type="button"
                  className={cx("search-bar__result", i === activeIndex && "search-bar__result--focused")}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => { e.preventDefault(); openItem(item); }}
                >
                  <span className="search-bar__result-thumb">
                    {itemThumb(item) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={itemThumb(item)!} alt="" draggable={false} />
                    ) : (
                      <span className="search-bar__result-thumb--missing" />
                    )}
                  </span>
                  <span className="search-bar__result-meta">
                    <span className="search-bar__result-title">{itemLabel(item)}</span>
                    <span className="search-bar__result-subtitle">{itemSubtitle(item)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
