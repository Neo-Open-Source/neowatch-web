'use client'

import { useState } from 'react'
import { HiChevronRight, HiChevronLeft } from 'react-icons/hi2'
import type { AudioTrack, QualityLevel, PlayerSettings } from '../types'

// ─── Constants ──────────────────────────────────────────────

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

const SUBTITLE_SIZES = [
  { value: 14, label: 'Small' },
  { value: 18, label: 'Medium' },
  { value: 22, label: 'Large' },
  { value: 28, label: 'Extra Large' },
]

// ─── Types ──────────────────────────────────────────────────

type SettingsTab = 'main' | 'audio' | 'subtitles' | 'subtitle-size' | 'quality' | 'speed'

export interface SettingsMenuProps {
  audioTracks: AudioTrack[]
  subtitleTracks: { id: string | 'off'; label: string; language: string }[]
  qualityLevels: QualityLevel[]
  settings: PlayerSettings
  variant?: 'panel' | 'sheet'
  onTabChange?: (tab: string | null) => void
  onAudioTrackChange: (id: number) => void
  onSubtitleTrackChange: (id: string | 'off') => void
  onSubtitleSizeChange: (size: number) => void
  onQualityChange: (id: number | 'auto') => void
  onPlaybackSpeedChange: (speed: number) => void
}

// ─── Sub-components ─────────────────────────────────────────

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="settings-back" onClick={onClick}>
      <HiChevronLeft size={18} />
      {label}
    </button>
  )
}

// ─── Component ──────────────────────────────────────────────

export function SettingsMenu({
  audioTracks,
  subtitleTracks,
  qualityLevels,
  settings,
  variant = 'panel',
  onTabChange,
  onAudioTrackChange,
  onSubtitleTrackChange,
  onSubtitleSizeChange,
  onQualityChange,
  onPlaybackSpeedChange,
}: SettingsMenuProps) {
  const [tab, setTab] = useState<SettingsTab>('main')

  const goTo = (next: SettingsTab) => {
    setTab(next)
    onTabChange?.(next === 'main' ? null : next)
  }

  const goBack = () => {
    setTab('main')
    onTabChange?.(null)
  }

  const currentAudioLabel = audioTracks.find((t) => t.id === settings.audioTrack)?.label ?? 'Default'
  const currentSubtitleLabel = subtitleTracks.find((t) => t.id === settings.subtitleTrack)?.label ?? 'Off'
  const currentQualityLabel = settings.quality === 'auto'
    ? 'Auto'
    : qualityLevels.find((l) => l.id === settings.quality)?.label ?? 'Auto'
  const currentSizeLabel = SUBTITLE_SIZES.find((s) => s.value === settings.subtitleSize)?.label ?? `${settings.subtitleSize}px`

  const mainItems = [
    { id: 'audio' as const, label: 'Audio', value: currentAudioLabel },
    ...(subtitleTracks.length > 1
      ? [{ id: 'subtitles' as const, label: 'Subtitles', value: currentSubtitleLabel }]
      : []),
    { id: 'subtitle-size' as const, label: 'Subtitle Size', value: currentSizeLabel },
    ...(qualityLevels.length > 1
      ? [{ id: 'quality' as const, label: 'Quality', value: currentQualityLabel }]
      : []),
    { id: 'speed' as const, label: 'Speed', value: `${settings.playbackSpeed}x` },
  ]

  if (mainItems.length === 0) return null

  const isSheet = variant === 'sheet'

  const renderContent = () => {
    switch (tab) {
      case 'main':
        return mainItems.map((item) => (
          <button
            key={item.id}
            className={`settings-item ${isSheet ? 'settings-item--sheet' : ''}`}
            onClick={() => goTo(item.id)}
          >
            <span className="settings-item__label">{item.label}</span>
            <span className="settings-item__value">
              {item.value}
              <HiChevronRight size={15} />
            </span>
          </button>
        ))

      case 'audio':
        return (
          <>
            {audioTracks.map((track) => (
              <button
                key={track.id}
                className={`settings-item ${isSheet ? 'settings-item--sheet' : ''} ${track.id === settings.audioTrack ? 'settings-item--active' : ''}`}
                onClick={() => { onAudioTrackChange(track.id); goBack() }}
              >
                {track.label}
              </button>
            ))}
          </>
        )

      case 'subtitles':
        return (
          <>
            {subtitleTracks.map((track) => (
              <button
                key={String(track.id)}
                className={`settings-item ${isSheet ? 'settings-item--sheet' : ''} ${track.id === settings.subtitleTrack ? 'settings-item--active' : ''}`}
                onClick={() => { onSubtitleTrackChange(track.id); goBack() }}
              >
                {track.label}
              </button>
            ))}
          </>
        )

      case 'subtitle-size':
        return (
          <>
            {SUBTITLE_SIZES.map((size) => (
              <button
                key={size.value}
                className={`settings-item ${isSheet ? 'settings-item--sheet' : ''} ${size.value === settings.subtitleSize ? 'settings-item--active' : ''}`}
                onClick={() => { onSubtitleSizeChange(size.value); goBack() }}
              >
                {size.label}
              </button>
            ))}
          </>
        )

      case 'quality':
        return (
          <>
            <button
              className={`settings-item ${isSheet ? 'settings-item--sheet' : ''} ${settings.quality === 'auto' ? 'settings-item--active' : ''}`}
              onClick={() => { onQualityChange('auto'); goBack() }}
            >
              Auto
            </button>
            {qualityLevels.map((level) => (
              <button
                key={level.id}
                className={`settings-item ${isSheet ? 'settings-item--sheet' : ''} ${level.id === settings.quality ? 'settings-item--active' : ''}`}
                onClick={() => { onQualityChange(level.id); goBack() }}
              >
                <span className="settings-item__label">
                  {level.label}
                  {(level.height === 720 || level.height === 1080) && <span className="settings-hd-badge">HD</span>}
                </span>
              </button>
            ))}
          </>
        )

      case 'speed':
        return (
          <>
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                className={`settings-item ${isSheet ? 'settings-item--sheet' : ''} ${speed === settings.playbackSpeed ? 'settings-item--active' : ''}`}
                onClick={() => { onPlaybackSpeedChange(speed); goBack() }}
              >
                {speed}x
              </button>
            ))}
          </>
        )
    }
  }

  // Десктоп: floating panel со своим фоном
  if (variant === 'panel') {
    return (
      <div className="settings-panel">
        <div className="settings-panel__items">
          {tab !== 'main' && <BackButton label="Back" onClick={goBack} />}
          {renderContent()}
        </div>
      </div>
    )
  }

  // Мобиле: голый список, sheet снаружи является обёрткой
  return (
    <div className="settings-sheet-content">
      {renderContent()}
    </div>
  )
}
