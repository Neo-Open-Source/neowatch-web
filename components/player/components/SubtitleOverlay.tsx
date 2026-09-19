'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SubtitleTrackOption } from '../types'

interface Cue {
  startTime: number
  endTime: number
  text: string
}

interface SubtitleOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  subtitles: SubtitleTrackOption[]
  activeTrackId: string | null
  subtitleSize: number
}

function parseVTT(content: string): Cue[] {
  const lines = content.split(/\r?\n/)
  const cues: Cue[] = []
  let i = 0

  while (i < lines.length && !lines[i].trim().startsWith('-->')) i++

  let startTime = 0
  let endTime = 0
  let textLines: string[] = []

  const parseTime = (s: string): number => {
    const parts = s.trim().split(':')
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
    }
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
    }
    return parseFloat(parts[0])
  }

  for (; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.includes('-->')) {
      if (textLines.length > 0) {
        cues.push({ startTime, endTime, text: textLines.join('\n') })
        textLines = []
      }
      const parts = line.split('-->')
      startTime = parseTime(parts[0])
      const endPart = parts[1].split(/\s+/)[0]
      endTime = parseTime(endPart)
    } else if (line && !line.startsWith('WEBVTT') && !line.startsWith('NOTE')) {
      textLines.push(line)
    }
  }
  if (textLines.length > 0) {
    cues.push({ startTime, endTime, text: textLines.join('\n') })
  }
  return cues
}

export function SubtitleOverlay({
  videoRef,
  subtitles,
  activeTrackId,
  subtitleSize,
}: SubtitleOverlayProps) {
  const [cuesByTrack, setCuesByTrack] = useState<Record<string, Cue[]>>({})
  const [currentCues, setCurrentCues] = useState<Cue[]>([])
  const [hlsCues, setHlsCues] = useState<Cue[]>([])

  // activeTrackId форматы: null | 'hls:N' | 'ext:someId'
  const hlsIndex = activeTrackId?.startsWith('hls:')
    ? Number(activeTrackId.slice(4))
    : null
  const extId = activeTrackId?.startsWith('ext:')
    ? activeTrackId.slice(4)
    : null

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      const result: Record<string, Cue[]> = {}
      await Promise.all(
        subtitles.map(async (sub) => {
          try {
            const res = await fetch(sub.url)
            const text = await res.text()
            result[sub.id] = parseVTT(text)
          } catch {
            result[sub.id] = []
          }
        })
      )
      if (!cancelled) setCuesByTrack(result)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [subtitles])

  useEffect(() => {
    const video = videoRef.current
    if (hlsIndex == null || !video) {
      setHlsCues([])
      return
    }
    const track = video.textTracks[hlsIndex]
    if (!track) {
      setHlsCues([])
      return
    }
    const readCues = () => {
      const cues = track.cues
      const time = video.currentTime
      const matching: Cue[] = []
      if (cues) {
        for (let i = 0; i < cues.length; i++) {
          const c = cues[i] as VTTCue
          if (time >= c.startTime && time < c.endTime) {
            matching.push({ startTime: c.startTime, endTime: c.endTime, text: c.text })
          }
        }
      }
      setHlsCues(matching)
    }
    video.addEventListener('timeupdate', readCues)
    readCues()
    return () => video.removeEventListener('timeupdate', readCues)
  }, [videoRef, hlsIndex])

  const updateCues = useCallback(() => {
    if (!extId) {
      setCurrentCues([])
      return
    }
    const trackCues = cuesByTrack[extId]
    if (!trackCues) {
      setCurrentCues([])
      return
    }
    const video = videoRef.current
    if (!video) return
    const time = video.currentTime
    const matching = trackCues.filter(
      (cue) => time >= cue.startTime && time < cue.endTime
    )
    setCurrentCues(matching)
  }, [extId, cuesByTrack, videoRef])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !extId) {
      setCurrentCues([])
      return
    }
    const onTimeUpdate = () => updateCues()
    video.addEventListener('timeupdate', onTimeUpdate)
    updateCues()
    return () => video.removeEventListener('timeupdate', onTimeUpdate)
  }, [videoRef, extId, updateCues])

  const activeSub = subtitles.find((s) => s.id === extId)

  if (!activeTrackId) return null

  // ext субтитры — показываем только если нашли трек и есть активные cue
  if (extId != null) {
    if (!activeSub || currentCues.length === 0) return null
  }

  // HLS субтитры — показываем только если есть активные cue
  if (hlsIndex != null && hlsCues.length === 0) return null

  const cues = hlsIndex != null ? hlsCues : currentCues

  return (
    <div className="np-subtitle-overlay">
      {cues.map((cue, i) => (
        <div
          key={i}
          className="np-subtitle-cue"
          style={{ fontSize: subtitleSize }}
        >
          {cue.text.split('\n').map((line, j) => (
            <span key={j} className="np-subtitle-line">
              {line}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
