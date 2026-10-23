import { Suspense } from "react";
import { getLocale } from "@/lib/i18n-server";
import { toApiLanguage } from "@/lib/api/types";
import { getHomeRows } from "@/lib/api/server-data";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { HomePageClient } from "./HomePageClient";

async function HomeContent() {
  const locale = await getLocale();
  const lang = toApiLanguage(locale);

  let initial: Awaited<ReturnType<typeof getHomeRows>> | null = null;
  try {
    initial = await getHomeRows(lang);
  } catch {
    // Rows fall back to their own client-side fetch.
  }

  return <HomePageClient initial={initial} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
