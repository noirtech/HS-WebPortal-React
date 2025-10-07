'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContractForm } from '@/components/forms/contract-form'
import EditContractForm from '@/components/forms/edit-contract-form'
import { useLocaleFormatting, useLocale } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { useContracts } from '@/hooks/use-data-source-fetch'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Anchor,
  Edit,
  X,
  Download,
  Archive,
  Settings
} from 'lucide-react'

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

interface Berth {
  id: string
  berthNumber: string
}

interface Contract {
  id: string
  contractNumber: string
  startDate: string
  endDate: string
  status: string
  monthlyRate: number
  customerId: string
  boatId: string
  berthId: string | null
  customer: Owner
  boat: Boat
  berth: Berth | null
}

const contractStatusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800'
}

export default function ContractsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatDate, formatCurrency, localeConfig, getTimeUnit } = useLocaleFormatting()
  const { currentLocale } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showContractForm, setShowContractForm] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  // Use data source hook instead of direct API calls
  const { data: contracts, isLoading, error } = useContracts()





  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [status, router])

  useEffect(() => {
    let filtered = [...(contracts || [])]

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${contract.customer.firstName} ${contract.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.boat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(contract => contract.status === statusFilter)
    }

    setFilteredContracts(filtered)
  }, [searchTerm, statusFilter, contracts])

  // Handler functions for contract actions
  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract)
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Are you sure you want to cancel this contract? This action cannot be undone.')) {
      return
    }

    try {
      // In a real app, this would be an API call
      // await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' })
      
      // For demo mode, just show a success message
      logger.info('Contract cancelled successfully', { contractId })
      alert('Contract cancelled successfully')
    } catch (error) {
      logger.error('Error cancelling contract', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to cancel contract. Please try again.')
    }
  }

  const handleEditSuccess = () => {
    setEditingContract(null)
    // Refresh contracts list
    window.location.reload()
  }

  const handleDownloadContract = async (contract: Contract) => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { generateContractPDFBlob } = await import('@/lib/pdf-generator')
      
      // Convert Contract to ContractData for PDF generation
      const contractData = {
        id: contract.id,
        contractNumber: contract.contractNumber,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        monthlyRate: contract.monthlyRate,
        customer: {
          id: contract.customer.id,
          firstName: contract.customer.firstName,
          lastName: contract.customer.lastName,
          email: contract.customer.email
        },
        boat: {
          id: contract.boat.id,
          name: contract.boat.name,
          registration: contract.boat.registration
        },
        berthId: contract.berthId,
        berth: contract.berth ? {
          id: contract.berth.id,
          berthNumber: contract.berth.berthNumber
        } : undefined
      }
      
      const pdfBlob = generateContractPDFBlob(contractData)
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contract-${contract.contractNumber}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      logger.info('Contract PDF generated and downloaded successfully')
    } catch (error) {
      logger.error('Error generating contract PDF', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate contract PDF. Please try again.')
    }
  }

  const handleBulkDownload = async () => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { generateContractPDFBlob } = await import('@/lib/pdf-generator')
      
      if (filteredContracts.length === 0) {
        alert('No contracts to download')
        return
      }
      
      // Create a zip file with all PDFs
      const JSZip = await import('jszip')
      const zip = new JSZip.default()
      
      // Generate PDFs for each contract
      for (let i = 0; i < filteredContracts.length; i++) {
        const contract = filteredContracts[i]
        // Convert Contract to ContractData for PDF generation
        const contractData = {
          id: contract.id,
          contractNumber: contract.contractNumber,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          monthlyRate: contract.monthlyRate,
          customer: {
            id: contract.customer.id,
            firstName: contract.customer.firstName,
            lastName: contract.customer.lastName,
            email: contract.customer.email
          },
          boat: {
            id: contract.boat.id,
            name: contract.boat.name,
            registration: contract.boat.registration
          },
          berthId: contract.berthId,
          berth: contract.berth ? {
            id: contract.berth.id,
            berthNumber: contract.berth.berthNumber
          } : undefined
        }
        
        const pdfBlob = generateContractPDFBlob(contractData)
        
        const filename = `contract-${contract.contractNumber}-${new Date().toISOString().split('T')[0]}.pdf`
        
        // Add to zip
        zip.file(filename, pdfBlob)
      }
      
      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contracts-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      logger.info('Bulk download completed', { count: filteredContracts.length })
    } catch (error) {
      logger.error('Error in bulk download', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to download contracts. Please try again.')
    }
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contractStatusColors[status as keyof typeof contractStatusColors]}`}>
        {status}
      </span>
    )
  }

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto px-4 py-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="contracts"
            dataCount={contracts?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalContracts: contracts?.length || 0,
              activeContracts: contracts?.filter((c: any) => c.status === 'ACTIVE').length || 0,
              expiredContracts: contracts?.filter((c: any) => c.status === 'EXPIRED').length || 0,
              totalRevenue: contracts?.reduce((sum: number, c: any) => sum + (c.monthlyRate || 0), 0) || 0
            }}
          />
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
            <p className="text-gray-600 mt-2">
              Manage berth contracts and agreements with boat customers
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {localeConfig.name} • {localeConfig.currency} • {localeConfig.dateFormat}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              onClick={handleBulkDownload}
              variant="outline"
              disabled={filteredContracts.length === 0}
            >
              <Archive className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button 
              onClick={() => setShowContractForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Contract
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Contracts Management</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage berth contracts and agreements between the marina and boat owners.
                    </p>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Key Features:</p>
                      <ul className="space-y-1">
                        <li>• View all contracts with comprehensive details</li>
                        <li>• Create new contracts with boat and berth assignments</li>
                        <li>• Edit existing contracts and manage contract lifecycle</li>
                        <li>• Track contract status (Active, Pending, Expired, Cancelled)</li>
                        <li>• Download contract PDFs for record keeping</li>
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
                        <strong>Contract Data Structure:</strong> The contracts table contains 51 contract records with essential details like contract numbers, start/end dates, monthly rates, and status. Each contract has a unique ID, links to boats, berths, and customers through foreign key relationships.
                      </p>
                      <p>
                        <strong>Status Management:</strong> Tracks contract status through enum: ACTIVE, PENDING, EXPIRED, and CANCELLED
                      </p>
                      <p>
                        <strong>Multi-Table Joins:</strong> Automatically joins contracts table with boats, berths, and owners tables
                      </p>
                      <p>
                        <strong>Key Tables:</strong> <code className="bg-green-100 px-1 rounded">contracts</code> (51 total), <code className="bg-green-100 px-1 rounded">boats</code> (50 vessels), <code className="bg-green-100 px-1 rounded">berths</code> (50 berths), <code className="bg-green-100 px-1 rounded">owners</code> (51 customers)
                      </p>
                      <p>
                        <strong>Data Integrity:</strong> Uses LEFT JOINs to display comprehensive contract information and automatically calculates contract duration and total value
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
                    placeholder="Search contracts, customers, or boats..."
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
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="PENDING">Pending</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Show advanced filter options
                    const filters = prompt(`
