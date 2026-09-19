'use client'

import { useEffect, useCallback } from 'react'
import { HiXMark, HiChevronLeft } from 'react-icons/hi2'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  onBack?: () => void
  children: React.ReactNode
}

function IconWrap({ size, children }: { size: number; children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', fontSize: size, lineHeight: 1 }}>{children}</span>
}

export function BottomSheet({ open, onClose, title, subtitle, onBack, children }: BottomSheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="np-bottom-sheet-backdrop" onClick={onClose}>
      <div className="np-bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="np-bottom-sheet-handle" />
        <div className="np-bottom-sheet-header">
          <div className="np-bottom-sheet-header-left">
            {onBack && (
              <button className="np-bottom-sheet-back" onClick={onBack} aria-label="Back">
                <IconWrap size={20}><HiChevronLeft /></IconWrap>
              </button>
            )}
            <div>
              <h3 className="np-bottom-sheet-title">{title}</h3>
              {subtitle && <span className="np-bottom-sheet-subtitle">{subtitle}</span>}
            </div>
          </div>
          <button className="np-btn np-bottom-sheet-close" onClick={onClose} aria-label="Close">
            <IconWrap size={22}><HiXMark /></IconWrap>
          </button>
        </div>
        <div className="np-bottom-sheet-content">{children}</div>
      </div>
    </div>
  )
}
