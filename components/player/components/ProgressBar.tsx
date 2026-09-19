'use client'

import { useRef, useCallback, useState, useEffect } from 'react'

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
}

export function ProgressBar({ currentTime, duration, onSeek, videoRef }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const [buffered, setBuffered] = useState(0)

  useEffect(() => {
    const video = videoRef?.current ?? document.querySelector('video')
    if (!video) return
    const update = () => {
      if (video.buffered.length === 0) {
        setBuffered(0)
        return
      }
      for (let i = 0; i < video.buffered.length; i++) {
        if (
          video.currentTime >= video.buffered.start(i) &&
          video.currentTime <= video.buffered.end(i)
        ) {
          setBuffered(video.buffered.end(i))
          return
        }
      }
      setBuffered(video.buffered.end(0))
    }
    video.addEventListener('progress', update)
    update()
    return () => video.removeEventListener('progress', update)
  }, [videoRef])

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      const rect = barRef.current?.getBoundingClientRect()
      if (!rect || !duration) return 0
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return fraction * duration
    },
    [duration]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      const time = getTimeFromPosition(e.clientX)
      onSeek(time)

      const handleMouseMove = (e: MouseEvent) => {
        const t = getTimeFromPosition(e.clientX)
        onSeek(t)
      }
      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [getTimeFromPosition, onSeek]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const time = getTimeFromPosition(e.touches[0].clientX)
      onSeek(time)

      const handleTouchMove = (e: TouchEvent) => {
        const t = getTimeFromPosition(e.touches[0].clientX)
        onSeek(t)
      }
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    },
    [getTimeFromPosition, onSeek]
  )

  const handleHover = useCallback(
    (e: React.MouseEvent) => {
      const time = getTimeFromPosition(e.clientX)
      setHoverTime(time)
      setHoverX(e.clientX - (barRef.current?.getBoundingClientRect().left ?? 0))
    },
    [getTimeFromPosition]
  )

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="np-progress-bar-container">
      <div
        ref={barRef}
        className="np-progress-bar"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseMove={handleHover}
        onMouseLeave={() => setHoverTime(null)}
      >
        <div className="np-progress-track">
          <div
            className="np-progress-buffer"
            style={{ width: `${duration > 0 ? Math.min((buffered / duration) * 100, 100) : 0}%` }}
          />
          <div
            className="np-progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          <div
            className="np-progress-thumb"
            style={{ left: `${Math.min(progress, 100)}%` }}
          />
        </div>
        {hoverTime !== null && !isDragging && (
          <div className="np-progress-tooltip" style={{ left: hoverX }}>
            {formatHoverTime(hoverTime)}
          </div>
        )}
      </div>
    </div>
  )
}

function formatHoverTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
