'use client'

import React from 'react'
import { useMap } from './map-context'
import { MapControls } from './map-controls'
import { MarinaMapView } from './marina-map-view'

export function MapContainer() {
  const { mapState, closeMap } = useMap()

  // TEMPORARILY HIDDEN - Will be re-enabled in future
  const isHidden = true

  // Don't render the container if hidden
  if (isHidden) return null

  if (!mapState.isOpen) return null

  return (
    <>
      {/* Desktop: Sidebar (30-40% width) */}
      <div className="hidden lg:block fixed top-0 right-0 w-1/3 h-full bg-white border-l border-gray-200 shadow-xl z-40">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Marina Map</h2>
            <button
              onClick={closeMap}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Close map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Map Content */}
          <div className="flex-1 overflow-hidden">
            <MarinaMapView />
          </div>
          
          {/* Controls */}
          <div className="p-4 border-t border-gray-200">
            <MapControls />
          </div>
        </div>
      </div>

      {/* Tablet: Drawer (60% width) */}
      <div className="hidden md:block lg:hidden fixed top-0 right-0 w-3/5 h-full bg-white border-l border-gray-200 shadow-xl z-40 transform transition-transform duration-300">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Marina Map</h2>
            <button
              onClick={closeMap}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Close map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Map Content */}
          <div className="flex-1 overflow-hidden">
            <MarinaMapView />
          </div>
          
          {/* Controls */}
          <div className="p-4 border-t border-gray-200">
            <MapControls />
          </div>
        </div>
      </div>

      {/* Mobile: Fullscreen overlay */}
      <div className="md:hidden fixed inset-0 bg-white z-40">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Marina Map</h2>
            <button
              onClick={closeMap}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Close map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Map Content */}
          <div className="flex-1 overflow-hidden">
            <MarinaMapView />
          </div>
          
          {/* Controls */}
          <div className="p-4 border-t border-gray-200">
            <MapControls />
          </div>
        </div>
      </div>

      {/* Backdrop for mobile/tablet */}
      <div 
        className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={closeMap}
      />
    </>
  )
}
