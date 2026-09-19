"use client";

import { useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { CategorySection, GenresResponse } from "@/lib/api/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { PageTitle } from "@/components/ui/PageTitle";
import { InfiniteMediaGrid } from "@/components/sections/InfiniteMediaGrid";

const GENRES_SECTION = "Genres";

export default function CategoryCollectionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { locale } = useI18n();
  const lang = toApiLanguage(locale);

  const { data: sections, loading: sectionsLoading } = useAsyncResource<CategorySection[]>(
    () => api.categories.list(lang),
    [lang],
  );
  const { data: genreLists } = useAsyncResource<GenresResponse>(
    () => api.genres.list(lang),
    [lang],
  );

  const genre = sections
    ?.find((s) => s.section === GENRES_SECTION)
    ?.items.find((g) => g.id === id);

  // Same rule as the categories page: the collection endpoint tries movie
  // discover first, so a genre is "movie" unless it is TV-only.
  const movieGenreIds = new Set(genreLists?.movie.map((g) => g.id) ?? []);
  const mediaType = genre
    ? (movieGenreIds.has(parseInt(genre.id.replace(/\D+/g, ""), 10)) ? "movie" : "tv")
    : "movie";

  const loader = useCallback(
    (page: number) => {
      if (!genre) return Promise.reject(new Error("Category not found"));
      return api.categories.collection(genre.id, { language: lang, page });
    },
    [genre, lang],
  );

  if (!sectionsLoading && !genre) notFound();

  return (
    <>
      <PageTitle>{genre?.name ?? ""}</PageTitle>
      <div className="list-page__header">
        <h1 className="list-page__title">{genre?.name ?? ""}</h1>
      </div>
      {genre && (
        <InfiniteMediaGrid
          loader={loader}
          focusKeyPrefix={`cat-${genre.id}-card`}
          mediaType={mediaType}
        />
      )}
    </>
  );
}
