// Canonical media URL is `/{internalId}-{slug}`: the numeric id is the stable
// key (mediaByKey resolves it without a kind); the slug is cosmetic SEO taken
// from the first title that yields a Latin slug: English, then original, then title.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mediaUrl(id: string, ...titles: (string | null | undefined)[]): string {
  for (const title of titles) {
    const slug = slugify(title ?? "");
    if (slug && /[a-z]/.test(slug)) return `/${id}-${slug}`;
  }
  return `/${id}`;
}

export function mediaId(param: string | undefined): string | undefined {
  return param?.match(/^\d+/)?.[0];
}
