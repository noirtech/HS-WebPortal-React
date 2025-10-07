import React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  isVisible: boolean
  content: string
  x: number
  y: number
  className?: string
}

export function Tooltip({ isVisible, content, x, y, className }: TooltipProps) {
  if (!isVisible || !content) return null

  // Position tooltip above and to the right of cursor with offset
  const tooltipX = x + 10
  const tooltipY = y - 40

  return (
    <div
      className={cn(
        'fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none transition-opacity duration-200',
        'max-w-xs break-words',
        className
      )}
      style={{
        left: tooltipX,
        top: tooltipY,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {content}
      {/* Arrow pointing down */}
      <div
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
      />
    </div>
  )
}
