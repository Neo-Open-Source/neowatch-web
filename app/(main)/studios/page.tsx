"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { CategorySection, Studio } from "@/lib/api/types";
import { useI18n } from "@/lib/context/i18n-context";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { useInitialFocus } from "@/lib/hooks/use-initial-focus";
import { STUDIO_LOGOS } from "@/lib/constants/studios";
import { PageTitle } from "@/components/ui/PageTitle";
import { StudioCard } from "@/components/cards/StudioCard";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const STUDIOS_SECTION = "Studios";
const SKELETONS = makeSkeletonKeys(20);

export default function StudiosPage() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const { data: sections, error, loading } = useAsyncResource<CategorySection[]>(
    () => api.categories.list(toApiLanguage(locale)),
    [locale],
  );

  const studios = useMemo<Studio[]>(() => {
    const items = sections?.find((s) => s.section === STUDIOS_SECTION)?.items ?? [];
    return items
      .map((c) => ({
        id: c.id,
        name: c.name,
        logoUrl: STUDIO_LOGOS[c.id],
      }))
      .filter((s): s is Studio => Boolean(s.logoUrl));
  }, [sections]);

  useInitialFocus(["studio-card-0"]);

  return (
    <>
      <PageTitle>{t.studios.title}</PageTitle>
      <div className="studios-page">
        <div className="studios-page__header">
          <h1 className="studios-page__title">{t.studios.title}</h1>
        </div>
        <div className="studios-grid" data-spatial-grid>
          {loading
            ? SKELETONS.map((k) => <StudioCard key={k} />)
            : error ? (
              <p className="media-grid__status">{t.home.error}</p>
            ) : (
              studios.map((studio, i) => (
                <StudioCard
                  key={studio.id}
                  item={studio}
                  focusKey={`studio-card-${i}`}
                  onActivate={() => router.push(`/studios/${studio.id}`)}
                />
              ))
            )}
        </div>
      </div>
    </>
  );
}
