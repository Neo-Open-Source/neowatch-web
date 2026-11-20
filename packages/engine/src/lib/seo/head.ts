export interface MetaInput {
  site: string;
  siteName: string;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  noindex?: boolean;
  ogType?: "website" | "article" | "video.other";
}

export interface MetaResult {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  og: Record<string, string>;
}

export function buildMeta(input: MetaInput): MetaResult {
  const canonical = `${input.site.replace(/\/$/, "")}/${input.path.replace(/^\//, "").replace(/\/$/, "")}`;
  const suffix = `: ${input.siteName}`;
  const title = input.title === input.siteName || input.title.endsWith(suffix)
    ? input.title
    : `${input.title}${suffix}`;
  const og: Record<string, string> = {
    "og:title": title,
    "og:description": input.description,
    "og:type": input.ogType ?? "website",
    "og:url": canonical,
    "og:site_name": input.siteName,
    "og:locale": "ru_RU",
    "twitter:card": input.image ? "summary_large_image" : "summary",
  };
  if (input.image) og["og:image"] = input.image;

  return {
    title,
    description: input.description,
    canonical,
    robots: input.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    og,
  };
}
