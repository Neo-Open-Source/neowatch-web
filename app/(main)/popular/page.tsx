"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/context/i18n-context";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import { PageTitle } from "@/components/ui/PageTitle";
import { InfiniteMediaGrid } from "@/components/sections/InfiniteMediaGrid";

export default function PopularPage() {
  const { t, locale } = useI18n();
  const lang = toApiLanguage(locale);

  const loader = useCallback(
    (page: number) => api.media.trending({ language: lang, page }),
    [lang],
  );

  return (
    <>
      <PageTitle>{t.meta.popular}</PageTitle>
      <div className="list-page__header">
        <h1 className="list-page__title">{t.nav.popular}</h1>
      </div>
      <InfiniteMediaGrid loader={loader} focusKeyPrefix="popular-card" />
    </>
  );
}
