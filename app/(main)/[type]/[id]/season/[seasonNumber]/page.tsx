import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toApiLanguage } from "@/lib/api/types";
import type { SeasonDetails, TVDetails } from "@/lib/api/types";
import { getLocale } from "@/lib/i18n-server";
import { seasonMetadata } from "@/lib/metadata";
import { seasonJsonLd } from "@/lib/jsonld";
import { getSeasonBundle } from "@/lib/api/server-data";
import { LocaleAlternates } from "@/components/LocaleAlternates";
import { JsonLd } from "@/components/JsonLd";
import SeasonPageClient from "./SeasonPageClient";

interface SeasonPageProps {
  params: Promise<{ type: string; id: string; seasonNumber: string }>;
}

/** Server-side share metadata for season links (title, overview, poster/backdrop). */
export async function generateMetadata({ params }: SeasonPageProps): Promise<Metadata> {
  const { type, id, seasonNumber } = await params;
  if (type !== "tv") return {};
  const tvId = Number(id);
  const seasonNum = Number(seasonNumber);
  if (!Number.isFinite(tvId) || !Number.isFinite(seasonNum)) return {};

  const locale = await getLocale();
  const lang = toApiLanguage(locale);

  try {
    // Shared with the page below via React cache — one request per render.
    const { tv, season } = await getSeasonBundle(tvId, seasonNum, lang);
    return seasonMetadata({
      tv,
      season,
      locale,
      path: `/tv/${tvId}/season/${seasonNum}`,
    });
  } catch {
    return {};
  }
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { type, id, seasonNumber } = await params;
  if (type !== "tv" || !Number.isFinite(Number(id)) || !Number.isFinite(Number(seasonNumber))) {
    notFound();
  }
  const locale = await getLocale();

  // Same cached requests as generateMetadata; passed to the client so it skips
  // its own API calls. On failure the client fetches on its own (as before).
  let initialSeason: SeasonDetails | null = null;
  let initialTv: TVDetails | null = null;
  try {
    const bundle = await getSeasonBundle(Number(id), Number(seasonNumber), toApiLanguage(locale));
    initialSeason = bundle.season;
    initialTv = bundle.tv;
  } catch {
    /* client will fetch and handle the error */
  }

  return (
    <>
      <LocaleAlternates
        path={`/tv/${id}/season/${seasonNumber}`}
        locale={locale}
      />
      {initialSeason && initialTv && (
        <JsonLd
          data={await seasonJsonLd({
            tv: initialTv,
            season: initialSeason,
            locale,
            path: `/tv/${id}/season/${seasonNumber}`,
          })}
        />
      )}
      <SeasonPageClient initialSeason={initialSeason} initialTv={initialTv} />
    </>
  );
}
