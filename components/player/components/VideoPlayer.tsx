'use client'

import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { FaPlay, FaPause } from 'react-icons/fa6'
import { HiXMark } from 'react-icons/hi2'
import { useHLS } from '../hooks/useHLS'
import { useControls } from '../hooks/useControls'
import { useTvFocus } from '../hooks/useTvFocus'
import { useAutoFullscreen } from '../hooks/useFullscreen'
import { TopBar } from './TopBar'
import { BottomBar } from './BottomBar'
import { SettingsMenu } from './SettingsMenu'
import { EpisodePicker } from './EpisodePicker'
import { SubtitleOverlay } from './SubtitleOverlay'
import { NextUpCard } from './NextUpCard'
import { BottomSheet } from './BottomSheet'
import type { PlayerProps, PlayerSettings, EpisodeInfo } from '../types'
import '../styles/player.css'

function isEpisode(content: PlayerProps['content']): content is EpisodeInfo {
  return 'seriesTitle' in content && 'seasonNumber' in content
}

function getNextEpisode(content: PlayerProps['content'], seasons: PlayerProps['seasons']) {
  if (!isEpisode(content) || !seasons) return undefined
  const currentSeason = seasons.find((s) => s.seasonNumber === content.seasonNumber)
  if (!currentSeason) return undefined
  const currentIdx = currentSeason.episodes.findIndex(
    (e) => e.episodeNumber === content.episodeNumber
  )
  if (currentIdx < currentSeason.episodes.length - 1) {
    return currentSeason.episodes[currentIdx + 1]
  }
  const nextSeason = seasons.find((s) => s.seasonNumber === content.seasonNumber + 1)
  return nextSeason?.episodes[0]
}

function getPrevEpisode(content: PlayerProps['content'], seasons: PlayerProps['seasons']) {
  if (!isEpisode(content) || !seasons) return undefined
  const currentSeason = seasons.find((s) => s.seasonNumber === content.seasonNumber)
  if (!currentSeason) return undefined
  const currentIdx = currentSeason.episodes.findIndex(
    (e) => e.episodeNumber === content.episodeNumber
  )
  if (currentIdx > 0) {
    return currentSeason.episodes[currentIdx - 1]
  }
  const prevSeason = seasons.find((s) => s.seasonNumber === content.seasonNumber - 1)
  if (prevSeason && prevSeason.episodes.length > 0) {
    return prevSeason.episodes[prevSeason.episodes.length - 1]
  }
  return undefined
}

type MobileSheet = 'settings' | 'episodes' | null

export type VideoPlayerProps = PlayerProps & {
  onPrevEpisode?: () => void
  seasonsReady?: boolean
}

