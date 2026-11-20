import type { CatalogKind } from "./api/types";

export const catalogKinds = [
  "movie",
  "tv",
  "anime",
  "dorama",
  "eastern",
] as const satisfies readonly CatalogKind[];

export function isKind(value: string | undefined | null): value is CatalogKind {
  return catalogKinds.some((kind) => kind === value);
}
