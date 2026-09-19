'use client'

import type { CdnVideoDto, ContentInfo, EpisodeInfo, SeasonOption } from '../types'

export interface CdnMetadataResult {
  tmdbId: number
  content: ContentInfo
  seasons?: SeasonOption[]
}

export interface CdnMetadataLookup {
  tmdbId?: number
  mediaType?: 'movie' | 'tv'
}

const metaCache = new Map<string, CdnMetadataResult>()

// CDN providers often return their own name as episode title
const KNOWN_PROVIDER_NAMES = new Set([
  'anilibria', 'le-production', 'animelibria', 'anidub', 'anivost',
  'coldfilm', 'sharewood', 'lastub', 'libria',
])

function isProviderName(title: string): boolean {
  return KNOWN_PROVIDER_NAMES.has(title.toLowerCase().trim())
}

async function getJson(base: string, path: string) {
  const res = await fetch(`${base}${path}`)
  if (!res.ok) throw new Error(`Neowatch API error: ${res.status}`)
  const json = await res.json()
  return json.success ? json.data : null
}

function yearFromDate(date?: string | null): number | undefined {
  if (!date) return undefined
  const year = parseInt(date.slice(0, 4), 10)
  return isNaN(year) ? undefined : year
}

function roundRating(value?: number | null): number | undefined {
  if (value == null) return undefined
  return Math.round(value * 10) / 10
}

export async function fetchCdnMetadata(
  apiUrl: string,
  data: CdnVideoDto,
  lookup: CdnMetadataLookup = {}
): Promise<CdnMetadataResult | null> {
  const base = apiUrl.replace(/\/+$/, '')
  const type = lookup.mediaType ?? (data.isSeries ? 'tv' : 'movie')

  let tmdbId = lookup.tmdbId
  if (!tmdbId) {
    try {
      const search = await getJson(base, `/api/v1/search?q=${encodeURIComponent(data.title)}&type=${type}`)
      tmdbId = search?.items?.[0]?.tmdbId
    } catch {
      tmdbId = undefined
    }
  }
  if (!tmdbId) return null

  const cacheKey = `${type}:${tmdbId}`
  const cached = metaCache.get(cacheKey)
  if (cached) return cached

  try {
    let result: CdnMetadataResult

    if (type === 'movie') {
      const detail = await getJson(base, `/api/v1/media/movie/${tmdbId}`)
      if (!detail) return null
      result = {
        tmdbId,
        content: {
          title: detail.title || data.title,
          year: yearFromDate(detail.releaseDate),
          rating: roundRating(detail.voteAverage),
        },
      }
    } else {
      // ── Fetch TMDB season data for all CDN seasons ──
      const cdnSeasonNumbers = Array.from(new Set(data.episodes.map((e) => e.season))).sort((a, b) => a - b)
      const seasonList = await Promise.all(
        cdnSeasonNumbers.map((s) =>
          getJson(base, `/api/v1/media/tv/${tmdbId}/season/${s}`).catch(() => null)
        )
      )

      // Build TMDB episode lookup
      const tmdbBySeason = new Map<number, { name?: string; voteAverage?: number; still?: string | null; episodeNumber: number }[]>()
      for (const season of seasonList) {
        if (!season?.episodes) continue
        tmdbBySeason.set(season.seasonNumber, season.episodes)
      }

      // ── Season fallback: if CDN has fewer eps than TMDB,
      // map excess TMDB eps to the next CDN season ──
      //
      // Example: TMDB S1 has 24 eps, CDN S1 has 12 eps, CDN S2 has 12 eps
      // → CDN S2 ep 1 maps to TMDB S1 ep 13, etc.
      //
      // Build a flat TMDB episode list across seasons
      const flatTmdbEps: { name?: string; voteAverage?: number; still?: string | null; tmdbSeason: number; tmdbEpisode: number }[] = []
      for (const sNum of cdnSeasonNumbers) {
        const tmdbEps = tmdbBySeason.get(sNum)
        if (tmdbEps) {
          for (const ep of tmdbEps) {
            flatTmdbEps.push({ ...ep, tmdbSeason: sNum, tmdbEpisode: ep.episodeNumber })
          }
        }
      }

      // Count CDN episodes per season (sorted)
      const cdnEpsPerSeason = new Map<number, number>()
      for (const cdnEp of data.episodes) {
        cdnEpsPerSeason.set(cdnEp.season, (cdnEpsPerSeason.get(cdnEp.season) ?? 0) + 1)
      }

      // Build offset map: for each CDN season, how many flat TMDB eps came before
      const tmdbOffsetPerCdnSeason = new Map<number, number>()
      let runningOffset = 0
      for (const sNum of cdnSeasonNumbers) {
        tmdbOffsetPerCdnSeason.set(sNum, runningOffset)
        runningOffset += cdnEpsPerSeason.get(sNum) ?? 0
      }

      // Build episodes
      const bySeason = new Map<number, EpisodeInfo[]>()
      for (const cdnEp of data.episodes) {
        const offset = tmdbOffsetPerCdnSeason.get(cdnEp.season) ?? 0
        // Map to flat TMDB index: offset + (episode - 1)
        const flatIdx = offset + (cdnEp.episode - 1)
        const tmdbEp = flatIdx >= 0 && flatIdx < flatTmdbEps.length ? flatTmdbEps[flatIdx] : undefined

        const list = bySeason.get(cdnEp.season) ?? []
        list.push({
          id: `${data.id}:s${cdnEp.season}e${cdnEp.episode}`,
          seriesTitle: data.title,
          seasonNumber: cdnEp.season,
          episodeNumber: cdnEp.episode,
          episodeTitle: tmdbEp?.name || (isProviderName(cdnEp.title) ? undefined : cdnEp.title) || `Episode ${cdnEp.episode}`,
          rating: roundRating(tmdbEp?.voteAverage),
          thumbnail: tmdbEp?.still
            ? `${base}/api/v1/images/screens/${tmdbId}/${tmdbEp.tmdbSeason}/${tmdbEp.tmdbEpisode}?size=w500`
            : `${base}/api/v1/images/screens/${tmdbId}/${cdnEp.season}/${cdnEp.episode}?size=w500`,
        })
        bySeason.set(cdnEp.season, list)
      }

      const seasons: SeasonOption[] = Array.from(bySeason.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([seasonNumber, episodes]) => ({ seasonNumber, episodes }))

      const season = data.season ?? seasons[0]?.seasonNumber ?? 1
      const episode = data.episode ?? 1
      const epInfo = seasons
        .find((s) => s.seasonNumber === season)
        ?.episodes.find((e) => e.episodeNumber === episode)

      result = {
        tmdbId,
        content: epInfo ?? {
          id: `${data.id}:s${season}e${episode}`,
          seriesTitle: data.title,
          seasonNumber: season,
          episodeNumber: episode,
          episodeTitle: `Episode ${episode}`,
        },
        seasons,
      }
    }

    metaCache.set(cacheKey, result)
    return result
  } catch {
    return null
  }
}
