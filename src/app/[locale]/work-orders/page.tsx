'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Anchor,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Download,
  Archive,
  BookOpen,
  Settings
} from 'lucide-react'
import { useLocaleFormatting, useLocale } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { useWorkOrders } from '@/hooks/use-data-source-fetch'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { FullDiaryModal } from '@/components/dashboard/full-diary-modal'

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

export default function WorkOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatDate, formatCurrency, localeConfig } = useLocaleFormatting()
  const { currentLocale } = useLocale()
  
  // Use data source hook instead of hardcoded mock data
  const { data: workOrders, isLoading, error } = useWorkOrders()
  

  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false)
  
  // Check for view=diary parameter and open diary modal automatically
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam === 'diary') {
      logger.info('Opening diary modal from URL parameter', { viewParam })
      setIsDiaryModalOpen(true)
      
      // Clean up the URL by removing the view parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('view')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])
  
  // Show loading state
  if (isLoading) {
    return (
      <AppLayout user={mockUser}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading work orders...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <AppLayout user={mockUser}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Work Orders</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }
  
  // Show empty state if no work orders
  if (!workOrders || workOrders.length === 0) {
    return (
      <AppLayout user={mockUser}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🔧</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Work Orders Found</h2>
            <p className="text-gray-600 mb-4">There are no work orders to display at the moment.</p>
            <Button onClick={() => router.push(`/${currentLocale}/work-orders/create`)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Work Order
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Filter work orders based on search and filters
  const filteredWorkOrders = (workOrders || []).filter((workOrder: any) => {
    if (searchTerm) {
      const matchesSearch = 
        workOrder.externalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder.boat?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder.owner?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder.owner?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
    }

    if (statusFilter !== 'ALL' && workOrder.status !== statusFilter) {
      return false
    }

    if (priorityFilter !== 'ALL' && workOrder.priority !== priorityFilter) {
      return false
    }

    return true
  })


  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
        status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
        status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
        status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        priority === 'LOW' ? 'bg-gray-100 text-gray-800' :
        priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
        priority === 'HIGH' ? 'bg-red-100 text-red-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        {priority}
      </span>
    )
  }

  const getDaysUntilDue = (dueDate: Date | string) => {
    const today = new Date()
    const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate)
    
    // Check if the date is valid
    if (isNaN(dueDateObj.getTime())) {
      return 0 // Return 0 if invalid date
    }
    
    const diffTime = dueDateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleDownloadWorkOrder = async (workOrder: any) => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { downloadWorkOrderPDF } = await import('@/lib/pdf-generator')
      
      // Prepare work order data for PDF generation
      const workOrderData = {
        id: workOrder.id,
        workOrderNumber: workOrder.externalId,
        title: workOrder.title,
        description: workOrder.description || 'No description provided',
        status: workOrder.status,
        priority: workOrder.priority,
        assignedTo: workOrder.owner?.firstName + ' ' + workOrder.owner?.lastName,
        estimatedCost: 0, // Placeholder, actual cost will be fetched
        actualCost: workOrder.totalCost || 0,
        startDate: new Date(workOrder.requestedDate).toISOString(),
        completionDate: workOrder.completedDate ? new Date(workOrder.completedDate).toISOString() : undefined,
        createdAt: new Date(workOrder.requestedDate).toISOString(),
        updatedAt: workOrder.completedDate ? new Date(workOrder.completedDate).toISOString() : new Date(workOrder.requestedDate).toISOString()
      }
      
      // Generate and download PDF
      downloadWorkOrderPDF(workOrderData)
      
      logger.info('Work order PDF generated and downloaded successfully')
    } catch (error) {
      logger.error('Error generating work order PDF', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate work order PDF. Please try again.')
    }
  }

  const handleMoreFilters = () => {
    // Show advanced filter options
    const filters = prompt(`
Advanced Filters:

1. Date Range:
   - Start Date (YYYY-MM-DD): 
   - End Date (YYYY-MM-DD): 

2. Cost Range:
   - Min Cost: 
   - Max Cost: 

3. Marina Location:
   - All
   - Main Dock
   - North Pier
   - South Dock

4. Boat Type:
   - All
   - Sailboat
   - Motorboat
   - Yacht

Enter filter values (press Cancel to skip):
    `)
    if (filters) {
      logger.info('Advanced filters applied', { filters })
      alert('Advanced filters would be applied here')
    }
  }

  const handleBulkDownload = async () => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { generateWorkOrderPDFBlob } = await import('@/lib/pdf-generator')
      
      if (filteredWorkOrders.length === 0) {
        alert('No work orders to download')
        return
      }
      
      // Create a zip file with all PDFs
      const JSZip = await import('jszip')
      const zip = new JSZip.default()
      
      // Generate PDFs for each work order
      for (const workOrder of filteredWorkOrders) {
        try {
          const pdfBlob = await generateWorkOrderPDFBlob({
            id: workOrder.id,
            workOrderNumber: workOrder.workOrderNumber,
            title: workOrder.description,
            description: workOrder.description || 'No description provided',
            status: workOrder.status,
            priority: workOrder.priority,
            assignedTo: workOrder.customerName,
            estimatedCost: workOrder.estimatedCost || 0,
            actualCost: workOrder.estimatedCost || 0,
            startDate: new Date(workOrder.startDate).toISOString(),
            completionDate: workOrder.completionDate ? new Date(workOrder.completionDate).toISOString() : undefined,
            createdAt: new Date(workOrder.startDate).toISOString(),
            updatedAt: workOrder.completionDate ? new Date(workOrder.completionDate).toISOString() : new Date(workOrder.startDate).toISOString()
          })
          
          zip.file(`work-order-${workOrder.workOrderNumber}.pdf`, pdfBlob)
        } catch (error) {
          logger.error('Error generating PDF for work order', { workOrderId: workOrder.id, error })
        }
      }
      
      // Download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `work-orders-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      logger.info('Bulk work order download completed successfully')
    } catch (error) {
      logger.error('Error generating bulk work order download', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate bulk download. Please try again.')
    }
  }

  const getTotalWorkOrders = () => workOrders?.length || 0
  const getCompletedWorkOrders = () => workOrders?.filter(wo => wo.status === 'COMPLETED').length || 0
  const getInProgressWorkOrders = () => workOrders?.filter(wo => wo.status === 'IN_PROGRESS').length || 0
  const getPendingWorkOrders = () => workOrders?.filter(wo => wo.status === 'PENDING').length || 0
  const getTotalRevenue = () => workOrders?.filter(wo => wo.status === 'COMPLETED').reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0) || 0
  const getOverdueWorkOrders = () => workOrders?.filter(wo => new Date(wo.startDate) < new Date() && wo.status !== 'COMPLETED').length || 0

  return (
    <AppLayout user={mockUser}>
      <div className="p-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="workOrders"
            dataCount={workOrders?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalWorkOrders: workOrders?.length || 0,
              pendingWorkOrders: workOrders?.filter((wo: any) => wo.status === 'PENDING').length || 0,
              inProgressWorkOrders: workOrders?.filter((wo: any) => wo.status === 'IN_PROGRESS').length || 0,
              completedWorkOrders: workOrders?.filter((wo: any) => wo.status === 'COMPLETED').length || 0
            }}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-600 mt-2">
              Manage maintenance requests and service work
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {localeConfig.name} • {localeConfig.currency} • {localeConfig.measurement === 'metric' ? 'Metric' : 'Imperial'} units
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              variant="outline"
              onClick={handleBulkDownload}
              disabled={filteredWorkOrders.length === 0}
            >
              <Archive className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button onClick={() => router.push(`/${currentLocale}/work-orders/create`)}>
              <Plus className="w-4 h-4 mr-2" />
              New Work Order
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Work Order Management</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage maintenance requests, service work, and repair tasks for marina vessels.
                    </p>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Key Features:</p>
                      <ul className="space-y-1">
                        <li>• Create work orders with priority levels and detailed descriptions</li>
                        <li>• Assign work orders to technicians and track progress</li>
                        <li>• Monitor status updates (Pending, Scheduled, In Progress, Completed)</li>
                        <li>• Track costs including estimated vs. actual costs</li>
                        <li>• Link work orders to specific boats and owners</li>
                        <li>• Download work order PDFs for record keeping</li>
                      </ul>
                    </div>
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
                        <strong>Work Order Data Structure:</strong> The work_orders table contains maintenance and service records with fields for title, description, status, priority, requested date, completion date, and total cost. Each work order has a unique ID and links to boats, owners, and marinas through foreign key relationships.
                      </p>
                      <p>
                        <strong>Status Workflow:</strong> PENDING → SCHEDULED → IN_PROGRESS → COMPLETED with timestamps
                      </p>
                      <p>
                        <strong>Priority System:</strong> LOW, MEDIUM, HIGH, URGENT levels for resource allocation
                      </p>
                      <p>
                        <strong>Cost Tracking:</strong> Estimated vs. actual costs with completion date recording
                      </p>
                      <p>
                        <strong>Key Tables:</strong> <code className="bg-green-100 px-1 rounded">work_orders</code> (50 total), <code className="bg-green-100 px-1 rounded">owners</code> (51 customers), <code className="bg-green-100 px-1 rounded">boats</code> (50 vessels), <code className="bg-green-100 px-1 rounded">marinas</code> (1 marina)
                      </p>
                      <p>
                        <strong>Data Integration:</strong> Uses LEFT JOINs to display comprehensive work order information
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* NEW: Diary Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Diary - Daily Job List
            </CardTitle>
            <CardDescription>
              View and manage daily marina tasks and boatyard operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Job List Component will be imported here */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-blue-900">Today's Tasks</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-700 border-blue-300"
                    onClick={() => setIsDiaryModalOpen(true)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Full Diary
                  </Button>
                </div>
                <div className="text-sm text-blue-700">
                  <p>• Engine Maintenance - Port Engine (Mike Johnson) - IN PROGRESS</p>
                  <p>• Electrical System Check (Sarah Wilson) - PENDING</p>
                  <p>• Hull Cleaning and Inspection (Tom Brown) - ASSIGNED</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Work Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalWorkOrders()}</p>
                </div>
                <Wrench className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{getCompletedWorkOrders()}</p>
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
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{getInProgressWorkOrders()}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{getOverdueWorkOrders()}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
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
                    placeholder="Search work orders by number, title, boat, owner, or technician..."
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
                  <option value="PENDING">Pending</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <Button variant="outline" size="sm" onClick={handleMoreFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders List */}
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-12">
              <p>Loading work orders...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-12 text-red-600">
              {error}
            </div>
          )}
          {!isLoading && filteredWorkOrders.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first work order'
                  }
                </p>
                {!searchTerm && statusFilter === 'ALL' && priorityFilter === 'ALL' && (
                  <Button onClick={() => router.push(`/${currentLocale}/work-orders/create`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Work Order
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {!isLoading && filteredWorkOrders.length > 0 && filteredWorkOrders.map((workOrder) => (
            <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {workOrder.workOrderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {workOrder.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(workOrder.status)}
                        {getPriorityBadge(workOrder.priority)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Anchor className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{workOrder.boatName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{workOrder.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Berth N/A</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{workOrder.customerName}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Requested:</span>
                        <span className="ml-2 text-gray-900">{formatDate(workOrder.startDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Due Date:</span>
                        <span className={`ml-2 ${getDaysUntilDue(workOrder.startDate) < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {formatDate(workOrder.startDate)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Hours:</span>
                        <span className="ml-2 text-gray-900">
                          {/* Hours tracking not yet implemented */}
                          N/A
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Cost:</span>
                        <span className="ml-2 text-gray-900">
                          {formatCurrency(workOrder.estimatedCost || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {workOrder.description}
                      </p>
                      {/* Placeholder for parts and notes */}
                      {/* <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Parts:</span> {workOrder.parts.join(', ')}
                      </p> */}
                      {/* <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Notes:</span> {workOrder.notes}
                      </p> */}
                    </div>

                    {new Date(workOrder.startDate) < new Date() && workOrder.status !== 'COMPLETED' && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-800 font-semibold">
                            OVERDUE: This work order is {Math.abs(getDaysUntilDue(workOrder.startDate))} days past due!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/${currentLocale}/work-orders/${workOrder.id}`)}>
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadWorkOrder(workOrder)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/${currentLocale}/work-orders/${workOrder.id}/edit`)}>
                      Edit
                    </Button>
                    {workOrder.status === 'PENDING' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/${currentLocale}/work-orders/${workOrder.id}/start`)}>
                        Start
                      </Button>
                    )}
                    {workOrder.status === 'IN_PROGRESS' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => router.push(`/${currentLocale}/work-orders/${workOrder.id}/complete`)}>
                        Complete
                      </Button>
                    )}
                    {workOrder.status === 'SCHEDULED' && (
                      <Button variant="outline" size="sm" onClick={() => router.push(`/${currentLocale}/work-orders/${workOrder.id}/reschedule`)}>
                        Reschedule
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Full Diary Modal */}
      <FullDiaryModal
        isOpen={isDiaryModalOpen}
        onClose={() => setIsDiaryModalOpen(false)}
        userId={mockUser.id}
        marinaId="marina-1"
      />
      
      {/* DataSourceDebug Component - REMOVED TO FIX DUPLICATE BUTTONS */}
    </AppLayout>
  )
}


