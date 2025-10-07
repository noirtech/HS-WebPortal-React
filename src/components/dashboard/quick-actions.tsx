'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { 
  Plus, 
  FileText, 
  Calendar, 
  CreditCard, 
  Users, 
  Anchor,
  Wrench,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en-GB'

  const quickActions = [
    {
      name: 'Create Booking',
      description: 'Add a new berth booking',
      icon: Calendar,
      href: `/${locale}/bookings`,
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    },
    {
      name: 'New Contract',
      description: 'Create a berth contract',
      icon: FileText,
      href: `/${locale}/contracts`,
      color: 'bg-green-100 text-green-600 hover:bg-green-200'
    },
    {
      name: 'Record Payment',
      description: 'Log a customer payment',
      icon: CreditCard,
      href: `/${locale}/payments`,
      color: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
    },
    {
      name: 'Add Customer',
      description: 'Create customer account',
      icon: Users,
      href: `/${locale}/customers`,
      color: 'bg-orange-100 text-orange-600 hover:bg-orange-200'
    },
    {
      name: 'Manage Berths',
      description: 'View and edit berth status',
      icon: Anchor,
      href: `/${locale}/berths`,
      color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
    },
    {
      name: 'Create Work Order',
      description: 'Submit maintenance request',
      icon: Wrench,
      href: `/${locale}/work-orders`,
      color: 'bg-red-100 text-red-600 hover:bg-red-200'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.name} href={action.href}>
                <Button
                  variant="ghost"
                  className={`w-full h-auto p-4 justify-start ${action.color}`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{action.name}</div>
                    <div className="text-sm opacity-80">{action.description}</div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Need more options?</span>
            <Link href={`/${locale}/reports`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
