'use client'

import { useEffect, useState, useCallback } from 'react'
import { HiXMark } from 'react-icons/hi2'
import { FaPlay } from 'react-icons/fa6'
import type { EpisodeInfo } from '../types'

interface NextUpCardProps {
  currentTime: number
  duration: number
  nextEpisode?: EpisodeInfo
  onPlay: () => void
  onDismiss?: () => void
}

const LEAD_IN_SECONDS = 30

export function NextUpCard({
  currentTime,
  duration,
  nextEpisode,
  onPlay,
  onDismiss,
}: NextUpCardProps) {
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(LEAD_IN_SECONDS)

  const timeLeft = duration - currentTime

  useEffect(() => {
    if (!nextEpisode || duration <= 0) {
      setVisible(false)
      return
    }

    const show = timeLeft > 0 && timeLeft <= LEAD_IN_SECONDS
    setVisible(show)

    if (show) {
      setCountdown(Math.ceil(timeLeft))
    }
  }, [timeLeft, nextEpisode, duration])

  useEffect(() => {
    if (!visible) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onPlay()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [visible, onPlay])

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDismiss?.()
      setVisible(false)
    },
    [onDismiss]
  )

  const handlePlayNow = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onPlay()
      setVisible(false)
    },
    [onPlay]
  )

  if (!visible || !nextEpisode) return null

  return (
    <div className="np-nextup-card">
      <div className="np-nextup-header">
        <span className="np-nextup-title">Next Up</span>
        <button
          className="np-nextup-close"
          onClick={handleDismiss}
          aria-label="Dismiss"
          data-tv
        >
          <span style={{ display: 'inline-flex', fontSize: 18, lineHeight: 1 }}>
            <HiXMark />
          </span>
        </button>
      </div>
      <div className="np-nextup-body">
        {nextEpisode.thumbnail && (
          <div className="np-nextup-thumb">
            <img src={nextEpisode.thumbnail} alt="" />
            <div className="np-nextup-countdown">{countdown}s</div>
          </div>
        )}
        <div className="np-nextup-info">
          <div className="np-nextup-ep-title">{nextEpisode.episodeTitle}</div>
          <div className="np-nextup-ep-meta">
            S{nextEpisode.seasonNumber} E{nextEpisode.episodeNumber}
          </div>
          <button className="np-nextup-play" onClick={handlePlayNow} data-tv>
            <span style={{ display: 'inline-flex', fontSize: 20, lineHeight: 1 }}>
              <FaPlay />
            </span>
            Play
          </button>
        </div>
      </div>
    </div>
  )
}
