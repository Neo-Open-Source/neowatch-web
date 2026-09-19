import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toApiLanguage } from "@/lib/api/types";
import type { PersonDetails } from "@/lib/api/types";
import { getLocale } from "@/lib/i18n-server";
import { personMetadata } from "@/lib/metadata";
import { personJsonLd } from "@/lib/jsonld";
import { getPersonDetail } from "@/lib/api/server-data";
import { LocaleAlternates } from "@/components/LocaleAlternates";
import { JsonLd } from "@/components/JsonLd";
import PersonPageClient from "./PersonPageClient";

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server-side metadata for shared person links: name, profile photo, known-for
 * department and canonical URL — so Telegram/WhatsApp/Twitter render a rich
 * preview. Falls back to the root metadata when the API is unreachable.
 */
export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { id } = await params;
  const personId = Number(id);
  if (!Number.isFinite(personId)) return {};

  const locale = await getLocale();
  const lang = toApiLanguage(locale);

  try {
    // Shared with the page below via React cache — one API request per render.
    const person = await getPersonDetail(personId, lang);
    return personMetadata({ person, locale, path: `/person/${personId}` });
  } catch {
    return {};
  }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  if (!Number.isFinite(Number(id))) notFound();
  const locale = await getLocale();

  // Same cached request as generateMetadata; passed to the client so it skips
  // its own API call. On failure the client fetches on its own (as before).
  let initialData: PersonDetails | null = null;
  try {
    initialData = await getPersonDetail(Number(id), toApiLanguage(locale));
  } catch {
    /* client will fetch and handle the error */
  }

  return (
    <>
      <LocaleAlternates path={`/person/${id}`} locale={locale} />
      {initialData && (
        <JsonLd data={await personJsonLd({ person: initialData, locale, path: `/person/${id}` })} />
      )}
      <PersonPageClient initialData={initialData} />
    </>
  );
}
