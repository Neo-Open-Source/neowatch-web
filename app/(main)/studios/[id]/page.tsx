"use client";

import { useCallback, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { CategorySection, Studio } from "@/lib/api/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { STUDIO_LOGOS } from "@/lib/constants/studios";
import { PageTitle } from "@/components/ui/PageTitle";
import { InfiniteMediaGrid } from "@/components/sections/InfiniteMediaGrid";

const STUDIOS_SECTION = "Studios";

export default function StudioCollectionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { locale } = useI18n();
  const lang = toApiLanguage(locale);

  const { data: sections, loading: sectionsLoading } = useAsyncResource<CategorySection[]>(
    () => api.categories.list(lang),
    [lang],
  );

  const studio = useMemo<Studio | null>(() => {
    const items = sections?.find((s) => s.section === STUDIOS_SECTION)?.items ?? [];
    const match = items.find((c) => c.id === id);
    if (!match) return null;
    const logoUrl = STUDIO_LOGOS[match.id];
    return logoUrl ? { id: match.id, name: match.name, logoUrl } : null;
  }, [sections, id]);

  const loader = useCallback(
    (page: number) => {
      if (!studio) return Promise.reject(new Error("Studio not found"));
      return api.categories.collection(studio.id, { language: lang, page });
    },
    [studio, lang],
  );

  if (!sectionsLoading && !studio) notFound();

  return (
    <>
      <PageTitle>{studio?.name ?? ""}</PageTitle>
      <div className="list-page__header">
        <h1 className="list-page__title">{studio?.name ?? ""}</h1>
      </div>
      {studio && (
        <InfiniteMediaGrid
          loader={loader}
          focusKeyPrefix={`studio-${studio.id}-card`}
        />
      )}
    </>
  );
}
