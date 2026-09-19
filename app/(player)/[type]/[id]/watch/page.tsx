import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n-server";
import { toApiLanguage } from "@/lib/api/types";
import { getMediaDetail } from "@/lib/api/server-data";
import WatchPageClient from "./WatchPageClient";

interface WatchPageProps {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ season?: string; episode?: string; imdbId?: string; kpId?: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { type } = await params;
  if (type !== "movie" && type !== "tv") return {};
  return { title: `Watch — NeoWatch` };
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { type, id } = await params;
  const sp = await searchParams;
  if ((type !== "movie" && type !== "tv") || !Number.isFinite(Number(id))) notFound();

  const tmdbId = Number(id);
  const season = sp.season ? parseInt(sp.season, 10) : undefined;
  const episode = sp.episode ? parseInt(sp.episode, 10) : undefined;
  const imdbId = sp.imdbId ?? undefined;
  const kpId = sp.kpId ? parseInt(sp.kpId, 10) : undefined;

  // Sanitize: discard any NaN values from parseInt
  const safeSeason = Number.isFinite(season) ? season : undefined;
  const safeEpisode = Number.isFinite(episode) ? episode : undefined;
  const safeKpId = Number.isFinite(kpId) ? kpId : undefined;

  // Try to get imdbId from server data if not provided via query params
  let resolvedImdbId = imdbId;
  let resolvedKpId = safeKpId;
  if (!resolvedImdbId && !resolvedKpId) {
    try {
      const locale = await getLocale();
      const lang = toApiLanguage(locale);
      const data = await getMediaDetail(type as "movie" | "tv", tmdbId, lang);
      if ("imdbId" in data) resolvedImdbId = data.imdbId ?? undefined;
      if ("kpId" in data) resolvedKpId = data.kpId ?? undefined;
    } catch {
      // Client will handle the error
    }
  }

  return (
    <WatchPageClient
      type={type as "movie" | "tv"}
      tmdbId={tmdbId}
      season={safeSeason}
      episode={safeEpisode}
      imdbId={resolvedImdbId}
      kpId={resolvedKpId}
    />
  );
}
