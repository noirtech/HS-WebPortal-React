'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMap } from './map-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUniversalInteraction } from '@/hooks/useUniversalInteraction'
import { 
  Anchor, 
  Ship, 
  MapPin, 
  Info, 
  Edit3,
  Eye,
  Search
} from 'lucide-react'
import { useBerths } from '@/hooks/use-data-source-fetch'
import { useBoats } from '@/hooks/use-data-source-fetch'

export function MarinaMapView() {
  const { mapState, selectBerth, setViewMode, setZoom, setPanOffset, setIsPanning } = useMap()
  const [hoveredBerth, setHoveredBerth] = useState<string | null>(null)
  
  // Use data source hooks instead of hardcoded mock data
  const { data: berths, isLoading: berthsLoading, error: berthsError } = useBerths()
  const { data: boats, isLoading: boatsLoading, error: boatsError } = useBoats()
  
  // Universal interaction hook
  const {
    isPanning,
    inputType,
    startInteraction,
    updateInteraction,
    endInteraction,
    getCurrentPanOffset,
    detectSwipe
  } = useUniversalInteraction()

  // Component mount debugging
  useEffect(() => {
    
  }, [mapState, inputType])

  // Debug logging for pan state changes


  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.5, Math.min(3, mapState.zoom + delta))
    setZoom(newZoom)
  }, [mapState.zoom, setZoom])

  // Universal interaction handlers
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    startInteraction(e, mapState.panOffset, mapState.zoom)
    setIsPanning(true)
  }, [startInteraction, mapState.panOffset, mapState.zoom, setIsPanning])

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    updateInteraction(e)
  }, [updateInteraction])

  const handleEnd = useCallback(() => {
    endInteraction()
    setIsPanning(false)
    
    // Get final pan offset and update map state
    const finalOffset = getCurrentPanOffset()
    setPanOffset(finalOffset)
    
    // Detect swipe gestures
    const swipe = detectSwipe()
    if (swipe) {
      // Handle swipe gestures here
    }
  }, [endInteraction, setIsPanning, getCurrentPanOffset, setPanOffset, detectSwipe])

  // Real-time pan offset calculation for smooth updates
  const currentPanOffset = getCurrentPanOffset()
  
  // Update pan offset in real-time during interaction (throttled for performance)
  useEffect(() => {
    if (isPanning) {
      // Throttle updates to prevent excessive re-renders
      const timeoutId = setTimeout(() => {
        setPanOffset(currentPanOffset)
      }, 16) // ~60fps
      
      return () => clearTimeout(timeoutId)
    }
  }, [isPanning, currentPanOffset, setPanOffset])

  // Persist final pan offset when interaction ends
  const [finalPanOffset, setFinalPanOffset] = useState(mapState.panOffset)
  
  useEffect(() => {
    if (!isPanning && finalPanOffset !== mapState.panOffset) {
      setFinalPanOffset(mapState.panOffset)
    }
  }, [isPanning, mapState.panOffset, finalPanOffset])

  const getBerthColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-200 border-green-400 hover:bg-green-300'
      case 'occupied': return 'bg-blue-200 border-blue-400 hover:bg-blue-300'
      case 'maintenance': return 'bg-red-200 border-red-400 hover:bg-red-300'
      case 'reserved': return 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300'
      default: return 'bg-gray-200 border-gray-400 hover:bg-gray-300'
    }
  }

  // Show loading state
  if (berthsLoading || boatsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marina map...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (berthsError || boatsError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Marina Map</h2>
          <p className="text-gray-600 mb-4">Failed to load marina data</p>
        </div>
      </div>
    )
  }


  
  // Transform data for map display
  const mapBerths = (berths || []).map((berth: any, index: number) => {
    // Calculate position based on index for a grid layout
    const row = Math.floor(index / 5) // 5 berths per row
    const col = index % 5
    
    return {
      id: berth.id,
      name: berth.berthNumber,
      status: berth.isAvailable ? 'available' : 'occupied',
      boatId: null, // We'll connect boats separately
      dock: 'Main Dock', // Default dock assignment
      x: 50 + (col * 120),
      y: 30 + (row * 80),
      width: 100,
      height: 50
    }
  })

  const mapBoats = (boats || []).map((boat: any, index: number) => ({
    id: boat.id,
    name: boat.name,
    length: boat.length,
    beam: boat.beam,
    draft: boat.draft,
    owner: boat.owner ? `${boat.owner.firstName} ${boat.owner.lastName}` : 'Unknown Owner',
    type: 'Boat'
  }))

  // For demo purposes, let's assign some boats to berths
  // In a real implementation, this would come from contracts
  const berthsWithBoats = mapBerths.map((berth, index) => {
    // Assign boats to the first 15 berths (60% occupancy rate)
    if (index < 15 && index < mapBoats.length) {
      return {
        ...berth,
        status: 'occupied', // Force occupied status for demo
        boatId: mapBoats[index].id
      }
    }
    return {
      ...berth,
      status: 'available', // Force available status for remaining berths
      boatId: null
    }
  })

  const getBoatInfo = (boatId: string | null) => {
    if (!boatId) return null
    return mapBoats.find(boat => boat.id === boatId)
  }



  const handleBerthClick = (berthId: string) => {
    selectBerth(berthId)
  }

  const handleBerthHover = (berthId: string | null) => {
    setHoveredBerth(berthId)
  }

  const getViewModeIcon = () => {
    switch (mapState.viewMode) {
      case 'overview': return <Eye className="h-4 w-4" />
      case 'detailed': return <MapPin className="h-4 w-4" />
      case 'edit': return <Edit3 className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Map Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getViewModeIcon()}
            <span className="text-sm font-medium text-gray-700">
              {mapState.viewMode.charAt(0).toUpperCase() + mapState.viewMode.slice(1)} View
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {berthsWithBoats.filter(b => b.status === 'occupied').length} Occupied
            </Badge>
            <Badge variant="outline" className="text-xs">
              {berthsWithBoats.filter(b => b.status === 'available').length} Available
            </Badge>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 p-4 overflow-auto">
                 <div 
           className={`relative bg-blue-50 border-2 border-blue-200 rounded-lg origin-top-left select-none ${
             isPanning ? 'cursor-grabbing' : 'cursor-grab'
           }`}
                       style={{ 
              minHeight: '400px',
              transform: `scale(${mapState.zoom}) translate(${mapState.panOffset.x}px, ${mapState.panOffset.y}px)`,
              transformOrigin: 'top left',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserDrag: 'none'
            } as React.CSSProperties}
           onWheel={handleWheel}
           onMouseDown={handleStart}
           onMouseMove={handleMove}
           onMouseUp={handleEnd}
           onMouseLeave={handleEnd}
           onTouchStart={handleStart}
           onTouchMove={handleMove}
           onTouchEnd={handleEnd}
           
         >
          {/* Dock Labels */}
          <div className="absolute top-2 left-2 text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">
            Main Dock
          </div>
          <div className="absolute top-72 left-2 text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">
            Secondary Dock
          </div>
          <div className="absolute top-142 left-2 text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">
            Floating Dock
          </div>

          {/* Berths */}
          {berthsWithBoats.map((berth) => {
            const boat = getBoatInfo(berth.boatId)
            const isSelected = mapState.selectedBerth === berth.id
            const isHovered = hoveredBerth === berth.id

            return (
              <div
                key={berth.id}
                className={`absolute border-2 rounded cursor-pointer transition-all duration-200 ${
                  getBerthColor(berth.status)
                } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${
                  isHovered ? 'scale-105 shadow-lg' : ''
                }`}
                style={{
                  left: `${berth.x}px`,
                  top: `${berth.y}px`,
                  width: `${berth.width}px`,
                  height: `${berth.height}px`
                }}
                onClick={() => handleBerthClick(berth.id)}
                onMouseEnter={() => handleBerthHover(berth.id)}
                onMouseLeave={() => handleBerthHover(null)}
                title={`${berth.name} - ${berth.status}${boat ? ` - ${boat.name}` : ''}`}
              >
                {/* Berth Label */}
                <div className="absolute top-1 left-1 text-xs font-bold text-gray-800">
                  {berth.name}
                </div>

                {/* Status Indicator */}
                <div className="absolute top-1 right-1">
                  <div className={`w-2 h-2 rounded-full ${
                    berth.status === 'available' ? 'bg-green-500' :
                    berth.status === 'occupied' ? 'bg-blue-500' :
                    berth.status === 'maintenance' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                </div>

                {/* Boat Info (if occupied) */}
                {boat && (
                  <div className="absolute bottom-1 left-1 right-1 text-xs text-gray-700">
                    <div className="font-medium truncate">{boat.name}</div>
                    <div className="text-xs text-gray-500">{boat.type}</div>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-white p-2 rounded border text-xs">
            <div className="font-medium mb-1">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-200 border border-green-400 rounded" />
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded" />
                <span>Occupied</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-200 border border-red-400 rounded" />
                <span>Maintenance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            <span className="font-medium">Zoom:</span> {Math.round(mapState.zoom * 100)}%
          </div>
                     <div>
             <span className="font-medium">Pan:</span> {isPanning ? 'Active' : (Math.abs(finalPanOffset.x) > 0.1 || Math.abs(finalPanOffset.y) > 0.1 ? 'Moved' : 'Centered')}
             {(isPanning || Math.abs(finalPanOffset.x) > 0.1 || Math.abs(finalPanOffset.y) > 0.1) && (
               <span className="ml-1 text-xs">({Math.round(isPanning ? currentPanOffset.x : finalPanOffset.x)}, {Math.round(isPanning ? currentPanOffset.y : finalPanOffset.y)})</span>
             )}
           </div>
          <div>
            <span className="font-medium">Selected:</span> {mapState.selectedBerth || 'None'}
          </div>
          <div>
            <span className="font-medium">Mode:</span> {mapState.viewMode}
          </div>
        </div>
      </div>
    </div>
  )
}
