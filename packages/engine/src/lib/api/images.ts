export function proxiedImage(origin: string, url: string | null): string | null {
  if (!url) return null;
  return `${origin}/api/v1/image?url=${encodeURIComponent(url)}`;
}
