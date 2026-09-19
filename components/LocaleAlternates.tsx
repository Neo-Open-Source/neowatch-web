// Server-only. Renders <link rel="alternate" hreflang> and
// <meta property="og:locale:alternate"> tags that React 19 hoists into <head>.
// Next 16 dropped openGraph.localeAlternate and silently stopped rendering
// alternates.languages, so these tags are emitted directly — do NOT also set
// alternates.languages in generateMetadata or the tags would render twice.
//
// Note: the site serves every language from the same URL (locale is
// cookie-driven), so all hreflang variants point to the same page. Google
// ignores same-URL hreflang; the value here is informational og:locale:alternate
// for social crawlers.

import type { Locale } from "@/lib/i18n";
import { getMetadataBase, hreflangLanguages, ogLocaleAlternatesOf } from "@/lib/metadata";

export async function LocaleAlternates({ path, locale }: { path: string; locale: Locale }) {
  const base = await getMetadataBase();
  const hrefs = hreflangLanguages(path, base);

  return (
    <>
      {Object.entries(hrefs).map(([hreflang, href]) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      {ogLocaleAlternatesOf(locale).map((ogLocale) => (
        <meta key={ogLocale} property="og:locale:alternate" content={ogLocale} />
      ))}
    </>
  );
}