export function VideoPlayer({
  src,
  content,
  seasons,
  seasonsReady = true,
  poster,
  autoPlay = false,
  onClose,
  onNextEpisode,
  onPrevEpisode,
  onSeasonChange,
  subtitles,
  initialSettings,
  className = '',
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const controlsRef = useRef<HTMLDivElement | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [settings, setSettings] = useState<PlayerSettings>({
    audioTrack: 0,
    subtitleTrack: 'off',
    subtitleSize: 18,
    quality: 'auto',
    playbackSpeed: 1,
    ...initialSettings,
  })

  const [playAnim, setPlayAnim] = useState<'play' | 'pause' | null>(null)
  const playAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sheetSettingsTab, setSheetSettingsTab] = useState<string | null>(null)
  const [sheetSettingsVersion, setSheetSettingsVersion] = useState(0)

  const isLandscape = useAutoFullscreen()

  const videoRef = useRef<HTMLVideoElement | null>(null)

  const { audioTracks, subtitleTracks, qualityLevels, switchAudioTrack, switchSubtitleTrack, switchQuality, setPlaybackSpeed } =
    useHLS({ src, videoRef, autoPlay })

  const handleToggleSubtitles = useCallback(() => {
    setSettings((s) => {
      if (s.subtitleTrack === 'off') {
        if (subtitles?.length) {
          switchSubtitleTrack('off')
          return { ...s, subtitleTrack: `ext:${subtitles[0].id}` }
        }
        if (subtitleTracks.length) {
          switchSubtitleTrack(subtitleTracks[0].id)
          return { ...s, subtitleTrack: subtitleTracks[0].id }
        }
        return s
      }
      switchSubtitleTrack('off')
      return { ...s, subtitleTrack: 'off' }
    })
  }, [subtitles, subtitleTracks, switchSubtitleTrack])

  const {
    controlsVisible,
    playerState,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    showSettings,
    setShowSettings,
    resetHideTimer,
    togglePlay,
    seek,
    skip,
    toggleMute,
    handleVolumeChange,
    volumeUp,
    volumeDown,
    toggleFullscreen,
    togglePictureInPicture,
  } = useControls(containerRef, handleToggleSubtitles, videoRef)

  // ── Mobile detection ──

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isLandscape && isMobile && !document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {})
    }
  }, [isLandscape, isMobile])

  // ── TV focus management ──

  const anyPanelOpen = showSettings || showEpisodes

  useTvFocus(containerRef, {
    enabled: controlsVisible && !anyPanelOpen && !isMobile,
    selector: '[data-tv]',
    direction: 'horizontal',
    onBack: onClose,
  })

  // ── Subtitle tracks list ──

  const subtitleTrackList = useMemo(() => {
    const list: { id: string | 'off'; label: string; language: string }[] = [
      { id: 'off', label: 'Off', language: '' },
    ]
    if (subtitles) {
      subtitles.forEach((s) => {
        list.push({ id: `ext:${s.id}`, label: s.label, language: s.language })
      })
    }
    if (subtitleTracks.length) {
      subtitleTracks.forEach((t) => {
        list.push(t)
      })
    }
    return list
  }, [subtitles, subtitleTracks])

  const handleSubtitleTrackChange = useCallback(
    (id: string | 'off') => {
      if (id === 'off') {
        switchSubtitleTrack('off')
      } else if (id.startsWith('hls:')) {
        switchSubtitleTrack(id)
      } else {
        switchSubtitleTrack('off')
      }
      setSettings((s) => ({ ...s, subtitleTrack: id }))
    },
    [switchSubtitleTrack]
  )

  // ── Handlers ──

  const handleTogglePlay = useCallback((_e?: React.MouseEvent) => {
    const willPlay = playerState !== 'playing'
    setPlayAnim(willPlay ? 'play' : 'pause')
    if (playAnimTimer.current) clearTimeout(playAnimTimer.current)
    playAnimTimer.current = setTimeout(() => setPlayAnim(null), 700)
    togglePlay()
  }, [togglePlay, playerState])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      toggleFullscreen()
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        handleTogglePlay(e)
      }, 250)
    }
  }, [handleTogglePlay, toggleFullscreen])

  const settingsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Two ways a menu stops auto-closing on cursor leave:
  // 1. settingsPinned — opened/closed by a gear click; stays pinned until the
  //    gear is pressed again or an outside click happens.
  // 2. itemPinned — the user clicked into a submenu (audio, subtitles…);
  //    lasts only while they're inside that submenu — returning to the main
  //    list restores the normal hover auto-close.
  const [settingsPinned, setSettingsPinned] = useState(false)
  const [itemPinned, setItemPinned] = useState(false)

  const closeSettings = useCallback(() => {
    setShowSettings(false)
    setSettingsPinned(false)
    setItemPinned(false)
  }, [setShowSettings])

  const handleSettingsOpen = useCallback(() => {
    if (isMobile) {
      setMobileSheet('settings')
    } else {
      const next = !showSettings
      setShowSettings(next)
      setSettingsPinned(next)
      setItemPinned(false)
      setShowEpisodes(false)
    }
    resetHideTimer()
  }, [isMobile, resetHideTimer, setShowSettings, showSettings])

  const handleEpisodesOpen = useCallback(() => {
    if (isMobile) {
      setMobileSheet('episodes')
    } else {
      setShowEpisodes((prev) => !prev)
      closeSettings()
    }
    resetHideTimer()
  }, [closeSettings, isMobile, resetHideTimer])

  const handleSettingsMouseEnter = useCallback(() => {
    if (settingsCloseTimer.current) {
      clearTimeout(settingsCloseTimer.current)
      settingsCloseTimer.current = null
    }
    setShowSettings(true)
  }, [setShowSettings])

  const handleSettingsMouseLeave = useCallback(() => {
    if (settingsPinned || itemPinned) return
    settingsCloseTimer.current = setTimeout(() => {
      setShowSettings(false)
    }, 300)
  }, [itemPinned, setShowSettings, settingsPinned])

  // A pinned menu closes on a click anywhere outside the panel (the gear
  // button is excluded — it toggles on its own click).
  useEffect(() => {
    if (!showSettings || (!settingsPinned && !itemPinned) || isMobile) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (target?.closest?.('.player__settings-panel')) return
      if (target?.closest?.('[data-settings-toggle]')) return
      closeSettings()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [closeSettings, isMobile, itemPinned, settingsPinned, showSettings])

  const handleCloseEpisodes = useCallback(() => {
    setShowEpisodes(false)
    resetHideTimer()
  }, [resetHideTimer])

  const nextEpisode = useMemo(
    () => getNextEpisode(content, seasons),
    [content, seasons]
  )

  const prevEpisode = useMemo(
    () => getPrevEpisode(content, seasons),
    [content, seasons]
  )

  const handleNextEpisode = useCallback(() => {
    const next = nextEpisode
    if (!next) return
    const seasonChanging = isEpisode(content) && next.seasonNumber !== content.seasonNumber
    if (seasonChanging && onSeasonChange) {
      onSeasonChange(next.seasonNumber, next)
    } else if (onNextEpisode) {
      onNextEpisode()
    } else if (onSeasonChange) {
      onSeasonChange(next.seasonNumber, next)
    }
  }, [onNextEpisode, nextEpisode, onSeasonChange, content])

  const handlePrevEpisode = useCallback(() => {
    if (onPrevEpisode) {
      onPrevEpisode()
    } else if (prevEpisode && onSeasonChange) {
      onSeasonChange(prevEpisode.seasonNumber, prevEpisode)
    }
  }, [onPrevEpisode, prevEpisode, onSeasonChange])

  const activeSubtitleId = useMemo(() => {
    const t = settings.subtitleTrack
    if (t === 'off') return null
    // HLS и ext треки передаём как есть — SubtitleOverlay сам разбирает формат
    return t
  }, [settings.subtitleTrack])

  // ── Sub-renders ──

  const [sheetSettingsTitle, setSheetSettingsTitle] = useState('Settings')

  const settingsMenuProps = {
    audioTracks,
    subtitleTracks: subtitleTrackList,
    qualityLevels,
    settings,
    onAudioTrackChange: (id: number) => {
      switchAudioTrack(id)
      setSettings((s) => ({ ...s, audioTrack: id }))
    },
    onSubtitleTrackChange: handleSubtitleTrackChange,
    onSubtitleSizeChange: (size: number) => setSettings((s) => ({ ...s, subtitleSize: size })),
    onQualityChange: (id: number | 'auto') => {
      switchQuality(id)
      setSettings((s) => ({ ...s, quality: id }))
    },
    onPlaybackSpeedChange: (speed: number) => {
      setPlaybackSpeed(speed)
      setSettings((s) => ({ ...s, playbackSpeed: speed }))
    },
  }

  const hasEpisodes = Boolean(seasons && seasons.length > 0 && isEpisode(content))

  const showPoster = Boolean(
    poster &&
    currentTime === 0 &&
    (playerState === 'paused' || playerState === 'ended')
  )

  return (
    <div
      ref={containerRef}
      className={`player ${className} ${isFullscreen ? 'player--fullscreen' : ''} ${controlsVisible ? '' : 'player--controls-hidden'}`}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        className="player__video"
        tabIndex={-1}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={handleClick}
      />

      {showPoster && (
        <div
          className="player__poster"
          style={{ backgroundImage: `url(${poster})` }}
          onClick={handleClick}
        />
      )}

      <SubtitleOverlay
        videoRef={videoRef}
        subtitles={subtitles ?? []}
        activeTrackId={activeSubtitleId}
        subtitleSize={settings.subtitleSize}
      />

      <NextUpCard
        currentTime={currentTime}
        duration={duration}
        nextEpisode={nextEpisode}
        onPlay={handleNextEpisode}
      />

      {playAnim && (
        <div className="player__play-anim" key={playAnim}>
          <div className="player__play-anim-icon">
            {playAnim === 'play' ? (
              <span style={{ display: 'inline-flex', fontSize: 42, lineHeight: 1, color: '#fff' }}>
                <FaPlay />
              </span>
            ) : (
              <span style={{ display: 'inline-flex', fontSize: 42, lineHeight: 1, color: '#fff' }}>
                <FaPause />
              </span>
            )}
          </div>
        </div>
      )}

      <div
        ref={controlsRef}
        className={`player__controls-overlay ${controlsVisible ? 'player__controls-overlay--visible' : 'player__controls-overlay--hidden'}`}
      >
        <TopBar visible={controlsVisible} onClose={onClose} />
        <div
          className="player__spacer"
          onClick={isMobile ? undefined : handleClick}
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        />
        <BottomBar
          visible={controlsVisible}
          content={content}
          playerState={playerState}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          subtitlesActive={settings.subtitleTrack !== 'off'}
          settingsOpen={showSettings}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          hasEpisodes={hasEpisodes}
          videoRef={videoRef}
          onTogglePlay={handleTogglePlay}
          onSkip={skip}
          onSeek={seek}
          onPrevEpisode={prevEpisode ? handlePrevEpisode : undefined}
          onNextEpisode={nextEpisode ? handleNextEpisode : undefined}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onToggleSubtitles={handleToggleSubtitles}
          onTogglePiP={togglePictureInPicture}
          onToggleFullscreen={toggleFullscreen}
          onSettingsOpen={handleSettingsOpen}
          onEpisodesOpen={handleEpisodesOpen}
          onSettingsMouseEnter={isMobile ? undefined : handleSettingsMouseEnter}
          onSettingsMouseLeave={isMobile ? undefined : handleSettingsMouseLeave}
          onMouseActivity={resetHideTimer}
        />
      </div>

      {showSettings && !isMobile && (
        <div className="player__settings-overlay">
          <div
            className="player__settings-panel"
            onMouseEnter={handleSettingsMouseEnter}
            onMouseLeave={handleSettingsMouseLeave}
          >
            <SettingsMenu
              {...settingsMenuProps}
              variant="panel"
              onTabChange={(tab) => {
                // Entering a submenu pins the menu (cursor may leave it while
                // browsing); going back to the main list unpins, so a
                // hover-opened menu auto-closes again.
                setItemPinned(Boolean(tab))
              }}
            />
          </div>
        </div>
      )}

      {showEpisodes && !isMobile && (
        seasonsReady ? (
          <EpisodePicker
            seasons={seasons!}
            content={content}
            onSeasonChange={(season, ep) => {
              onSeasonChange?.(season, ep)
              handleCloseEpisodes()
            }}
            onClose={handleCloseEpisodes}
            variant="panel"
          />
        ) : (
          <div className="ep-picker__overlay">
            <div className="ep-picker__header">
              <div className="ep-picker__header-info">
                <span className="ep-picker__title">Episodes</span>
                <span className="ep-picker__subtitle">Loading...</span>
              </div>
              <button className="ep-picker__close" onClick={handleCloseEpisodes} aria-label="Close" data-tv>
                <HiXMark size={22} />
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="player__spinner" />
            </div>
          </div>
        )
      )}

      {isMobile && (
        <>
          <BottomSheet
            open={mobileSheet === 'settings'}
            onClose={() => { setMobileSheet(null); setSheetSettingsTab(null); setSheetSettingsVersion((v) => v + 1) }}
            title={sheetSettingsTitle}
            onBack={sheetSettingsTab ? () => { setSheetSettingsTab(null); setSheetSettingsVersion((v) => v + 1) } : undefined}
          >
            <SettingsMenu
              {...settingsMenuProps}
              variant="sheet"
              key={sheetSettingsVersion}
              onTabChange={(tab) => {
                setSheetSettingsTab(tab)
                if (!tab) setSheetSettingsTitle('Settings')
                else setSheetSettingsTitle(tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' '))
              }}
            />
          </BottomSheet>

          <BottomSheet
            open={mobileSheet === 'episodes'}
            onClose={() => setMobileSheet(null)}
            title="Episodes"
            subtitle={
              isEpisode(content)
                ? `${content.seriesTitle} · S${content.seasonNumber} E${content.episodeNumber}`
                : undefined
            }
          >
            {seasons && (
              <EpisodePicker
                seasons={seasons}
                content={content}
                onSeasonChange={(season, ep) => {
                  onSeasonChange?.(season, ep)
                  setMobileSheet(null)
                }}
                onClose={() => setMobileSheet(null)}
                variant="sheet"
              />
            )}
          </BottomSheet>
        </>
      )}

      {playerState === 'buffering' && (
        <div className="player__buffering">
          <div className="player__spinner" />
        </div>
      )}

      {playerState === 'ended' && (
        <div className="player__ended">
          <button className="player__replay-btn" onClick={handleTogglePlay} data-tv>
            <FaPlay size={36} />
            Replay
          </button>
        </div>
      )}
    </div>
  )
}
