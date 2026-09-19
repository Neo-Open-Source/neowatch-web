'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { fetchCdnMetadata, type CdnMetadataResult } from './cdnMetadata'
import type {
  CdnEpisodeDto,
  CdnPlayerOptions,
  CdnVideoDto,
  ContentInfo,
  EpisodeInfo,
  SeasonOption,
} from '../types'

function buildApiUrl(options: CdnPlayerOptions): string {
  const base = options.apiUrl.replace(/\/+$/, '')
  let path: string
  if (options.cdnId != null) {
    path = `/api/v1/player/cdn/${options.cdnId}`
  } else if (options.imdbId) {
    path = `/api/v1/player/cdn/imdb/${encodeURIComponent(options.imdbId)}`
  } else if (options.kpId != null) {
    path = `/api/v1/player/cdn/kp/${options.kpId}`
  } else {
    throw new Error('useCdnPlayer: provide cdnId, imdbId or kpId')
  }
  const params = new URLSearchParams()
  if (options.season != null) params.set('season', String(options.season))
  if (options.episode != null) params.set('episode', String(options.episode))
  const qs = params.toString()
  return qs ? `${base}${path}?${qs}` : `${base}${path}`
}

function getNextEpisodeData(
  data: CdnVideoDto,
  season: number,
  episode: number
): CdnEpisodeDto | undefined {
  const current = data.episodes
    .filter((e) => e.season === season && e.episode === episode)
    .sort((a, b) => a.episode - b.episode)[0]

  if (current) {
    const sameSeason = data.episodes
      .filter((e) => e.season === season)
      .sort((a, b) => a.episode - b.episode)
    const idx = sameSeason.findIndex((e) => e.episode === episode)
    if (idx !== -1 && idx < sameSeason.length - 1) {
      return sameSeason[idx + 1]
    }
  }

  const nextSeason = data.episodes
    .filter((e) => e.season > season)
    .sort((a, b) => a.season - b.season || a.episode - b.episode)[0]
  return nextSeason
}

export function useCdnPlayer(options: CdnPlayerOptions) {
  const { apiUrl, cdnId, imdbId, kpId, tmdbId, mediaType, season: initialSeason, episode: initialEpisode } = options

  const [data, setData] = useState<CdnVideoDto | null>(null)
  const [meta, setMeta] = useState<CdnMetadataResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dataRef = useRef<CdnVideoDto | null>(null)
  dataRef.current = data

  const fetchPlayer = useCallback(
    async (season?: number, episode?: number) => {
      if (!dataRef.current) setLoading(true)
      setError(null)
      try {
        const url = buildApiUrl({ apiUrl, cdnId, imdbId, kpId, season, episode })
        const res = await fetch(url)
        const json = await res.json()
        if (!json.success) {
          setError(json.error || 'Failed to load video')
          return
        }
        setData(json.data as CdnVideoDto)
      } catch (e) {
        setError((e as Error).message || 'Network error')
      } finally {
        setLoading(false)
      }
    },
    [apiUrl, cdnId, imdbId, kpId]
  )

  useEffect(() => {
    fetchPlayer(initialSeason, initialEpisode)
  }, [fetchPlayer, initialSeason, initialEpisode])

  useEffect(() => {
    if (!data) {
      setMeta(null)
      return
    }
    let cancelled = false
    fetchCdnMetadata(apiUrl, data, { tmdbId, mediaType })
      .then((m) => {
        if (!cancelled) setMeta(m)
      })
      .catch(() => {
        if (!cancelled) setMeta(null)
      })
    return () => {
      cancelled = true
    }
  }, [apiUrl, data, tmdbId, mediaType])

  const baseContent = useMemo<ContentInfo | null>(() => {
    if (!data) return null
    if (data.isSeries) {
      const season = data.season ?? 1
      const episode = data.episode ?? 1
      const epInfo = data.episodes.find((e) => e.season === season && e.episode === episode)
      return {
        id: `${data.id}:s${season}e${episode}`,
        seriesTitle: data.title,
        seasonNumber: season,
        episodeNumber: episode,
        episodeTitle: epInfo?.title || `Episode ${episode}`,
      }
    }
    return { title: data.title }
  }, [data])

  const baseSeasons = useMemo<SeasonOption[] | undefined>(() => {
    if (!data?.isSeries) return undefined
    const bySeason = new Map<number, EpisodeInfo[]>()
    for (const ep of data.episodes) {
      const list = bySeason.get(ep.season) ?? []
      list.push({
        id: `${data.id}:s${ep.season}e${ep.episode}`,
        seriesTitle: data.title,
        seasonNumber: ep.season,
        episodeNumber: ep.episode,
        episodeTitle: ep.title || `Episode ${ep.episode}`,
      })
      bySeason.set(ep.season, list)
    }
    return Array.from(bySeason.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([seasonNumber, episodes]) => ({ seasonNumber, episodes }))
  }, [data])

  const seasons = meta?.seasons ?? baseSeasons

  const content = useMemo<ContentInfo | null>(() => {
    if (!data) return null
    if (!data.isSeries) return meta?.content ?? baseContent
    const season = data.season ?? 1
    const episode = data.episode ?? 1
    const epInfo = seasons
      ?.find((s) => s.seasonNumber === season)
      ?.episodes.find((e) => e.episodeNumber === episode)
    if (epInfo) return epInfo
    return baseContent
  }, [data, meta, baseContent, seasons])

  const poster = useMemo(() => {
    if (!data) return null
    const base = apiUrl.replace(/\/+$/, '')
    const id = tmdbId ?? meta?.tmdbId
    if (!id) return null
    const type = mediaType ?? (data.isSeries ? 'tv' : 'movie')
    if (type === 'movie') {
      return `${base}/api/v1/images/backdrop/${id}?type=movie&size=w1280`
    }
    const season = data.season ?? 1
    const episode = data.episode ?? 1
    return `${base}/api/v1/images/screens/${id}/${season}/${episode}?size=w1280`
  }, [apiUrl, data, tmdbId, mediaType, meta])

  const handleSeasonChange = useCallback(
    (season: number, episode: EpisodeInfo) => {
      fetchPlayer(season, episode.episodeNumber)
    },
    [fetchPlayer]
  )

  const handleNextEpisode = useCallback(() => {
    if (!data) return
    const season = data.season ?? 1
    const episode = data.episode ?? 1
    const next = getNextEpisodeData(data, season, episode)
    if (next) {
      fetchPlayer(next.season, next.episode)
    }
  }, [data, fetchPlayer])

  return {
    src: data?.m3u8Url ?? null,
    content,
    seasons,
    seasonsReady: Boolean(meta || !data?.isSeries),
    poster,
    loading,
    error,
    onSeasonChange: handleSeasonChange,
    onNextEpisode: handleNextEpisode,
  }
}
