'use client'

import { useState, useRef, useCallback } from 'react'
import { HiXMark } from 'react-icons/hi2'
import { BsFillPlayFill } from 'react-icons/bs'
import { useTvFocus } from '../hooks/useTvFocus'
import { useI18n } from '@/lib/context/i18n-context'
import type { EpisodeInfo, SeasonOption, ContentInfo } from '../types'

function isEpisode(info: ContentInfo): info is EpisodeInfo {
  return 'seriesTitle' in info && 'seasonNumber' in info
}

interface EpisodePickerProps {
  seasons: SeasonOption[]
  content: ContentInfo
  onSeasonChange: (season: number, episode: EpisodeInfo) => void
  onClose: () => void
  variant?: 'panel' | 'sheet'
}

export function EpisodePicker({
  seasons,
  content,
  onSeasonChange,
  onClose,
  variant = 'panel',
}: EpisodePickerProps) {
  const { t } = useI18n()
  const [selectedSeason, setSelectedSeason] = useState(
    isEpisode(content) ? content.seasonNumber : seasons[0]?.seasonNumber ?? 1
  )

  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeason)
  const containerRef = useRef<HTMLDivElement>(null)

  useTvFocus(containerRef, {
    enabled: true,
    selector: '[data-tv]',
    direction: 'vertical',
    loop: true,
    onBack: onClose,
  })

  const handleEpisodeClick = (season: number, ep: EpisodeInfo) => {
    onSeasonChange(season, ep)
    onClose()
  }

  const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.setAttribute('data-failed', '')
  }, [])

  const isActive = (ep: EpisodeInfo) =>
    isEpisode(content) &&
    ep.episodeNumber === content.episodeNumber &&
    ep.seasonNumber === content.seasonNumber

  const seriesTitle = isEpisode(content) ? content.seriesTitle : undefined

  const episodeList = (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="ep-picker__header">
        <div className="ep-picker__header-info">
          <h2 className="ep-picker__title">{t.player.episodes}</h2>
          {seriesTitle && (
            <span className="ep-picker__subtitle">{seriesTitle}</span>
          )}
        </div>
        <button
          className="ep-picker__close"
          onClick={onClose}
          aria-label={t.player.close}
          data-tv
        >
          <HiXMark size={22} />
        </button>
      </div>

      {/* ── Season tabs ───────────────────────────────────── */}
      {seasons.length > 1 && (
        <div className="ep-picker__tabs">
          {seasons.map((s) => (
            <button
              key={s.seasonNumber}
              data-tv
              className={`ep-picker__tab${s.seasonNumber === selectedSeason ? ' ep-picker__tab--active' : ''}`}
              onClick={() => setSelectedSeason(s.seasonNumber)}
            >
              {t.player.season} {s.seasonNumber}
            </button>
          ))}
        </div>
      )}

      {/* ── Episode list ──────────────────────────────────── */}
      <div className="ep-picker__list">
        {currentSeason?.episodes.map((ep) => (
          <button
            key={ep.id}
            data-tv
            className={`ep-picker__item${isActive(ep) ? ' ep-picker__item--active' : ''}`}
            onClick={() => handleEpisodeClick(currentSeason.seasonNumber, ep)}
          >
            {/* Thumbnail */}
            <div className="ep-picker__thumb">
              {ep.thumbnail && (
                <img src={ep.thumbnail} alt="" onError={handleImgError} />
              )}
              <div className="ep-picker__thumb-play" aria-hidden>
                <BsFillPlayFill size={20} />
              </div>
              {isActive(ep) && <div className="ep-picker__thumb-badge">▶</div>}
            </div>

            {/* Info */}
            <div className="ep-picker__info">
              <span className="ep-picker__ep-num">
                {ep.seasonNumber} · {ep.episodeNumber}
              </span>
              <span className="ep-picker__ep-title">{ep.episodeTitle}</span>
            </div>

            {/* Rating */}
            {ep.rating != null && (
              <span className="ep-picker__rating">
                <span className="ep-picker__star">★</span>
                {ep.rating.toFixed(1)}
              </span>
            )}
          </button>
        ))}

        {!currentSeason?.episodes.length && (
          <div className="ep-picker__empty">{t.player.noEpisodes}</div>
        )}
      </div>
    </>
  )

  if (variant === 'panel') {
    return (
      <div ref={containerRef} className="ep-picker__overlay">
        {episodeList}
      </div>
    )
  }

  // Sheet variant (mobile)
  return (
    <div ref={containerRef} className="ep-picker ep-picker--sheet">
      {episodeList}
    </div>
  )
}
