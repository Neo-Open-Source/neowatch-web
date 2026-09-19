'use client'

import { HiXMark } from 'react-icons/hi2'

export interface TopBarProps {
  visible: boolean
  onClose?: () => void
}

export function TopBar({ visible, onClose }: TopBarProps) {
  return (
    <div className={`player-top ${visible ? 'player-top--visible' : 'player-top--hidden'}`}>
      {onClose && (
        <button className="player-btn player-btn--close" onClick={onClose} aria-label="Close" data-tv>
          <HiXMark size={24} />
        </button>
      )}
    </div>
  )
}
