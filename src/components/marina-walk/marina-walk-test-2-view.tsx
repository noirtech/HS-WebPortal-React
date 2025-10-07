'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocaleFormatting } from '@/lib/locale-context'
import { 
  Ship, 
  MapPin, 
  Compass, 
  Users, 
  Search,
  Filter,
  Smartphone,
  Monitor,
  Maximize2,
  Minimize2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Fullscreen,
  Smartphone as PhoneIcon,
  Tablet,
  Laptop,
  RotateCcw
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

interface MarinaWalkTest2ViewProps {
  berths: Berth[]
  boats: Boat[]
}

export function MarinaWalkTest2View({ berths, boats }: MarinaWalkTest2ViewProps) {
  const { localeConfig } = useLocaleFormatting()
  
  // View mode state with automatic detection
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDockWalkMode, setIsDockWalkMode] = useState(false)
  
  // Refs for gesture handling
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  
  // Auto-detect device size on mount and resize
  useEffect(() => {
    const detectDeviceSize = () => {
      const width = window.innerWidth
      if (width <= 768) {
        setViewMode('mobile')
      } else if (width <= 1024) {
        setViewMode('tablet')
      } else {
        setViewMode('desktop')
      }
    }
    
    // Initial detection
    detectDeviceSize()
    
    // Listen for resize events
    window.addEventListener('resize', detectDeviceSize)
    
    return () => window.removeEventListener('resize', detectDeviceSize)
  }, [])
  
  // Dock walk state
  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null)
  const [verifiedBerths, setVerifiedBerths] = useState<Set<string>>(new Set())
  const [currentLocation, setCurrentLocation] = useState({ x: 0, y: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
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

  // Filter berths based on search and status
  const filteredBerths = enrichedBerths.filter(berth => {
    const matchesSearch = searchQuery === '' || 
      berth.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      berth.boatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      berth.owner?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const handleBerthSelect = (berthId: string) => {
    setSelectedBerthId(berthId === selectedBerthId ? null : berthId)
  }

  const handleVerification = (berthId: string, isCorrect: boolean) => {
    if (isCorrect) {
      setVerifiedBerths(prev => new Set(prev).add(berthId))
    } else {
      setVerifiedBerths(prev => {
        const newSet = new Set(prev)
        newSet.delete(berthId)
        return newSet
      })
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'occupied':
        return { color: 'bg-blue-500', text: 'Occupied', icon: Ship }
      case 'available':
        return { color: 'bg-green-500', text: 'Available', icon: MapPin }
      case 'reserved':
        return { color: 'bg-yellow-500', text: 'Reserved', icon: AlertTriangle }
      case 'maintenance':
        return { color: 'bg-red-500', text: 'Maintenance', icon: AlertTriangle }
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

  // Enhanced fullscreen handling with viewport optimization
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement
      setIsFullscreen(isFullscreenNow)
      
      // Optimize viewport for dock walk mode
      if (isFullscreenNow) {
        setIsDockWalkMode(true)
        // Add mobile-optimized viewport meta tag
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover')
        }
      } else {
        setIsDockWalkMode(false)
        // Restore default viewport
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1')
        }
      }
    }

    // Keyboard event handler for ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Gesture handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    
    // Swipe right to exit fullscreen (common mobile gesture)
    if (deltaX > 100 && deltaTime < 300 && Math.abs(deltaY) < 50) {
      if (isFullscreen) {
        // Add visual feedback
        if (containerRef.current) {
          containerRef.current.classList.add('swipe-feedback')
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.classList.remove('swipe-feedback')
            }
          }, 300)
        }
        document.exitFullscreen()
      }
    }
    
    // Swipe down to exit fullscreen (iOS-style gesture)
    if (deltaY > 100 && deltaTime < 300 && Math.abs(deltaX) < 50) {
      if (isFullscreen) {
        // Add visual feedback
        if (containerRef.current) {
          containerRef.current.classList.add('swipe-feedback')
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.classList.remove('swipe-feedback')
            }
          }, 300)
        }
        document.exitFullscreen()
      }
    }
    
    touchStartRef.current = null
  }

  // Save portal state before entering dock walk mode
  const savePortalState = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('marinaPortalState', JSON.stringify({
        scrollPosition: window.scrollY,
        searchQuery: searchQuery,
        selectedBerth: selectedBerthId,
        timestamp: Date.now()
      }))
    }
  }

  // Restore portal state when exiting dock walk mode
  const restorePortalState = () => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('marinaPortalState')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          // Only restore if state is recent (within 5 minutes)
          if (Date.now() - state.timestamp < 300000) {
            setSearchQuery(state.searchQuery || '')
            setSelectedBerthId(state.selectedBerth || null)
            // Scroll position will be handled by the browser
          }
        } catch (error) {
          console.warn('Failed to restore portal state:', error)
        }
      }
    }
  }

  // Enhanced fullscreen toggle with state management
  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      savePortalState()
      toggleFullscreen()
    } else {
      toggleFullscreen()
      // Small delay to ensure fullscreen exit completes
      setTimeout(() => {
        restorePortalState()
      }, 100)
    }
  }

  // Handle back navigation to previous page
  const handleBack = () => {
    // Use browser history to go back to the previous page
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`dock-walk-test-2-container ${viewMode} ${isFullscreen ? 'fullscreen' : ''} ${isDockWalkMode ? 'dock-walk-mode' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with search and controls */}
      <div className={`flex flex-col space-y-3 ${
        viewMode === 'mobile' ? 'p-3' :
        viewMode === 'tablet' ? 'p-4' :
        'p-5'
      }`}>
        {/* Title and subtitle */}
        <div className="text-center">
          <h1 className={`font-bold text-gray-900 ${
            viewMode === 'mobile' ? 'text-xl' :
            viewMode === 'tablet' ? 'text-2xl' :
            'text-3xl'
          }`}>
            <Ship className={`inline mr-2 ${
              viewMode === 'mobile' ? 'h-5 w-5' :
              viewMode === 'tablet' ? 'h-6 w-6' :
              'h-8 w-8'
            }`} />
                            Dockwalk
          </h1>
          <p className={`text-gray-600 ${
            viewMode === 'mobile' ? 'text-sm' :
            viewMode === 'tablet' ? 'text-base' :
            'text-lg'
          }`}>
            {/* marina.name and marina.totalBerths are not defined in this component's props */}
            {/* Assuming they are passed as props or defined elsewhere */}
            {/* For now, leaving them as placeholders */}
            Marina Name - Total Berths
          </p>
        </div>

        {/* Search and filter row */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
              viewMode === 'mobile' ? 'h-4 w-4' :
              viewMode === 'tablet' ? 'h-5 w-5' :
              'h-6 w-6'
            }`} />
            <input
              type="text"
              placeholder={viewMode === 'mobile' ? 'Search...' : 'Search berths or boats...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                viewMode === 'mobile' ? 'text-sm' :
                viewMode === 'tablet' ? 'text-base' :
                'text-lg'
              }`}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Filter className={`${
              viewMode === 'mobile' ? 'h-4 w-4' :
              viewMode === 'tablet' ? 'h-5 w-5' :
              'h-6 w-6'
            }`} />
            {viewMode === 'mobile' ? null : (
              <span className={viewMode === 'tablet' ? 'text-sm' : 'text-base'}>
                {viewMode === 'tablet' ? 'Filter' : 'Filters'}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Berth Grid - Mobile Optimized */}
        <div className={`${
          viewMode === 'mobile' ? 'p-2' : 
          viewMode === 'tablet' ? 'p-4' : 
          'p-6'
        }`}>
          <div className={`grid ${
            viewMode === 'mobile' ? 'grid-cols-2 gap-2' : 
            viewMode === 'tablet' ? 'grid-cols-3 gap-3' : 
            'grid-cols-4 xl:grid-cols-5 gap-4'
          }`}>
            {filteredBerths.map((berth) => {
              const statusInfo = getStatusInfo(berth.status)
              const isSelected = selectedBerthId === berth.id
              const isVerified = verifiedBerths.has(berth.id)
              const maintenanceInfo = berth.maintenanceStatus ? getMaintenanceInfo(berth.maintenanceStatus) : null
              
              return (
                <Card
                  key={berth.id}
                  className={`berth-card cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''
                  } ${isVerified ? 'border-green-500 bg-green-50' : 'border-gray-200'} ${
                    viewMode === 'mobile' ? 'p-3' : 
                    viewMode === 'tablet' ? 'p-4' : 
                    'p-5'
                  }`}
                  onClick={() => handleBerthSelect(berth.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                        <span className={`font-bold ${
                          viewMode === 'mobile' ? 'text-base' : 
                          viewMode === 'tablet' ? 'text-lg' : 
                          'text-xl'
                        }`}>{berth.number}</span>
                      </div>
                      
                      {isVerified && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Boat Information */}
                    {berth.boatName && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Ship className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-800">{berth.boatName}</span>
                        </div>
                        
                        {berth.owner && (
                          <div className="text-sm text-gray-600">
                            Owner: {berth.owner}
                          </div>
                        )}
                        
                        {berth.boatLength && berth.boatBeam && (
                          <div className="text-xs text-gray-500">
                            {berth.boatLength}m × {berth.boatBeam}m
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Maintenance Status */}
                    {maintenanceInfo && (
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white ${maintenanceInfo.color}`}>
                        <span>{maintenanceInfo.icon}</span>
                        <span>{maintenanceInfo.text}</span>
                      </div>
                    )}
                    
                    {/* Verification Buttons */}
                    <div className={`flex pt-2 ${
                      viewMode === 'mobile' ? 'space-x-1' : 'space-x-2'
                    }`}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerification(berth.id, true)
                        }}
                        className={`flex-1 transition-all duration-200 ${
                          viewMode === 'mobile' ? 'h-8 text-xs' : 
                          viewMode === 'tablet' ? 'h-9 text-sm' : 
                          'h-10 text-base'
                        }`}
                        disabled={isVerified}
                      >
                        <CheckCircle className={`mr-1 ${
                          viewMode === 'mobile' ? 'h-3 w-3' : 
                          viewMode === 'tablet' ? 'h-4 w-4' : 
                          'h-5 w-5'
                        }`} />
                        Correct
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerification(berth.id, false)
                        }}
                        className={`flex-1 transition-all duration-200 ${
                          viewMode === 'mobile' ? 'h-8 text-xs' : 
                          viewMode === 'tablet' ? 'h-9 text-sm' : 
                          'h-10 text-base'
                        }`}
                      >
                        <XCircle className={`mr-1 ${
                          viewMode === 'mobile' ? 'h-3 w-3' : 
                          viewMode === 'tablet' ? 'h-4 w-4' : 
                          'h-5 w-5'
                        }`} />
                        Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Responsive Bottom Navigation */}
      <div className={`mobile-bottom-nav bg-white border-t border-gray-200 transition-all duration-300 ${
        viewMode === 'mobile' ? 'p-2' : 
        viewMode === 'tablet' ? 'p-3' : 
        'p-4'
      }`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${
            viewMode === 'mobile' ? 'space-x-2' : 'space-x-4'
          }`}>
            <div className={`flex items-center ${
              viewMode === 'mobile' ? 'space-x-1' : 'space-x-2'
            }`}>
              <MapPin className={`text-blue-600 ${
                viewMode === 'mobile' ? 'h-3 w-3' : 'h-4 w-4'
              }`} />
              <span className={`text-gray-600 ${
                viewMode === 'mobile' ? 'text-xs' : 'text-sm'
              }`}>Location: A1</span>
            </div>
            
            <div className={`flex items-center ${
              viewMode === 'mobile' ? 'space-x-1' : 'space-x-2'
            }`}>
              <Users className={`text-green-600 ${
                viewMode === 'mobile' ? 'h-3 w-3' : 'h-4 w-4'
              }`} />
              <span className={`text-gray-600 ${
                viewMode === 'mobile' ? 'text-xs' : 'text-sm'
              }`}>Team: 3 online</span>
            </div>
          </div>
          
          <div className={`flex items-center ${
            viewMode === 'mobile' ? 'space-x-1' : 'space-x-2'
          }`}>
            <Button
              size="sm"
              variant="outline"
              className={`transition-all duration-200 ${
                viewMode === 'mobile' ? 'h-7 px-2 text-xs' : 
                viewMode === 'tablet' ? 'h-8 px-3 text-sm' : 
                'h-8 px-3'
              }`}
            >
              <Settings className={`mr-1 ${
                viewMode === 'mobile' ? 'h-3 w-3' : 'h-4 w-4'
              }`} />
              {viewMode === 'mobile' ? '' : 'Settings'}
            </Button>
            
            <Button
              size="sm"
              variant="default"
              className={`bg-blue-600 hover:bg-blue-700 transition-all duration-200 ${
                viewMode === 'mobile' ? 'h-7 px-2 text-xs' : 
                viewMode === 'tablet' ? 'h-8 px-3 text-sm' : 
                'h-8 px-3'
              }`}
              onClick={handleBack}
            >
              <ArrowLeft className={`mr-1 ${
                viewMode === 'mobile' ? 'h-3 w-3' : 'h-4 w-4'
              }`} />
              {viewMode === 'mobile' ? '' : 'Back'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
