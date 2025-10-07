'use client'

import React from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useLocaleFormatting } from '@/lib/locale-context'
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'

// Client-side only time display component to prevent hydration errors
function TimeDisplay({ timestamp }: { timestamp: Date }) {
  const [timeString, setTimeString] = React.useState('')
  
  React.useEffect(() => {
    // Only format time on client side
    setTimeString(timestamp.toLocaleTimeString())
  }, [timestamp])
  
  return <span suppressHydrationWarning>{timeString}</span>
}

// Mock data for demonstration
const mockStats = {
  totalContracts: 24,
  activeContracts: 18,
  totalInvoices: 156,
  overdueInvoices: 7,
  totalRevenue: 125000,
  pendingOperations: 3,
  pendingWorkOrders: 12,
  totalBookings: 45,
  activeBookings: 8,
      totalCustomers: 32,
  totalBoats: 28
}

const mockRecentActivity = [
  {
    id: '1',
    type: 'contract',
    action: 'Contract renewed',
    description: 'Contract #CTR-2024-001 renewed for John Smith',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'completed'
  },
  {
    id: '2',
    type: 'invoice',
    action: 'Invoice generated',
    description: 'Invoice #INV-2024-156 generated for Sarah Johnson',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    status: 'pending'
  },
  {
    id: '3',
    type: 'payment',
    action: 'Payment received',
    description: 'Payment of £2,500 received for Invoice #INV-2024-155',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    status: 'completed'
  },
  {
    id: '4',
    type: 'workOrder',
    action: 'Work order completed',
    description: 'Work order #WO-2024-089 completed for boat maintenance',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    status: 'completed'
  }
]

const mockQuickActions = [
  { name: 'New Contract', href: '/contracts/new', icon: FileText, color: 'bg-blue-500' },
  { name: 'New Booking', href: '/bookings/new', icon: Calendar, color: 'bg-green-500' },
  { name: 'Generate Invoice', href: '/invoices/new', icon: FileText, color: 'bg-purple-500' },
  { name: 'Create Work Order', href: '/work-orders/new', icon: AlertCircle, color: 'bg-orange-500' }
]

// Mock user for demo purposes
const mockUser = {
  id: 'demo-user',
  email: 'demo@marina.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: [
    { role: 'ADMIN' },
    { role: 'STAFF_FRONT_DESK' }
  ]
}

export default function DashboardPage() {
  const { formatCurrency } = useLocaleFormatting()
  
  return (
    <AppLayout user={mockUser}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {mockUser.firstName}!</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                {mockStats.activeContracts} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Operations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.pendingOperations}</div>
              <p className="text-xs text-muted-foreground">
                {mockStats.pendingWorkOrders} work orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {mockStats.activeBookings} active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockQuickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.name}
                variant="outline"
                className="h-24 flex-col justify-center space-y-2"
                asChild
              >
                <a href={action.href}>
                  <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.name}</span>
                </a>
              </Button>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your marina</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        <TimeDisplay timestamp={activity.timestamp} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and connectivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Edge Agent</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Sync</span>
                  <span className="text-sm text-gray-600">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Operations</span>
                  <span className="text-sm text-gray-600">{mockStats.pendingOperations}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

