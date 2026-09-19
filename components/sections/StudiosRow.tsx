"use client";

import { useRouter } from "next/navigation";
import { ShelfSection } from "@/components/sections/ShelfSection";
import { StudioCard } from "@/components/cards/StudioCard";
import { STUDIO_LOGOS } from "@/lib/constants/studios";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { Studio } from "@/lib/api/types";
import { useI18n } from "@/lib/context/i18n-context";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const SKELETONS = makeSkeletonKeys(20);

export function StudiosRow({
  title,
  focusKey,
  initialData,
}: {
  title: string;
  focusKey?: string;
  /** SSR-fetched studios — skips the post-hydration API call on first load. */
  initialData?: Studio[] | null;
}) {
  const { locale } = useI18n();
  const router = useRouter();
  const { data, loading } = useAsyncResource<Studio[]>(
    () =>
      api.categories.list(toApiLanguage(locale)).then((sections) => {
        const studios = sections.find((s) => s.section === "Studios");
        return studios
          ? studios.items
              .map((c) => ({
                id: c.id,
                name: c.name,
                logoUrl: STUDIO_LOGOS[c.id],
              }))
              .filter((s): s is Studio => Boolean(s.logoUrl))
          : [];
      }),
    [locale],
    initialData,
  );
  const items = data ?? [];

  return (
    <ShelfSection title={title} loading={loading} focusKey={focusKey}>
      {loading
        ? SKELETONS.map((k) => <StudioCard key={k} />)
        : (
            <>
              {items.map((studio, i) => (
                <StudioCard
                  key={studio.id}
                  item={studio}
                  focusKey={focusKey ? `${focusKey}-card-${i}` : undefined}
                  onActivate={() => router.push(`/studios/${studio.id}`)}
                />
              ))}
            </>
          )}
    </ShelfSection>
  );
}
