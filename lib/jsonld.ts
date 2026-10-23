// schema.org JSON-LD builders (server-only). Rendered by <JsonLd> via React 19
// head hoisting, so search engines get rich structured data per language
// variant (?lang= URLs, matching canonical/og:url).

import { getMetadataBase, langUrl } from "@/lib/metadata";
import { hreflangOf, type Locale } from "@/lib/i18n";
import type { MovieDetails, PersonDetails, Season, SeasonDetails, TVDetails } from "@/lib/api/types";
import { toApiLanguage } from "@/lib/api/types";
import { backdropTextUrl } from "@/lib/api/media";

/** ISO 8601 duration ("PT2H21M") from a minutes value. */
function isoDuration(minutes: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `PT${h}H${m}M` : `PT${m}M`;
}

function aggregateRating(data: { voteAverage: number; voteCount: number }) {
  if (data.voteAverage <= 0) return undefined;
  return {
    "@type": "AggregateRating",
    ratingValue: Number(data.voteAverage.toFixed(1)),
    bestRating: 10,
    worstRating: 0,
    ...(data.voteCount > 0 ? { ratingCount: data.voteCount } : {}),
  };
}

function schemaPeople(list: { name: string }[] | undefined, max: number) {
  if (!list || list.length === 0) return undefined;
  return list.slice(0, max).map((p) => ({ "@type": "Person", name: p.name }));
}

interface MediaLdInput {
  type: "movie" | "tv";
  data: MovieDetails | TVDetails;
  locale: Locale;
  /** Canonical path of the page, e.g. "/movie/123". */
  path: string;
}

/** JSON-LD for a movie (/movie/[id]) or TV series (/tv/[id]) page. */
export async function mediaJsonLd({ type, data, locale, path }: MediaLdInput) {
  const base = await getMetadataBase();
  const url = new URL(langUrl(path, locale), base).toString();
  const image = backdropTextUrl(data.tmdbId, type, toApiLanguage(locale));
  const genre = data.genres?.map((g) => g.name);

  const common = {
    "@context": "https://schema.org",
    name: data.title,
    description: data.overview?.trim() || undefined,
    image,
    datePublished: data.releaseDate || undefined,
    inLanguage: hreflangOf(locale),
    genre,
    aggregateRating: aggregateRating(data),
    director: schemaPeople(data.credits?.crew?.filter((c) => c.job === "Director"), 3),
    actor: schemaPeople(data.credits?.cast, 12),
    url,
  };

  if (type === "movie") {
    return {
      ...common,
      "@type": "Movie",
      duration: isoDuration("runtime" in data ? data.runtime : null),
    };
  }

  const tv = data as TVDetails;
  return {
    ...common,
    "@type": "TVSeries",
    numberOfSeasons: tv.numberOfSeasons || undefined,
    containsSeason: tv.seasons?.slice(0, 10).map((s) => ({
      "@type": "TVSeason",
      name: s.name,
      seasonNumber: s.seasonNumber,
      url,
    })),
  };
}

interface PersonLdInput {
  person: PersonDetails;
  locale: Locale;
  /** Canonical path of the page, e.g. "/person/123". */
  path: string;
}

/** JSON-LD for a person (/person/[id]) page. */
export async function personJsonLd({ person, locale, path }: PersonLdInput) {
  const base = await getMetadataBase();
  const url = new URL(langUrl(path, locale), base).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    image: person.profile || undefined,
    url,
    jobTitle: person.department || undefined,
    inLanguage: hreflangOf(locale),
  };
}

interface SeasonLdInput {
  tv: TVDetails;
  season: SeasonDetails | Season;
  locale: Locale;
  /** Canonical path of the page, e.g. "/tv/123/season/1". */
  path: string;
}

/** JSON-LD for a TV season (/tv/[id]/season/[n]) page. */
export async function seasonJsonLd({ tv, season, locale, path }: SeasonLdInput) {
  const base = await getMetadataBase();
  const url = new URL(langUrl(path, locale), base).toString();
  const image = backdropTextUrl(tv.tmdbId, "tv", toApiLanguage(locale));
  const episodeCount = season.episodeCount ?? ("episodes" in season ? season.episodes?.length : undefined);

  return {
    "@context": "https://schema.org",
    "@type": "TVSeason",
    name: season.name,
    seasonNumber: season.seasonNumber,
    description: season.overview?.trim() || tv.overview?.trim() || undefined,
    image,
    datePublished: season.airDate || undefined,
    inLanguage: hreflangOf(locale),
    numberOfEpisodes: episodeCount || undefined,
    partOfSeries: {
      "@type": "TVSeries",
      name: tv.title,
      url: new URL(`/tv/${tv.tmdbId}`, base).toString(),
    },
    url,
  };
}
