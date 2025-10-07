'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ship, MapPin, CheckCircle } from 'lucide-react'

interface TestBerth {
  id: string
  number: string
  dock: string
  status: 'occupied' | 'available' | 'reserved' | 'maintenance'
  boatName?: string
}

interface TestBoat {
  id: string
  name: string
  length: number
  beam: number
  owner: string
  berthId: string
}

interface MobileDockwalk2TestProps {
  berths: TestBerth[]
  boats: TestBoat[]
}

export function MobileDockwalk2Test({ berths, boats }: MobileDockwalk2TestProps) {
  const [currentView, setCurrentView] = useState<'berths' | 'test'>('berths')
  
  // Enrich berths with boat information
  const enrichedBerths = berths.map(berth => {
    const boat = boats.find(b => b.berthId === berth.id)
    return {
      ...berth,
      boatName: boat?.name,
      boatLength: boat?.length,
      boatBeam: boat?.beam,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="font-bold text-gray-900 text-lg">
                <Ship className="inline mr-2 h-5 w-5" />
                Mobile Dockwalk 2 - Test
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView(currentView === 'berths' ? 'test' : 'berths')}
            >
              Switch View
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {currentView === 'berths' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Berths ({enrichedBerths.length})</h2>
            <div className="flex flex-col space-y-4 max-w-2xl mx-auto">
              {enrichedBerths.map((berth) => (
                <Card key={berth.id} className="transition-all duration-200 hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${
                          berth.status === 'occupied' ? 'bg-green-500' :
                          berth.status === 'available' ? 'bg-blue-500' :
                          berth.status === 'reserved' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <span className="font-bold text-2xl text-gray-900">{berth.number}</span>
                          <div className="text-xs text-gray-500 mt-1">{berth.dock}</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {berth.boatName ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Ship className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900">{berth.boatName}</span>
                        </div>
                        {berth.boatLength && berth.boatBeam && (
                          <div className="text-sm text-gray-600">
                            {berth.boatLength}m × {berth.boatBeam}m
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Berth Available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test View</h2>
            <p className="text-gray-600">Basic component rendering successfully!</p>
          </div>
        )}
      </div>
    </div>
  )
}
