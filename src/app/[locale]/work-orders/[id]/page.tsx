'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  User,
  Anchor,
  Calendar,
  DollarSign,
  MapPin,
  Wrench,
  FileText
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
    owner?: {
      firstName: string
      lastName: string
    }
  }
  owner?: {
    id: string
    firstName: string
    lastName: string
  }
  berth?: {
    id: string
    name: string
    berthNumber: string
  }
}

export default function WorkOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { formatDate, formatCurrency, localeConfig } = useLocaleFormatting()
  const { currentLocale } = useLocale()
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const workOrderId = params.id as string

  // Fetch work order details
  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/work-orders/${workOrderId}`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        setWorkOrder(data.data || null)
      } catch (error) {
        logger.error('Failed to fetch work order', { error, workOrderId })
        setError('Failed to load work order details')
      } finally {
        setIsLoading(false)
      }
    }

    if (workOrderId) {
      fetchWorkOrder()
    }
  }, [workOrderId])

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`${
        status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
        status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
        status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
        status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    return (
      <Badge className={`${
        priority === 'LOW' ? 'bg-gray-100 text-gray-800' :
        priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
        priority === 'HIGH' ? 'bg-red-100 text-red-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        {priority}
      </Badge>
    )
  }

  const getDaysUntilDue = (dueDate: Date | string) => {
    const today = new Date()
    const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate)
    
    if (isNaN(dueDateObj.getTime())) {
      return 0
    }
    
    const diffTime = dueDateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleDownloadWorkOrder = async () => {
    if (!workOrder) return
    
    try {
      const { downloadWorkOrderPDF } = await import('@/lib/pdf-generator')
      
      const workOrderData = {
        id: workOrder.id,
        workOrderNumber: workOrder.externalId,
        title: workOrder.title,
        description: workOrder.description || 'No description provided',
        status: workOrder.status,
        priority: workOrder.priority,
        assignedTo: workOrder.owner?.firstName + ' ' + workOrder.owner?.lastName,
        estimatedCost: 0,
        actualCost: workOrder.totalCost || 0,
        startDate: new Date(workOrder.requestedDate).toISOString(),
        completionDate: workOrder.completedDate ? new Date(workOrder.completedDate).toISOString() : undefined,
        createdAt: new Date(workOrder.requestedDate).toISOString(),
        updatedAt: workOrder.completedDate ? new Date(workOrder.completedDate).toISOString() : new Date(workOrder.requestedDate).toISOString()
      }
      
      await downloadWorkOrderPDF(workOrderData)
    } catch (error) {
      logger.error('Failed to download work order PDF', { error, workOrderId })
      alert('Failed to download PDF')
    }
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

  const isOverdue = new Date(workOrder.requestedDate) < new Date() && workOrder.status !== 'COMPLETED'
  const daysUntilDue = getDaysUntilDue(workOrder.requestedDate)

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
              <h1 className="text-3xl font-bold text-gray-900">Work Order {workOrder.externalId}</h1>
              <p className="text-gray-600">{workOrder.title}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleDownloadWorkOrder}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => router.push(`/${currentLocale}/work-orders/${workOrder.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(workOrder.status)}</div>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  <div className="mt-1">{getPriorityBadge(workOrder.priority)}</div>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className={`text-lg font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(workOrder.requestedDate)}
                  </p>
                  {isOverdue && (
                    <p className="text-sm text-red-600 font-medium">
                      {Math.abs(daysUntilDue)} days overdue
                    </p>
                  )}
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Work Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{workOrder.description || 'No description provided'}</p>
              </CardContent>
            </Card>

            {/* Dates and Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Requested Date:</span>
                    <span className="font-medium">{formatDate(workOrder.requestedDate)}</span>
                  </div>
                  {workOrder.completedDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completed Date:</span>
                      <span className="font-medium text-green-600">{formatDate(workOrder.completedDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDate(workOrder.requestedDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{formatDate(workOrder.completedDate || workOrder.requestedDate)}</span>
                  </div>
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
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(workOrder.totalCost || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-medium">N/A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Labour Hours:</span>
                    <span className="font-medium">N/A</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Related Information */}
          <div className="space-y-6">
            {/* Boat Information */}
            {workOrder.boat && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Anchor className="w-5 h-5 mr-2" />
                    Boat Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{workOrder.boat.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Registration:</span>
                      <p className="font-medium">{workOrder.boat.registration}</p>
                    </div>
                    {workOrder.boat.owner && (
                      <div>
                        <span className="text-sm text-gray-600">Owner:</span>
                        <p className="font-medium">
                          {workOrder.boat.owner.firstName} {workOrder.boat.owner.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner Information */}
            {workOrder.owner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Owner Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">
                        {workOrder.owner.firstName} {workOrder.owner.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">ID:</span>
                      <p className="font-medium">{workOrder.owner.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marina Information */}
            {workOrder.marina && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Marina Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{workOrder.marina.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">ID:</span>
                      <p className="font-medium">{workOrder.marina.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Overdue Warning */}
        {isOverdue && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Work Order Overdue</h3>
                  <p className="text-red-700">
                    This work order is {Math.abs(daysUntilDue)} days past the requested completion date.
                    Please update the status or complete the work order.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
