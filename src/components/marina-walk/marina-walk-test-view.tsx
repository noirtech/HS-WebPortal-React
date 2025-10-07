'use client'



import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { 
  Ship, 
  MapPin, 
  Compass, 
  Users, 
  MessageSquare, 
  Bell,
  Search,
  Filter,
  Smartphone,
  Monitor,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

interface Berth {
  id: string
  number: string
  status: 'occupied' | 'available' | 'reserved' | 'maintenance'
  boatId?: string
  boatName?: string
  boatLength?: number
  boatBeam?: number
  coordinates: { x: number; y: number }
}

interface Boat {
  id: string
  name: string
  length: number
  beam: number
  owner: string
  contact: string
  lastInspection: string
  nextInspection: string
  maintenanceStatus: 'good' | 'needs_attention' | 'maintenance_due'
}

interface MarinaWalkTestViewProps {
  berths: Berth[]
  boats: Boat[]
}

export function MarinaWalkTestView({ berths, boats }: MarinaWalkTestViewProps) {
  const { localeConfig } = useLocaleFormatting()
  
  // Stub functions for tooltip and element label functionality
  const showTooltip = (content: string, event: React.MouseEvent) => {
    logger.debug('showTooltip called', { content, event });
  };
  
  const hideTooltip = () => {
    logger.debug('hideTooltip called');
  };
  
  const renderElementLabel = (content: string, className: string) => {
    logger.debug('renderElementLabel called', { content, className });
    return null; // Return null for now since this is a test component
  };

  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null)
  const [checkedBerths, setCheckedBerths] = useState<Set<string>>(new Set())
  const [isMobileMode, setIsMobileMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [userDirection, setUserDirection] = useState<'N' | 'S' | 'E' | 'W'>('N')
  const [currentLocation, setCurrentLocation] = useState({ x: 0, y: 0 })
  const [showCompass, setShowCompass] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    boatSize: 'all',
    maintenance: 'all'
  })
  const [compassPosition, setCompassPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isCompassLocked, setIsCompassLocked] = useState(false)
  const [showMouseOverLabels, setShowMouseOverLabels] = useState(false)
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  // Enrich berths with boat information
  const enrichedBerths = berths.map(berth => {
    const boat = boats.find(b => b.id === berth.boatId)
    return {
      ...berth,
      boatName: boat?.name,
      boatLength: boat?.length,
      boatBeam: boat?.beam,
      owner: boat?.owner,
      contact: boat?.contact,
      lastInspection: boat?.lastInspection,
      nextInspection: boat?.nextInspection,
      maintenanceStatus: boat?.maintenanceStatus
    }
  })

  const handleBerthSelect = (berthId: string) => {
    setSelectedBerthId(berthId === selectedBerthId ? null : berthId)
    
    // Gentle scroll to show selected berth in list if it's not visible
    setTimeout(() => {
      const berthElement = document.getElementById(`test-berth-${berthId}`)
      if (berthElement) {
        // Check if the element is visible in the viewport
        const rect = berthElement.getBoundingClientRect()
        const listContainer = berthElement.closest('.overflow-y-auto')
        
        if (listContainer) {
          const containerRect = listContainer.getBoundingClientRect()
          
          // Only scroll if the element is not fully visible
          if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
            berthElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest', // Less jarring than 'center'
              inline: 'nearest'
            })
          }
        }
      }
    }, 100)
  }

  const handleCheckboxChange = (berthId: string, checked: boolean) => {
    const newCheckedBerths = new Set(checkedBerths)
    if (checked) {
      newCheckedBerths.add(berthId)
    } else {
      newCheckedBerths.delete(berthId)
    }
    setCheckedBerths(newCheckedBerths)
  }

  const toggleMobileMode = () => setIsMobileMode(!isMobileMode)
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

  // Compass dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - compassPosition.x,
      y: e.clientY - compassPosition.y
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setCompassPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'occupied':
        return { color: 'bg-green-500', text: 'Occupied', icon: Ship }
      case 'available':
        return { color: 'bg-blue-500', text: 'Available', icon: MapPin }
      case 'reserved':
        return { color: 'bg-yellow-500', text: 'Reserved', icon: Bell }
      case 'maintenance':
        return { color: 'bg-red-500', text: 'Maintenance', icon: Bell }
      default:
        return { color: 'bg-gray-500', text: 'Unknown', icon: MapPin }
    }
  }

  const getMaintenanceInfo = (status: string) => {
    switch (status) {
      case 'good':
        return { color: 'bg-green-500', text: 'Good', icon: '✓' }
      case 'needs_attention':
        return { color: 'bg-yellow-500', text: 'Needs Attention', icon: '⚠' }
      case 'maintenance_due':
        return { color: 'bg-red-500', text: 'Due', icon: '🔧' }
      default:
        return { color: 'bg-gray-500', text: 'Unknown', icon: '?' }
    }
  }

  // Simulate user movement for testing
  useEffect(() => {
    const interval = setInterval(() => {
      setUserDirection(['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)] as 'N' | 'S' | 'E' | 'W')
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // DEBUG: Height investigation logging - TEMPORARY
  useEffect(() => {
    const logHeights = () => {
      logger.debug('Height Investigation - Content Overflow Issue')
      
      const berthSidebar = document.querySelector('.berth-list')
      const berthCard = document.querySelector('.berth-list .shadow-lg')
      const berthContent = document.querySelector('.berth-list .overflow-y-auto')
      const marinaGrid = document.querySelector('.lg\\:col-span-2 .shadow-lg')
      
      if (berthSidebar) {
        const rect = berthSidebar.getBoundingClientRect()
        logger.debug('Berth Sidebar Container dimensions', {
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
          className: berthSidebar.className
        })
      }
      
      if (berthCard) {
        const rect = berthCard.getBoundingClientRect()
        logger.debug('Berth Card dimensions', {
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
          className: berthCard.className
        })
      }
      
      if (berthContent) {
        const rect = berthContent.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(berthContent)
        logger.debug('Berth Content Area dimensions', {
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
          className: berthContent.className,
          computedHeight: computedStyle.height,
          maxHeight: computedStyle.maxHeight,
          overflow: computedStyle.overflow,
          scrollHeight: berthContent.scrollHeight,
          clientHeight: berthContent.clientHeight
        })
      }
      
      if (marinaGrid) {
        const rect = marinaGrid.getBoundingClientRect()
        logger.debug('Marina Grid dimensions', {
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
          className: marinaGrid.className
        })
      }
      
      logger.debug('END DEBUG LOGGING')
    }
    
    // Log heights after component mounts and after a delay
    logHeights()
    const timer = setTimeout(logHeights, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Simple hover tooltip system - shows existing element labels on hover
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  
  // Boat verification system state
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean
    berthId: string | null
    searchQuery: string
    selectedBoatId: string | null
  }>({
    isOpen: false,
    berthId: null,
    searchQuery: '',
    selectedBoatId: null
  })
  
  const [boatVerifications, setBoatVerifications] = useState<Map<string, {
    isCorrect: boolean
    correctBoatId?: string
    verifiedAt: Date
  }>>(new Map())
  


  // Boat verification handlers
  const handleCorrectBoat = (berthId: string) => {
    setBoatVerifications(prev => new Map(prev).set(berthId, {
      isCorrect: true,
      verifiedAt: new Date()
    }))
  }

  const handleWrongBoat = (berthId: string) => {
    setVerificationModal({
      isOpen: true,
      berthId,
      searchQuery: '',
      selectedBoatId: null
    })
  }

  const handleBoatSelection = (boatId: string) => {
    if (verificationModal.berthId) {
      setBoatVerifications(prev => new Map(prev).set(verificationModal.berthId!, {
        isCorrect: false,
        correctBoatId: boatId,
        verifiedAt: new Date()
      }))
      setVerificationModal({
        isOpen: false,
        berthId: null,
        searchQuery: '',
        selectedBoatId: null
      })
    }
  }

  const closeVerificationModal = () => {
    setVerificationModal({
      isOpen: false,
      berthId: null,
      searchQuery: '',
      selectedBoatId: null
    })
  }

  // Filter boats based on search query
  const filteredBoats = boats.filter(boat => {
    const searchQuery = verificationModal.searchQuery.toLowerCase()
    const boatName = boat.name?.toLowerCase() || ''
    const boatOwner = boat.owner?.toLowerCase() || ''
    
    return boatName.includes(searchQuery) || boatOwner.includes(searchQuery)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`marina-walk-test-container ${isMobileMode ? 'mobile-mode' : ''}`}>

      
      {/* Enhanced Control Bar with Research-Based Features */}
      <div 
        className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 relative"
        onMouseEnter={(e) => showTooltip('[CONTROL_BAR]', e)}
        onMouseLeave={hideTooltip}
      >
        {/* Element Label */}
        {renderElementLabel('[CONTROL_BAR]', 'absolute -top-5 left-2')}
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">🚢 Enhanced Marina View</h2>
            <p className="text-sm text-gray-600">Research-based UX improvements in action</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.location.href = '/en-GB/marina-walk'}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 border-orange-300 text-orange-700 hover:bg-orange-50 relative"
              onMouseEnter={(e) => showTooltip('[BACK_BUTTON]', e)}
              onMouseLeave={hideTooltip}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Original</span>
              {/* Element Label */}
              {renderElementLabel('[BACK_BUTTON]', 'absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap')}
            </Button>
            
            <Button
              onClick={toggleMobileMode}
              variant={isMobileMode ? "default" : "outline"}
              size="sm"
              className="flex items-center space-x-2 relative"
              onMouseEnter={(e) => showTooltip('[MOBILE_TOGGLE]', e)}
              onMouseLeave={hideTooltip}
            >
              {isMobileMode ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
              <span>{isMobileMode ? 'Desktop Mode' : 'Mobile Mode'}</span>
              {/* Element Label */}
              {renderElementLabel('[MOBILE_TOGGLE]', 'absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap')}
            </Button>
            
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 relative"
              onMouseEnter={(e) => showTooltip('[FULLSCREEN_BUTTON]', e)}
              onMouseLeave={hideTooltip}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              {/* Element Label */}
              {renderElementLabel('[FULLSCREEN_BUTTON]', 'absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap')}
            </Button>
            
                         {/* Enhanced Mouse-over Labels Toggle - DEVELOPMENT TOOL */}
             <Button
               onClick={() => {
                 setShowMouseOverLabels(!showMouseOverLabels)
                 setHoveredElement(null) // Clear any existing tooltip
               }}
               variant={showMouseOverLabels ? "default" : "outline"}
               size="sm"
               className="flex items-center space-x-2 relative border-purple-300 text-purple-700 hover:bg-purple-50"
               onMouseEnter={(e) => showTooltip('[MOUSEOVER_TOGGLE]', e)}
               onMouseLeave={hideTooltip}
             >
               <Search className="h-4 w-4" />
               <span>{showMouseOverLabels ? 'Hide Auto-Labels' : 'Show Auto-Labels'}</span>
             </Button>
             

          </div>
        </div>

        {/* Enhanced Navigation Controls */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 relative"
          onMouseEnter={(e) => showTooltip('[NAVIGATION_CONTROLS]', e)}
          onMouseLeave={hideTooltip}
        >
          {/* Element Label */}
          {renderElementLabel('[NAVIGATION_CONTROLS]', 'absolute -top-5 left-6')}
          
          {/* Compass Navigation */}
          <div 
            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200 relative"
            onMouseEnter={(e) => showTooltip('[COMPASS_NAV]', e)}
            onMouseLeave={hideTooltip}
          >
            <Compass className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">Direction</div>
              <div className="text-lg font-bold text-blue-600">{userDirection}</div>
            </div>
            <Button
              onClick={() => setShowCompass(!showCompass)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 relative"
              onMouseEnter={(e) => showTooltip('[COMPASS_TOGGLE]', e)}
              onMouseLeave={hideTooltip}
            >
              {showCompass ? 'Hide' : 'Show'}
              {/* Element Label */}
              {renderElementLabel('[COMPASS_TOGGLE]', 'absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap')}
            </Button>
            {/* Element Label */}
            {renderElementLabel('[COMPASS_NAV]', 'absolute -top-5 right-2')}
          </div>

          {/* Location Tracking */}
          <div 
            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200 relative"
            onMouseEnter={(e) => showTooltip('[LOCATION_TRACKER]', e)}
            onMouseLeave={hideTooltip}
          >
            <MapPin className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">Current Location</div>
              <div className="text-sm text-gray-600">Berth A1 Area</div>
            </div>
            {/* Element Label */}
            {renderElementLabel('[LOCATION_TRACKER]', 'absolute -top-5 right-6')}
          </div>

          {/* Team Status */}
          <div 
            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200 relative"
            onMouseEnter={(e) => showTooltip('[TEAM_STATUS]', e)}
            onMouseLeave={hideTooltip}
          >
            <Users className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">Team Online</div>
              <div className="text-sm text-gray-600">3 members active</div>
            </div>
            {/* Element Label */}
            {renderElementLabel('[TEAM_STATUS]', 'absolute -top-5 right-10')}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative items-stretch"
        onMouseEnter={(e) => showTooltip('[MAIN_CONTENT_GRID]', e)}
        onMouseLeave={hideTooltip}
      >
        {/* Element Label */}
        {renderElementLabel('[MAIN_CONTENT_GRID]', 'absolute -top-5 left-1/2 transform -translate-x-1/2')}
        
                 {/* Enhanced Berth List - Left Sidebar */}
         <div 
           className={`berth-list ${isMobileMode ? 'hidden' : ''} flex flex-col`}
           onMouseEnter={(e) => showTooltip('[BERTH_LIST_SIDEBAR]', e)}
           onMouseLeave={hideTooltip}
         >
           <Card className="shadow-lg relative flex flex-col h-full overflow-hidden">
            {/* Element Label */}
            {renderElementLabel('[BERTH_LIST_SIDEBAR]', 'absolute -top-5 left-2')}
            
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Enhanced Berth List</span>
              </CardTitle>
              
              {/* Selection Status Indicator */}
              {selectedBerthId && (
                <div 
                  className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg relative"
                  onMouseEnter={(e) => showTooltip('[SELECTION_INDICATOR]', e)}
                  onMouseLeave={hideTooltip}
                >
                  {/* Element Label */}
                  {renderElementLabel('[SELECTION_INDICATOR]', 'absolute -top-5 right-2')}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-blue-800">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">
                        Selected: Berth {enrichedBerths.find(b => b.id === selectedBerthId)?.number}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Smart scroll to show selected berth if not visible
                        const berthElement = document.getElementById(`test-berth-${selectedBerthId}`)
                        if (berthElement) {
                          const rect = berthElement.getBoundingClientRect()
                          const listContainer = berthElement.closest('.overflow-y-auto')
                          
                          if (listContainer) {
                            const containerRect = listContainer.getBoundingClientRect()
                            
                            // Only scroll if the element is not fully visible
                            if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
                              berthElement.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'nearest',
                                inline: 'nearest'
                              })
                            }
                          }
                        }
                      }}
                      className="text-xs h-6 px-2 relative"
                      onMouseEnter={(e) => showTooltip('[JUMP_TO_BERTH]', e)}
                      onMouseLeave={hideTooltip}
                    >
                      Jump to Berth
                      {/* Element Label */}
                      {renderElementLabel('[JUMP_TO_BERTH]', 'absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Enhanced Filters */}
              <div 
                className="mt-3 space-y-2 relative"
                onMouseEnter={(e) => showTooltip('[FILTERS_SECTION]', e)}
                onMouseLeave={hideTooltip}
              >
                {/* Element Label */}
                {renderElementLabel('[FILTERS_SECTION]', 'absolute -top-5 left-6')}
                
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search berths..."
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Status
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Size
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Maintenance
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col min-h-0">
              <div 
                className="space-y-2 flex-1 overflow-y-auto relative"
                onMouseEnter={(e) => showTooltip('[BERTH_LIST_CONTENT]', e)}
                onMouseLeave={hideTooltip}
              >
                {/* Element Label */}
                {renderElementLabel('[BERTH_LIST_CONTENT]', 'absolute -top-5 left-10')}
                
                {enrichedBerths.map((berth) => {
                  const statusInfo = getStatusInfo(berth.status)
                  const StatusIcon = statusInfo.icon
                  const isSelected = selectedBerthId === berth.id
                  const maintenanceInfo = berth.maintenanceStatus ? getMaintenanceInfo(berth.maintenanceStatus) : null
                  
                  return (
                                         <div
                       id={`test-berth-${berth.id}`}
                       key={berth.id}
                                               className={`p-3 rounded-lg border cursor-pointer transition-all ${
                         isSelected 
                           ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200 ring-opacity-50' 
                           : checkedBerths.has(berth.id)
                           ? 'border-green-300 bg-green-50 shadow-sm ring-1 ring-green-200 ring-opacity-30'
                           : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                       }`}
                       onClick={() => handleBerthSelect(berth.id)}
                     >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}></div>
                            <span className="font-semibold text-gray-800">Berth {berth.number}</span>
                            {maintenanceInfo && (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${maintenanceInfo.color}`}>
                                {maintenanceInfo.icon} {maintenanceInfo.text}
                              </div>
                            )}
                          </div>
                          
                          {berth.boatName && (
                            <div className="mb-2">
                              <div className="text-sm font-medium text-gray-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 inline-block">
                                {berth.boatName}
                              </div>
                            </div>
                          )}
                          
                          {berth.owner && (
                            <div className="text-xs text-gray-600 mb-1">
                              Owner: {berth.owner}
                            </div>
                          )}
                          
                          {berth.nextInspection && (
                            <div className="text-xs text-gray-600">
                              Next Inspection: {berth.nextInspection}
                            </div>
                          )}
                        </div>
                        
                        {/* Boat Verification Buttons */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCorrectBoat(berth.id)
                            }}
                            className="h-6 px-3 text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                            disabled={boatVerifications.has(berth.id)}
                          >
                            <span className="mr-1">✓</span>
                            Correct
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleWrongBoat(berth.id)
                            }}
                            className="h-6 px-3 text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                            disabled={boatVerifications.has(berth.id)}
                          >
                            <span className="mr-1">✗</span>
                            Wrong
                          </Button>
                        </div>
                        
                        {/* Verification Status Indicator */}
                        {boatVerifications.has(berth.id) && (
                          <div className="mt-2 p-2 rounded-md text-xs">
                            {boatVerifications.get(berth.id)?.isCorrect ? (
                              <div className="flex items-center space-x-2 text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                                <span className="text-green-600">✓</span>
                                <span>Verified: Correct boat in berth</span>
                                <span className="text-orange-500 text-xs">
                                  {boatVerifications.get(berth.id)?.verifiedAt.toLocaleTimeString()}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                                <span className="text-orange-600">⚠</span>
                                <span>
                                  Correct boat: {boats.find(b => b.id === boatVerifications.get(berth.id)?.correctBoatId)?.name}
                                </span>
                                <span className="text-orange-500 text-xs">
                                  {boatVerifications.get(berth.id)?.verifiedAt.toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Marina Grid - Center */}
        <div className="lg:col-span-2">
          <Card 
            className="shadow-lg relative"
            onMouseEnter={(e) => showTooltip('[MARINA_GRID_CARD]', e)}
            onMouseLeave={hideTooltip}
          >
            {/* Element Label */}
            {renderElementLabel('[MARINA_GRID_CARD]', 'absolute -top-5 right-2')}
            
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Ship className="h-5 w-5 text-blue-600" />
                <span>Enhanced Marina Grid</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Click on berths to select them • Enhanced with research-based UX improvements
              </p>
            </CardHeader>
            
            <CardContent>
                             {/* Enhanced Marina Grid */}
               <div 
                                   className="marina-grid-test bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border-2 border-blue-200 relative"
                 onMouseEnter={(e) => showTooltip('[MARINA_GRID_CONTAINER]', e)}
                 onMouseLeave={hideTooltip}
               >
                {/* Element Label */}
                {renderElementLabel('[MARINA_GRID_CONTAINER]', 'absolute -top-5 right-6')}
                
                {/* Compass Overlay - Draggable */}
                {showCompass && (
                  <div 
                    className="absolute bg-white p-2 rounded-lg shadow-lg border border-blue-200 z-10 select-none cursor-move"
                    style={{
                      left: `${compassPosition.x}px`,
                      top: `${compassPosition.y}px`
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={(e) => showTooltip('[DRAGGABLE_COMPASS]', e)}
                    onMouseLeave={hideTooltip}
                  >
                    {/* Element Label */}
                    {renderElementLabel('[DRAGGABLE_COMPASS]', 'absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap')}
                    
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        🧭 Compass
                      </div>
                      <div className="text-lg font-bold text-blue-600">{userDirection}</div>
                      <div className="text-xs text-gray-500">Direction</div>
                    </div>
                  </div>
                )}

                {/* Berth Grid */}
                <div 
                  className="grid grid-cols-4 gap-3 relative"
                  onMouseEnter={(e) => showTooltip('[BERTH_GRID]', e)}
                  onMouseLeave={hideTooltip}
                >
                  {/* Element Label */}
                  {renderElementLabel('[BERTH_GRID]', 'absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap')}
                  
                  {enrichedBerths.map((berth) => {
                    const statusInfo = getStatusInfo(berth.status)
                    const isSelected = selectedBerthId === berth.id
                    const maintenanceInfo = berth.maintenanceStatus ? getMaintenanceInfo(berth.maintenanceStatus) : null
                    const hasBoat = berth.boatId
                    
                    return (
                      <div
                        key={berth.id}
                        className={`berth-cell-test relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-100 shadow-lg scale-105 ring-4 ring-blue-200 ring-opacity-50'
                            : checkedBerths.has(berth.id)
                            ? 'border-green-400 bg-green-100 shadow-md ring-2 ring-green-200 ring-opacity-40'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                        } ${
                          hasBoat ? 'bg-white' : 'bg-gray-200'
                        }`}
                        onClick={() => handleBerthSelect(berth.id)}
                      >
                        {/* Berth Number */}
                        <div className={`text-sm font-bold text-center mb-2 ${
                          checkedBerths.has(berth.id) ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {berth.number}
                        </div>

                        {/* Boat Information */}
                        {hasBoat && (
                          <div className="text-center mb-2">
                            <Ship className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                            <div className="text-xs font-medium text-gray-800 bg-white bg-opacity-90 px-1 py-0.5 rounded border border-gray-200 shadow-sm">
                              {berth.boatName}
                            </div>
                          </div>
                        )}

                        {/* Status Indicator */}
                        <div className="absolute top-2 right-2">
                          <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                        </div>

                        {/* Maintenance Status */}
                        {maintenanceInfo && (
                          <div className="absolute bottom-2 left-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${maintenanceInfo.color}`}>
                              {maintenanceInfo.icon}
                            </div>
                          </div>
                        )}

                        {/* Checked Indicator */}
                        {checkedBerths.has(berth.id) && (
                          <div className="absolute bottom-2 right-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          </div>
                        )}

                        {/* Selection Highlight */}
                        {isSelected && (
                          <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none animate-pulse"></div>
                        )}
                        
                        
                      </div>
                    )
                  })}
                </div>

                {/* Enhanced Legend */}
                <div 
                  className="mt-6 p-4 bg-white rounded-lg border border-blue-200 relative"
                  onMouseEnter={(e) => showTooltip('[ENHANCED_LEGEND]', e)}
                  onMouseLeave={hideTooltip}
                >
                  {/* Element Label */}
                  {renderElementLabel('[ENHANCED_LEGEND]', 'absolute -top-5 right-10')}
                  
                  <h4 className="font-medium text-gray-800 mb-3">Enhanced Legend</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Occupied</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Reserved</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Maintenance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span>Checked Off</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">⚠</div>
                      <span>Needs Attention</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">🔧</div>
                      <span>Maintenance Due</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">N</div>
                      <span>Direction Indicator</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spacer to prevent overlap */}
      <div className="h-8"></div>

      {/* Boat Verification Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800 flex items-center space-x-2">
            <span className="text-green-600">📋</span>
            <span>Boat Verification Progress</span>
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {boatVerifications.size} of {enrichedBerths.length} berths verified
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(boatVerifications.size / enrichedBerths.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-white rounded-lg border border-green-200">
            <div className="font-medium text-green-600 mb-1 flex items-center space-x-2">
              <span>✓</span>
              <span>Correct Boats</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {Array.from(boatVerifications.values()).filter(v => v.isCorrect).length}
            </div>
            <p className="text-gray-600">Boats in correct berths</p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-orange-200">
            <div className="font-medium text-orange-600 mb-1 flex items-center space-x-2">
              <span>⚠</span>
              <span>Wrong Boats</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {Array.from(boatVerifications.values()).filter(v => !v.isCorrect).length}
            </div>
            <p className="text-gray-600">Boats in wrong berths</p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <div className="font-medium text-blue-600 mb-1 flex items-center space-x-2">
              <span>📊</span>
              <span>Remaining</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {enrichedBerths.length - boatVerifications.size}
            </div>
            <p className="text-gray-600">Berths still to verify</p>
          </div>
        </div>
        
        {boatVerifications.size > 0 && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recent verifications:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBoatVerifications(new Map())}
                className="text-xs h-6 px-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(boatVerifications.entries()).slice(-5).map(([berthId, verification]) => {
                const berth = enrichedBerths.find(b => b.id === berthId)
                return (
                  <div
                    key={berthId}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      verification.isCorrect 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-orange-100 text-orange-800 border border-orange-200'
                    }`}
                  >
                    Berth {berth?.number}: {verification.isCorrect ? '✓ Correct' : '⚠ Wrong'}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Boat Verification Modal */}
      {verificationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Select Correct Boat</h3>
                  <p className="text-sm text-red-600 mt-1">
                    Berth {enrichedBerths.find(b => b.id === verificationModal.berthId)?.number} - 
                    Wrong boat currently in berth
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeVerificationModal}
                  className="text-red-600 hover:text-red-800 hover:bg-red-100"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-xl">×</span>
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Start typing boat name or owner..."
                  value={verificationModal.searchQuery}
                  onChange={(e) => setVerificationModal(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                  autoFocus
                />
                {verificationModal.searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVerificationModal(prev => ({ ...prev, searchQuery: '' }))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Clear search</span>
                    <span className="text-xl">×</span>
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {filteredBoats.length} boat{filteredBoats.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Boat List */}
            <div className="flex-1 overflow-y-auto max-h-96">
              {filteredBoats.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredBoats.map((boat) => (
                    <div
                      key={boat.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleBoatSelection(boat.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Ship className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">{boat.name}</h4>
                              <p className="text-sm text-gray-600">Owner: {boat.owner}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Length: {Math.round(boat.length)}m</span>
<span>Beam: {Math.round(boat.beam)}m</span>
                            <span>Contact: {boat.contact}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            boat.maintenanceStatus === 'good' 
                              ? 'bg-green-100 text-green-800' 
                              : boat.maintenanceStatus === 'needs_attention'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {boat.maintenanceStatus === 'good' ? 'Good' : 
                             boat.maintenanceStatus === 'needs_attention' ? 'Needs Attention' : 'Maintenance Due'}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No boats found</h4>
                  <p className="text-gray-500">
                    {verificationModal.searchQuery 
                      ? `No boats match "${verificationModal.searchQuery}"` 
                      : 'Start typing to search for boats'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Select the boat that should be in this berth
                </p>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={closeVerificationModal}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Bottom Panel */}
      <div 
        className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 relative"
        onMouseEnter={(e) => showTooltip('[BOTTOM_PANEL]', e)}
        onMouseLeave={hideTooltip}
      >
        {/* Element Label */}
        {renderElementLabel('[BOTTOM_PANEL]', 'absolute -top-5 left-10')}
        
        <h3 className="font-medium text-gray-800 mb-3">🚀 Research-Based Features Implemented</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-white rounded-lg border">
            <div className="font-medium text-blue-600 mb-1">Navigation & Orientation</div>
            <ul className="text-gray-600 space-y-1">
              <li>• Compass direction indicator</li>
              <li>• Current location tracking</li>
              <li>• Enhanced spatial awareness</li>
            </ul>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="font-medium text-green-600 mb-1">Contextual Information</div>
            <ul className="text-gray-600 space-y-1">
              <li>• Rich boat information cards</li>
              <li>• Maintenance status indicators</li>
              <li>• Owner contact details</li>
            </ul>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="font-medium text-purple-600 mb-1">Touch-First Design</div>
            <ul className="text-gray-600 space-y-1">
              <li>• Mobile-optimized layout</li>
              <li>• Enhanced visual feedback</li>
              <li>• Improved accessibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
