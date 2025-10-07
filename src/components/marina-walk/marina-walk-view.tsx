'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocaleFormatting } from '@/lib/locale-context'
import { useRouter } from 'next/navigation'
import { 
  Ship, 
  MapPin, 
  Compass, 
  Users, 
  Search,
  Filter,
  Smartphone,
  Monitor,
  Maximize2,
  Minimize2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Fullscreen
} from 'lucide-react'

interface Berth {
  id: string
  number: string
  status: 'occupied' | 'available' | 'reserved' | 'maintenance'
  boatId?: string
  boatName?: string
  boatLength?: number
  boatBeam?: number
  coordinates: { x: number; y: number }
}

interface Boat {
  id: string
  name: string
  length: number
  beam: number
  draft: number
  owner: string
  contact: string
  lastInspection: string
  nextInspection: string
  maintenanceStatus: 'good' | 'needs_attention' | 'maintenance_due'
  berthId: string
}

interface MarinaWalkViewProps {
  berths: Berth[]
  boats: Boat[]
}

export function MarinaWalkView({ berths, boats }: MarinaWalkViewProps) {
  const { localeConfig } = useLocaleFormatting()
  const router = useRouter()
  
  // View mode state
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isMobileMode, setIsMobileMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Combine berths and boats data
  const enrichedBerths = berths.map(berth => {
    const boat = boats.find(b => b.berthId === berth.id)
    return {
      ...berth,
      boatName: boat?.name,
      boatLength: boat?.length,
      boatBeam: boat?.beam
    }
  })

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'occupied':
        return { color: 'bg-blue-500', icon: Ship, text: 'Occupied' }
      case 'available':
        return { color: 'bg-green-500', icon: MapPin, text: 'Available' }
      case 'reserved':
        return { color: 'bg-yellow-500', icon: MapPin, text: 'Reserved' }
      case 'maintenance':
        return { color: 'bg-red-500', icon: MapPin, text: 'Maintenance' }
      default:
        return { color: 'bg-gray-500', icon: MapPin, text: 'Unknown' }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dockwalk</h1>
              <p className="text-gray-600">Portsmouth Marina - 16 berths</p>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-xs font-medium text-yellow-800 mb-2">🧪 Testing Area</div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => router.push('/en-GB/mobile-dockwalk-2-old')}
                  variant="default"
                  size="sm"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Ship className="h-4 w-4" />
                  <span>Mobile Dockwalk 2</span>
                </Button>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrichedBerths.map((berth) => {
            const statusInfo = getStatusInfo(berth.status)
            
            return (
              <Card key={berth.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                      <span className="font-bold text-lg">{berth.number}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {berth.boatName && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Ship className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-800">{berth.boatName}</span>
                      </div>
                      
                      {berth.boatLength && berth.boatBeam && (
                        <div className="text-sm text-gray-600">
                          {berth.boatLength}m × {berth.boatBeam}m
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color}`}>
                    <span>{statusInfo.text}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
