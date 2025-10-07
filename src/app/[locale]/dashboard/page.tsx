'use client'

import { useTranslations } from 'next-intl'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { JobList } from '@/components/dashboard/job-list'
import { WelcomeMessage } from '@/components/dashboard/welcome-message'
import { DetailedWeatherModal } from '@/components/dashboard/detailed-weather-modal'
import { DashboardStats as DashboardStatsType } from '@/types'
import { useLocaleFormatting } from '@/lib/locale-context'
import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { useDataSource } from '@/lib/data-source-context'
import { useDashboardStats, useMarinaOverview } from '@/hooks/use-data-source-fetch'
import { DataSourceDebug } from '@/components/ui/data-source-debug'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/app-layout'
import { useSession } from 'next-auth/react'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { Settings } from 'lucide-react'


// Default user fallback - John Doe
const defaultUser = {
  id: 'demo-user',
  email: 'demo@marina.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: ['ADMIN']
}

function DashboardPageContent() {
  const t = useTranslations()
  const { formatCurrency, formatDate, formatNumber, localeConfig } = useLocaleFormatting()
  const { currentSource, isDemoMode } = useDataSource()
  const { data: session } = useSession()

  const [currentTime, setCurrentTime] = useState<string>('')
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [weatherRefreshTrigger, setWeatherRefreshTrigger] = useState(0)



  
  // Use session user or fallback to John Doe
  const currentUser = session?.user ? {
    firstName: (session.user as any).firstName || 'John',
    lastName: (session.user as any).lastName || 'Doe',
    email: session.user.email || 'demo@marina.com',
    roles: ['ADMIN']
  } : defaultUser

  // Use new data source hooks
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: marinaOverview, isLoading: overviewLoading, error: overviewError } = useMarinaOverview()

  // Using real marina data from the system - Harbor Point Marina
