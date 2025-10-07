'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BoatForm } from '@/components/forms/boat-form'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { useBoats } from '@/hooks/use-data-source-fetch'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Settings } from 'lucide-react'
import { 
  Plus, 
  Search, 
  Filter, 
  Ship, 
  User,
  MapPin,
  Ruler,
  FileText,
  AlertCircle,
  CheckCircle,
  Edit,
  X,
  Eye,
  Download,
  Archive
} from 'lucide-react'

interface Boat {
  id: string
  name: string
  registration: string
  length: number
  beam: number
  draft: number
  isActive: boolean
  ownerId: string
  marinaId: string
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function BoatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { formatLength, formatBeam, formatDraft, localeConfig } = useLocaleFormatting()
  const { data: boats, isLoading, error } = useBoats()
  const [showBoatForm, setShowBoatForm] = useState(false)
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sizeFilter, setSizeFilter] = useState('ALL')

  // Filter boats based on search and filters
  const filteredBoats = (boats || []).filter((boat: any) => {
    if (searchTerm) {
      const matchesSearch = 
        boat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (boat.registration && boat.registration.toLowerCase().includes(searchTerm.toLowerCase())) ||
        `${boat.owner?.firstName} ${boat.owner?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
    }

    if (statusFilter !== 'ALL') {
      const isActive = statusFilter === 'ACTIVE'
      if (boat.isActive !== isActive) return false
    }

    if (sizeFilter !== 'ALL') {
      const length = boat.length || 0
      switch (sizeFilter) {
        case 'SMALL':
          if (length >= 20) return false
          break
        case 'MEDIUM':
          if (length < 20 || length >= 40) return false
          break
        case 'LARGE':
          if (length < 40) return false
          break
      }
    }

    return true
  })



  // Handler functions for boat actions
  const handleEditBoat = (boat: Boat) => {
    setEditingBoat(boat)
  }

  const handleDeleteBoat = async (boatId: string) => {
    if (!confirm('Are you sure you want to delete this boat? This action cannot be undone.')) {
      return
    }

    try {
      // In a real app, this would be an API call
      // await fetch(`/api/boats/${boatId}`, { method: 'DELETE' })
      
      // In demo mode, show alert instead of updating state
      logger.info('Boat deleted successfully', { boatId })
      alert('Boat deleted successfully! (Demo mode - no actual boat deleted)')
    } catch (error) {
      logger.error('Error deleting boat', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to delete boat. Please try again.')
    }
  }

  const handleEditSuccess = () => {
    setEditingBoat(null)
    window.location.reload()
  }

  const handleDownloadBoat = async (boat: Boat) => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { downloadBoatPDF } = await import('@/lib/pdf-generator')
      
      // Prepare boat data for PDF generation
      const boatData = {
        id: boat.id,
        name: boat.name,
        registration: boat.registration,
        length: boat.length,
        beam: boat.beam,
        draft: boat.draft,
        isActive: boat.isActive,
        owner: boat.owner,
        marinaId: boat.marinaId
      }
      
      // Generate and download PDF
      downloadBoatPDF(boatData)
      
      logger.info('Boat PDF generated and downloaded successfully')
    } catch (error) {
      logger.error('Error generating boat PDF', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate boat PDF. Please try again.')
    }
  }

  const handleBulkDownload = async () => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { generateBoatPDFBlob } = await import('@/lib/pdf-generator')
      
      if (filteredBoats.length === 0) {
        alert('No boats to download')
        return
      }
      
      // Create a zip file with all PDFs
      const JSZip = await import('jszip')
      const zip = new JSZip.default()
      
      // Generate PDFs for each boat
      for (let i = 0; i < filteredBoats.length; i++) {
        const boat = filteredBoats[i]
        const pdfBlob = generateBoatPDFBlob(boat)
        
        const filename = `boat-${boat.registration || boat.name}-${new Date().toISOString().split('T')[0]}.pdf`
        
        // Add to zip
        zip.file(filename, pdfBlob)
      }
      
      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `boats-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      logger.info('Bulk download completed', { count: filteredBoats.length })
    } catch (error) {
      logger.error('Error in bulk download', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to download boats. Please try again.')
    }
  }

  const boatStatusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${boatStatusColors[status as keyof typeof boatStatusColors]}`}>
        {status}
      </span>
    )
  }

  const getTotalBoats = () => (boats || []).length
  const getActiveBoats = () => (boats || []).filter((b: any) => b.isActive).length
  const getInactiveBoats = () => (boats || []).filter((b: any) => !b.isActive).length
  const getTotalLength = () => {
    return (boats || []).reduce((sum: number, boat: any) => sum + (boat.length || 0), 0)
  }

  // Show loading state
  if (isLoading || status === 'loading') {
    return (
      <AppLayout user={session?.user}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading boats...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <AppLayout user={session?.user}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Boats</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }
  
  // Show empty state if no boats
  if (!boats || boats.length === 0) {
    return (
      <AppLayout user={session?.user}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🚤</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Boats Found</h2>
            <p className="text-gray-600 mb-4">There are no boats to display at the moment.</p>
            <Button onClick={() => setShowBoatForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Boat
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <AppLayout user={session.user}>
      <div className="p-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="boats"
            dataCount={boats?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalBoats: boats?.length || 0,
              mooredBoats: boats?.filter((b: any) => b.status === 'MOORED').length || 0,
              maintenanceBoats: boats?.filter((b: any) => b.status === 'MAINTENANCE').length || 0,
              availableBoats: boats?.filter((b: any) => b.status === 'AVAILABLE').length || 0
            }}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Boats</h1>
            <p className="text-gray-600 mt-2">
              Manage vessel registry and boat information
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              variant="outline"
              onClick={handleBulkDownload}
              disabled={filteredBoats.length === 0}
            >
              <Archive className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button onClick={() => setShowBoatForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Boat
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Boat Registry</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage vessel registry and boat information for marina customers.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> Register boats with specifications (length, beam, draft), link to owners, track registration numbers, and manage boat status (Active/Inactive). Each boat can be assigned to berths and linked to contracts for marina services.
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
                        <strong>Boat Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">boats</code> table contains 50 vessel records with specifications like name, registration number, length, beam, and draft. 
                        Each boat has a unique ID, owner assignment, and links to contracts and berths through foreign key relationships.
                      </p>
                      <p>
                        <strong>Owner Relationship:</strong> Each boat is linked to a customer through the <code className="bg-green-100 px-1 rounded">owners</code> table via the ownerId field. 
                        This allows the system to display owner information (name, email, contact details) for each vessel.
                      </p>
                      <p>
                        <strong>Berth Assignment Tracking:</strong> Boat berth assignments are tracked through the <code className="bg-green-100 px-1 rounded">contracts</code> table, which links boats to specific berths. 
                        This enables the system to show current berth location and contract status for each vessel.
                      </p>
                      <p>
                        <strong>Key Tables for Boats:</strong> <code className="bg-green-100 px-1 rounded">boats</code> (50 total), <code className="bg-green-100 px-1 rounded">owners</code> (51 customers), 
                        <code className="bg-green-100 px-1 rounded">contracts</code> (51 contracts), <code className="bg-green-100 px-1 rounded">berths</code> (50 berths). 
                        The system uses LEFT JOINs to display comprehensive boat information including owner details and current berth assignments.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search boats by name, registration, or owner..."
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
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Sizes</option>
                  <option value="SMALL">
                    Small (&lt;{localeConfig.measurement === 'metric' ? '9m' : '30ft'})
                  </option>
                  <option value="MEDIUM">
                    Medium ({localeConfig.measurement === 'metric' ? '9-12m' : '30-40ft'})
                  </option>
                  <option value="LARGE">
                    Large (&gt;{localeConfig.measurement === 'metric' ? '12m' : '40ft'})
                  </option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
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
                  <p className="text-sm font-medium text-gray-600">Total Boats</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalBoats()}</p>
                </div>
                <Ship className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{getActiveBoats()}</p>
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
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">{getInactiveBoats()}</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Length</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatLength(getTotalLength())}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boats List */}
        <div className="space-y-4">
          {filteredBoats.map((boat) => (
            <Card key={boat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {boat.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {boat.registration || 'No registration'} • {boat.owner?.firstName || 'Unknown'} {boat.owner?.lastName || 'Owner'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(boat.isActive ? 'ACTIVE' : 'INACTIVE')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{boat.owner?.firstName || 'Unknown'} {boat.owner?.lastName || 'Owner'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{boat.owner?.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Ruler className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatLength(boat.length)} × {boat.beam ? formatBeam(boat.beam) : 'N/A'} × {boat.draft ? formatDraft(boat.draft) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Ship className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Registration: {boat.registration || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/boats/${boat.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadBoat(boat)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditBoat(boat)}
                      disabled={!boat.isActive}
                      className={!boat.isActive ? "text-gray-400 bg-gray-100 cursor-not-allowed" : ""}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteBoat(boat.id)}
                      disabled={!boat.isActive}
                      className={!boat.isActive ? "text-gray-400 bg-gray-100 cursor-not-allowed" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {boat.isActive ? 'Delete' : 'Deleted'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBoats.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Ship className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No boats found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' || sizeFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first boat'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && sizeFilter === 'ALL' && (
                <Button onClick={() => setShowBoatForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Boat
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Boat Form Modal */}
        {showBoatForm && (
          <BoatForm
            onClose={() => setShowBoatForm(false)}
            onSuccess={() => {
              // Refresh boats list
              window.location.reload()
            }}
          />
        )}

        {/* Edit Boat Form Modal */}
        {editingBoat && (
          <BoatForm
            boat={editingBoat}
            onClose={() => setEditingBoat(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
      
      {/* DataSourceDebug Component - REMOVED TO FIX DUPLICATE BUTTONS */}
    </AppLayout>
  )
}
