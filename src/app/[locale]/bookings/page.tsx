'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocaleDateInput } from '@/components/ui/locale-date-input'
import { useLocaleFormatting } from '@/lib/locale-context'
import { useBookings } from '@/hooks/use-data-source-fetch'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { logger } from '@/lib/logger'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock,
  DollarSign,
  User,
  Anchor,
  MapPin,
  X,
  Settings
} from 'lucide-react'

// Mock user for demo purposes
const mockUser = {
  id: 'demo-user',
  email: 'demo@marina.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: [
    { role: 'ADMIN' },
    { role: 'STAFF_FRONT_DESK' }
  ]
}

// Booking status colors for UI

const bookingStatusColors = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

export default function BookingsPage() {
  const { formatCurrency, formatDate, formatNumber, localeConfig, getTimeUnit } = useLocaleFormatting()
  
  // Use data source hook instead of hardcoded mock data
  const { data: bookings, isLoading, error } = useBookings()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [showNewBookingModal, setShowNewBookingModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    boatName: '',
    berthNumber: '',
    startDate: '',
    endDate: '',
    dailyRate: '',
    purpose: ''
  })
  const [editBooking, setEditBooking] = useState({
    customerName: '',
    boatName: '',
    berthNumber: '',
    startDate: '',
    endDate: '',
    dailyRate: '',
    purpose: ''
  })
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    customerFilter: '',
    boatFilter: '',
    berthFilter: '',
    minRate: '',
    maxRate: ''
  })

  // Filter bookings based on search and filters
  const filteredBookings = (bookings || []).filter((booking: any) => {
    // Search filter
    const matchesSearch = !searchTerm || 
      booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.boatName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter
    
    // Date filter
    let matchesDate = true
    if (dateFilter !== 'ALL') {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const startDate = new Date(booking.startDate)
      
      switch (dateFilter) {
        case 'TODAY':
          matchesDate = startDate.toDateString() === today.toDateString()
          break
        case 'TOMORROW':
          matchesDate = startDate.toDateString() === tomorrow.toDateString()
          break
        case 'THIS_WEEK':
          const weekFromNow = new Date(today)
          weekFromNow.setDate(weekFromNow.getDate() + 7)
          matchesDate = startDate >= today && startDate <= weekFromNow
          break
      }
    }
    
    // Advanced filters
    const matchesCustomer = !advancedFilters.customerFilter || 
      booking.customerName?.toLowerCase().includes(advancedFilters.customerFilter.toLowerCase())
    
    const matchesBoat = !advancedFilters.boatFilter || 
      booking.boatName?.toLowerCase().includes(advancedFilters.boatFilter.toLowerCase())
    
    const matchesBerth = !advancedFilters.berthFilter || 
      booking.berthNumber?.toLowerCase().includes(advancedFilters.berthFilter.toLowerCase())
    
    const matchesMinRate = !advancedFilters.minRate || 
      booking.dailyRate >= parseFloat(advancedFilters.minRate)
    
    const matchesMaxRate = !advancedFilters.maxRate || 
      booking.dailyRate <= parseFloat(advancedFilters.maxRate)
    
    return matchesSearch && matchesStatus && matchesDate && 
           matchesCustomer && matchesBoat && matchesBerth && 
           matchesMinRate && matchesMaxRate
  })

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bookingStatusColors[status as keyof typeof bookingStatusColors]}`}>
        {status}
      </span>
    )
  }

  const getDaysDuration = (startDate: Date | string, endDate: Date | string) => {
    try {
      const start = startDate instanceof Date ? startDate : new Date(startDate)
      const end = endDate instanceof Date ? endDate : new Date(endDate)
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch (error) {
      logger.error('Error calculating days duration', { startDate, endDate, error })
      return 0
    }
  }

  const handleNewBookingChange = (field: string, value: string) => {
    setNewBooking(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateBooking = () => {
    // Validate required fields
    if (!newBooking.customerName || !newBooking.boatName || !newBooking.berthNumber || 
        !newBooking.startDate || !newBooking.endDate || !newBooking.dailyRate) {
      alert('Please fill in all required fields')
      return
    }

    // Create new booking
    const newBookingData = {
      id: ((bookings?.length || 0) + 1).toString(),
      bookingNumber: `BK-2024-${String((bookings?.length || 0) + 1).padStart(3, '0')}`,
      customerName: newBooking.customerName,
      boatName: newBooking.boatName,
      berthNumber: newBooking.berthNumber,
      startDate: new Date(newBooking.startDate),
      endDate: new Date(newBooking.endDate),
      status: 'PENDING',
      dailyRate: parseFloat(newBooking.dailyRate),
      totalAmount: parseFloat(newBooking.dailyRate) * getDaysDuration(new Date(newBooking.startDate), new Date(newBooking.endDate)),
      purpose: newBooking.purpose
    }

    // In demo mode, show alert instead of updating state
    alert('Booking created successfully! (Demo mode - no actual booking created)')

    // Reset form and close modal
    setNewBooking({
      customerName: '',
      boatName: '',
      berthNumber: '',
      startDate: '',
      endDate: '',
      dailyRate: '',
      purpose: ''
    })
    setShowNewBookingModal(false)

    // Show success message
    alert('Booking created successfully!')
  }

  const handleCancelNewBooking = () => {
    setNewBooking({
      customerName: '',
      boatName: '',
      berthNumber: '',
      startDate: '',
      endDate: '',
      dailyRate: '',
      purpose: ''
    })
    setShowNewBookingModal(false)
  }

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setSelectedBooking(null)
    setShowViewModal(false)
  }

  // Edit booking handlers
  const handleEditBooking = (booking: any) => {
    setEditBooking({
      customerName: booking.customerName,
      boatName: booking.boatName,
      berthNumber: booking.berthNumber,
      startDate: booking.startDate.toISOString().split('T')[0],
      endDate: booking.endDate.toISOString().split('T')[0],
      dailyRate: booking.dailyRate.toString(),
      purpose: booking.purpose || ''
    })
    setSelectedBooking(booking)
    setShowEditModal(true)
  }

  const handleUpdateBooking = () => {
    if (!selectedBooking) return

    // Validate required fields
    if (!editBooking.customerName || !editBooking.boatName || !editBooking.berthNumber || 
        !editBooking.startDate || !editBooking.endDate || !editBooking.dailyRate) {
      alert('Please fill in all required fields')
      return
    }

    // In demo mode, show alert instead of updating state
    alert('Booking updated successfully! (Demo mode - no actual booking updated)')

    setShowEditModal(false)
    setSelectedBooking(null)
    alert('Booking updated successfully!')
  }

  const handleCancelEditBooking = () => {
    setShowEditModal(false)
    setSelectedBooking(null)
  }

  const handleConfirmBooking = (bookingId: string) => {
    // In demo mode, show alert instead of updating state
    alert('Booking confirmed successfully! (Demo mode - no actual booking confirmed)')
  }

  const handleAdvancedFilterChange = (field: string, value: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      customerFilter: '',
      boatFilter: '',
      berthFilter: '',
      minRate: '',
      maxRate: ''
    })
  }

  const handleApplyAdvancedFilters = () => {
    setShowAdvancedFilters(false)
  }

  return (
    <AppLayout user={mockUser}>
      <div className="p-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="bookings"
            dataCount={bookings?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalBookings: bookings?.length || 0,
              activeBookings: bookings?.filter((b: any) => b.status === 'ACTIVE').length || 0,
              completedBookings: bookings?.filter((b: any) => b.status === 'COMPLETED').length || 0,
              cancelledBookings: bookings?.filter((b: any) => b.status === 'CANCELLED').length || 0
            }}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-2">
              Manage temporary berth reservations and scheduling
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {localeConfig.name} • {localeConfig.currency} • {localeConfig.dateFormat}
            </p>
          </div>
          <Button className="mt-4 sm:mt-0" onClick={() => setShowNewBookingModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Booking Management</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage temporary berth reservations and scheduling for marina customers.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> Create and manage temporary berth bookings with start/end dates, daily rates, and customer information. Track booking status (Pending, Confirmed, Completed, Cancelled), calculate total costs, and manage berth availability for short-term rentals.
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
                        <strong>Booking Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">bookings</code> table contains temporary berth reservation records with fields for customer information, boat details, berth assignment, start/end dates, daily rates, and total amounts. 
                        Each booking has a unique ID and links to customers, boats, and berths through foreign key relationships.
                      </p>
                      <p>
                        <strong>Status Management:</strong> Bookings follow a defined status progression: PENDING → CONFIRMED → COMPLETED or CANCELLED. 
                        The system tracks each status change and calculates total costs based on daily rates and duration.
                      </p>
                      <p>
                        <strong>Date and Rate Calculations:</strong> The system automatically calculates booking duration and total amounts using start/end dates and daily rates. 
                        This enables accurate cost tracking and revenue reporting for temporary berth rentals.
                      </p>
                      <p>
                        <strong>Key Tables for Bookings:</strong> <code className="bg-green-100 px-1 rounded">bookings</code> (50 total), <code className="bg-green-100 px-1 rounded">owners</code> (51 customers), 
                        <code className="bg-green-100 px-1 rounded">boats</code> (50 vessels), <code className="bg-green-100 px-1 rounded">berths</code> (50 berths). 
                        The system uses LEFT JOINs to display comprehensive booking information including customer details, boat specifications, and berth availability.
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
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings?.length || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(bookings || []).filter((b: any) => b.status === 'CONFIRMED').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {(bookings || []).filter((b: any) => b.status === 'PENDING').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency((bookings || []).reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0))}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
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
                    placeholder="Search bookings, customers, or boats..."
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
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Today</option>
                  <option value="TOMORROW">Tomorrow</option>
                  <option value="THIS_WEEK">This Week</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(true)}>
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {(bookings || []).map((booking: any) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.bookingNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking.customerName} • {booking.boatName}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Berth {booking.berthNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {getDaysDuration(booking.startDate, booking.endDate)} days
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatCurrency(booking.dailyRate)}{getTimeUnit('day')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Purpose:</span> {booking.purpose}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total:</span> {formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewBooking(booking)}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditBooking(booking)}>
                      Edit
                    </Button>
                    {booking.status === 'PENDING' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmBooking(booking.id)}>
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(bookings || []).length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first booking'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && dateFilter === 'ALL' && (
                <Button onClick={() => setShowNewBookingModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Booking
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Booking</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelNewBooking}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <Input
                  value={newBooking.customerName}
                  onChange={(e) => handleNewBookingChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boat Name *
                </label>
                <Input
                  value={newBooking.boatName}
                  onChange={(e) => handleNewBookingChange('boatName', e.target.value)}
                  placeholder="Enter boat name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berth Number *
                </label>
                <Input
                  value={newBooking.berthNumber}
                  onChange={(e) => handleNewBookingChange('berthNumber', e.target.value)}
                  placeholder="e.g., A-15"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <LocaleDateInput
                    value={newBooking.startDate}
                    onChange={(value) => handleNewBookingChange('startDate', value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <LocaleDateInput
                    value={newBooking.endDate}
                    onChange={(value) => handleNewBookingChange('endDate', value)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate (£) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newBooking.dailyRate}
                  onChange={(e) => handleNewBookingChange('dailyRate', e.target.value)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <Input
                  value={newBooking.purpose}
                  onChange={(e) => handleNewBookingChange('purpose', e.target.value)}
                  placeholder="e.g., Weekend getaway"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreateBooking}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Booking
              </Button>
              <Button
                onClick={handleCancelNewBooking}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Booking Modal */}
      {showViewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Booking Details</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedBooking.bookingNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <p className="text-gray-900">{selectedBooking.customerName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Boat Name</label>
                  <p className="text-gray-900">{selectedBooking.boatName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berth Number</label>
                  <p className="text-gray-900">{selectedBooking.berthNumber}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bookingStatusColors[selectedBooking.status as keyof typeof bookingStatusColors]}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-gray-900">{formatDate(selectedBooking.startDate)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-gray-900">{formatDate(selectedBooking.endDate)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-gray-900">{getDaysDuration(selectedBooking.startDate, selectedBooking.endDate)} days</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedBooking.dailyRate)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
              </div>
              
              {selectedBooking.purpose && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <p className="text-gray-900">{selectedBooking.purpose}</p>
                </div>
              )}
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

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Booking</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEditBooking}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <Input
                  value={editBooking.customerName}
                  onChange={(e) => setEditBooking(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boat Name *
                </label>
                <Input
                  value={editBooking.boatName}
                  onChange={(e) => setEditBooking(prev => ({ ...prev, boatName: e.target.value }))}
                  placeholder="Enter boat name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berth Number *
                </label>
                <Input
                  value={editBooking.berthNumber}
                  onChange={(e) => setEditBooking(prev => ({ ...prev, berthNumber: e.target.value }))}
                  placeholder="e.g., A-15"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <LocaleDateInput
                    value={editBooking.startDate}
                    onChange={(value) => setEditBooking(prev => ({ ...prev, startDate: value }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <LocaleDateInput
                    value={editBooking.endDate}
                    onChange={(value) => setEditBooking(prev => ({ ...prev, endDate: value }))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate (£) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editBooking.dailyRate}
                  onChange={(e) => setEditBooking(prev => ({ ...prev, dailyRate: e.target.value }))}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <Input
                  value={editBooking.purpose}
                  onChange={(e) => setEditBooking(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="e.g., Weekend getaway"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpdateBooking}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Update Booking
              </Button>
              <Button
                onClick={handleCancelEditBooking}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <Input
                  value={advancedFilters.customerFilter}
                  onChange={(e) => handleAdvancedFilterChange('customerFilter', e.target.value)}
                  placeholder="Filter by customer name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boat Name
                </label>
                <Input
                  value={advancedFilters.boatFilter}
                  onChange={(e) => handleAdvancedFilterChange('boatFilter', e.target.value)}
                  placeholder="Filter by boat name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berth Number
                </label>
                <Input
                  value={advancedFilters.berthFilter}
                  onChange={(e) => handleAdvancedFilterChange('berthFilter', e.target.value)}
                  placeholder="Filter by berth number"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Daily Rate
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
                    Max Daily Rate
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
