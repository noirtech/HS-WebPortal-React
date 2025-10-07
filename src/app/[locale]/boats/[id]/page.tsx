'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Edit, 
  Ship, 
  User,
  MapPin,
  Ruler,
  AlertCircle,
  FileText,
  X,
  Anchor
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { useLocaleFormatting } from '@/lib/locale-context'

interface Boat {
  id: string
  name: string
  registration?: string
  length: number
  beam?: number
  draft?: number
  isActive: boolean
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

const boatStatusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800'
}

export default function BoatDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const boatId = params.id as string
  const { formatLength, formatBeam, formatDraft } = useLocaleFormatting()
  
  const [boat, setBoat] = useState<Boat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    // Fetch boat details
    const fetchBoat = async () => {
      try {
        logger.debug('BOAT DETAIL: Fetching boat', { boatId })
        const response = await fetch(`/api/boats/${boatId}`)
        
        if (response.ok) {
          const data = await response.json()
          logger.info('BOAT DETAIL: Boat fetched successfully', { data })
          setBoat(data)
        } else {
          const errorData = await response.json()
          logger.error('BOAT DETAIL: Failed to fetch boat', { errorData })
          setError(errorData.error || 'Failed to fetch boat')
        }
      } catch (error) {
        logger.error('BOAT DETAIL: Error fetching boat', { error: error instanceof Error ? error.message : String(error) })
        setError('Failed to fetch boat')
      } finally {
        setIsLoading(false)
      }
    }

    if (boatId) {
      fetchBoat()
    }
  }, [status, router, boatId])

  const handleDeleteBoat = async () => {
    if (!confirm('Are you sure you want to delete this boat? This action cannot be undone.')) {
      return
    }

    try {
      logger.debug('BOAT DETAIL: Deleting boat', { boatId })
      const response = await fetch(`/api/boats/${boatId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        logger.info('BOAT DETAIL: Boat deleted successfully')
        router.push('/boats')
      } else {
        const errorData = await response.json()
        logger.error('BOAT DETAIL: Failed to delete boat', { errorData })
        alert(`Failed to delete boat: ${errorData.error}`)
      }
    } catch (error) {
      logger.error('Error deleting boat', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to delete boat')
    }
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading boat details...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Boat</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/boats')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Boats
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!boat) {
    return (
      <AppLayout user={session.user}>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <Anchor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Boat Not Found</h1>
            <p className="text-gray-600 mb-4">The boat you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/boats')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Boats
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${boatStatusColors[status as keyof typeof boatStatusColors]}`}>
        {status}
      </span>
    )
  }

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/boats')}
              className="mb-4 sm:mb-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Boats
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Boat Details</h1>
              <p className="text-gray-600 mt-2">
                {boat.name} • {boat.owner.firstName} {boat.owner.lastName}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/boats?edit=${boatId}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Boat
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDeleteBoat}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Delete Boat
            </Button>
          </div>
        </div>

        {/* Boat Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Boat Status</h2>
                <p className="text-gray-600">Current status and key information</p>
              </div>
              {getStatusBadge(boat.isActive ? 'ACTIVE' : 'INACTIVE')}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Boat Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Boat Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Boat Name</label>
                  <p className="text-gray-900 font-semibold">{boat.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Registration</label>
                  <p className="text-gray-900">{boat.registration || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Length</label>
                  <p className="text-gray-900 font-semibold">{formatLength(boat.length)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Beam</label>
                  <p className="text-gray-900">{boat.beam ? formatBeam(boat.beam) : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Draft</label>
                  <p className="text-gray-900">{boat.draft ? formatDraft(boat.draft) : 'N/A'}</p>
                </div>
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
                  {boat.owner.firstName} {boat.owner.lastName}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{boat.owner.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/boats')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Boats
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push(`/boats?edit=${boatId}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Boat
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}




