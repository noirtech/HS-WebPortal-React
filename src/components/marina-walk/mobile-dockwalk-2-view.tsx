'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ship, MapPin, Search, CheckCircle, AlertTriangle, Clock, RefreshCw, X, Anchor, Eye, BarChart3, Wrench, FileText, Download, Share, Bell, Settings, User, Shield, Globe, Database, HelpCircle, Zap, Brain, Box, TrendingUp, Users, Mic, Camera, Upload, Copy, Trash2, Droplets, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'

interface Berth {
  id: string
  number: string
  name: string
  status: string
  boatId?: string
  boatName?: string
  boatLength?: number
  boatBeam?: number
  coordinates: { x: number, y: number }
}

interface Boat {
  id: string
  name: string
  length: number
  beam: number
  draft: number
  owner: string
  contact: string
  lastInspection: string
  nextInspection: string
  maintenanceStatus: string
  berthId: string
}

interface MobileDockwalk2ViewProps {
  berths: Berth[]
  boats: Boat[]
}

export default function MobileDockwalk2View({ berths, boats }: MobileDockwalk2ViewProps) {
  logger.debug('MobileDockwalk2View Component function started')
  logger.debug('MobileDockwalk2View Props received', { berths, boats })
  
  // Navigation
  const router = useRouter()
  
  // Handle back navigation with fallback
  const handleBackNavigation = () => {
    logger.debug('Back navigation triggered', { 
      historyLength: window.history.length,
      currentPath: window.location.pathname 
    })
    
    // Try to go back in history
    if (window.history.length > 1) {
      logger.debug('Using router.back()')
      router.back()
    } else {
      // Fallback: navigate to the main marina walk page
      logger.debug('Using fallback navigation to /en-GB/marina-walk')
      router.push('/en-GB/marina-walk')
    }
  }
  
  // State management
  const [berthStates, setBerthStates] = useState<Record<string, 'confirmed' | 'another_boat' | 'vacant' | null>>({})
  const [showBoatSelectionModal, setShowBoatSelectionModal] = useState(false)
  const [selectedBerthForBoatChange, setSelectedBerthForBoatChange] = useState<string | null>(null)
  const [boatSearchQuery, setBoatSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('berths')
  
  // Additional state for other tabs
  const [meterReadings, setMeterReadings] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [photoGallery, setPhotoGallery] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [weatherData, setWeatherData] = useState<any>({})
  const [analyticsData, setAnalyticsData] = useState<any>({})
  
  // Header button states
  const [showSummary, setShowSummary] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Dropdown state management
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  // Expanding action panel state for berth-1
  const [expandedBerth1, setExpandedBerth1] = useState(false)
  // Expanding action panel state for berth-2
  const [expandedBerth2, setExpandedBerth2] = useState(false)
  
  // Undo confirmation dialog state
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)
  const [pendingUndoBerthId, setPendingUndoBerthId] = useState<string | null>(null)
  
  // Verify Button ref for berth-1
  const verifyButtonRef = useRef<HTMLButtonElement>(null)
  
  // Modal drag functionality
  const [isDragging, setIsDragging] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Refs
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Hooks
  const { formatCurrency, formatDate } = useLocaleFormatting()

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showBoatSelectionModal) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [showBoatSelectionModal])



  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + Left Arrow for back navigation
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        logger.debug('Keyboard shortcut triggered: Alt + Left Arrow')
        handleBackNavigation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Enhanced berths with boat information
  const enrichedBerths = berths.map(berth => {
    const boat = boats.find(b => b.berthId === berth.id)
    return {
      ...berth,
      boatName: boat?.name || null,
      boatLength: boat?.length || null,
      boatBeam: boat?.beam || null
    }
  })

  // Filtered boats for search
  const filteredBoats = boats.filter(boat =>
    boat.name.toLowerCase().includes(boatSearchQuery.toLowerCase()) ||
    boat.owner.toLowerCase().includes(boatSearchQuery.toLowerCase())
  )

  // Mock data for other tabs
  useEffect(() => {
    // Mock meter readings
    setMeterReadings([
      { id: 1, berthId: 'A1', type: 'electricity', value: 125.5, unit: 'kWh', timestamp: new Date().toISOString() },
      { id: 2, berthId: 'A2', type: 'water', value: 45.2, unit: 'm³', timestamp: new Date().toISOString() },
      { id: 3, berthId: 'A3', type: 'electricity', value: 89.1, unit: 'kWh', timestamp: new Date().toISOString() }
    ])

    // Mock issues
    setIssues([
      { id: 1, berthId: 'A1', type: 'electrical', priority: 'high', status: 'open', description: 'Power outlet not working', timestamp: new Date().toISOString() },
      { id: 2, berthId: 'A2', type: 'plumbing', priority: 'medium', status: 'in-progress', description: 'Water pressure low', timestamp: new Date().toISOString() }
    ])

    // Mock photo gallery
    setPhotoGallery([
      { id: 1, berthId: 'A1', type: 'verification', url: '/api/placeholder/300/200', timestamp: new Date().toISOString() },
      { id: 2, berthId: 'A2', type: 'issue', url: '/api/placeholder/300/200', timestamp: new Date().toISOString() }
    ])

    // Mock team members
    setTeamMembers([
      { id: 1, name: 'John Smith', role: 'Senior Staff', status: 'online', location: 'Dock A', lastSeen: new Date().toISOString() },
      { id: 2, name: 'Sarah Johnson', role: 'Staff', status: 'online', location: 'Dock B', lastSeen: new Date().toISOString() }
    ])

    // Mock AI insights
    setAiInsights([
      { id: 1, type: 'maintenance', title: 'Predictive Maintenance Alert', description: 'Berth A1 electrical system showing early warning signs', confidence: 85, timestamp: new Date().toISOString() },
      { id: 2, type: 'optimization', title: 'Berth Utilization', description: 'Dock A utilization at 87% - consider expansion', confidence: 92, timestamp: new Date().toISOString() }
    ])

    // Mock weather data
    setWeatherData({
      temperature: 18,
      windSpeed: 12,
      windDirection: 'SW',
      visibility: 'Good',
      tide: 'High',
      forecast: 'Partly cloudy with light winds'
    })

    // Mock analytics data
    setAnalyticsData({
      totalBerths: 12,
      occupiedBerths: 8,
      utilizationRate: 67,
      monthlyRevenue: 45000,
      activeIssues: 3,
      resolvedIssues: 15
    })
  }, [])

  // Event handlers
  const handleConfirmBoat = (berthId: string) => {
    setBerthStates(prev => ({ ...prev, [berthId]: 'confirmed' }))
  }

  const handleAnotherBoat = (berthId: string) => {
    setSelectedBerthForBoatChange(berthId)
    setShowBoatSelectionModal(true)
    setBoatSearchQuery('')
  }

  const handleMarkVacant = (berthId: string) => {
    setBerthStates(prev => ({ ...prev, [berthId]: 'vacant' }))
  }

  const handleUndoAction = (berthId: string) => {
    setBerthStates(prev => ({ ...prev, [berthId]: null }))
  }

  const handleSelectBoat = (boatId: string) => {
    if (selectedBerthForBoatChange) {
      setBerthStates(prev => ({ ...prev, [selectedBerthForBoatChange]: 'another_boat' }))
      setShowBoatSelectionModal(false)
      setSelectedBerthForBoatChange(null)
      setBoatSearchQuery('')
    }
  }

  const handleCloseBoatSelectionModal = () => {
    setShowBoatSelectionModal(false)
    setSelectedBerthForBoatChange(null)
    setBoatSearchQuery('')
  }

  // Modal drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      setIsDragging(true)
      const rect = modalRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && modalRef.current) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }



  // Event listeners for modal drag
  useEffect(() => {
    if (showBoatSelectionModal) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [showBoatSelectionModal, isDragging, dragOffset])



  // Escape key and outside click handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showBoatSelectionModal) {
        handleCloseBoatSelectionModal()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleCloseBoatSelectionModal()
      }
    }

    if (showBoatSelectionModal) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('click', handleClickOutside)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showBoatSelectionModal])

  // Focus search input when modal opens
  useEffect(() => {
    if (showBoatSelectionModal && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [showBoatSelectionModal])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.berth-dropdown')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  // Navigation tabs configuration
  const navigationTabs = [
    { id: 'berths', label: 'Berths', icon: MapPin, color: 'blue' },
    { id: 'verify', label: 'Verify', icon: CheckCircle, color: 'green' },
    { id: 'meters', label: 'Meters', icon: Zap, color: 'yellow' },
    { id: 'issues', label: 'Issues', icon: AlertTriangle, color: 'red' },
    { id: 'photos', label: 'Photos', icon: Camera, color: 'purple' },
    { id: 'team', label: 'Team', icon: Users, color: 'indigo' },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain, color: 'pink' },
    { id: '3d-view', label: '3D View', icon: Box, color: 'orange' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'emerald' },
    { id: 'weather', label: 'Weather', icon: Globe, color: 'cyan' },
    { id: 'data', label: 'Data', icon: Database, color: 'slate' }
  ]

  // Helper function to get button text based on berth state
  const getBerthButtonText = (berthId: string) => {
    const berthState = berthStates[berthId]
    if (berthState === 'confirmed') return 'Verified ✓'
    if (berthState === 'another_boat') return 'Another Boat ✓'
    if (berthState === 'vacant') return 'Vacant ✓'
    return 'Verify Boat'
  }

  // Helper function to get button styling based on berth state
  const getBerthButtonStyle = (berthId: string) => {
    const berthState = berthStates[berthId]
    if (berthState === 'confirmed') return 'bg-green-600 hover:bg-green-700'
    if (berthState === 'another_boat') return 'bg-amber-600 hover:bg-amber-700'
    if (berthState === 'vacant') return 'bg-gray-600 hover:bg-gray-700'
    return 'bg-blue-600 hover:bg-blue-700'
  }

  // Helper function to get button icon based on berth state
  const getBerthButtonIcon = (berthId: string) => {
    const berthState = berthStates[berthId]
    if (berthState === 'confirmed') return CheckCircle
    if (berthState === 'another_boat') return Search
    if (berthState === 'vacant') return X
    return Wrench
  }

  // Render berth cards
  const renderBerthsView = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Berth Management</h2>
          <div className="text-sm text-gray-500">
            {enrichedBerths.length} berths • {enrichedBerths.filter(b => b.boatName).length} occupied
          </div>
        </div>
        
        <div className="grid gap-4">
          {enrichedBerths.map((berth) => {
            const berthState = berthStates[berth.id]
            const isConfirmed = berthState === 'confirmed'
            const isAnotherBoat = berthState === 'another_boat'
            const isVacant = berthState === 'vacant'
            
            return (
                                            <Card key={berth.id} className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 p-3" data-element-name={`berth-card-${berth.id}`}>
                 {/* Ultra-Compact Header with Inline Boat Info */}
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                     <div className="flex items-center justify-center w-7 h-7 bg-blue-100 rounded-full" data-element-name={`berth-icon-${berth.id}`}>
                       <Anchor className="h-3 w-3 text-blue-600" />
                     </div>
                     <div data-element-name={`berth-info-${berth.id}`}>
                       <div className="text-sm font-semibold text-gray-900 leading-tight">
                         {berth.number}
                       </div>
                       <div className="text-xs text-gray-500 leading-tight">{berth.name}</div>
                     </div>
                   </div>

                   {/* Status Badge - Moved to where undo button was */}
                   {berthState && (
                     <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                       isConfirmed ? 'bg-green-100 text-green-800' :
                       isAnotherBoat ? 'bg-amber-100 text-amber-800' :
                       isVacant ? 'bg-gray-100 text-gray-800' : ''
                     }`} data-element-name={`berth-status-${berth.id}`}>
                       {isConfirmed ? 'Confirmed' : isAnotherBoat ? 'Another Boat' : 'Vacant'}
                     </div>
                   )}
                 </div>

                 {/* Inline Boat Info and Action Buttons */}
                 <div className="relative flex items-center">
                   {/* Compact Boat Information - Inline */}
                   {berth.boatName ? (
                     <div className="p-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-200 w-fit mr-[10px]" data-element-name={`boat-info-${berth.id}`}>
                       <div className="flex items-center space-x-1.5">
                         <Ship className="h-3 w-3 text-blue-600" />
                         <span className="text-xs font-medium text-blue-900">{berth.boatName}</span>
                         <span className="text-xs text-blue-700">• {berth.boatLength}m × {berth.boatBeam}m</span>
                       </div>
                     </div>
                   ) : (
                     <div className="p-1.5 bg-gray-50 rounded border border-gray-200 w-fit mr-[10px]" data-element-name={`no-boat-info-${berth.id}`}>
                       <div className="flex items-center space-x-1.5">
                         <Eye className="h-3 w-3 text-gray-500" />
                         <span className="text-xs text-gray-600">No boat assigned</span>
                       </div>
                     </div>
                   )}

                                       {/* Action Buttons - Different layouts for different berths */}
                    {berth.id === 'berth-1' ? (
                      // Expanding action button system for berth-1 (KEEPING original)
                      <div className="relative" data-element-name={`expanding-action-buttons-${berth.id}`}>
                        {/* TESTING ONLY - System Message for Berth 1 */}
                        <div className="absolute -top-12 left-0 w-[280px] px-2 py-1 bg-yellow-50 border-2 border-dashed border-yellow-400 rounded text-xs text-yellow-800 font-medium" data-element-name={`testing-message-${berth.id}`}>
                          🧪 TESTING: Verify Button - System 1
                        </div>
                        
                        {/* Main Verify Boat Button - Draggable with react-draggable */}
                        <Button
                          ref={verifyButtonRef}
                          onClick={() => setExpandedBerth1(!expandedBerth1)}
                          disabled={!!berthState}
                          className={`h-6 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 flex items-center gap-1`}
                          data-element-name={`verify-boat-button-${berth.id}`}
                        >
                          <Wrench className="h-3 w-3" />
                          Verify Boat
                          <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${expandedBerth1 ? 'rotate-0' : ''}`} />
                        </Button>
                        
                        {/* Expanding Action Panel - Right Expansion */}
                        <div className={`absolute left-[calc(100%-4px)] top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out overflow-hidden ${
                          expandedBerth1 ? 'max-w-64 opacity-100' : 'max-w-0 opacity-0'
                        }`}>
                          <div className="px-[18px] flex items-center gap-1 min-w-[254px] h-6">
                            <Button
                              onClick={() => {
                                handleConfirmBoat(berth.id)
                                setExpandedBerth1(false)
                              }}
                              disabled={!!berthState}
                              className={`h-6 px-2 text-xs ${
                                isConfirmed
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-green-500 hover:bg-green-600'
                              } text-white transition-all duration-200`}
                              data-element-name={`confirm-boat-button-${berth.id}`}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                            
                            <Button
                              onClick={() => {
                                handleAnotherBoat(berth.id)
                                setExpandedBerth1(false)
                              }}
                              disabled={!!berthState}
                              className={`h-6 px-2 text-xs ${
                                isAnotherBoat
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'bg-amber-600 hover:bg-amber-700'
                              } text-white transition-all duration-200`}
                              data-element-name={`another-boat-button-${berth.id}`}
                            >
                              <Search className="h-3 w-3 mr-1" />
                              Another
                            </Button>
                            
                            <Button
                              onClick={() => {
                                handleMarkVacant(berth.id)
                                setExpandedBerth1(false)
                              }}
                              disabled={!!berthState}
                              className={`h-6 px-2 text-xs ${
                                isVacant
                                  ? 'bg-gray-600 hover:bg-gray-700'
                                  : 'bg-blue-400 hover:bg-blue-500'
                              } text-white transition-all duration-200`}
                              data-element-name={`mark-vacant-button-${berth.id}`}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Vacant
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : berth.id === 'berth-2' ? (
                      // Expanding action button system for berth-2 - flexible layout
                      <div className="relative ml-2" data-element-name={`berth-2-expanding-buttons-${berth.id}`}>
                        {/* TESTING ONLY - System Message for Berth 2 */}
                        <div className="absolute -top-12 left-0 w-[280px] px-2 py-1 bg-yellow-50 border-2 border-dashed border-yellow-400 rounded text-xs text-yellow-800 font-medium" data-element-name={`testing-message-${berth.id}`}>
                          🧪 TESTING: Verify Button - System 2
                        </div>
                        
                        {/* Verify Button and Undo Button Container - Inline */}
                        <div className="flex items-center gap-2">
                                                  <Button
                          onClick={() => setExpandedBerth2(!expandedBerth2)}
                          disabled={!!berthState}
                          className={`h-6 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 flex items-center gap-1`}
                          data-element-name={`berth-2-verify-button-${berth.id}`}
                        >
                          {berthState ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Anchor className="h-3 w-3" />
                              Verify Boat
                              <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${expandedBerth2 ? 'rotate-90' : ''}`} />
                            </>
                          )}
                        </Button>
                        
                        {/* Undo Button - Next to Verify Boat Button */}
                        {berthState && (
                          <button
                            onClick={() => {
                              setPendingUndoBerthId(berth.id)
                              setShowUndoConfirm(true)
                            }}
                            className="h-6 px-2 text-xs bg-red-500 hover:bg-red-600 text-white transition-all duration-200 flex items-center gap-1 rounded border border-red-400"
                            title="Undo decision"
                            data-element-name={`undo-button-${berth.id}`}
                          >
                            <X className="h-3 w-3" />
                            Undo
                          </button>
                        )}

                        </div>
                        
                        {/* Expanding Action Panel - Right Expansion with flexible positioning */}
                        <div className={`absolute left-[calc(100%+4px)] top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out overflow-hidden ${
                          expandedBerth2 ? 'max-w-[264px] opacity-100' : 'max-w-0 opacity-0'
                        }`}>
                          <div className={`pl-0 pr-2 flex items-center gap-1 h-6 transition-all duration-300 ${
                            expandedBerth2 ? 'min-w-[264px]' : 'min-w-0'
                          }`} style={{visibility: expandedBerth2 ? 'visible' : 'hidden'}}>
                            <Button
                              onClick={() => {
                                handleConfirmBoat(berth.id)
                                setExpandedBerth2(false)
                              }}
                              disabled={!!berthState}
                              className={`h-6 px-2 text-xs ${
                                isConfirmed
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-green-500 hover:bg-green-600'
                              } text-white transition-all duration-200`}
                              data-element-name={`berth-2-confirm-button-${berth.id}`}
                            >
                              {React.createElement(getBerthButtonIcon(berth.id), { className: "h-3 w-3 mr-1" })}
                              Confirm
                            </Button>
                            
                            <Button
                              onClick={() => {
                                handleAnotherBoat(berth.id)
                                setExpandedBerth2(false)
                              }}
                              disabled={!!berthState}
                              className={`h-6 px-2 text-xs ${
                                isAnotherBoat
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'bg-amber-600 hover:bg-amber-700'
                              } text-white transition-all duration-200`}
                              data-element-name={`berth-2-another-button-${berth.id}`}
                            >
                              {React.createElement(getBerthButtonIcon(berth.id), { className: "h-3 w-3 mr-1" })}
                              Another
                            </Button>
                            
                            <Button
                              onClick={() => {
                                handleMarkVacant(berth.id)
                                setExpandedBerth2(false)
                              }}
                              disabled={!!berthState}
                              className={`h-6 px-2 text-xs ${
                                isVacant
                                  ? 'bg-gray-600 hover:bg-gray-700'
                                  : 'bg-blue-400 hover:bg-blue-500'
                              } text-white transition-all duration-200`}
                              data-element-name={`berth-2-vacant-button-${berth.id}`}
                            >
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
                              </svg>
                              Vacant
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1" data-element-name={`action-buttons-${berth.id}`}>
                        <Button
                          onClick={() => handleConfirmBoat(berth.id)}
                          disabled={!!berthState}
                          className={`h-6 px-2 text-xs ${
                            isConfirmed
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-green-500 hover:bg-green-600'
                          } text-white transition-all duration-200`}
                          data-element-name={`confirm-boat-button-${berth.id}`}

                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          onClick={() => handleAnotherBoat(berth.id)}
                          disabled={!!berthState}
                          className={`h-6 px-2 text-xs ${
                            isAnotherBoat
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-amber-500 hover:bg-amber-700'
                          } text-white transition-all duration-200`}
                          data-element-name={`another-boat-button-${berth.id}`}

                        >
                          <Search className="h-3 w-3 mr-1" />
                          Another
                        </Button>
                        <Button
                          onClick={() => handleMarkVacant(berth.id)}
                          disabled={!!berthState}
                          className={`h-6 px-2 text-xs ${
                            isVacant
                              ? 'bg-gray-600 hover:bg-gray-700'
                              : 'bg-red-500 hover:bg-red-600'
                          } text-white transition-all duration-200`}
                          data-element-name={`mark-vacant-button-${berth.id}`}

                        >
                          <X className="h-3 w-3 mr-1" />
                          Vacant
                        </Button>
                      </div>
                    )}
                 </div>

                                                        {/* Compact Undo Button - Only for berth-1 */}
                   {berthState && berth.id === 'berth-1' && (
                     <div className="mt-2 pt-2 border-t border-gray-200">
                                               <Button
                          onClick={() => handleUndoAction(berth.id)}
                          variant="outline"
                          size="sm"
                          className="w-full h-6 text-xs text-gray-600 hover:text-gray-800 transition-all duration-200"
                          data-element-name={`undo-action-button-${berth.id}`}

                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Undo Action
                        </Button>
                     </div>
                   )}


                 </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Render Verify tab
  const renderVerifyView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Boat Verification</h2>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle className="h-4 w-4 mr-2" />
          Start Verification
        </Button>
      </div>
      
      <div className="grid gap-4">
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Verification Workflow</h3>
              <p className="text-sm text-gray-600">5-step process for boat verification</p>
            </div>
          </div>
        </Card>
        
        <div className="grid gap-3">
          {['Vessel Identity', 'Documentation Check', 'Safety Inspection', 'Photo Documentation', 'Final Approval'].map((step, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
              </div>
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Render Meters tab
  const renderMetersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Meter Readings</h2>
        <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
          <Zap className="h-4 w-4 mr-2" />
          Add Reading
        </Button>
      </div>
      
      <div className="grid gap-4">
        {meterReadings.map((reading) => (
          <Card key={reading.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  reading.type === 'electricity' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <Zap className={`h-5 w-5 ${
                    reading.type === 'electricity' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Berth {reading.berthId}</h3>
                  <p className="text-sm text-gray-600">{reading.type} meter</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{reading.value} {reading.unit}</div>
                <div className="text-sm text-gray-500">{new Date(reading.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render Issues tab
  const renderIssuesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Issue Management</h2>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>
      
      <div className="grid gap-4">
        {issues.map((issue) => (
          <Card key={issue.id} className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    issue.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {issue.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    issue.status === 'open' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {issue.status}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Berth {issue.berthId} - {issue.type}</h3>
                <p className="text-sm text-gray-600">{issue.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render Photos tab
  const renderPhotosView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Photo Gallery</h2>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {photoGallery.map((photo) => (
          <Card key={photo.id} className="p-3">
            <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{photo.type}</p>
              <p className="text-xs text-gray-500">Berth {photo.berthId}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render Team tab
  const renderTeamView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Team Status</h2>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Users className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>
      
      <div className="grid gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                member.status === 'online' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <User className={`h-5 w-5 ${
                  member.status === 'online' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.role} • {member.location}</p>
              </div>
              <div className="text-right">
                <div className={`w-2 h-2 rounded-full ${
                  member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render AI Insights tab
  const renderAIInsightsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">AI Insights</h2>
        <Button className="bg-pink-600 hover:bg-pink-700 text-white">
          <Brain className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4">
        {aiInsights.map((insight) => (
          <Card key={insight.id} className="p-4 border-l-4 border-l-pink-500">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{insight.type}</span>
                  <span className="text-sm font-medium text-pink-600">{insight.confidence}% confidence</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render 3D View tab
  const render3DView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">3D Marina View</h2>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          <Box className="h-4 w-4 mr-2" />
          Full Screen
        </Button>
      </div>
      
      <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Box className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">3D Visualization</h3>
          <p className="text-sm text-gray-600">Interactive marina layout view</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-20 flex-col space-y-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          <span className="text-sm">Navigate</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col space-y-2">
          <Eye className="h-6 w-6 text-green-600" />
          <span className="text-sm">Inspect</span>
        </Button>
      </div>
    </div>
  )

  // Render Analytics tab
  const renderAnalyticsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Analytics Dashboard</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <TrendingUp className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{analyticsData.totalBerths}</div>
          <div className="text-sm text-gray-600">Total Berths</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{analyticsData.occupiedBerths}</div>
          <div className="text-sm text-gray-600">Occupied</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{analyticsData.utilizationRate}%</div>
          <div className="text-sm text-gray-600">Utilization</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">£{analyticsData.monthlyRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Monthly Revenue</div>
        </Card>
      </div>
      
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Issue Summary</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Active Issues</span>
          <span className="text-lg font-semibold text-red-600">{analyticsData.activeIssues}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">Resolved This Month</span>
          <span className="text-lg font-semibold text-green-600">{analyticsData.resolvedIssues}</span>
        </div>
      </Card>
    </div>
  )

  // Render Weather tab
  const renderWeatherView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Marine Weather</h2>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
          <Globe className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-gray-900 mb-2">{weatherData.temperature}°C</div>
          <div className="text-lg text-gray-600">{weatherData.forecast}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{weatherData.windSpeed} knots</div>
            <div className="text-sm text-gray-600">Wind Speed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{weatherData.windDirection}</div>
            <div className="text-sm text-gray-600">Wind Direction</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{weatherData.visibility}</div>
            <div className="text-sm text-gray-600">Visibility</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{weatherData.tide}</div>
            <div className="text-sm text-gray-600">Tide</div>
          </div>
        </div>
      </Card>
    </div>
  )

  // Render Data tab
  const renderDataView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Data Management</h2>
        <Button className="bg-slate-600 hover:bg-slate-700 text-white">
          <Database className="h-4 w-4 mr-2" />
          Sync
        </Button>
      </div>
      
      <div className="grid gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-600">Download CSV reports and analytics</p>
            </div>
            <Button variant="outline" size="sm">Export</Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Import Data</h3>
              <p className="text-sm text-gray-600">Upload vessel and berth information</p>
            </div>
            <Button variant="outline" size="sm">Import</Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Sync Status</h3>
              <p className="text-sm text-gray-600">Last sync: 2 minutes ago</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <button 
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-not-allowed relative"
                disabled={true}
                aria-label="Back button disabled"
                title="Back button disabled"
              >
                <ArrowLeft className="h-6 w-6" />
                <X className="h-8 w-8 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-sm" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <Ship className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Dockwalk</h1>
                  <p className="text-xs text-gray-600">Advanced Marina Staff App</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => setShowSummary(true)}
                data-element-name="summary-button"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Summary</span>
                <span className="sm:hidden">Sum</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => setShowVoice(true)}
                data-element-name="voice-button"
              >
                <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Voice</span>
                <span className="sm:hidden">Mic</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => setShowSettings(true)}
                data-element-name="settings-button"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => setShowNotifications(true)}
                data-element-name="notifications-button"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Notif</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3 overflow-x-auto scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const colorClasses = {
                blue: 'bg-blue-600 hover:bg-blue-700 text-white',
                green: 'bg-green-600 hover:bg-green-700 text-white',
                yellow: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                red: 'bg-red-600 hover:bg-red-700 text-white',
                purple: 'bg-purple-600 hover:bg-purple-700 text-white',
                indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                pink: 'bg-pink-600 hover:bg-pink-700 text-white',
                orange: 'bg-orange-600 hover:bg-orange-700 text-white',
                emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                cyan: 'bg-cyan-600 hover:bg-cyan-700 text-white',
                slate: 'bg-slate-600 hover:bg-slate-700 text-white'
              }
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`whitespace-nowrap transition-all duration-200 ${
                    isActive ? colorClasses[tab.color as keyof typeof colorClasses] : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  data-element-name={`nav-tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Search, Filter & Actions Section */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 mb-4" data-element-name="search-filter-section">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search Input - Compact */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search berths, vessels, or owners..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  data-element-name="search-input"
                />
              </div>
            </div>
            
            {/* Compact Filters */}
            <div className="flex gap-2 flex-shrink-0">
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[120px]">
                <option>All Docks</option>
                <option>Main Dock A</option>
                <option>Main Dock B</option>
                <option>Floating Dock C</option>
                <option>Floating Dock D</option>
              </select>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[120px]">
                <option>All Statuses</option>
                <option>Occupied</option>
                <option>Available</option>
                <option>Reserved</option>
                <option>Maintenance</option>
              </select>
            </div>
            
            {/* Compact Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-2 h-auto text-xs border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-2 h-auto text-xs border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <Ship className="h-3 w-3 mr-1" />
                Occupied
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-2 h-auto text-xs border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Available
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-2 h-auto text-xs border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <Wrench className="h-3 w-3 mr-1" />
                Maintenance
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6" data-element-name="content-area">
          {activeTab === 'berths' && renderBerthsView()}
          {activeTab === 'verify' && renderVerifyView()}
          {activeTab === 'meters' && renderMetersView()}
          {activeTab === 'issues' && renderIssuesView()}
          {activeTab === 'photos' && renderPhotosView()}
          {activeTab === 'team' && renderTeamView()}
          {activeTab === 'ai-insights' && renderAIInsightsView()}
          {activeTab === '3d-view' && render3DView()}
          {activeTab === 'analytics' && renderAnalyticsView()}
          {activeTab === 'weather' && renderWeatherView()}
          {activeTab === 'data' && renderDataView()}
        </div>

        {/* Enhanced Features Section */}
        <Card className="shadow-lg mt-6 border-0 bg-gradient-to-r from-gray-50 to-blue-50" data-element-name="enhanced-features-section">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span>Enhanced Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-white hover:bg-gray-50 transition-all duration-200">
                <Brain className="h-6 w-6 text-pink-600" />
                <span className="text-sm">AI Insights</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-white hover:bg-gray-50 transition-all duration-200">
                <Box className="h-6 w-6 text-orange-600" />
                <span className="text-sm">3D Visualization</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-white hover:bg-gray-50 transition-all duration-200">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span className="text-sm">Analytics Dashboard</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-white hover:bg-gray-50 transition-all duration-200">
                <Users className="h-6 w-6 text-blue-600" />
                <span className="text-sm">Team Collaboration</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-white hover:bg-gray-50 transition-all duration-200">
                <Mic className="h-6 w-6 text-red-600" />
                <span className="text-sm">Voice Commands</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-white hover:bg-gray-50 transition-all duration-200">
                <Bell className="h-6 w-6 text-purple-600" />
                <span className="text-sm">Real-time Alerts</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boat Selection Modal */}
      {showBoatSelectionModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          style={{ 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onTouchMove={(e) => e.preventDefault()}
          onWheel={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div
            ref={modalRef}
            style={{
              transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
              maxHeight: '80vh',
              overflow: 'hidden',
              position: 'relative'
            }}
            className="bg-white rounded-xl shadow-2xl p-6 w-96 cursor-grab active:cursor-grabbing border-0"
            onMouseDown={handleMouseDown}
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Boat for Berth {selectedBerthForBoatChange}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseBoatSelectionModal}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search boats..."
                value={boatSearchQuery}
                onChange={(e) => setBoatSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            <div 
              className="max-h-64 space-y-2" 
              style={{ 
                overflowY: 'auto', 
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              {filteredBoats.map((boat) => (
                <div
                  key={boat.id}
                  onClick={() => handleSelectBoat(boat.id)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
                >
                  <div className="font-medium text-gray-900">{boat.name}</div>
                  <div className="text-sm text-gray-600">
                    {Math.round(boat.length)}m × {Math.round(boat.beam)}m • {boat.owner}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex space-x-2">
              <Button
                onClick={handleCloseBoatSelectionModal}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (filteredBoats.length > 0) {
                    handleSelectBoat(filteredBoats[0].id)
                  }
                }}
                disabled={filteredBoats.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Select Boat
              </Button>
            </div>
          </div>
        </div>
      )}




      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Summary</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{enrichedBerths.length}</div>
                  <div className="text-sm text-gray-600">Total Berths</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{enrichedBerths.filter(b => b.boatName).length}</div>
                  <div className="text-sm text-gray-600">Occupied</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Today's Activity</h4>
                <div className="text-sm text-gray-600">
                  <p>• {meterReadings.length} meter readings recorded</p>
                  <p>• {issues.filter(i => i.status === 'open').length} issues open</p>
                  <p>• {photoGallery.length} photos taken</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Modal */}
      {showVoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Voice Commands</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoice(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Mic className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Listening...</h4>
                <p className="text-sm text-gray-600">Say a command like "Go to Berths" or "Show Issues"</p>
              </div>
              
              <div className="space-y-2 text-left">
                <h5 className="font-medium text-gray-900">Available Commands:</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• "Go to [tab name]"</p>
                  <p>• "Show summary"</p>
                  <p>• "Take photo"</p>
                  <p>• "Report issue"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">App Preferences</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    User Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help & Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">High Priority Issue</h4>
                    <p className="text-sm text-red-700">Berth A1 electrical problem requires immediate attention</p>
                    <p className="text-xs text-red-600 mt-1">2 minutes ago</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Verification Complete</h4>
                    <p className="text-sm text-blue-700">Boat "Sea Spirit" verification completed successfully</p>
                    <p className="text-xs text-blue-600 mt-1">15 minutes ago</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Meter Reading</h4>
                    <p className="text-sm text-green-700">New electricity reading recorded for Berth A2</p>
                    <p className="text-xs text-green-600 mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Undo Confirmation Dialog */}
      {showUndoConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Undo Action</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUndoConfirm(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-700">
                    Are you sure you want to undo this action? This will reset the berth status and remove the verification.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUndoConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (pendingUndoBerthId) {
                      handleUndoAction(pendingUndoBerthId)
                    }
                    setShowUndoConfirm(false)
                    setPendingUndoBerthId(null)
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Undo Action
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
