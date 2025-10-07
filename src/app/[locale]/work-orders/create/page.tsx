'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  DollarSign,
  Plus
} from 'lucide-react'
import { useLocaleFormatting, useLocale } from '@/lib/locale-context'
import { logger } from '@/lib/logger'

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

interface Marina {
  id: string
  name: string
}

export default function CreateWorkOrderPage() {
  const router = useRouter()
  const { formatDate, formatCurrency, localeConfig } = useLocaleFormatting()
  const { currentLocale } = useLocale()
  const [owners, setOwners] = useState<Owner[]>([])
  const [boats, setBoats] = useState<Boat[]>([])
  const [marinas, setMarinas] = useState<Marina[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    marinaId: '',
    ownerId: '',
    boatId: '',
    requestedDate: new Date().toISOString().split('T')[0],
    totalCost: ''
  })

  // Fetch related data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch marinas
        const marinasResponse = await fetch('/api/marinas')
        if (marinasResponse.ok) {
          const marinasData = await marinasResponse.json()
          setMarinas(marinasData.data || [])
          // Set default marina if available
          if (marinasData.data && marinasData.data.length > 0) {
            setFormData(prev => ({ ...prev, marinaId: marinasData.data[0].id }))
          }
        }

        // Fetch owners
        const ownersResponse = await fetch('/api/owners')
        if (ownersResponse.ok) {
          const ownersData = await ownersResponse.json()
          setOwners(ownersData.data || [])
        }

        // Fetch boats
        const boatsResponse = await fetch('/api/boats')
        if (boatsResponse.ok) {
          const boatsData = await boatsResponse.json()
          setBoats(boatsData.data || [])
        }

      } catch (error) {
        logger.error('Failed to fetch data for new work order', { error })
        setError('Failed to load form data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required')
        return
      }
      if (!formData.description.trim()) {
        setError('Description is required')
        return
      }
      if (!formData.marinaId) {
        setError('Marina is required')
        return
      }
      if (!formData.ownerId) {
        setError('Owner is required')
        return
      }
      if (!formData.requestedDate) {
        setError('Requested date is required')
        return
      }

      const createData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        marinaId: formData.marinaId,
        ownerId: formData.ownerId,
        boatId: formData.boatId || null,
        requestedDate: formData.requestedDate,
        totalCost: formData.totalCost ? parseFloat(formData.totalCost) : null
      }

      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Redirect to the new work order detail page
      router.push(`/${currentLocale}/work-orders/${result.data.id}`)
      
    } catch (error) {
      logger.error('Failed to create work order', { error })
      setError(error instanceof Error ? error.message : 'Failed to create work order')
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
            <p className="mt-4 text-gray-600">Loading form data...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Create New Work Order</h1>
              <p className="text-gray-600">Fill in the details below to create a new work order</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Plus className="w-4 h-4 mr-2" />
              {isSaving ? 'Creating...' : 'Create Work Order'}
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

        {/* Create Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>Enter the essential details for the work order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of the work required"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed description of the work required, including any specific requirements or notes"
                    rows={4}
                    required
                  />
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
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Scheduling
                </CardTitle>
                <CardDescription>Set when the work is requested to be completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="requestedDate">Requested Completion Date *</Label>
                  <Input
                    id="requestedDate"
                    type="date"
                    value={formData.requestedDate}
                    onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Related Information */}
          <div className="space-y-6">
            {/* Marina and Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Location & Ownership
                </CardTitle>
                <CardDescription>Select the marina and owner for this work order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="marinaId">Marina *</Label>
                  <Select value={formData.marinaId} onValueChange={(value) => handleInputChange('marinaId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marina" />
                    </SelectTrigger>
                    <SelectContent>
                      {marinas.map((marina) => (
                        <SelectItem key={marina.id} value={marina.id}>
                          {marina.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="ownerId">Owner *</Label>
                  <Select value={formData.ownerId} onValueChange={(value) => handleInputChange('ownerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.firstName} {owner.lastName} ({owner.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Boat Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Anchor className="w-5 h-5 mr-2" />
                  Boat Assignment
                </CardTitle>
                <CardDescription>Optionally assign this work order to a specific boat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="boatId">Boat (Optional)</Label>
                  <Select value={formData.boatId} onValueChange={(value) => handleInputChange('boatId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select boat (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No boat assigned</SelectItem>
                      {boats.map((boat) => (
                        <SelectItem key={boat.id} value={boat.id}>
                          {boat.name} ({boat.registration})
                        </SelectItem>
                      ))}
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
                <CardDescription>Set the estimated or actual cost for this work order</CardDescription>
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
                  <p className="text-sm text-gray-500 mt-1">Leave empty if cost is not yet determined</p>
                </div>
              </CardContent>
            </Card>

            {/* Form Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Form Summary</CardTitle>
                <CardDescription className="text-blue-700">Review the information before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Title:</span>
                  <span className="font-medium text-blue-900">{formData.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Marina:</span>
                  <span className="font-medium text-blue-900">
                    {marinas.find(m => m.id === formData.marinaId)?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Owner:</span>
                  <span className="font-medium text-blue-900">
                    {owners.find(o => o.id === formData.ownerId)?.firstName + ' ' + 
                     owners.find(o => o.id === formData.ownerId)?.lastName || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Priority:</span>
                  <span className="font-medium text-blue-900">{formData.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Requested Date:</span>
                  <span className="font-medium text-blue-900">{formData.requestedDate || 'Not set'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
