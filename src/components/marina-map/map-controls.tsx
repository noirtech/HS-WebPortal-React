'use client'

import React from 'react'
import { useMap } from './map-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  Edit3, 
  MapPin,
  Layers,
  Search,
  Move
} from 'lucide-react'

export function MapControls() {
  const { 
    mapState, 
    setZoom, 
    setViewMode, 
    resetMap, 
    selectBerth,
    setPanOffset
  } = useMap()

  const handleZoomIn = () => {
    setZoom(mapState.zoom + 0.2)
  }

  const handleZoomOut = () => {
    setZoom(mapState.zoom - 0.2)
  }

  const handleReset = () => {
    resetMap()
  }

  const handleViewModeChange = () => {
    const modes: Array<'overview' | 'detailed' | 'edit'> = ['overview', 'detailed', 'edit']
    const currentIndex = modes.indexOf(mapState.viewMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setViewMode(modes[nextIndex])
  }

  const handleClearSelection = () => {
    selectBerth(null)
  }

  const handleResetPan = () => {

    setPanOffset({ x: 0, y: 0 })
    
  }

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Zoom & Navigation</h4>
        <div className="flex space-x-2">
          <Button
            onClick={handleZoomIn}
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={mapState.zoom >= 3}
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            In
          </Button>
          <Button
            onClick={handleZoomOut}
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={mapState.zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4 mr-1" />
            Out
          </Button>
          <Button
            onClick={handleReset}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            onClick={handleResetPan}
            size="sm"
            variant="outline"
            className="flex-1"
            title="Reset pan position"
          >
            <Move className="h-4 w-4 mr-1" />
            Center
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Zoom: {Math.round(mapState.zoom * 100)}%
        </div>
      </div>

      {/* View Mode Controls */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">View Mode</h4>
        <div className="flex space-x-2">
          <Button
            onClick={handleViewModeChange}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {mapState.viewMode === 'overview' && <Eye className="h-4 w-4 mr-1" />}
            {mapState.viewMode === 'detailed' && <MapPin className="h-4 w-4 mr-1" />}
            {mapState.viewMode === 'edit' && <Edit3 className="h-4 w-4 mr-1" />}
            {mapState.viewMode === 'overview' && 'Overview'}
            {mapState.viewMode === 'detailed' && 'Detailed'}
            {mapState.viewMode === 'edit' && 'Edit'}
          </Button>
        </div>
        <div className="mt-2">
          <Badge 
            variant={
              mapState.viewMode === 'overview' ? 'default' : 
              mapState.viewMode === 'detailed' ? 'secondary' : 
              'destructive'
            }
            className="w-full justify-center"
          >
            {mapState.viewMode.charAt(0).toUpperCase() + mapState.viewMode.slice(1)} Mode
          </Badge>
        </div>
      </div>

      {/* Selection Controls */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Selection</h4>
        <div className="space-y-2">
          {mapState.selectedBerth ? (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-blue-700 font-medium">Selected Berth</div>
              <div className="text-sm text-blue-800">{mapState.selectedBerth}</div>
              <Button
                onClick={handleClearSelection}
                size="sm"
                variant="outline"
                className="mt-2 w-full"
              >
                Clear Selection
              </Button>
            </div>
          ) : (
            <div className="p-2 bg-gray-50 rounded border border-gray-200 text-center">
              <div className="text-xs text-gray-500">No berth selected</div>
              <div className="text-xs text-gray-400 mt-1">Click on a berth to select</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Search className="h-3 w-3 mr-1" />
            Search
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Layers className="h-3 w-3 mr-1" />
            Layers
          </Button>
        </div>
      </div>
    </div>
  )
}
