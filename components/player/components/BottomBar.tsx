'use client'

import { useMemo, useState, useEffect } from 'react'
import { FaPlay, FaPause, FaBackwardStep, FaForwardStep } from 'react-icons/fa6'
import { TbRewindBackward10, TbRewindForward10 } from 'react-icons/tb'
import { HiSpeakerWave, HiSpeakerXMark, HiMiniSpeakerWave } from 'react-icons/hi2'
import { LuPictureInPicture, LuMaximize, LuMinimize, LuCaptions, LuList } from 'react-icons/lu'
import { RiSettings4Fill } from 'react-icons/ri'
import { ProgressBar } from './ProgressBar'
import type { ContentInfo, EpisodeInfo } from '../types'

function isEpisode(info: ContentInfo): info is EpisodeInfo {
  return 'seriesTitle' in info && 'seasonNumber' in info
}

function formatRemaining(current: number, duration: number): string {
  if (!isFinite(duration) || duration <= 0) return '-0:00'
  const remaining = Math.max(0, duration - current)
  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = Math.floor(remaining % 60)
  if (h > 0) {
    return `-${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `-${m}:${s.toString().padStart(2, '0')}`
}

function IconWrap({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', fontSize: size, lineHeight: 1 }}>
      {children}
    </span>
  )
}

// ─── Volume slider ────────────────────────────────────────────

interface VolumeControlProps {
  volume: number
  isMuted: boolean
  onVolumeChange: (v: number) => void
  onToggleMute: () => void
  onMouseActivity?: () => void
}

function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute, onMouseActivity }: VolumeControlProps) {
  const [dragging, setDragging] = useState(false)
  const effectiveVolume = isMuted ? 0 : volume

  const VolumeIcon = effectiveVolume === 0
    ? HiSpeakerXMark
    : effectiveVolume < 0.5
    ? HiMiniSpeakerWave
    : HiSpeakerWave

  return (
    <div
      className={`player-volume-wrap${dragging ? ' player-volume-wrap--dragging' : ''}`}
      onMouseMove={onMouseActivity}
    >
      {/* Horizontal slider — slides in on hover */}
      <div className="player-volume-slider">
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={effectiveVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          className="player-volume-range"
          aria-label="Volume"
          style={{ '--vol': `${effectiveVolume * 100}%` } as React.CSSProperties}
        />
      </div>
      <button
        className="player-btn player-btn--dim"
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        data-tv
      >
        <IconWrap size={22}><VolumeIcon /></IconWrap>
      </button>
    </div>
  )
}

// ─── Types ──────────────────────────────────────────────────

export interface BottomBarProps {
  visible: boolean
  content: ContentInfo
  playerState: 'playing' | 'paused' | 'buffering' | 'ended'
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  subtitlesActive: boolean
  settingsOpen: boolean
  isFullscreen: boolean
  isMobile: boolean
  hasEpisodes?: boolean
  videoRef?: React.RefObject<HTMLVideoElement | null>
  onTogglePlay: () => void
  onSkip: (seconds: number) => void
  onSeek: (time: number) => void
  onPrevEpisode?: () => void
  onNextEpisode?: () => void
  onVolumeChange: (value: number) => void
  onToggleMute: () => void
  onToggleSubtitles: () => void
  onTogglePiP: () => void
  onToggleFullscreen: () => void
  onSettingsOpen: () => void
  onEpisodesOpen?: () => void
  onSettingsMouseEnter?: () => void
  onSettingsMouseLeave?: () => void
  onMouseActivity: () => void
}

// ─── Component ──────────────────────────────────────────────

export function BottomBar({
  visible,
  content,
  playerState,
  currentTime,
  duration,
  volume,
  isMuted,
  subtitlesActive,
  settingsOpen,
  isFullscreen,
  isMobile,
  hasEpisodes,
  videoRef,
  onTogglePlay,
  onSkip,
  onSeek,
  onPrevEpisode,
  onNextEpisode,
  onVolumeChange,
  onToggleMute,
  onToggleSubtitles,
  onTogglePiP,
  onToggleFullscreen,
  onSettingsOpen,
  onEpisodesOpen,
  onSettingsMouseEnter,
  onSettingsMouseLeave,
  onMouseActivity,
}: BottomBarProps) {
  const [pipSupported, setPipSupported] = useState(false)
  useEffect(() => {
    setPipSupported('pictureInPictureEnabled' in document)
  }, [])

  const info = useMemo(() => {
    if (isEpisode(content)) {
      const rating = content.rating != null ? ` ★ ${content.rating}` : ''
      return {
        title: content.seriesTitle,
        subtitle: `S${content.seasonNumber} E${content.episodeNumber} · ${content.episodeTitle}${rating}`,
      }
    }
    const parts = []
    if (content.year != null) parts.push(String(content.year))
    if (content.rating != null) parts.push(`★ ${content.rating}`)
    return {
      title: content.title,
      subtitle: parts.join(' '),
    }
  }, [content])

  const isPlaying = playerState === 'playing' || playerState === 'buffering'
  const remainingTime = formatRemaining(currentTime, duration)

  const anyMenuOpen = subtitlesActive || settingsOpen
  const utilBtnClass = (isActive: boolean) => {
    if (isActive) return 'player-btn player-btn--active'
    if (anyMenuOpen) return 'player-btn player-btn--muted'
    return 'player-btn player-btn--dim'
  }

  return (
    <div
      className={`player-bottom ${visible ? 'player-bottom--visible' : 'player-bottom--hidden'}`}
      onMouseMove={onMouseActivity}
    >
      <div className="player-meta">
        <span className="player-meta__title">{info.title}</span>
        <span className="player-meta__subtitle">{info.subtitle}</span>
      </div>

      <div className="player-progress-row">
        <div className="player-progress-row__bar">
          <ProgressBar currentTime={currentTime} duration={duration} onSeek={onSeek} videoRef={videoRef} />
        </div>
        <span className="player-progress-row__time">{remainingTime}</span>
      </div>

      <div className="player-controls">
        <div className="player-controls__left">
          <button
            className="player-btn player-btn--play"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            data-tv
          >
            <IconWrap size={20}>{isPlaying ? <FaPause /> : <FaPlay />}</IconWrap>
          </button>

          <button className="player-btn" onClick={() => onSkip(-10)} aria-label="Rewind 10s" data-tv>
            <IconWrap size={22}><TbRewindBackward10 /></IconWrap>
          </button>

          <button className="player-btn" onClick={() => onSkip(10)} aria-label="Forward 10s" data-tv>
            <IconWrap size={22}><TbRewindForward10 /></IconWrap>
          </button>

          {onPrevEpisode && (
            <button className="player-btn" onClick={onPrevEpisode} aria-label="Previous episode" data-tv>
              <IconWrap size={20}><FaBackwardStep /></IconWrap>
            </button>
          )}

          {onNextEpisode && (
            <button className="player-btn" onClick={onNextEpisode} aria-label="Next episode" data-tv>
              <IconWrap size={20}><FaForwardStep /></IconWrap>
            </button>
          )}
        </div>

        <div className="player-controls__right">
          {!isMobile && (
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={onVolumeChange}
              onToggleMute={onToggleMute}
              onMouseActivity={onMouseActivity}
            />
          )}

          <button
            className={utilBtnClass(subtitlesActive)}
            onClick={onToggleSubtitles}
            aria-label="Subtitles"
            data-tv
          >
            <IconWrap size={22}><LuCaptions /></IconWrap>
          </button>

          {hasEpisodes && (
            <button
              className="player-btn player-btn--dim"
              onClick={onEpisodesOpen}
              aria-label="Episodes"
              data-tv
            >
              <IconWrap size={22}><LuList /></IconWrap>
            </button>
          )}

          <button
            className={utilBtnClass(settingsOpen)}
            onClick={onSettingsOpen}
            onMouseEnter={onSettingsMouseEnter}
            onMouseLeave={onSettingsMouseLeave}
            aria-label="Settings"
            data-tv
            data-settings-toggle
          >
            <IconWrap size={22}><RiSettings4Fill /></IconWrap>
          </button>

          {pipSupported && (
            <button
              className={utilBtnClass(false)}
              onClick={onTogglePiP}
              aria-label="Picture in Picture"
              data-tv
            >
              <IconWrap size={22}><LuPictureInPicture /></IconWrap>
            </button>
          )}

          <button
            className={utilBtnClass(false)}
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            data-tv
          >
            <IconWrap size={22}>{isFullscreen ? <LuMinimize /> : <LuMaximize />}</IconWrap>
          </button>
        </div>
      </div>
    </div>
  )
}
