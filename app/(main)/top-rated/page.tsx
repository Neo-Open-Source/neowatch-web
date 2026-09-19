"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { MediaType } from "@/lib/api/types";
import { PageTitle } from "@/components/ui/PageTitle";
import { InfiniteMediaGrid } from "@/components/sections/InfiniteMediaGrid";
import { ChipGroup, Chip } from "@/components/ui/ChipGroup";
import { UpTargetsProvider } from "@/lib/context/up-navigation";

function TopRatedInner() {
  const { t, locale } = useI18n();
  const lang = toApiLanguage(locale);
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") === "tv" ? "tv" : "movie") as MediaType;
  const [type, setType] = useState<MediaType>(initialType);

  const loader = useCallback(
    (page: number) =>
      type === "movie"
        ? api.media.movieList("top-rated", { language: lang, page })
        : api.media.tvList("top-rated", { language: lang, page }),
    [type, lang],
  );

  return (
    <UpTargetsProvider targets={["TOP_RATED_FILTERS"]}>
      <PageTitle>{t.meta.topRated}</PageTitle>
      <div className="list-page__header">
        <h1 className="list-page__title">{t.nav.topRated}</h1>
        <ChipGroup focusKey="TOP_RATED_FILTERS" onDown={() => setFocus(`top-rated-${type}-card-0`)}>
          <Chip focusKey="TOP_RATED_MOVIE" active={type === "movie"} onClick={() => setType("movie")}>
            {t.search.filters.typeMovie}
          </Chip>
          <Chip focusKey="TOP_RATED_TV" active={type === "tv"} onClick={() => setType("tv")}>
            {t.search.filters.typeTV}
          </Chip>
        </ChipGroup>
      </div>
      <InfiniteMediaGrid
        key={type}
        loader={loader}
        focusKeyPrefix={`top-rated-${type}-card`}
        mediaType={type}
      />
    </UpTargetsProvider>
  );
}

export default function TopRatedPage() {
  return (
    <Suspense>
      <TopRatedInner />
    </Suspense>
  );
}
