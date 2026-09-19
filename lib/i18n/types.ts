// i18n: типы и общие константы — единственный источник типов интерфейса.

export const SITE_NAME = "NeoWatch";

export const LOCALE_COOKIE = "nw-locale";

export const languages = [
  { code: "en", label: "EN", flag: "/flags/gb.webp" },
  { code: "ru", label: "RU", flag: "/flags/ru.webp" },
  { code: "uk", label: "UK", flag: "/flags/ua.webp" },
] as const;

export type Locale = (typeof languages)[number]["code"];

export const DEFAULT_LOCALE: Locale = "ru";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && languages.some((l) => l.code === value);
}

/** hreflang-style code for a locale, e.g. "ru" → "ru-RU". Used in ?lang= URLs. */
const HREFLANG_CODES: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  uk: "uk-UA",
};

export function hreflangOf(locale: Locale): string {
  return HREFLANG_CODES[locale];
}

/**
 * Normalizes a `?lang=` value (ru, ru-RU, ru_RU, en-US…) to a Locale, or null
 * when it's absent or not one of the supported languages.
 */
export function normalizeLangParam(
  value: string | string[] | undefined | null,
): Locale | null {
  if (value == null) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const match = /^([a-z]{2})(?:[-_][a-zA-Z]{2,4})?$/i.exec(raw.trim());
  if (!match) return null;
  const code = match[1].toLowerCase();
  return isLocale(code) ? code : null;
}

export interface Dict {
  meta: {
    home: string;
    categories: string;
    studios: string;
    watchlist: string;
    search: string;
    popular: string;
    topRated: string;
  };
  nav: {
    search: string;
    home: string;
    popular: string;
    topRated: string;
    categories: string;
    studios: string;
    allCategories: string;
    watchlist: string;
    signIn: string;
    signOut: string;
    profile: string;
  };
  auth: {
    signingIn: string;
    failed: string;
  };
  home: {
    continueWatching: string;
    genres: string;
    popular: string;
    popularStudios: string;
    watchlist: string;
    topMovies: string;
    topSeries: string;
    error: string;
    seeAll: string;
  };
  watchlist: {
    title: string;
    empty: string;
    signInPrompt: string;
    signIn: string;
  };
  categories: {
    title: string;
  };
  studios: {
    title: string;
  };
  search: {
    placeholder: string;
    submit: string;
    clear: string;
    resultsFor: string;
    noResults: string;
    loading: string;
    error: string;
    seeAll: string;
    filters: {
      type: string;
      typeAll: string;
      typeMovie: string;
      typeTV: string;
      genre: string;
      genreAll: string;
      yearFrom: string;
      yearTo: string;
      ratingFrom: string;
      ratingTo: string;
      apply: string;
      reset: string;
    };
  };
  card: {
    tmdb: string;
    imdb: string;
    resume: string;
  };
  detail: {
    watch: string;
    watchTrailer: string;
    addToWatchlist: string;
    inWatchlist: string;
    share: string;
    linkCopied: string;
    addedToWatchlist: string;
    removedFromWatchlist: string;
    watchlistError: string;
    markWatched: string;
    seasons: string;
    seasonsLabel: (n: number) => string;
    cast: string;
    trailers: string;
    similar: string;
    relatedCast: string;
    relatedStudio: string;
    director: string;
    season: string;
    episodeLabel: (n: number) => string;
    episodes: string;
  };
  /** Share-preview (OG image) labels. */
  og: {
    movie: string;
    tv: string;
  };
  list: {
    loadMore: string;
    allLoaded: string;
  };
  person: {
    filmography: string;
    department: string;
  };
  terms: {
    title: string;
    notice: string;
    link: string;
    url: string;
    accept: string;
    decline: string;
    /** Shown in the consent gate before the first video play. */
    gateNotice: string;
  };
  /** Full text of the /terms page. */
  termsPage: {
    title: string;
    updated: string;
    intro: string;
    sections: Array<{ heading: string; body: string }>;
  };
  player: {
    episodes: string;
    season: string;
    loading: string;
    close: string;
    noEpisodes: string;
  };
  a11y: {
    logo: string;
    scrollLeft: string;
    scrollRight: string;
    langPicker: string;
    back: string;
  };
  footer: {
    ecosystem: string;
    community: string;
    blog: string;
    api: string;
    neoid: string;
    telegram: string;
    github: string;
    tos: string;
    copyright: string;
  };
}

