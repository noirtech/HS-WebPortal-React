import React, { useState, useCallback, useEffect } from 'react'
import { useMousePosition } from './useMousePosition'

interface TooltipState {
  isVisible: boolean
  content: string
  x: number
  y: number
}

export function useTooltip() {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    isVisible: false,
    content: '',
    x: 0,
    y: 0
  })
  
  const mousePosition = useMousePosition()

  const showTooltip = useCallback((content: string, x: number, y: number) => {
    setTooltipState({
      isVisible: true,
      content,
      x,
      y
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltipState(prev => ({
      ...prev,
      isVisible: false
    }))
  }, [])

  const updateTooltipPosition = useCallback(() => {
    if (tooltipState.isVisible) {
      setTooltipState(prev => ({
        ...prev,
        x: mousePosition.x,
        y: mousePosition.y
      }))
    }
  }, [tooltipState.isVisible, mousePosition.x, mousePosition.y])

  // Update tooltip position when mouse moves
  React.useEffect(() => {
    if (tooltipState.isVisible) {
      updateTooltipPosition()
    }
  }, [mousePosition, tooltipState.isVisible, updateTooltipPosition])

  return {
    tooltipState,
    showTooltip,
    hideTooltip,
    updateTooltipPosition
  }
}
