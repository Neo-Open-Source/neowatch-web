import { getLocale } from "@/lib/i18n-server";
import { toApiLanguage } from "@/lib/api/types";
import { getHomeRows } from "@/lib/api/server-data";
import { HomePageClient } from "./HomePageClient";

export default async function HomePage() {
  const locale = await getLocale();
  const lang = toApiLanguage(locale);

  // SSR-fetched home rows (single cached request per render) — the client rows
  // consume this as initialData and skip their own API call on first load,
  // replacing the post-hydration waterfall with content already in the HTML.
  let initial: Awaited<ReturnType<typeof getHomeRows>> | null = null;
  try {
    initial = await getHomeRows(lang);
  } catch {
    // Rows fall back to their own client-side fetch.
  }

  return <HomePageClient initial={initial} />;
}
