import type { ModuleConfig } from "@neowatch/engine/module";

export const module: ModuleConfig = {
  id: "anime",
  title: "NeoAni",
  brand: "NeoWatch",
  tagline: "Аниме",
  description: "Аниме: новые серии, расписание выходов и подборки.",
  searchPlaceholder: "Найти аниме",
  accent: { base: "#f2603c", strong: "#ff7d5c", on: "#ffffff" },
  kinds: ["anime", "dorama"],
  nav: [
    { href: "/", label: "Главная", icon: "solar:home-bold" },
    { href: "/catalog", label: "Каталог", icon: "solar:widget-bold" },
    { href: "/calendar", label: "Календарь", icon: "solar:calendar-bold" },
    { href: "/collections", label: "Подборки", icon: "solar:bookmark-square-bold" },
  ],
  home: [
    { type: "recent", title: "Обновления", href: "/catalog?sort=created_at", limit: 18 },
    { type: "popular", title: "Популярное сейчас", href: "/catalog?sort=popular", limit: 18 },
    { type: "collections", title: "Подборки", href: "/collections", limit: 4 },
  ],
};
