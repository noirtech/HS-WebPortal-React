import { useState, useEffect } from 'react'

interface MousePosition {
  x: number
  y: number
}

export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })

  useEffect(() => {
    let isActive = true
    
    const updateMousePosition = (ev: MouseEvent) => {
      if (isActive) {
        setMousePosition({ x: ev.clientX, y: ev.clientY })
      }
    }

    window.addEventListener('mousemove', updateMousePosition)

    return () => {
      isActive = false
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [])

  return mousePosition
}
