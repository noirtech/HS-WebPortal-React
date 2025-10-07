'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertTriangle,
  Wrench,
  User,
  Anchor,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useLocaleFormatting, useLocale } from '@/lib/locale-context'
import { logger } from '@/lib/logger'

interface WorkOrder {
  id: string
  externalId: string
  title: string
  description?: string
  status: string
  priority: string
  requestedDate: Date
  completedDate?: Date
  totalCost?: number
  marinaId: string
  boatId?: string
  ownerId: string
  marina?: {
    id: string
    name: string
  }
  boat?: {
    id: string
    name: string
    registration: string
  }
  owner?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Owner {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Boat {
  id: string
  name: string
  registration: string
}

export default function EditWorkOrderPage() {
  const router = useRouter()
  const params = useParams()
  const { formatDate, formatCurrency, localeConfig } = useLocaleFormatting()
  const { currentLocale } = useLocale()
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [boats, setBoats] = useState<Boat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    requestedDate: '',
    completedDate: '',
    totalCost: '',
    ownerId: '',
    boatId: 'none'
  })

  const workOrderId = params.id as string

  // Fetch work order details and related data
  useEffect(() => {
    let isMounted = true
    let abortController = new AbortController()
    
    const fetchData = async () => {
      try {
        if (!isMounted) return
        
        setIsLoading(true)
        setError(null)
        
        // Fetch work order details
        logger.debug('Fetching work order details...')
        const workOrderResponse = await fetch(`/api/work-orders/${workOrderId}`, {
          credentials: 'include',
          signal: abortController.signal
        })
        
        if (!isMounted) return
        logger.debug('Work order API response:', { status: workOrderResponse.status, statusText: workOrderResponse.statusText })
        
        if (!workOrderResponse.ok) {
          throw new Error(`HTTP ${workOrderResponse.status}: ${workOrderResponse.statusText}`)
        }
        const workOrderData = await workOrderResponse.json()
        if (!isMounted) return
        logger.debug('Work order data received:', workOrderData)
        const workOrder = workOrderData.data
        
        if (workOrder) {
          logger.debug('Setting work order and form data:', workOrder)
          setWorkOrder(workOrder)
          setFormData({
            title: workOrder.title || '',
            description: workOrder.description || '',
            status: workOrder.status || '',
            priority: workOrder.priority || '',
            requestedDate: workOrder.requestedDate ? new Date(workOrder.requestedDate).toISOString().split('T')[0] : '',
            completedDate: workOrder.completedDate ? new Date(workOrder.completedDate).toISOString().split('T')[0] : '',
            totalCost: workOrder.totalCost?.toString() || '',
            ownerId: workOrder.ownerId || '',
            boatId: workOrder.boatId || 'none'
          })
        } else {
          logger.warn('No work order data received')
        }

        // Fetch owners for dropdown
        if (!isMounted) return
        logger.debug('Fetching owners from API...')
        const ownersResponse = await fetch('/api/owners', {
          credentials: 'include',
          signal: abortController.signal
        })
        
        if (!isMounted) return
        logger.debug('Owners API response:', { status: ownersResponse.status, statusText: ownersResponse.statusText })
        
        if (ownersResponse.ok) {
          const ownersData = await ownersResponse.json()
          if (!isMounted) return
          logger.debug('Owners data received:', ownersData)
          setOwners(ownersData.data || [])
          logger.debug('Owners state set to:', ownersData.data?.length || 0, 'items')
        } else {
          logger.warn('Failed to fetch owners', { status: ownersResponse.status, statusText: ownersResponse.statusText })
          if (ownersResponse.status === 401) {
            setError('Authentication required. Please log in again.')
          } else {
            setError(`Failed to load owners: ${ownersResponse.status} ${ownersResponse.statusText}`)
          }
        }

        // Fetch boats for dropdown
        if (!isMounted) return
        logger.debug('Fetching boats from API...')
        const boatsResponse = await fetch('/api/boats', {
          credentials: 'include',
          signal: abortController.signal
        })
        
        if (!isMounted) return
        logger.debug('Boats API response:', { status: boatsResponse.status, statusText: boatsResponse.statusText })
        
                 if (boatsResponse.ok) {
           const boatsData = await boatsResponse.json()
           if (!isMounted) return
           logger.debug('Boats data received:', boatsData)
           logger.debug('Boats data structure:', {
             hasData: !!boatsData.data,
             dataLength: boatsData.data?.length,
             directLength: Array.isArray(boatsData) ? boatsData.length : 'Not array',
             keys: Object.keys(boatsData)
           })
           // Boats API returns data directly as array, not wrapped in .data
           const boatsArray = Array.isArray(boatsData) ? boatsData : (boatsData.data || [])
           setBoats(boatsArray)
           logger.debug('Boats state set to:', boatsArray.length, 'items')
         } else {
          logger.warn('Failed to fetch boats', { status: boatsResponse.status, statusText: boatsResponse.statusText })
          if (boatsResponse.status === 401) {
            setError('Authentication required. Please log in again.')
          } else {
            setError(`Failed to load boats: ${boatsResponse.status} ${boatsResponse.statusText}`)
          }
        }

      } catch (error) {
        if (!isMounted) return
        if (error instanceof Error && error.name === 'AbortError') {
          logger.debug('Fetch aborted - component unmounted')
          return
        }
        logger.error('Failed to fetch data for edit', { error, workOrderId })
        setError('Failed to load work order details')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (workOrderId) {
      fetchData()
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [workOrderId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        requestedDate: formData.requestedDate,
        completedDate: formData.completedDate || null,
        totalCost: formData.totalCost ? parseFloat(formData.totalCost) : null,
        ownerId: formData.ownerId,
        boatId: formData.boatId || null
      }

      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Redirect back to work order detail page
      router.push(`/${currentLocale}/work-orders/${workOrderId}`)
      
    } catch (error) {
      logger.error('Failed to update work order', { error, workOrderId })
      setError('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading work order details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !workOrder) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-32 w-32 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Work Order</h1>
            <p className="text-gray-600 mb-4">{error || 'Work order not found'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Debug logging for form rendering condition
  logger.debug('Form rendering condition check:', {
    ownersLength: owners.length,
    boatsLength: boats.length,
    workOrderExists: !!workOrder,
    owners: owners.length > 0 ? 'Data available' : 'No data',
    boats: boats.length > 0 ? 'Data available' : 'No data',
    workOrder: workOrder ? 'Data available' : 'No data'
  })

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Work Order</h1>
              <p className="text-gray-600">{workOrder.externalId} - {workOrder.title}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        {owners.length === 0 || boats.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading form data...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Owners: {owners.length} | Boats: {boats.length} | Work Order: {workOrder ? 'Loaded' : 'Loading...'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Work order title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed description of the work required"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="requestedDate">Requested Date</Label>
                  <Input
                    id="requestedDate"
                    type="date"
                    value={formData.requestedDate}
                    onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="completedDate">Completed Date (Optional)</Label>
                  <Input
                    id="completedDate"
                    type="date"
                    value={formData.completedDate}
                    onChange={(e) => handleInputChange('completedDate', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Related Information */}
          <div className="space-y-6">
            {/* Owner and Boat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Owner & Boat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ownerId">Owner</Label>
                  <Select value={formData.ownerId} onValueChange={(value) => handleInputChange('ownerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={owners.length > 0 ? "Select owner" : "Loading owners..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.length > 0 ? (
                        owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.firstName} {owner.lastName} ({owner.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading owners...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="boatId">Boat (Optional)</Label>
                  <Select value={formData.boatId} onValueChange={(value) => handleInputChange('boatId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={boats.length > 0 ? "Select boat (optional)" : "Loading boats..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No boat assigned</SelectItem>
                      {boats.length > 0 ? (
                        boats.map((boat) => (
                          <SelectItem key={boat.id} value={boat.id}>
                            {boat.name} ({boat.registration})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading boats...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Cost Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Cost Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="totalCost">Total Cost</Label>
                  <Input
                    id="totalCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalCost}
                    onChange={(e) => handleInputChange('totalCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Values Display */}
            <Card>
              <CardHeader>
                <CardTitle>Current Values</CardTitle>
                <CardDescription>These values cannot be edited</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Work Order ID:</span>
                  <span className="font-medium">{workOrder.externalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marina:</span>
                  <span className="font-medium">{workOrder.marina?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(workOrder.requestedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{formatDate(workOrder.completedDate || workOrder.requestedDate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </AppLayout>
  )
}
