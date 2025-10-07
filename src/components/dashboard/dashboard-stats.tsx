'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStats as DashboardStatsType } from '@/types'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { 
  FileText, 
  Receipt, 
  Calendar, 
  CreditCard, 
  Users, 
  Wrench, 
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

interface DashboardStatsProps {
  stats: DashboardStatsType
  isLoading?: boolean
}

interface StatCard {
  title: string
  value: string
  description: string
  icon: any
  color: string
  bgColor: string
  showBreakdown?: boolean
  breakdown?: {
    workOrders: number
    invoices: number
    payments: number
  }
}

export function DashboardStats({ stats, isLoading = false }: DashboardStatsProps) {
  const { formatCurrency, formatNumber, formatDateRelative, localeConfig } = useLocaleFormatting()

  // Debug logging
  logger.debug('DashboardStats Component rendered', {
    stats,
    isLoading,
    localeConfig: {
      name: localeConfig.name,
      currency: localeConfig.currency
    }
  })

  const statCards: StatCard[] = [
    {
      title: 'Total Contracts',
      value: stats.totalContracts > 0 ? formatNumber(stats.totalContracts) : 'No data',
      description: stats.activeContracts > 0 ? `${stats.activeContracts} active` : 'No active contracts',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices > 0 ? formatNumber(stats.totalInvoices) : 'No data',
      description: stats.overdueInvoices > 0 ? `${stats.overdueInvoices} overdue` : 'No overdue invoices',
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: stats.totalRevenue > 0 ? formatCurrency(stats.totalRevenue) : 'No revenue',
      description: `Current period`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings > 0 ? formatNumber(stats.totalBookings) : 'No data',
      description: stats.activeBookings > 0 ? `${stats.activeBookings} active` : 'No active bookings',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pending Operations',
      value: stats.pendingOperations > 0 ? formatNumber(stats.pendingOperations) : 'No pending',
      description: 'Require attention',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      showBreakdown: true,
      breakdown: {
        workOrders: stats.pendingWorkOrders || 0,
        invoices: (stats.totalInvoices - (stats.overdueInvoices || 0)) || 0,
        payments: stats.pendingPayments || 0
      }
    },
    {
      title: 'Work Orders',
      value: stats.pendingWorkOrders > 0 ? formatNumber(stats.pendingWorkOrders) : 'No pending',
      description: 'In progress',
      icon: Wrench,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                ) : (
                  stat.description
                )}
              </div>
              
              {/* Show breakdown for Pending Operations */}
              {stat.showBreakdown && stat.breakdown && !isLoading && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">
                        {stat.breakdown.workOrders}
                      </div>
                      <div className="text-gray-500">Work Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">
                        {stat.breakdown.invoices}
                      </div>
                      <div className="text-gray-500">Invoices</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">
                        {stat.breakdown.payments}
                      </div>
                      <div className="text-gray-500">Payments</div>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-1">
                {localeConfig.name} • {localeConfig.currency}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================================
// MARINA STATUS INDICATOR
// ============================================================================

interface MarinaStatusIndicatorProps {
  isOnline: boolean
  lastSyncAt?: Date
  className?: string
}

export const MarinaStatusIndicator: React.FC<MarinaStatusIndicatorProps> = ({
  isOnline,
  lastSyncAt,
  className,
}) => {
  const { formatDateRelative } = useLocaleFormatting()
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Marina Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {lastSyncAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Last sync: {formatDateRelative(lastSyncAt)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

interface QuickAction {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color?: string
}

interface QuickActionsProps {
  actions: QuickAction[]
  className?: string
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  className,
}) => {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {actions.map((action, index) => (
        <Card
          key={index}
          className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
            action.color ? `border-${action.color}-200 bg-${action.color}-50` : ''
          }`}
          onClick={() => window.location.href = action.href}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <div className="text-muted-foreground">
                {action.icon}
              </div>
              <CardTitle className="text-sm font-medium">
                {action.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {action.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: Date
  user: string
  status: 'success' | 'warning' | 'error' | 'info'
}

interface RecentActivityProps {
  activities: ActivityItem[]
  className?: string
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  className,
}) => {
  const { formatDateRelative } = useLocaleFormatting()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-blue-600 bg-blue-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-full ${getStatusColor(activity.status)}`}
              >
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {activity.user} • {formatDateRelative(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DashboardStats