import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toApiLanguage } from "@/lib/api/types";
import type { MovieDetails, TVDetails } from "@/lib/api/types";
import { getLocale } from "@/lib/i18n-server";
import { mediaMetadata } from "@/lib/metadata";
import { mediaJsonLd } from "@/lib/jsonld";
import { getMediaDetail } from "@/lib/api/server-data";
import { LocaleAlternates } from "@/components/LocaleAlternates";
import { JsonLd } from "@/components/JsonLd";
import DetailPageClient from "./DetailPageClient";

interface DetailPageProps {
  params: Promise<{ type: string; id: string }>;
}

/**
 * Server-side metadata for shared links: localized title/description (fetched
 * in the current site language), backdrop image, rating in the description,
 * canonical URL and og:locale — so Telegram/WhatsApp/Twitter render a rich
 * preview. Falls back to the root metadata when the API is unreachable.
 */
export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { type, id } = await params;
  if (type !== "movie" && type !== "tv") return {};
  const tmdbId = Number(id);
  if (!Number.isFinite(tmdbId)) return {};

  const locale = await getLocale();
  const lang = toApiLanguage(locale);

  try {
    // Shared with the page below via React cache — one API request per render.
    const data = await getMediaDetail(type, tmdbId, lang);
    return mediaMetadata({ type, data, locale, path: `/${type}/${tmdbId}` });
  } catch {
    return {};
  }
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { type, id } = await params;
  if ((type !== "movie" && type !== "tv") || !Number.isFinite(Number(id))) notFound();
  const locale = await getLocale();

  // Same cached request as generateMetadata; passed to the client so it skips
  // its own API call. On failure the client fetches on its own (as before).
  let initialData: MovieDetails | TVDetails | null = null;
  try {
    initialData = await getMediaDetail(type, Number(id), toApiLanguage(locale));
  } catch {
    /* client will fetch and handle the error */
  }

  return (
    <>
      <LocaleAlternates path={`/${type}/${id}`} locale={locale} />
      {initialData && (
        <JsonLd data={await mediaJsonLd({ type, data: initialData, locale, path: `/${type}/${id}` })} />
      )}
      <DetailPageClient initialData={initialData} />
    </>
  );
}
