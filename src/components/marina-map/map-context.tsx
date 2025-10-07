'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface MapState {
  isOpen: boolean
  zoom: number
  selectedBerth: string | null
  viewMode: 'overview' | 'detailed' | 'edit'
  center: { x: number; y: number }
  isPanning: boolean
  panOffset: { x: number; y: number }
}

interface MapContextType {
  mapState: MapState
  openMap: () => void
  closeMap: () => void
  toggleMap: () => void
  setZoom: (zoom: number) => void
  selectBerth: (berthId: string | null) => void
  setViewMode: (mode: 'overview' | 'detailed' | 'edit') => void
  setCenter: (center: { x: number; y: number }) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  setIsPanning: (isPanning: boolean) => void
  resetMap: () => void
}

const defaultMapState: MapState = {
  isOpen: false,
  zoom: 1,
  selectedBerth: null,
  viewMode: 'overview',
  center: { x: 0, y: 0 },
  isPanning: false,
  panOffset: { x: 0, y: 0 }
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const [mapState, setMapState] = useState<MapState>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marina-map-state')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return { ...defaultMapState, ...parsed, isOpen: false } // Always start closed
        } catch {
          return defaultMapState
        }
      }
    }
    return defaultMapState
  })

  // Save to localStorage whenever mapState changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('marina-map-state', JSON.stringify(mapState))
    }
  }, [mapState])

  const openMap = () => {
    setMapState(prev => ({ ...prev, isOpen: true }))
  }

  const closeMap = () => {
    setMapState(prev => ({ ...prev, isOpen: false }))
  }

  const toggleMap = () => {
    setMapState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }

  const setZoom = (zoom: number) => {
    setMapState(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(3, zoom)) }))
  }

  const selectBerth = (berthId: string | null) => {
    setMapState(prev => ({ ...prev, selectedBerth: berthId }))
  }

  const setViewMode = (mode: 'overview' | 'detailed' | 'edit') => {
    setMapState(prev => ({ ...prev, viewMode: mode }))
  }

  const setCenter = (center: { x: number; y: number }) => {
    setMapState(prev => ({ ...prev, center }))
  }

  const setPanOffset = (offset: { x: number; y: number }) => {

    setMapState(prev => ({ ...prev, panOffset: offset }))
  }

  const setIsPanning = (isPanning: boolean) => {

    setMapState(prev => ({ ...prev, isPanning }))
  }

  const resetMap = () => {
    setMapState(prev => ({
      ...prev,
      zoom: defaultMapState.zoom,
      selectedBerth: defaultMapState.selectedBerth,
      viewMode: defaultMapState.viewMode,
      center: defaultMapState.center,
      panOffset: defaultMapState.panOffset
    }))
  }

  const value: MapContextType = {
    mapState,
    openMap,
    closeMap,
    toggleMap,
    setZoom,
    selectBerth,
    setViewMode,
    setCenter,
    setPanOffset,
    setIsPanning,
    resetMap
  }

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider')
  }
  return context
}
