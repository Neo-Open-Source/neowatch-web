'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FaPlay, FaPause } from 'react-icons/fa6'
import { TbRewindBackward10, TbRewindForward10 } from 'react-icons/tb'

interface MobileOverlayProps {
  visible: boolean
  playerState: 'playing' | 'paused' | 'buffering' | 'ended'
  onTogglePlay: () => void
  onSkip: (seconds: number) => void
  onDismiss: () => void
}

export function MobileOverlay({
  visible,
  playerState,
  onTogglePlay,
  onSkip,
}: MobileOverlayProps) {
  const [show, setShow] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShow(false), 2500)
  }, [])

  useEffect(() => {
    if (visible) {
      setShow(true)
      if (playerState === 'playing') scheduleHide()
      else if (hideTimer.current) clearTimeout(hideTimer.current)
    } else {
      setShow(false)
    }
  }, [visible, playerState, scheduleHide])

  if (!show) return null

  const isPlaying = playerState === 'playing' || playerState === 'buffering'

  return (
    <div className="mobile-overlay" onClick={onTogglePlay}>
      {/* Rewind */}
      <button
        className="mobile-overlay__skip"
        onClick={(e) => { e.stopPropagation(); onSkip(-10); scheduleHide() }}
        aria-label="Rewind 10s"
      >
        <TbRewindBackward10 size={30} />
        <span className="mobile-overlay__skip-label">10</span>
      </button>

      {/* Play/Pause */}
      <button
        className="mobile-overlay__play"
        onClick={(e) => { e.stopPropagation(); onTogglePlay() }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <FaPause size={28} /> : <FaPlay size={28} />}
      </button>

      {/* Forward */}
      <button
        className="mobile-overlay__skip"
        onClick={(e) => { e.stopPropagation(); onSkip(10); scheduleHide() }}
        aria-label="Forward 10s"
      >
        <TbRewindForward10 size={30} />
        <span className="mobile-overlay__skip-label">10</span>
      </button>
    </div>
  )
}
