'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const VOLUME_STEP = 0.05

export function useControls(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onToggleSubtitles?: () => void,
  videoRef = useRef<HTMLVideoElement | null>(null),
) {
  const [controlsVisible, setControlsVisible] = useState(true)
  const [playerState, setPlayerState] = useState<
    'playing' | 'paused' | 'buffering' | 'ended'
  >('paused')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bufferingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (playerState === 'playing' && !showSettings) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, 3000)
    }
  }, [playerState, showSettings])

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      setPlayerState('playing')
    } else {
      video.pause()
      setPlayerState('paused')
    }
    resetHideTimer()
  }, [resetHideTimer])

  const seek = useCallback((time: number) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current
      if (video) {
        const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
        video.currentTime = newTime
        setCurrentTime(newTime)
      }
      resetHideTimer()
    },
    [resetHideTimer]
  )

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.muted = !video.muted
      setIsMuted(video.muted)
    }
    resetHideTimer()
  }, [resetHideTimer])

  const handleVolumeChange = useCallback((value: number) => {
    const video = videoRef.current
    if (video) {
      const clamped = Math.max(0, Math.min(1, value))
      video.volume = clamped
      setVolume(clamped)
      if (clamped === 0) {
        video.muted = true
        setIsMuted(true)
      } else if (video.muted) {
        video.muted = false
        setIsMuted(false)
      }
    }
  }, [])

  const volumeUp = useCallback(() => {
    const video = videoRef.current
    if (video) {
      if (video.muted) {
        video.muted = false
        setIsMuted(false)
      }
      handleVolumeChange(video.volume + VOLUME_STEP)
    }
  }, [handleVolumeChange])

  const volumeDown = useCallback(() => {
    handleVolumeChange((videoRef.current?.volume ?? volume) - VOLUME_STEP)
  }, [handleVolumeChange, volume])

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
    resetHideTimer()
  }, [containerRef, resetHideTimer])

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiPActive(false)
      } else {
        await video.requestPictureInPicture()
        setIsPiPActive(true)
      }
    } catch {
      // PiP not supported
    }
    resetHideTimer()
  }, [resetHideTimer])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const isTimeBuffered = (time: number) => {
      for (let i = 0; i < video.buffered.length; i++) {
        if (time >= video.buffered.start(i) && time <= video.buffered.end(i)) {
          return true
        }
      }
      return false
    }

    const clearBufferingTimer = () => {
      if (bufferingTimerRef.current) {
        clearTimeout(bufferingTimerRef.current)
        bufferingTimerRef.current = null
      }
    }

    const scheduleBuffering = (delay = 400) => {
      clearBufferingTimer()
      bufferingTimerRef.current = setTimeout(() => {
        // Перепроверяем — может данные уже подгрузились
        if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
          setPlayerState('buffering')
        }
      }, delay)
    }

    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onDurationChange = () => {
      if (isFinite(video.duration)) setDuration(video.duration)
    }
    const onEmptied = () => {
      clearBufferingTimer()
      setCurrentTime(0)
      setDuration(0)
      setPlayerState('paused')
    }

    // play = намерение играть, но данных может не быть
    const onPlay = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        setPlayerState('playing')
      } else {
        scheduleBuffering(0)
      }
    }

    const onPause = () => {
      clearBufferingTimer()
      if (!video.seeking) setPlayerState('paused')
    }

    const onEnded = () => {
      clearBufferingTimer()
      setPlayerState('ended')
    }

    // waiting = браузер ждёт данных во время воспроизведения
    const onWaiting = () => {
      scheduleBuffering(400)
    }

    // stalled от HLS.js часто ложный — используем большую задержку
    const onStalled = () => {
      scheduleBuffering(800)
    }

    // playing = данные есть, воспроизведение реально началось
    const onPlaying = () => {
      clearBufferingTimer()
      setIsSeeking(false)
      setPlayerState('playing')
    }

    // seeking: не показываем buffering сразу — ждём, вдруг данные уже есть
    const onSeeking = () => {
      setIsSeeking(true)
      scheduleBuffering(300)
    }

    // seeked: данные найдены, обновляем состояние по реальному статусу видео
    const onSeeked = () => {
      clearBufferingTimer()
      setIsSeeking(false)
      setCurrentTime(video.currentTime)
      if (!video.paused) {
        setPlayerState('playing')
      } else {
        setPlayerState('paused')
      }
    }

    // canplay / canplaythrough — снимаем buffering если данные подгрузились
    const onCanPlay = () => {
      clearBufferingTimer()
      if (!video.paused) setPlayerState('playing')
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('play', onPlay)
    video.addEventListener('emptied', onEmptied)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('stalled', onStalled)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('seeking', onSeeking)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('canplaythrough', onCanPlay)

    return () => {
      clearBufferingTimer()
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('emptied', onEmptied)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('stalled', onStalled)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('seeking', onSeeking)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('canplaythrough', onCanPlay)
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    scheduleHide()
  }, [scheduleHide])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'c':
          e.preventDefault()
          onToggleSubtitles?.()
          break
        case 'arrowleft':
          e.preventDefault()
          skip(-10)
          break
        case 'arrowright':
          e.preventDefault()
          skip(10)
          break
        case 'arrowup':
          e.preventDefault()
          volumeUp()
          resetHideTimer()
          break
        case 'arrowdown':
          e.preventDefault()
          volumeDown()
          resetHideTimer()
          break
        case 'escape':
          setShowSettings(false)
          break
      }
    },
    [togglePlay, toggleFullscreen, toggleMute, resetHideTimer, skip, onToggleSubtitles, volumeUp, volumeDown]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current)
    }
  }, [])

  return {
    videoRef,
    controlsVisible,
    playerState,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isPiPActive,
    isSeeking,
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
  }
}
