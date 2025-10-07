'use client'

import { useState, useEffect } from 'react'
import MobileDockwalk2View from '@/components/marina-walk/mobile-dockwalk-2-view'
import { getMarinaWalkData } from '@/lib/api/marina-walk'
import { AppLayout } from '@/components/layout/app-layout'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Settings } from 'lucide-react'

export default function DockwalkPage() {
  const [marinaData, setMarinaData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getMarinaWalkData()
        setMarinaData(data)
      } catch (err) {
        console.error('Error fetching marina data:', err)
        setError('Failed to load marina data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dockwalk data...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !marinaData) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error || 'Failed to load marina data'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">


        {/* Collapsible Information Box */}
        <CollapsibleInfoBox title="Click to find out what this page does">
          <div className="space-y-4">
            {/* Page Overview Box */}
            <div className="bg-blue-50 border border-blue-200 p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">?</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Dockwalk Interface</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Purpose:</strong> Advanced mobile-first PWA for marina staff to conduct comprehensive dock walk inspections and boat verifications on-site.
                  </p>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>How it works:</strong> Mobile-optimised interface showing real-time marina layout with boat positions, berth status, and quick access to boat/berth details. Perfect for staff doing physical inspections, customer tours, or maintenance checks.
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Mobile Optimisation:</strong> Specifically designed for mobile devices with touch-friendly controls, responsive design, and optimised performance for on-the-go operations. Ready for staff to carry out dock walk operations efficiently using smartphones or tablets in any weather conditions.
                  </p>
                </div>
              </div>
            </div>

            {/* System Architecture Box */}
            <div className="bg-green-50 border border-green-200 p-6">
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
                      <strong>Marina Walk Data Structure:</strong> The dockwalk interface integrates with the <code className="bg-green-100 px-1 rounded">marina_walk</code> table, which contains real-time marina layout data including berth positions, boat assignments, and status information. 
                      Each berth has a unique identifier and links to boat and customer information.
                    </p>
                    <p>
                      <strong>Real-Time Data Integration:</strong> The system uses the <code className="bg-green-100 px-1 rounded">getMarinaWalkData</code> API endpoint to fetch live marina data, including boat positions, berth availability, and customer information. 
                      Data is updated in real-time to reflect current marina status.
                    </p>
                    <p>
                      <strong>Mobile-First Architecture:</strong> Built as a Progressive Web App (PWA) with mobile-optimised components including <code className="bg-green-100 px-1 rounded">MobileDockwalk2View</code> for touch-friendly interactions. 
                      The interface is designed for offline capability and responsive design across all device sizes.
                    </p>
                    <p>
                      <strong>Key Tables for Marina Walk:</strong> <code className="bg-green-100 px-1 rounded">marina_walk</code> (marina layout), <code className="bg-green-100 px-1 rounded">boats</code> (boat information), 
                      <code className="bg-green-100 px-1 rounded">berths</code> (berth details), <code className="bg-green-100 px-1 rounded">customers</code> (customer data). The system uses geolocation and real-time data synchronization for accurate marina representation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleInfoBox>

        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="marina-walk"
            dataCount={marinaData ? 1 : 0}
            isLoading={loading}
            error={error ? new Error(error) : null}
            additionalInfo={{
              totalBerths: marinaData?.berths?.length || 0,
              totalBoats: marinaData?.boats?.length || 0,
              occupiedBerths: marinaData?.berths?.filter((b: any) => b.status === 'OCCUPIED').length || 0,
              availableBerths: marinaData?.berths?.filter((b: any) => b.status === 'AVAILABLE').length || 0
            }}
          />
        </div>

        {/* Main Dockwalk Interface */}
        <MobileDockwalk2View berths={marinaData.berths} boats={marinaData.boats} />
      </div>
    </AppLayout>
  )
}
