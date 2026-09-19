/** Stable, unique key for a media item — used for React keys and list dedupe. */
export function mediaKey(mediaType: string | null | undefined, tmdbId: number): string {
  return mediaType ? `${mediaType}-${tmdbId}` : `item-${tmdbId}`;
}