const mockMarina = {
  name: 'Harbor Point Marina',
  code: 'HPM',
  address: '123 Harbor Drive, Harbor City, HC 12345',
  timezone: 'America/New_York'
}

  // State for real database stats (legacy - will be removed)
  const [rawApiData, setRawApiData] = useState<any>(null)

  // Dashboard stats data from data source system with safe fallbacks
  const stats = dashboardStats || {
    contracts: { total: 0, active: 0, pending: 0, expired: 0 },
    invoices: { total: 0, paid: 0, pending: 0, overdue: 0 },
    bookings: { total: 0, active: 0 },
    payments: { total: 0, completed: 0, pending: 0, failed: 0 },
    owners: { total: 0, withContracts: 0 },
    boats: { total: 0, active: 0, inactive: 0 },
    berths: { total: 0, occupied: 0, available: 0 },
    workOrders: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    financial: { totalRevenue: 0, monthlyRevenue: 0, outstandingAmount: 0 }
  }

  // Safe access to stats properties
  const safeStats = {
    contracts: stats?.contracts || { total: 0, active: 0, pending: 0, expired: 0 },
    invoices: stats?.invoices || { total: 0, paid: 0, pending: 0, overdue: 0 },
    bookings: stats?.bookings || { total: 0, active: 0 },
    payments: stats?.payments || { total: 0, completed: 0, pending: 0, failed: 0 },
    owners: stats?.owners || { total: 0, withContracts: 0 },
    boats: stats?.boats || { total: 0, active: 0, inactive: 0 },
    berths: stats?.berths || { total: 0, occupied: 0, available: 0 },
    workOrders: stats?.workOrders || { total: 0, completed: 0, inProgress: 0, pending: 0 },
    financial: stats?.financial || { totalRevenue: 0, monthlyRevenue: 0, outstandingAmount: 0 }
  }

  // Debug logging for locale changes
  useEffect(() => {
    logger.debug('Locale config updated', {
      currentLocale: localeConfig.name,
      currency: localeConfig.currency,
      dateFormat: localeConfig.dateFormat,
      sampleDate: formatDate('2025-08-21'),
      sampleCurrency: formatCurrency(1234.56)
    })
  }, [localeConfig, formatDate, formatCurrency])

  // Database fetching is now handled by the data source hooks

  // Update time on client side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // DEBUG LOGGING
  logger.debug('DashboardPage Component rendered', {
    mockUser: currentUser,
    stats: safeStats,
    userRoles: currentUser.roles,
    statsKeys: Object.keys(safeStats),
    currentLocale: localeConfig.name,
    currency: localeConfig.currency,
    dateFormat: localeConfig.dateFormat,
    timeFormat: localeConfig.timeFormat,
    dataSource: currentSource,
    isDemoMode
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Data Source Debug Component */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
        <DataSourceDebug 
          dataType="dashboard"
          dataCount={1}
          isLoading={statsLoading || overviewLoading}
          error={statsError || overviewError}
          additionalInfo={{
            contracts: safeStats.contracts.total,
            invoices: safeStats.invoices.total,
            bookings: safeStats.bookings.total,
            boats: safeStats.boats.total,
            berths: safeStats.berths.total,
            workOrders: safeStats.workOrders.total,
            revenue: safeStats.financial.totalRevenue
          }}
        />
      </div>

      {/* Page Title and Change Log Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            Central command center for marina operations.
          </p>
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
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Marina Dashboard</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Purpose:</strong> Central command center for marina operations, providing real-time overview of contracts, invoices, bookings, work orders, and financial performance.
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>How it works:</strong> View key performance indicators, monitor pending operations, track revenue and occupancy rates, and access quick actions for daily marina management. The dashboard automatically switches between demo data (25 items) and live database information.
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
                      <strong>Dashboard Data Structure:</strong> The dashboard aggregates data from multiple tables including <code className="bg-green-100 px-1 rounded">contracts</code>, <code className="bg-green-100 px-1 rounded">invoices</code>, <code className="bg-green-100 px-1 rounded">bookings</code>, <code className="bg-green-100 px-1 rounded">work_orders</code>, <code className="bg-green-100 px-1 rounded">payments</code>, <code className="bg-green-100 px-1 rounded">boats</code>, <code className="bg-green-100 px-1 rounded">berths</code>, and <code className="bg-green-100 px-1 rounded">owners</code>.
                    </p>
                    <p>
                      <strong>Data Source Switching:</strong> The system supports seamless switching between demo mode (25 items per category) and live database mode using React Context and custom hooks. Demo mode provides realistic sample data for presentations and offline use.
                    </p>
                    <p>
                      <strong>Real-Time Statistics:</strong> Dashboard displays current counts, active items, pending operations, and financial summaries. All data is fetched through optimized SQL queries with proper JOINs and aggregation functions.
                    </p>
                    <p>
                      <strong>Key Tables for Dashboard:</strong> <code className="bg-green-100 px-1 rounded">contracts</code> (51 total), <code className="bg-green-100 px-1 rounded">invoices</code> (50 total), <code className="bg-green-100 px-1 rounded">bookings</code> (50 total), <code className="bg-green-100 px-1 rounded">work_orders</code> (50 total), <code className="bg-green-100 px-1 rounded">payments</code> (50 total), <code className="bg-green-100 px-1 rounded">boats</code> (50 total), <code className="bg-green-100 px-1 rounded">berths</code> (50 total), <code className="bg-green-100 px-1 rounded">owners</code> (51 customers).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleInfoBox>



        {/* Simplified Header Section */}
        <div className="mb-8">
          {/* Main Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl shadow-xl mb-6 overflow-hidden">
            <div className="relative">
              {/* Background Pattern - Simplified */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
                  backgroundSize: '60px 60px'
                }}></div>
              </div>

              {/* Content */}
                            <div className="relative px-6 py-8">

                {/* Welcome Message with integrated mini weather widget */}
                <div className="w-full">
                              <WelcomeMessage 
              user={currentUser}
              marina={mockMarina}
              onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
              onWeatherDataUpdate={setWeatherData}
              weatherRefreshTrigger={weatherRefreshTrigger}
            />
                </div>
              </div>

              {/* Decorative Bottom Border */}
              <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400"></div>
            </div>
                    </div>
        </div>

        {(statsError || overviewError) ? (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard Data</h3>
                <p className="text-sm text-red-700 mt-1">{statsError?.message || overviewError?.message || 'Unknown error'}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* NEW: Job List Widget - Moved above DashboardStats */}
            <div className="mb-8">
              <JobList 
                userId={currentUser.email} // In real app, get from session
                marinaId="marina-1" // In real app, get from session/context
              />
            </div>

            <DashboardStats 
              stats={{
                totalContracts: (statsLoading || overviewLoading) ? 0 : safeStats.contracts.total,
                activeContracts: (statsLoading || overviewLoading) ? 0 : safeStats.contracts.active,
                totalInvoices: (statsLoading || overviewLoading) ? 0 : safeStats.invoices.total,
                overdueInvoices: (statsLoading || overviewLoading) ? 0 : safeStats.invoices.overdue,
                totalRevenue: (statsLoading || overviewLoading) ? 0 : safeStats.financial.totalRevenue,
                pendingOperations: (statsLoading || overviewLoading) ? 0 : (safeStats.workOrders.pending + safeStats.invoices.pending + safeStats.payments.pending),
                pendingWorkOrders: (statsLoading || overviewLoading) ? 0 : safeStats.workOrders.pending,
                pendingPayments: (statsLoading || overviewLoading) ? 0 : safeStats.payments.pending,
                totalBookings: (statsLoading || overviewLoading) ? 0 : safeStats.bookings.total,
                activeBookings: (statsLoading || overviewLoading) ? 0 : safeStats.bookings.active
              }}
              isLoading={statsLoading || overviewLoading}
            />
          </>
        )}
        
        {/* Debug: Stats being passed to DashboardStats */}
        {!(statsLoading || overviewLoading) && !(statsError || overviewError) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-xs">
            <h4 className="font-semibold mb-2">🔍 DEBUG: Stats being passed to DashboardStats</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div><strong>Contracts:</strong> {safeStats.contracts.total} total, {safeStats.contracts.active} active</div>
              <div><strong>Invoices:</strong> {safeStats.invoices.total} total, {safeStats.invoices.overdue} overdue</div>
              <div><strong>Revenue:</strong> {safeStats.financial.totalRevenue}</div>
              <div><strong>Bookings:</strong> {safeStats.bookings.total} total, {safeStats.bookings.active} active</div>
              <div><strong>Work Orders:</strong> {safeStats.workOrders.pending} pending</div>
              <div><strong>Pending Ops:</strong> {safeStats.workOrders.pending + safeStats.invoices.pending + safeStats.payments.pending}</div>
            </div>
          </div>
        )}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity />
          <QuickActions />
        </div>

        {/* Weather Modal */}
        <DetailedWeatherModal
          isOpen={isWeatherModalOpen}
          onClose={() => setIsWeatherModalOpen(false)}
          weatherData={weatherData}
          onRefresh={() => {
            // Trigger weather widget refresh
            setWeatherRefreshTrigger(prev => prev + 1)

          }}
        />


      </div>
    )
  }

export default function DashboardPage() {
  return (
    <AppLayout user={defaultUser}>
      <DashboardPageContent />
      {/* Data Source Debug Component - REMOVED TO FIX DUPLICATE BUTTONS */}
    </AppLayout>
  )
}



