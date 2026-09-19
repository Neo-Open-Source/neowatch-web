// i18n: сборка словарей и ре-экспорт типов.
import { en } from "./en";
import { ru } from "./ru";
import { uk } from "./uk";

export const dicts = { en, ru, uk } as const;

export {
  SITE_NAME,
  LOCALE_COOKIE,
  languages,
  DEFAULT_LOCALE,
  isLocale,
  hreflangOf,
  normalizeLangParam,
} from "./types";
export type { Dict, Locale } from "./types";
