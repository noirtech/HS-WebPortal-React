import { useRef, useState, useCallback, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface InteractionState {
  isPanning: boolean
  isZooming: boolean
  startPosition: Position | null
  currentPosition: Position | null
  initialPanOffset: Position
  initialZoom: number
}

export function useUniversalInteraction() {
  const [state, setState] = useState<InteractionState>({
    isPanning: false,
    isZooming: false,
    startPosition: null,
    currentPosition: null,
    initialPanOffset: { x: 0, y: 0 },
    initialZoom: 1
  })

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTouchDistance = useRef<number>(0)

  // Detect input type
  const [inputType, setInputType] = useState<'touch' | 'mouse' | 'unknown'>('unknown')

  useEffect(() => {
    const detectInput = () => {
      if ('ontouchstart' in window) {
        setInputType('touch')
      } else if ('onmousedown' in window) {
        setInputType('mouse')
      }
    }
    
    detectInput()
    window.addEventListener('touchstart', () => setInputType('touch'), { once: true })
    window.addEventListener('mousedown', () => setInputType('mouse'), { once: true })
  }, [])

  // Universal position extraction
  const getPosition = useCallback((e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent): Position => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY }
    }
    return { x: 0, y: 0 }
  }, [])

  // Calculate distance between two touches for pinch zoom
  const getTouchDistance = useCallback((e: TouchEvent | React.TouchEvent): number => {
    if (e.touches.length < 2) return 0
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Start interaction (touch or mouse)
  const startInteraction = useCallback((
    e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent,
    initialPanOffset: Position,
    initialZoom: number
  ) => {
    // Prevent default behavior more aggressively for touch
    if ('touches' in e) {
      e.preventDefault()
      e.stopPropagation()
      // Prevent scrolling on mobile
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      e.preventDefault()
      e.stopPropagation()
    }

    const pos = getPosition(e)
    const time = Date.now()

    setState(prev => ({
      ...prev,
      isPanning: true,
      startPosition: pos,
      currentPosition: pos,
      initialPanOffset,
      initialZoom
    }))

    // Store touch start for gesture recognition
    if ('touches' in e) {
      touchStartRef.current = { x: pos.x, y: pos.y, time }
      lastTouchDistance.current = getTouchDistance(e)
    }
  }, [getPosition, getTouchDistance])

  // Update interaction (touch or mouse)
  const updateInteraction = useCallback((
    e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent
  ) => {
    if (!state.isPanning) return

    // Prevent default behavior more aggressively for touch
    if ('touches' in e) {
      e.preventDefault()
      e.stopPropagation()
    } else {
      e.preventDefault()
      e.stopPropagation()
    }

    const pos = getPosition(e)
    
    setState(prev => ({
      ...prev,
      currentPosition: pos
    }))

    // Handle pinch zoom for touch
    if ('touches' in e && e.touches.length === 2) {
      const distance = getTouchDistance(e)
      if (lastTouchDistance.current > 0) {
        const scale = distance / lastTouchDistance.current
        // Emit zoom event
        const newZoom = Math.max(0.5, Math.min(3, state.initialZoom * scale))
        // You can call a callback here to update zoom
      }
      lastTouchDistance.current = distance
    }
  }, [state.isPanning, getPosition, getTouchDistance, state.initialZoom])

  // End interaction (touch or mouse)
  const endInteraction = useCallback(() => {
    // Restore scrolling on mobile
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    
    setState(prev => ({
      ...prev,
      isPanning: false,
      isZooming: false,
      startPosition: null,
      currentPosition: null
    }))

    touchStartRef.current = null
    lastTouchDistance.current = 0
  }, [])

  // Calculate current pan offset
  const getCurrentPanOffset = useCallback((): Position => {
    if (!state.startPosition || !state.currentPosition) {
      return state.initialPanOffset
    }

    const deltaX = state.currentPosition.x - state.startPosition.x
    const deltaY = state.currentPosition.y - state.startPosition.y

    return {
      x: state.initialPanOffset.x + deltaX,
      y: state.initialPanOffset.y + deltaY
    }
  }, [state.startPosition, state.currentPosition, state.initialPanOffset])

  // Gesture recognition (swipe detection)
  const detectSwipe = useCallback((): 'left' | 'right' | 'up' | 'down' | null => {
    if (!touchStartRef.current || !state.currentPosition) return null

    const deltaX = state.currentPosition.x - touchStartRef.current.x
    const deltaY = state.currentPosition.y - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Minimum distance and time for swipe
    const minDistance = 50
    const maxTime = 300

    if (deltaTime > maxTime) return null

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minDistance) {
      return deltaX > 0 ? 'right' : 'left'
    }

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minDistance) {
      return deltaY > 0 ? 'down' : 'up'
    }

    return null
  }, [state.currentPosition])

  return {
    // State
    isPanning: state.isPanning,
    isZooming: state.isZooming,
    inputType,
    
    // Actions
    startInteraction,
    updateInteraction,
    endInteraction,
    
    // Calculations
    getCurrentPanOffset,
    detectSwipe,
    
    // Current values
    startPosition: state.startPosition,
    currentPosition: state.currentPosition,
    initialPanOffset: state.initialPanOffset,
    initialZoom: state.initialZoom
  }
}
