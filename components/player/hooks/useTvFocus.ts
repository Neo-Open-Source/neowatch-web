'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseTvFocusOptions {
  enabled: boolean
  selector?: string
  direction?: 'horizontal' | 'vertical' | 'both'
  loop?: boolean
  onEnter?: () => void
  onBack?: () => void
}

export function useTvFocus(
  containerRef: React.RefObject<HTMLElement | null>,
  { enabled, selector = '[data-tv]', direction = 'both', loop = false, onEnter, onBack }: UseTvFocusOptions
) {
  const focusedIndex = useRef(-1)

  const getItems = useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector))
  }, [containerRef, selector])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // The player container must not be a focus stop itself. It may have kept
    // this attribute after a hot reload from an earlier version of the hook.
    container.removeAttribute('tabindex')

    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = getItems()
      if (items.length === 0) return

      const active = document.activeElement
      const isTvFocused = active && items.includes(active as HTMLElement)

      if (e.key === 'Enter') {
        if (isTvFocused) {
          e.preventDefault()
          e.stopPropagation()
          ;(active as HTMLElement).click()
          onEnter?.()
        }
        return
      }

      if (e.key === 'Backspace' || e.key === 'Escape') {
        e.stopPropagation()
        onBack?.()
        return
      }

      if (!isTvFocused) return

      let currentIndex = items.indexOf(active as HTMLElement)
      let nextIndex = currentIndex

      if (direction === 'horizontal' || direction === 'both') {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          e.stopPropagation()
          nextIndex = currentIndex + 1
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          e.stopPropagation()
          nextIndex = currentIndex - 1
        }
      }

      if (direction === 'vertical' || direction === 'both') {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          e.stopPropagation()
          nextIndex = currentIndex + 1
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          e.stopPropagation()
          nextIndex = currentIndex - 1
        }
      }

      if (nextIndex !== currentIndex) {
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0
        } else if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1
        }
        items[nextIndex]?.focus()
        focusedIndex.current = nextIndex
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, containerRef, selector, direction, loop, onEnter, onBack, getItems])

  const focusIndex = focusedIndex.current

  const focusFirst = useCallback(() => {
    const items = getItems()
    if (items.length > 0) {
      items[0].focus()
      focusedIndex.current = 0
    }
  }, [getItems])

  const focusLast = useCallback(() => {
    const items = getItems()
    if (items.length > 0) {
      items[items.length - 1].focus()
      focusedIndex.current = items.length - 1
    }
  }, [getItems])

  return { focusFirst, focusLast, focusIndex }
}