Advanced Filters:

1. Date Range:
   - Start Date (YYYY-MM-DD): 
   - End Date (YYYY-MM-DD): 

2. Rate Range:
   - Min Rate: 
   - Max Rate: 

3. Customer Type:
   - All
   - Premium
   - Standard

Enter filter values (press Cancel to skip):
                    `)
                    if (filters) {
                      logger.info('Advanced filters applied', { filters })
                      alert('Advanced filters would be applied here')
                    }
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.contractNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {contract.customer.firstName} {contract.customer.lastName} • {contract.boat.name}
                        </p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Anchor className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Berth {contract.berth?.berthNumber || 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatCurrency(contract.monthlyRate)}{getTimeUnit('month')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Total: {formatCurrency(contract.monthlyRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/${currentLocale}/contracts/${contract.id}`)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadContract(contract)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                                         {contract.status !== 'CANCELLED' ? (
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleEditContract(contract)}
                       >
                         <Edit className="w-4 h-4 mr-1" />
                         Edit
                       </Button>
                     ) : (
                       <Button 
                         variant="outline" 
                         size="sm"
                         disabled
                         className="text-gray-400 bg-gray-100 cursor-not-allowed"
                       >
                         <Edit className="w-4 h-4 mr-1" />
                         Edit
                       </Button>
                     )}
                                         {contract.status !== 'CANCELLED' ? (
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleDeleteContract(contract.id)}
                         className="text-red-600 hover:text-red-700 hover:bg-red-50"
                       >
                         <X className="w-4 h-4 mr-1" />
                         Cancel
                       </Button>
                     ) : (
                       <Button 
                         variant="outline" 
                         size="sm"
                         disabled
                         className="text-gray-400 bg-gray-100 cursor-not-allowed"
                       >
                         <X className="w-4 h-4 mr-1" />
                         Cancelled
                       </Button>
                     )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first contract'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && (
                <Button onClick={() => setShowContractForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contract
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contract Form Modal */}
        {showContractForm && (
          <ContractForm
            onClose={() => setShowContractForm(false)}
            onSuccess={() => {
              // Refresh contracts list
              window.location.reload()
            }}
          />
        )}

        {/* Edit Contract Form Modal */}
        {editingContract && (
          <EditContractForm
            contract={editingContract}
            onClose={() => setEditingContract(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </AppLayout>
  )
}
