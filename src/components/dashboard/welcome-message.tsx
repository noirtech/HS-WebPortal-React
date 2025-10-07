'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { 
  User, 
  MapPin, 
  Clock, 
  Calendar,
  Sun,
  Moon
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { MiniWeatherWidget } from './mini-weather-widget'

interface WelcomeMessageProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    roles: string[]
  }
  marina?: {
    name: string
    code: string
    address?: string
    timezone: string
  }
  onOpenWeatherModal?: () => void
  onWeatherDataUpdate?: (data: any) => void
  weatherRefreshTrigger?: number
}

export function WelcomeMessage({ user, marina, onOpenWeatherModal, onWeatherDataUpdate, weatherRefreshTrigger }: WelcomeMessageProps) {
  const t = useTranslations()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')
  const [isDaytime, setIsDaytime] = useState(true)

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Determine greeting based on time of day
  useEffect(() => {
    const hour = currentTime.getHours()
    const isDay = hour >= 6 && hour < 18
    
    setIsDaytime(isDay)
    
    if (hour >= 0 && hour < 12) {
      setGreeting('Good morning')
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon')
    } else if (hour >= 17 && hour < 24) {
      setGreeting('Good evening')
    }
  }, [currentTime])

  // Format time based on locale - use consistent formatting to avoid hydration issues
  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    // Use a consistent locale string to avoid hydration mismatches
    return new Intl.DateTimeFormat('en-GB', options).format(date)
  }

  // Format date based on locale - use consistent formatting to avoid hydration issues
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
    // Use a consistent locale string to avoid hydration mismatches
    return new Intl.DateTimeFormat('en-GB', options).format(date)
  }

  // Get day of week - use consistent formatting to avoid hydration issues
  const getDayOfWeek = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date)
  }

  // Get time period description
  const getTimePeriod = (date: Date) => {
    const hour = date.getHours()
    if (hour >= 0 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 24) return 'evening'
    return 'morning' // Default fallback
  }

  // Get appropriate icon based on time and weather
  const getTimeIcon = () => {
    if (isDaytime) {
      return <Sun className="h-6 w-6 text-yellow-500" />
    } else {
      return <Moon className="h-6 w-6 text-blue-400" />
    }
  }

  // Get appropriate background gradient based on time
  const getBackgroundGradient = () => {
    if (isDaytime) {
      return 'bg-gradient-to-r from-yellow-50 via-orange-50 to-amber-50 border-yellow-200'
    } else {
      return 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200'
    }
  }

  if (!user) {
    return null
  }

  return (
    <Card className={`${getBackgroundGradient()} shadow-sm`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Main Greeting */}
            <div className="flex items-center gap-3 mb-3">
              {getTimeIcon()}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {greeting}, {user.firstName}!
                </h1>
                <p className="text-xs text-gray-600">
                  Welcome to the {marina?.name || 'Marina Portal'}
                </p>
              </div>
            </div>

            {/* Information Row - Single Line Layout */}
            <div className="flex flex-wrap gap-4 text-xs">
              {/* User Info */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded">
                  <User className="h-3 w-3 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">{user.firstName} {user.lastName}</span>
                <span className="text-gray-500 bg-blue-50 px-1.5 py-0.5 rounded-full text-xs">
                  {user.roles.join(', ')}
                </span>
              </div>

              {/* Marina Info */}
              {marina && (
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-100 rounded">
                    <MapPin className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-700">{marina.name}</span>
                  {marina.address && (
                    <span className="text-gray-500 bg-green-50 px-1.5 py-0.5 rounded-full text-xs">
                      {marina.address}
                    </span>
                  )}
                </div>
              )}

              {/* Time Info */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-purple-100 rounded">
                  <Clock className="h-3 w-3 text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">{formatTime(currentTime)}</span>
                <span className="text-gray-500 bg-purple-50 px-1.5 py-0.5 rounded-full text-xs capitalize">
                  {getTimePeriod(currentTime)}
                </span>
              </div>

              {/* Date Info */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-orange-100 rounded">
                  <Calendar className="h-3 w-3 text-orange-600" />
                </div>
                <span className="font-medium text-gray-700">{getDayOfWeek(currentTime)}</span>
                <span className="text-gray-500 bg-orange-50 px-1.5 py-0.5 rounded-full text-xs">
                  {formatDate(currentTime)}
                </span>
                {marina?.timezone && (
                  <span className="text-gray-500 bg-blue-50 px-1.5 py-0.5 rounded-full text-xs">
                    {marina.timezone}
                  </span>
                  )}
              </div>
            </div>
          </div>

          {/* Right Side - Weather Widget Only */}
          <div className="flex flex-col items-end">
            {/* Mini Weather Widget */}
            <MiniWeatherWidget 
              onOpenDetailed={onOpenWeatherModal || (() => {})}
              onWeatherDataUpdate={onWeatherDataUpdate}
              refreshTrigger={weatherRefreshTrigger}
            />
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">
            {isDaytime 
              ? "Have a productive day managing your marina operations!"
              : "Great work today! Time to review and plan for tomorrow."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
