'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocaleFormatting } from '@/lib/locale-context'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { Settings } from 'lucide-react'
import { useBerths } from '@/hooks/use-data-source-fetch'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { 
  Plus, 
  Search, 
  Filter, 
  Anchor, 
  MapPin,
  Ship,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react'

const berthStatusColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RESERVED: 'bg-purple-100 text-purple-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800'
}

export default function BerthsPage() {
  const { formatCurrency, localeConfig, getTimeUnit, formatBerthSize, formatBerthDepth } = useLocaleFormatting()
  
  // Use data source hook instead of direct API calls
  const { data: berths, isLoading, error } = useBerths()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sectionFilter, setSectionFilter] = useState('ALL')

  // All hooks must be called before any conditional returns
  const [showAddBerthModal, setShowAddBerthModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showVacateModal, setShowVacateModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedBerth, setSelectedBerth] = useState<any>(null)
  const [newBerth, setNewBerth] = useState({
    berthNumber: '',
    section: '',
    size: '',
    depth: '',
    monthlyRate: '',
    facilities: [] as string[],
    notes: ''
  })
  const [editBerth, setEditBerth] = useState({
    berthNumber: '',
    section: '',
    size: '',
    depth: '',
    monthlyRate: '',
    facilities: [] as string[],
    notes: ''
  })
  const [assignBerth, setAssignBerth] = useState({
    boatName: '',
    ownerName: '',
    contractEndDate: ''
  })
  const [advancedFilters, setAdvancedFilters] = useState({
    minRate: '',
    maxRate: ''
  })

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading berths...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Berths</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show empty state if no berths
  if (!berths || berths.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">⚓</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Berths Found</h2>
            <p className="text-gray-600 mb-4">There are no berths to display at the moment.</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add First Berth
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Filter berths based on search and filters
  const filteredBerths = (berths || []).filter((berth: any) => {
    if (searchTerm) {
      const matchesSearch = 
        berth.berthNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (berth.berthNumber?.substring(0, 1) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (berth.boatName && berth.boatName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (berth.ownerFirstName && berth.ownerFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (berth.ownerLastName && berth.ownerLastName.toLowerCase().includes(searchTerm.toLowerCase()))
      if (!matchesSearch) return false
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'AVAILABLE') {
        if (!berth.isAvailable) return false
      } else if (statusFilter === 'OCCUPIED') {
        if (berth.isAvailable) return false
      }
    }

    if (sectionFilter !== 'ALL') {
      if (berth.berthNumber?.substring(0, 1) !== sectionFilter) return false
    }

    // Apply advanced filters
    if (advancedFilters.minRate) {
      if ((berth.monthlyRate || 0) < parseFloat(advancedFilters.minRate)) return false
    }

    if (advancedFilters.maxRate) {
      if ((berth.monthlyRate || 0) > parseFloat(advancedFilters.maxRate)) return false
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${berthStatusColors[status as keyof typeof berthStatusColors]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'OCCUPIED':
        return <Ship className="h-4 w-4 text-blue-600" />
      case 'MAINTENANCE':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'RESERVED':
        return <Calendar className="h-4 w-4 text-purple-600" />
      case 'OUT_OF_SERVICE':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Anchor className="h-4 w-4 text-gray-600" />
    }
  }

  const getTotalBerths = () => (berths || []).length
  const getAvailableBerths = () => (berths || []).filter(b => b.isAvailable).length
  const getOccupiedBerths = () => (berths || []).filter(b => !b.isAvailable).length
  const getTotalRevenue = () => (berths || []).filter(b => !b.isAvailable).reduce((sum, berth) => sum + (berth.monthlyRate || 0), 0)

  const getSections = () => Array.from(new Set((berths || []).map(berth => berth.berthNumber?.substring(0, 1) || 'Unknown')))

  // New berth handlers
  const handleNewBerthChange = (field: string, value: string | string[]) => {
    setNewBerth(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateBerth = () => {
    // Validate required fields
    if (!newBerth.berthNumber || !newBerth.section || !newBerth.size || !newBerth.depth || !newBerth.monthlyRate) {
      alert('Please fill in all required fields')
      return
    }

    // Create new berth
    const newBerthData = {
      id: (berths.length + 1).toString(),
      berthNumber: newBerth.berthNumber,
      section: newBerth.section,
      size: newBerth.size,
      depth: newBerth.depth,
      status: 'AVAILABLE',
      currentBoat: null,
      currentOwner: null,
      monthlyRate: parseFloat(newBerth.monthlyRate),
      contractEndDate: null,
      facilities: newBerth.facilities,
      notes: newBerth.notes
    }

    // Note: In a real application, this would be handled by the data source system
    // For now, we'll just show a success message
    // The data will be refreshed on the next render from the data source

    // Reset form and close modal
    setNewBerth({
      berthNumber: '',
      section: '',
      size: '',
      depth: '',
      monthlyRate: '',
      facilities: [],
      notes: ''
    })
    setShowAddBerthModal(false)

    // Show success message
    alert('Berth added successfully!')
  }

  const handleCancelNewBerth = () => {
    setNewBerth({
      berthNumber: '',
      section: '',
      size: '',
      depth: '',
      monthlyRate: '',
      facilities: [],
      notes: ''
    })
    setShowAddBerthModal(false)
  }

  // View berth handlers
  const handleViewBerth = (berth: any) => {
    setSelectedBerth(berth)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setSelectedBerth(null)
    setShowViewModal(false)
  }

  // Edit berth handlers
  const handleEditBerth = (berth: any) => {
    setEditBerth({
      berthNumber: berth.berthNumber,
      section: berth.section,
      size: berth.size,
      depth: berth.depth,
      monthlyRate: berth.monthlyRate.toString(),
      facilities: berth.facilities,
      notes: berth.notes || ''
    })
    setSelectedBerth(berth)
    setShowEditModal(true)
  }

  const handleUpdateBerth = () => {
    if (!selectedBerth) return

    // Note: In a real application, this would be handled by the data source system
    // For now, we'll just show a success message
    // The data will be refreshed on the next render from the data source

    setShowEditModal(false)
    setSelectedBerth(null)
    alert('Berth updated successfully!')
  }

  const handleCancelEditBerth = () => {
    setShowEditModal(false)
    setSelectedBerth(null)
  }

  // Assign berth handlers
  const handleAssignBerth = (berth: any) => {
    setSelectedBerth(berth)
    setShowAssignModal(true)
  }

  const handleConfirmAssign = () => {
    if (!selectedBerth) return

    // Note: In a real application, this would be handled by the data source system
    // For now, we'll just show a success message
    // The data will be refreshed on the next render from the data source

    setShowAssignModal(false)
    setSelectedBerth(null)
    setAssignBerth({ boatName: '', ownerName: '', contractEndDate: '' })
    alert('Berth assigned successfully!')
  }

  const handleCancelAssign = () => {
    setShowAssignModal(false)
    setSelectedBerth(null)
    setAssignBerth({ boatName: '', ownerName: '', contractEndDate: '' })
  }

  // Vacate berth handlers
  const handleVacateBerth = (berth: any) => {
    setSelectedBerth(berth)
    setShowVacateModal(true)
  }

  const handleConfirmVacate = () => {
    if (!selectedBerth) return

    // Note: In a real application, this would be handled by the data source system
    // For now, we'll just show a success message
    // The data will be refreshed on the next render from the data source

    setShowVacateModal(false)
    setSelectedBerth(null)
    alert('Berth vacated successfully!')
  }

  const handleCancelVacate = () => {
    setShowVacateModal(false)
    setSelectedBerth(null)
  }

  // Facility toggle handler
  const toggleFacility = (facility: string, facilities: string[], setFacilities: (facilities: string[]) => void) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility))
    } else {
      setFacilities([...facilities, facility])
    }
  }

  // Advanced filters handlers
  const handleAdvancedFilterChange = (field: 'minRate' | 'maxRate', value: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      minRate: '',
      maxRate: ''
    })
  }

  const handleApplyAdvancedFilters = () => {
    setShowAdvancedFilters(false)
  }

  return (
    <AppLayout>
      <div className="p-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="berths"
            dataCount={berths?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalBerths: berths?.length || 0,
              occupiedBerths: berths?.filter((b: any) => b.status === 'OCCUPIED').length || 0,
              availableBerths: berths?.filter((b: any) => b.status === 'AVAILABLE').length || 0,
              reservedBerths: berths?.filter((b: any) => b.status === 'RESERVED').length || 0
            }}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Berths</h1>
            <p className="text-gray-600 mt-2">
              Manage marina berths, availability, and assignments
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {localeConfig.name} • {localeConfig.currency} • {localeConfig.measurement === 'metric' ? 'Metric' : 'Imperial'} units
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            {/* Map View button temporarily hidden - will be re-enabled in future */}
            {/* <Button 
              variant="outline"
              onClick={() => {
                alert('Map view would be implemented here. This could show a visual representation of all berths in the marina.')
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Map View
            </Button> */}
            <Button onClick={() => setShowAddBerthModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Berth
            </Button>
          </div>
        </div>

        {/* Collapsible Information Box */}
        <CollapsibleInfoBox title="Click to find out what this page does">
          <div className="space-y-4">
            {/* Page Overview Box */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">?</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Berth Management</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage marina berths, availability, and assignments for boat storage.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> View all berths with their specifications (length, beam), check availability status, see assigned boats and owners, and manage berth assignments. Each berth shows monthly rental rates and contract information when occupied.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Architecture Box */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Settings className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">System Architecture & Database</h3>
                    <div className="text-sm text-green-700 space-y-2">
                      <p>
                        <strong>Berth Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">berths</code> table contains 50 berths with specifications like length, beam, availability status, and marina assignments. 
                        Each berth has a unique ID, berth number (A1, B2, etc.), and links to contracts through foreign key relationships.
                      </p>
                      <p>
                        <strong>Availability Logic:</strong> The system determines berth availability by checking the <code className="bg-green-100 px-1 rounded">contracts</code> table for active contracts. 
                        When a berth has an active contract, it's marked as occupied (0), otherwise available (1). This is calculated using a CASE statement in the SQL query.
                      </p>
                      <p>
                        <strong>Enhanced vs Basic Queries:</strong> The API first attempts an enhanced query that joins berths with contracts, boats, and owners tables. 
                        If any related table is missing, it falls back to a basic query showing only berth specifications. This ensures the page always loads.
                      </p>
                      <p>
                        <strong>Key Tables for Berths:</strong> <code className="bg-green-100 px-1 rounded">berths</code> (50 berths), <code className="bg-green-100 px-1 rounded">contracts</code> (51 records), 
                        <code className="bg-green-100 px-1 rounded">boats</code> (50 vessels), <code className="bg-green-100 px-1 rounded">owners</code> (51 customers). 
                        The system uses LEFT JOINs to connect berth specifications with contract details and boat/owner information.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Berths</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalBerths()}</p>
                </div>
                <Anchor className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{getAvailableBerths()}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-blue-600">{getOccupiedBerths()}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ship className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalRevenue())}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search berths by number, section, boat, or owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Sections</option>
                  {getSections().map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(true)}>
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Berths List */}
        <div className="space-y-4">
          {berths.map((berth) => (
            <Card key={berth.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {berth.berthNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {berth.berthNumber?.substring(0, 1) || 'Unknown'} Dock • {berth.length || 0}m • {berth.beam || 0}m beam
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(berth.isAvailable ? 'AVAILABLE' : 'OCCUPIED')}
                        {getStatusBadge(berth.isAvailable ? 'AVAILABLE' : 'OCCUPIED')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Ship className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {berth.boatName || 'No boat assigned'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {berth.ownerFirstName && berth.ownerLastName ? `${berth.ownerFirstName} ${berth.ownerLastName}` : 'No owner'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatCurrency(berth.monthlyRate)}{getTimeUnit('month')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {berth.contractEndDate ? `Until ${berth.contractEndDate}` : 'No contract'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">Details:</span>
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Length: {berth.length || 0}m
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Beam: {berth.beam || 0}m
                          </span>
                        </div>
                      </div>
                      {berth.contractStatus && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Contract Status:</span> {berth.contractStatus}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewBerth(berth)}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditBerth(berth)}>
                      Edit
                    </Button>
                    {berth.isAvailable && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAssignBerth(berth)}>
                        Assign
                      </Button>
                    )}
                    {!berth.isAvailable && (
                      <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700" onClick={() => handleVacateBerth(berth)}>
                        Vacate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {berths.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Anchor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No berths found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' || sectionFilter !== 'ALL' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first berth'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && sectionFilter === 'ALL' && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Berth
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Berth Modal */}
      {showAddBerthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Berth</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelNewBerth}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berth Number *
                </label>
                <Input
                  value={newBerth.berthNumber}
                  onChange={(e) => handleNewBerthChange('berthNumber', e.target.value)}
                  placeholder="e.g., A-01"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section *
                </label>
                <Input
                  value={newBerth.section}
                  onChange={(e) => handleNewBerthChange('section', e.target.value)}
                  placeholder="e.g., A Dock"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size ({localeConfig.measurement === 'metric' ? 'm' : 'ft'}) *
                  </label>
                  <Input
                    value={newBerth.size}
                    onChange={(e) => handleNewBerthChange('size', e.target.value)}
                    placeholder={localeConfig.measurement === 'metric' ? 'e.g., 12.5m' : 'e.g., 40ft'}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depth ({localeConfig.measurement === 'metric' ? 'm' : 'ft'}) *
                  </label>
                  <Input
                    value={newBerth.depth}
                    onChange={(e) => handleNewBerthChange('depth', e.target.value)}
                    placeholder={localeConfig.measurement === 'metric' ? 'e.g., 2.5m' : 'e.g., 8ft'}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rate ({localeConfig.currencySymbol}) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newBerth.monthlyRate}
                  onChange={(e) => handleNewBerthChange('monthlyRate', e.target.value)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facilities
                </label>
                <div className="space-y-2">
                  {['Water', 'Electricity', 'WiFi', 'Fuel Dock'].map((facility) => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newBerth.facilities.includes(facility)}
                        onChange={() => toggleFacility(facility, newBerth.facilities, (facilities) => handleNewBerthChange('facilities', facilities))}
                        className="mr-2"
                      />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Input
                  value={newBerth.notes}
                  onChange={(e) => handleNewBerthChange('notes', e.target.value)}
                  placeholder="Additional notes"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreateBerth}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Add Berth
              </Button>
              <Button
                onClick={handleCancelNewBerth}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Berth Modal */}
      {showViewModal && selectedBerth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Berth Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseViewModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berth Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedBerth.berthNumber}</p>
                </div>
                
                                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dock Section</label>
                  <p className="text-gray-900">{selectedBerth.berthNumber?.substring(0, 1) || 'Unknown'} Dock</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                  <p className="text-gray-900">{selectedBerth.length || 0}m</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beam</label>
                  <p className="text-gray-900">{selectedBerth.beam || 0}m</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${berthStatusColors[selectedBerth.isAvailable ? 'AVAILABLE' : 'OCCUPIED']}`}>
                    {selectedBerth.isAvailable ? 'AVAILABLE' : 'OCCUPIED'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Boat</label>
                  <p className="text-gray-900">{selectedBerth.boatName || 'No boat assigned'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Owner</label>
                  <p className="text-gray-900">{selectedBerth.ownerFirstName && selectedBerth.ownerLastName ? `${selectedBerth.ownerFirstName} ${selectedBerth.ownerLastName}` : 'No owner'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate</label>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(selectedBerth.monthlyRate || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Details</label>
                <div className="space-y-2">
                  {selectedBerth.contractStatus && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status: </span>
                      <span className="text-gray-900">{selectedBerth.contractStatus}</span>
                    </div>
                  )}
                  {selectedBerth.contractStartDate && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Start Date: </span>
                      <span className="text-gray-900">{new Date(selectedBerth.contractStartDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedBerth.contractEndDate && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">End Date: </span>
                      <span className="text-gray-900">{new Date(selectedBerth.contractEndDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCloseViewModal}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Berth Modal */}
      {showEditModal && selectedBerth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Berth</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEditBerth}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berth Number *
                </label>
                <Input
                  value={editBerth.berthNumber}
                  onChange={(e) => setEditBerth(prev => ({ ...prev, berthNumber: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section *
                </label>
                <Input
                  value={editBerth.section}
                  onChange={(e) => setEditBerth(prev => ({ ...prev, section: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size ({localeConfig.measurement === 'metric' ? 'm' : 'ft'}) *
                  </label>
                  <Input
                    value={editBerth.size}
                    onChange={(e) => setEditBerth(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depth ({localeConfig.measurement === 'metric' ? 'm' : 'ft'}) *
                  </label>
                  <Input
                    value={editBerth.depth}
                    onChange={(e) => setEditBerth(prev => ({ ...prev, depth: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rate ({localeConfig.currencySymbol}) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editBerth.monthlyRate}
                  onChange={(e) => setEditBerth(prev => ({ ...prev, monthlyRate: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facilities
                </label>
                <div className="space-y-2">
                  {['Water', 'Electricity', 'WiFi', 'Fuel Dock'].map((facility) => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editBerth.facilities.includes(facility)}
                        onChange={() => toggleFacility(facility, editBerth.facilities, (facilities) => setEditBerth(prev => ({ ...prev, facilities })))}
                        className="mr-2"
                      />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Input
                  value={editBerth.notes}
                  onChange={(e) => setEditBerth(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpdateBerth}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Update Berth
              </Button>
              <Button
                onClick={handleCancelEditBerth}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Berth Modal */}
      {showAssignModal && selectedBerth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assign Berth {selectedBerth.berthNumber}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelAssign}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boat Name *
                </label>
                <Input
                  value={assignBerth.boatName}
                  onChange={(e) => setAssignBerth(prev => ({ ...prev, boatName: e.target.value }))}
                  placeholder="Enter boat name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name *
                </label>
                <Input
                  value={assignBerth.ownerName}
                  onChange={(e) => setAssignBerth(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="Enter owner name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract End Date
                </label>
                <Input
                  type="date"
                  value={assignBerth.contractEndDate}
                  onChange={(e) => setAssignBerth(prev => ({ ...prev, contractEndDate: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleConfirmAssign}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Assign Berth
              </Button>
              <Button
                onClick={handleCancelAssign}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vacate Berth Modal */}
      {showVacateModal && selectedBerth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Vacate Berth {selectedBerth.berthNumber}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelVacate}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Confirm Berth Vacancy
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This will mark berth {selectedBerth.berthNumber} as available.</p>
                      <p className="mt-1">Current boat: <strong>{selectedBerth.currentBoat}</strong></p>
                      <p>Current owner: <strong>{selectedBerth.currentOwner}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleConfirmVacate}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Confirm Vacancy
              </Button>
              <Button
                onClick={handleCancelVacate}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Advanced Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">

              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Monthly Rate
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={advancedFilters.minRate}
                    onChange={(e) => handleAdvancedFilterChange('minRate', e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Monthly Rate
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={advancedFilters.maxRate}
                    onChange={(e) => handleAdvancedFilterChange('maxRate', e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
              </div>
              

            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleApplyAdvancedFilters}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </Button>
              <Button
                onClick={handleClearAdvancedFilters}
                variant="outline"
                className="flex-1"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* DataSourceDebug Component - REMOVED TO FIX DUPLICATE BUTTONS */}
    </AppLayout>
  )
}
