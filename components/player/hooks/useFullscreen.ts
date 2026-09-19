'use client'

import { useEffect, useCallback, useState } from 'react'

export function useAutoFullscreen() {
  const [isLandscape, setIsLandscape] = useState(false)

  const handleOrientation = useCallback(() => {
    const landscape = window.innerWidth > window.innerHeight
    setIsLandscape(landscape)
  }, [])

  useEffect(() => {
    handleOrientation()
    window.addEventListener('resize', handleOrientation)
    window.addEventListener('orientationchange', handleOrientation)
    return () => {
      window.removeEventListener('resize', handleOrientation)
      window.removeEventListener('orientationchange', handleOrientation)
    }
  }, [handleOrientation])

  return isLandscape
}
