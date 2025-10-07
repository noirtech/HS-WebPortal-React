'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CollapsibleInfoBoxProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function CollapsibleInfoBox({ 
  title = "Click to find out what this page does", 
  children, 
  className = "" 
}: CollapsibleInfoBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`mb-6 ${className}`}>
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        className="w-full flex items-center justify-between p-4 text-left bg-gradient-to-r from-orange-400 to-orange-500 border-orange-300 hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-white" />
          <span className="font-semibold text-white text-base">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-white" />
        ) : (
          <ChevronDown className="h-5 w-5 text-white" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
