'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Calendar, User, Anchor } from 'lucide-react'

const recentActivities = [
  {
    id: 1,
    type: 'booking',
    message: 'New booking created for berth A12',
    user: 'John Smith',
    time: '2 hours ago',
    icon: Calendar,
    color: 'text-blue-600'
  },
  {
    id: 2,
    type: 'payment',
    message: 'Payment received for invoice #INV-001',
    user: 'Sarah Johnson',
    time: '4 hours ago',
    icon: Activity,
    color: 'text-green-600'
  },
  {
    id: 3,
    type: 'maintenance',
    message: 'Work order completed for berth B8',
    user: 'Mike Wilson',
    time: '6 hours ago',
    icon: Anchor,
    color: 'text-orange-600'
  },
  {
    id: 4,
    type: 'user',
    message: 'New customer account created',
    user: 'Admin',
    time: '1 day ago',
    icon: User,
    color: 'text-purple-600'
  }
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      by {activity.user}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activity
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
