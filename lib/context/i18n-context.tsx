"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dicts,
  languages,
  normalizeLangParam,
  type Dict,
  type Locale,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  t: Dict;
  languages: typeof languages;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Adopt ?lang= from the URL (shared links, language-switcher navigation) so
  // the client UI matches the locale the server rendered for that URL.
  // Adjusting state during render is the documented pattern for deriving state
  // from a changing external value; the server (proxy) persists the cookie.
  const urlLocale = normalizeLangParam(searchParams?.get("lang"));
  if (urlLocale && urlLocale !== locale) {
    setLocaleState(urlLocale);
  }

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = next;
  };

  return (
    <I18nContext.Provider value={{ locale, t: dicts[locale], languages, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
