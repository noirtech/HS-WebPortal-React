'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import {
  Cloud,
  Sun,
  Wind,
  Eye,
  Anchor,
  Navigation,
  RefreshCw,
  MapPin,
  Thermometer,
  Droplets,
  Gauge,
  Waves,
  Compass,
  Clock,
  Zap,
  ExternalLink
} from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  visibility: number
  description: string
  iconCode: string
  marineData?: {
    waveHeight: number
    waterTemp: number
    tideInfo: string
  }
}

interface CompactWeatherWidgetProps {
  onOpenDetailed: () => void
  onWeatherDataUpdate?: (data: WeatherData) => void
}

export function CompactWeatherWidget({ onOpenDetailed, onWeatherDataUpdate }: CompactWeatherWidgetProps) {
  const t = useTranslations()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Get weather icon based on OpenWeatherMap icon codes
  const getWeatherIcon = (iconCode: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '01d': <Sun className="h-6 w-6 text-yellow-500" />,
      '01n': <Sun className="h-6 w-6 text-yellow-400" />,
      '02d': <Cloud className="h-6 w-6 text-blue-400" />,
      '02n': <Cloud className="h-6 w-6 text-blue-300" />,
      '03d': <Cloud className="h-6 w-6 text-gray-400" />,
      '03n': <Cloud className="h-6 w-6 text-gray-300" />,
      '04d': <Cloud className="h-6 w-6 text-gray-500" />,
      '04n': <Cloud className="h-6 w-6 text-gray-400" />,
      '09d': <Droplets className="h-6 w-6 text-blue-500" />,
      '09n': <Droplets className="h-6 w-6 text-blue-400" />,
      '10d': <Droplets className="h-6 w-6 text-blue-600" />,
      '10n': <Droplets className="h-6 w-6 text-blue-500" />,
      '11d': <Zap className="h-6 w-6 text-yellow-600" />,
      '11n': <Zap className="h-6 w-6 text-yellow-500" />,
      '13d': <Cloud className="h-6 w-6 text-white" />,
      '13n': <Cloud className="h-6 w-6 text-gray-200" />,
      '50d': <Cloud className="h-6 w-6 text-gray-400" />,
      '50n': <Cloud className="h-6 w-6 text-gray-300" />
    }
    return iconMap[iconCode] || <Cloud className="h-6 w-6 text-gray-400" />
  }

  // Get user location and fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get user location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          })
        })

        const { latitude, longitude } = position.coords
        logger.info('Location obtained', { latitude, longitude })

        // Fetch weather data from OpenWeatherMap
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
        if (!apiKey) {
          throw new Error('OpenWeatherMap API key not configured')
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
        )

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`)
        }

        const data = await response.json()
        logger.info('Weather data fetched', { data })

        // Transform API data to our format
        const transformedData: WeatherData = {
          location: data.name || 'Unknown Location',
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          windDirection: data.wind.deg,
          pressure: data.main.pressure,
          visibility: Math.round(data.visibility / 1000), // Convert m to km
          description: data.weather[0]?.description || 'Unknown',
          iconCode: data.weather[0]?.icon || '01d',
          marineData: {
            waveHeight: Math.random() * 2 + 0.5, // Mock data for now
            waterTemp: Math.round(data.main.temp - 2), // Usually cooler than air
            tideInfo: 'High: 14:30, Low: 20:45' // Mock tide data
          }
        }

        setWeatherData(transformedData)
        setLastUpdated(new Date())
        logger.info('Weather data transformed and set', { transformedData })
        
        // Update parent component with weather data
        if (onWeatherDataUpdate) {
          onWeatherDataUpdate(transformedData)
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        logger.error('Failed to fetch weather data', { error: errorMessage })
        
        // Set mock data for development/testing
        setWeatherData({
          location: 'Harbor City',
          temperature: 22,
          feelsLike: 24,
          humidity: 65,
          windSpeed: 12,
          windDirection: 180,
          pressure: 1013,
          visibility: 10,
          description: 'Partly cloudy',
          iconCode: '02d',
          marineData: {
            waveHeight: 1.2,
            waterTemp: 20,
            tideInfo: 'High: 14:30, Low: 20:45'
          }
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [])

  // Refresh weather data
  const handleRefresh = () => {
    setWeatherData(null)
    setError(null)
    setIsLoading(true)
    // Re-trigger the useEffect
    window.location.reload()
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-0 shadow-xl backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div className="text-lg font-semibold text-gray-700 mb-2">Loading Weather Data</div>
            <div className="text-sm text-gray-500">Detecting location and fetching current conditions...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !weatherData) {
    return (
      <Card className="w-full bg-gradient-to-br from-red-50 via-white to-pink-50 border-0 shadow-xl backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Cloud className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-lg font-semibold text-red-700 mb-2">Weather Unavailable</div>
            <div className="text-sm text-red-600 mb-4">Unable to fetch current weather data</div>
            <div className="text-xs text-gray-500">Check your internet connection and location permissions</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weatherData) {
    return null
  }

  return (
    <Card 
      className="w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group backdrop-blur-sm"
      onClick={onOpenDetailed}
    >
      <CardContent className="p-6">
        {/* Header with location and time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-blue-700">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">{weatherData.location}</span>
          </div>
          {lastUpdated && (
            <div className="flex items-center text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span className="text-xs">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* Main weather display */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="text-blue-600 transform group-hover:scale-110 transition-transform duration-300">
              {getWeatherIcon(weatherData.iconCode)}
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {weatherData.temperature}°C
          </div>
          <div className="text-sm text-gray-600 capitalize font-medium">
            {weatherData.description}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Feels like {weatherData.feelsLike}°C
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Wind */}
          <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-100">
            <div className="flex items-center justify-center text-blue-600 mb-2">
              <Wind className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {weatherData.windSpeed}
            </div>
            <div className="text-xs text-gray-600">km/h</div>
          </div>

          {/* Humidity */}
          <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-100">
            <div className="flex items-center justify-center text-blue-600 mb-2">
              <Droplets className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {weatherData.humidity}%
            </div>
            <div className="text-xs text-gray-600">Humidity</div>
          </div>
        </div>

        {/* Marine conditions */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200 mb-4">
          <div className="flex items-center justify-center text-blue-700 mb-3">
            <Waves className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Marine Conditions</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-800">
                {weatherData.marineData?.waveHeight.toFixed(1)}m
              </div>
              <div className="text-xs text-blue-600">Wave Height</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-800">
                {weatherData.marineData?.waterTemp}°C
              </div>
              <div className="text-xs text-blue-600">Water Temp</div>
            </div>
          </div>
        </div>

        {/* Expand indicator */}
        <div className="text-center">
          <div className="inline-flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
            <span className="text-sm font-medium mr-2">View Details</span>
            <ExternalLink className="h-4 w-4 transform group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
