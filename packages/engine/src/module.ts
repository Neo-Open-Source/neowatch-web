import type { CatalogKind } from "./lib/api/types";

export interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

export interface Accent {
  base: string;
  strong: string;
  on: string;
}

export type HomeBlock =
  | { type: "recent"; title: string; href: string; limit: number }
  | { type: "popular"; title: string; href: string; limit: number }
  | { type: "collections"; title: string; href: string; limit: number };

export interface ModuleConfig {
  id: string;
  title: string;
  brand: string;
  tagline: string;
  description: string;
  searchPlaceholder: string;
  accent: Accent;
  kinds: CatalogKind[];
  nav: NavLink[];
  home: HomeBlock[];
}
