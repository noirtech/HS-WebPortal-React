'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EditContractForm from '@/components/forms/edit-contract-form'
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Anchor,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  X,
  Download
} from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'
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

export default function ContractDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string
  const { formatDate, formatCurrency, localeConfig } = useLocaleFormatting()
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    // Fetch contract details
    const fetchContract = async () => {
      try {
        logger.debug('CONTRACT DETAIL: Fetching contract', { contractId })
        const response = await fetch(`/api/contracts/${contractId}`)
        
        if (response.ok) {
          const data = await response.json()
          logger.info('CONTRACT DETAIL: Contract fetched successfully', { data })
          setContract(data)
        } else {
          const errorData = await response.json()
          logger.error('CONTRACT DETAIL: Failed to fetch contract', { errorData })
          setError(errorData.error || 'Failed to fetch contract')
        }
      } catch (error) {
        logger.error('CONTRACT DETAIL: Error fetching contract', { error: error instanceof Error ? error.message : String(error) })
        setError('Failed to fetch contract')
      } finally {
        setIsLoading(false)
      }
    }

    if (contractId) {
      fetchContract()
    }
  }, [status, router, contractId])

  const handleEditContract = () => {
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    // Refresh contract data
    window.location.reload()
  }

  const handleDeleteContract = async () => {
    if (!confirm('Are you sure you want to cancel this contract? This action cannot be undone.')) {
      return
    }

    try {
      logger.debug('CONTRACT DETAIL: Deleting contract', { contractId })
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        logger.info('CONTRACT DETAIL: Contract deleted successfully')
        router.push('/contracts')
      } else {
        const errorData = await response.json()
        logger.error('CONTRACT DETAIL: Failed to delete contract', { errorData })
        alert(`Failed to delete contract: ${errorData.error}`)
      }
    } catch (error) {
      logger.error('Error deleting contract', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to delete contract')
    }
  }

  const handleDownloadContract = async () => {
    if (!contract) return
    
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { downloadContractPDF } = await import('@/lib/pdf-generator')
      
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
      
      // Generate and download PDF
      downloadContractPDF(contractData)
      
      logger.info('Contract PDF generated and downloaded successfully')
    } catch (error) {
      logger.error('Error generating contract PDF', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate contract PDF. Please try again.')
    }
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract details...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  if (error) {
    return (
      <AppLayout user={session.user}>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Contract</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/contracts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contracts
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!contract) {
    return (
      <AppLayout user={session.user}>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Found</h1>
            <p className="text-gray-600 mb-4">The contract you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/contracts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contracts
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }



  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${contractStatusColors[status as keyof typeof contractStatusColors]}`}>
        {status}
      </span>
    )
  }

  const calculateTotalValue = () => {
    const start = new Date(contract.startDate)
    const end = new Date(contract.endDate)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    return months * contract.monthlyRate
  }

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/contracts')}
              className="mb-4 sm:mb-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contracts
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
              <p className="text-gray-600 mt-2">
                {contract.contractNumber} • {contract.customer.firstName} {contract.customer.lastName}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={handleDownloadContract}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {contract.status !== 'CANCELLED' && (
              <>
                <Button variant="outline" onClick={handleEditContract}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Contract
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDeleteContract}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Contract
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Contract Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Contract Status</h2>
                <p className="text-gray-600">Current status and key information</p>
              </div>
              {getStatusBadge(contract.status)}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract Number</label>
                  <p className="text-gray-900 font-semibold">{contract.contractNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Monthly Rate</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(contract.monthlyRate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900">{formatDate(contract.endDate)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Total Contract Value</label>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculateTotalValue())}</p>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900 font-semibold">
                  {contract.customer.firstName} {contract.customer.lastName}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{contract.customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">-</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boat Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Anchor className="w-5 h-5" />
                Boat Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Boat Name</label>
                  <p className="text-gray-900 font-semibold">{contract.boat.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Registration</label>
                  <p className="text-gray-900">{contract.boat.registration || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Berth Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Berth Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.berth ? (
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned Berth</label>
                  <p className="text-gray-900 font-semibold">Berth {contract.berth.berthNumber}</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No berth assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

                 {/* Action Buttons */}
         <div className="mt-8 flex justify-center gap-4">
           <Button variant="outline" onClick={() => router.push('/contracts')}>
             <ArrowLeft className="w-4 h-4 mr-2" />
             Back to Contracts
           </Button>
           
           {contract.status !== 'CANCELLED' && (
             <Button onClick={handleEditContract}>
               <Edit className="w-4 h-4 mr-2" />
               Edit Contract
             </Button>
           )}
         </div>

         {/* Edit Contract Form Modal */}
         {showEditForm && contract && (
           <EditContractForm
             contract={contract}
             onClose={() => setShowEditForm(false)}
             onSuccess={handleEditSuccess}
           />
         )}
       </div>
     </AppLayout>
   )
 }
