import type { ModuleConfig } from "@neowatch/engine/module";

export const module: ModuleConfig = {
  id: "movies",
  title: "NeoWatch",
  brand: "NeoWatch",
  tagline: "фильмы и сериалы",
  description: "Фильмы и сериалы: что смотрят сейчас, новые релизы и подборки.",
  searchPlaceholder: "Найти фильм или сериал",
  accent: { base: "#5b8dff", strong: "#7ba3ff", on: "#0a1020" },
  kinds: ["movie", "tv"],
  nav: [
    { href: "/", label: "Главная", icon: "solar:home-bold" },
    { href: "/catalog", label: "Каталог", icon: "solar:widget-bold" },
    { href: "/calendar", label: "Календарь", icon: "solar:calendar-bold" },
    { href: "/collections", label: "Подборки", icon: "solar:bookmark-square-bold" },
  ],
  home: [
    { type: "recent", title: "Новые релизы", href: "/catalog?sort=created_at", limit: 18 },
    { type: "popular", title: "Популярное сейчас", href: "/catalog?sort=popular", limit: 18 },
    { type: "collections", title: "Подборки", href: "/collections", limit: 4 },
  ],
};
