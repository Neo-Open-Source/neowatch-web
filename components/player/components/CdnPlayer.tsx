'use client'

import { useCdnPlayer } from '../hooks/useCdnPlayer'
import { VideoPlayer } from './VideoPlayer'
import type { CdnPlayerProps } from '../types'

export function CdnPlayer({ apiUrl, cdnId, imdbId, kpId, tmdbId, mediaType, season, episode, ...playerProps }: CdnPlayerProps) {
  const { src, content, seasons, seasonsReady, poster, loading, error, onSeasonChange, onNextEpisode } = useCdnPlayer({
    apiUrl,
    cdnId,
    imdbId,
    kpId,
    tmdbId,
    mediaType,
    season,
    episode,
  })

  if (loading) {
    return (
      <div className="cdn-player-fallback">
        <div className="cdn-player-fallback__spinner" />
      </div>
    )
  }

  if (error || !src || !content) {
    return (
      <div className="cdn-player-fallback cdn-player-fallback--error">
        <div className="cdn-player-fallback__title">Failed to load video</div>
        <div className="cdn-player-fallback__message">{error ?? 'Video not found'}</div>
      </div>
    )
  }

  return (
    <VideoPlayer
      {...playerProps}
      src={src}
      content={content}
      seasons={seasons}
      seasonsReady={seasonsReady}
      poster={poster ?? undefined}
      onSeasonChange={onSeasonChange}
      onNextEpisode={onNextEpisode}
    />
  )
}
