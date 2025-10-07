'use client'

import { useTranslations } from 'next-intl'
import { AppLayout } from '@/components/layout/app-layout'
import { MarinaWalkTestView } from '@/components/marina-walk/marina-walk-test-view'
import { useLocaleFormatting } from '@/lib/locale-context'
import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export default function MarinaWalkTestPage() {
  const t = useTranslations()
  const { localeConfig } = useLocaleFormatting()
  const mockUser = {
    id: '1',
    name: 'Marina Staff',
    email: 'staff@marina.com',
    roles: ['marina_staff', 'inspector'],
    avatar: '/avatars/staff.jpg'
  }
  
  const [marinaData, setMarinaData] = useState({
    berths: [],
    boats: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchMarinaData = async () => {
      try {
        logger.debug('MarinaWalkTestPage Fetching marina data')
        const response = await fetch('/api/marina-walk')
        const data = await response.json()
        const berths = data.berths || []
        const boats = data.boats || []
        setMarinaData({ berths, boats, isLoading: false, error: null })
        logger.info('MarinaWalkTestPage Marina data fetched', { berths: berths.length, boats: boats.length })
      } catch (error: any) {
        logger.error('MarinaWalkTestPage Error fetching marina data', { error: error.message })
        setMarinaData({ berths: [], boats: [], isLoading: false, error: error.message })
      }
    }

    fetchMarinaData()
  }, [])

  if (marinaData.isLoading) {
    return (
      <AppLayout user={mockUser}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (marinaData.error) {
    return (
      <AppLayout user={mockUser}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-xl font-semibold mb-2">Error Loading Marina Data</div>
            <div className="text-gray-600">{marinaData.error}</div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={mockUser}>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚢 Dockwalk - Test Environment</h1>
          <p className="text-gray-600">
            This is the test area for implementing research-based UX improvements. 
            Your original Dockwalk page remains unchanged for reference.
          </p>
        </div>
        
        <MarinaWalkTestView berths={marinaData.berths} boats={marinaData.boats} />
      </div>
    </AppLayout>
  )
}
