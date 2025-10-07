'use client'

import React from 'react'
import { useMap } from './map-context'
import { Map, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MapToggleButtonTest() {
  const { mapState, toggleMap } = useMap()

  return (
    <Button
      onClick={toggleMap}
      className={`fixed top-20 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg transition-all duration-200 ${
        mapState.isOpen
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
      aria-label={mapState.isOpen ? 'Close marina map' : 'Open marina map'}
      title={mapState.isOpen ? 'Close marina map' : 'Open marina map'}
    >
      {mapState.isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Map className="h-5 w-5" />
      )}
    </Button>
  )
}
