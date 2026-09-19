'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Hls from 'hls.js'
import type { AudioTrack, QualityLevel, SubtitleTrack } from '../types'

interface UseHLSProps {
  src: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  autoPlay?: boolean
}

export function useHLS({ src, videoRef, autoPlay }: UseHLSProps) {
  const hlsRef = useRef<Hls | null>(null)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([])
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setAudioTracks([])
    setSubtitleTracks([])
    setQualityLevels([])

    if (!Hls.isSupported()) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
      }
      return
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    })
    hls.subtitleDisplay = false
    hlsRef.current = hls

    hls.attachMedia(video)

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(src)
    })

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (autoPlay) {
        video.play().catch(() => {})
      }

      setQualityLevels(
        hls.levels
          .map((l, i) => ({
            id: i,
            label: l.height >= 2160 ? '4K' : `${l.height}p`,
            height: l.height,
            bitrate: l.bitrate,
          }))
          .reverse()
      )
    })

    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_e, data) => {
      setAudioTracks(
        data.audioTracks.map((t, i) => ({
          id: i,
          label: t.name || `Track ${i + 1}`,
          language: t.lang || 'unknown',
        }))
      )
    })

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_e, data) => {
      setSubtitleTracks(
        data.subtitleTracks.map((t, i) => ({
          id: `hls:${i}`,
          label: t.name || `Subtitle ${i + 1}`,
          language: t.lang || 'unknown',
        }))
      )
    })

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError()
            break
          default:
            break
        }
      }
    })

    return () => {
      hls.destroy()
      hlsRef.current = null
    }
  }, [src, videoRef, autoPlay])

  const switchAudioTrack = useCallback((id: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = id
    }
  }, [])

  const switchSubtitleTrack = useCallback((id: string | 'off') => {
    if (!hlsRef.current) return
    if (id === 'off') {
      hlsRef.current.subtitleTrack = -1
    } else if (id.startsWith('hls:')) {
      hlsRef.current.subtitleTrack = Number(id.slice(4))
    }
  }, [])

  const switchQuality = useCallback((id: number | 'auto') => {
    if (!hlsRef.current) return
    if (id === 'auto') {
      hlsRef.current.currentLevel = -1
    } else {
      hlsRef.current.currentLevel = id
    }
  }, [])

  const setPlaybackSpeed = useCallback(
    (speed: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = speed
      }
    },
    [videoRef]
  )

  return {
    audioTracks,
    subtitleTracks,
    qualityLevels,
    switchAudioTrack,
    switchSubtitleTrack,
    switchQuality,
    setPlaybackSpeed,
  }
}
