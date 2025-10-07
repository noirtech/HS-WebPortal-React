'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  X,
  MapPin,
  Clock,
  RefreshCw,
  Wind,
  Waves,
  Thermometer,
  Anchor,
  Eye,
  Gauge,
  Sun,
  Moon,
  Cloud,
  Droplets,
  AlertTriangle,
  Info,
  Navigation,
  Compass,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Leaf,
  Activity,
  Droplet
} from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  windGust: number
  pressure: number
  pressureTrend: 'rising' | 'falling' | 'stable'
  visibility: number
  description: string
  iconCode: string
  dataSource: 'live' | 'demo'
  uvIndex: number
  pollenCount: number
  marineData: {
    waveHeight: number
    wavePeriod: number
    waveDirection: number
    waterTemp: number
    salinity: number
    currentSpeed: number
    currentDirection: number
    tideInfo: {
      current: number
      high: { time: string; height: number }
      low: { time: string; height: number }
      nextChange: { time: string; type: 'high' | 'low' }
    }
    marineForecast: string
  }
  airQuality: {
    index: number
    category: string
    pollutants: {
      pm25: number
      pm10: number
      no2: number
      o3: number
    }
  }
}

interface DetailedWeatherModalProps {
  isOpen: boolean
  onClose: () => void
  weatherData: WeatherData | null
  onRefresh?: () => void
}

export function DetailedWeatherModal({ 
  isOpen, 
  onClose, 
  weatherData, 
  onRefresh 
}: DetailedWeatherModalProps) {
  const t = useTranslations()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Debug logging


  // Get weather icon based on OpenWeatherMap icon codes
  const getWeatherIcon = (iconCode: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    }
    
    const iconMap: Record<string, React.ReactNode> = {
      '01d': <Sun className={`${sizeClasses[size]} text-yellow-500`} />,
      '01n': <Sun className={`${sizeClasses[size]} text-yellow-400`} />,
      '02d': <Cloud className={`${sizeClasses[size]} text-blue-400`} />,
      '02n': <Cloud className={`${sizeClasses[size]} text-blue-300`} />,
      '03d': <Cloud className={`${sizeClasses[size]} text-gray-400`} />,
      '03n': <Cloud className={`${sizeClasses[size]} text-gray-300`} />,
      '04d': <Cloud className={`${sizeClasses[size]} text-gray-500`} />,
      '04n': <Cloud className={`${sizeClasses[size]} text-gray-400`} />,
      '09d': <Droplets className={`${sizeClasses[size]} text-blue-500`} />,
      '09n': <Droplets className={`${sizeClasses[size]} text-blue-400`} />,
      '10d': <Droplets className={`${sizeClasses[size]} text-blue-600`} />,
      '10n': <Droplets className={`${sizeClasses[size]} text-blue-500`} />,
      '11d': <Cloud className={`${sizeClasses[size]} text-yellow-600`} />,
      '11n': <Cloud className={`${sizeClasses[size]} text-yellow-500`} />,
      '13d': <Cloud className={`${sizeClasses[size]} text-white`} />,
      '13n': <Cloud className={`${sizeClasses[size]} text-gray-200`} />,
      '50d': <Cloud className={`${sizeClasses[size]} text-gray-400`} />,
      '50n': <Cloud className={`${sizeClasses[size]} text-gray-300`} />
    }
    return iconMap[iconCode] || <Cloud className={`${sizeClasses[size]} text-gray-400`} />
  }

  // Get wind direction as compass direction
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  // Get wind speed category for marina operations
  const getWindSpeedCategory = (speed: number) => {
    if (speed < 10) return { category: 'Light', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' }
    if (speed < 20) return { category: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' }
    if (speed < 30) return { category: 'Strong', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' }
    return { category: 'High', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' }
  }

  // Get wave height category
  const getWaveHeightCategory = (height: number) => {
    if (height < 0.5) return { category: 'Calm', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' }
    if (height < 1.0) return { category: 'Slight', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' }
    if (height < 2.0) return { category: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' }
    return { category: 'Rough', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' }
  }

  // Get pressure trend icon
  const getPressureTrendIcon = (trend: 'rising' | 'falling' | 'stable') => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'falling': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  // Get UV index category and color
  const getUVIndexCategory = (index: number) => {
    if (index <= 2) return { category: 'Low', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' }
    if (index <= 5) return { category: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' }
    if (index <= 7) return { category: 'High', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' }
    if (index <= 10) return { category: 'Very High', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' }
    return { category: 'Extreme', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' }
  }

  // Get pollen count category
  const getPollenCountCategory = (count: number) => {
    if (count <= 2.4) return { category: 'Low', color: 'text-green-600', bg: 'bg-green-100' }
    if (count <= 4.8) return { category: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (count <= 7.2) return { category: 'High', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { category: 'Very High', color: 'text-red-600', bg: 'bg-red-100' }
  }

  // Get air quality category
  const getAirQualityCategory = (index: number) => {
    if (index <= 50) return { category: 'Good', color: 'text-green-600', bg: 'bg-green-100' }
    if (index <= 100) return { category: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (index <= 150) return { category: 'Unhealthy for Sensitive Groups', color: 'text-orange-600', bg: 'bg-orange-100' }
    if (index <= 200) return { category: 'Unhealthy', color: 'text-red-600', bg: 'bg-red-100' }
    if (index <= 300) return { category: 'Very Unhealthy', color: 'text-purple-600', bg: 'bg-purple-100' }
    return { category: 'Hazardous', color: 'text-red-800', bg: 'bg-red-200' }
  }

  // Format time for tide information
  const formatTime = (time: string) => {
    return time // Assuming time is already in HH:MM format
  }

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Use mock data if no weather data is available
  const displayData = weatherData || {
    location: 'St Katharine Docks',
    temperature: 22,
    feelsLike: 24,
    humidity: 65,
    windSpeed: 12,
    windDirection: 180,
    windGust: 18,
    pressure: 1013,
    pressureTrend: 'stable' as const,
    visibility: 10,
    description: 'Partly cloudy',
    iconCode: '02d',
    dataSource: 'demo' as const,
    uvIndex: 5,
    pollenCount: 3,
    marineData: {
      waveHeight: 0.8,
      wavePeriod: 8,
      waveDirection: 175,
      waterTemp: 18,
      salinity: 35.2,
      currentSpeed: 0.8,
      currentDirection: 185,
      tideInfo: {
        current: 1.2,
        high: { time: '14:30', height: 2.1 },
        low: { time: '08:45', height: 0.3 },
        nextChange: { time: '20:15', type: 'low' as const }
      },
      marineForecast: 'Light winds and moderate seas. Good conditions for small craft operations.'
    },
    airQuality: {
      index: 42,
      category: 'Good',
      pollutants: {
        pm25: 12,
        pm10: 25,
        no2: 18,
        o3: 35
      }
    }
  }

  const windCategory = getWindSpeedCategory(displayData.windSpeed)
  const waveCategory = getWaveHeightCategory(displayData.marineData.waveHeight)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={false}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              {getWeatherIcon(displayData.iconCode, 'md')}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Marine Weather Conditions</h2>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="font-medium">{displayData.location}</span>
                <span>•</span>
                <span className="capitalize">{displayData.description}</span>
                {displayData.dataSource === 'live' ? (
                  <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700 border-green-200">
                    Live Data
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Demo Data
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Conditions Overview */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {/* Temperature */}
          <Card className="p-2 bg-gradient-to-br from-blue-50 to-white">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {getWeatherIcon(displayData.iconCode, 'sm')}
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {displayData.temperature}°C
                  </div>
                  <div className="text-xs text-gray-600">
                    Feels {displayData.feelsLike}°C
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Wind */}
          <Card className="p-2 bg-gradient-to-br from-green-50 to-white">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wind className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {displayData.windSpeed}
                  </div>
                  <div className="text-xs text-gray-600">km/h</div>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {getWindDirection(displayData.windDirection)}
              </div>
            </div>
          </Card>

          {/* UV Index */}
          <Card className="p-2 bg-gradient-to-br from-yellow-50 to-white">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {displayData.uvIndex}
                  </div>
                  <div className="text-xs text-gray-600">UV Index</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Air Quality */}
          <Card className="p-2 bg-gradient-to-br from-purple-50 to-white">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {displayData.airQuality.index}
                  </div>
                  <div className="text-xs text-gray-600">AQI</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Data Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Marine Conditions */}
          <Card className="p-2">
            <div className="flex items-center gap-1 mb-2">
              <div className="p-1 bg-blue-100 rounded">
                <Waves className="h-3 w-3 text-blue-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900">Marine</h3>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center p-1 bg-blue-50 rounded text-xs">
                <span className="text-gray-600">Wave Height</span>
                <span className="font-semibold text-blue-800">
                  {displayData.marineData.waveHeight.toFixed(1)}m
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-blue-50 rounded text-xs">
                <span className="text-gray-600">Current Speed</span>
                <span className="font-semibold text-blue-800">
                  {displayData.marineData.currentSpeed} m/s
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-blue-50 rounded text-xs">
                <span className="text-gray-600">Salinity</span>
                <span className="font-semibold text-blue-800">
                  {displayData.marineData.salinity}‰
                </span>
              </div>
            </div>
          </Card>

          {/* Environmental */}
          <Card className="p-2">
            <div className="flex items-center gap-1 mb-2">
              <div className="p-1 bg-green-100 rounded">
                <Leaf className="h-3 w-3 text-green-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900">Environmental</h3>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center p-1 bg-green-50 rounded text-xs">
                <span className="text-gray-600">Pollen Count</span>
                <span className="font-semibold text-green-800">
                  {displayData.pollenCount}
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-green-50 rounded text-xs">
                <span className="text-gray-600">UV Index</span>
                <span className="font-semibold text-green-800">
                  {displayData.uvIndex}
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-green-50 rounded text-xs">
                <span className="text-gray-600">Air Quality</span>
                <span className="font-semibold text-green-800">
                  {displayData.airQuality.category}
                </span>
              </div>
            </div>
          </Card>

          {/* Atmospheric Conditions */}
          <Card className="p-2">
            <div className="flex items-center gap-1 mb-2">
              <div className="p-1 bg-purple-100 rounded">
                <Gauge className="h-3 w-3 text-purple-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900">Atmosphere</h3>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center p-1 bg-purple-50 rounded text-xs">
                <span className="text-gray-600">Humidity</span>
                <span className="font-semibold text-purple-800">
                  {displayData.humidity}%
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-purple-50 rounded text-xs">
                <span className="text-gray-600">Pressure</span>
                <span className="font-semibold text-purple-800">
                  {displayData.pressure} hPa
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-purple-50 rounded text-xs">
                <span className="text-gray-600">Visibility</span>
                <span className="font-semibold text-purple-800">
                  {displayData.visibility} km
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tide Information */}
        <Card className="p-2 mb-3">
          <div className="flex items-center gap-1 mb-2">
            <div className="p-1 bg-green-100 rounded">
              <Anchor className="h-3 w-3 text-green-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-900">Tides</h3>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <div className="text-center p-1 bg-green-50 rounded text-xs">
              <div className="font-bold text-green-800">
                {displayData.marineData.tideInfo.current.toFixed(1)}m
              </div>
              <div className="text-gray-600">Current</div>
            </div>
            <div className="text-center p-1 bg-blue-50 rounded text-xs">
              <div className="font-bold text-blue-800">
                {displayData.marineData.tideInfo.high.height.toFixed(1)}m
              </div>
              <div className="text-gray-600">High {formatTime(displayData.marineData.tideInfo.high.time)}</div>
            </div>
            <div className="text-center p-1 bg-red-50 rounded text-xs">
              <div className="font-bold text-red-800">
                {displayData.marineData.tideInfo.low.height.toFixed(1)}m
              </div>
              <div className="text-gray-600">Low {formatTime(displayData.marineData.tideInfo.low.time)}</div>
            </div>
            <div className="text-center p-1 bg-yellow-50 rounded text-xs">
              <div className="font-bold text-yellow-800">
                {displayData.marineData.tideInfo.nextChange.type === 'high' ? 'H' : 'L'}
              </div>
              <div className="text-gray-600">Next {formatTime(displayData.marineData.tideInfo.nextChange.time)}</div>
            </div>
          </div>
        </Card>

        {/* Marine Forecast & Safety */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Marine Forecast */}
          <Card className="p-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="p-1 bg-indigo-100 rounded">
                <BarChart3 className="h-3 w-3 text-indigo-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900">Forecast</h3>
            </div>
            <div className="p-1 bg-indigo-50 rounded text-xs">
              <p className="text-indigo-800 leading-relaxed">
                {displayData.marineData.marineForecast}
              </p>
            </div>
          </Card>

          {/* Safety and Recommendations */}
          <Card className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center gap-1 mb-1">
              <div className="p-1 bg-amber-100 rounded">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
              </div>
              <h3 className="text-xs font-semibold text-amber-800">Safety</h3>
            </div>
            <div className="space-y-0.5 text-xs text-amber-800">
              <div className="flex items-start gap-1">
                <div className="w-1 h-1 bg-amber-500 rounded-full mt-1 flex-shrink-0"></div>
                <span>{windCategory.category} winds</span>
              </div>
              <div className="flex items-start gap-1">
                <div className="w-1 h-1 bg-amber-500 rounded-full mt-1 flex-shrink-0"></div>
                <span>{waveCategory.category} seas</span>
              </div>
              <div className="flex items-start gap-1">
                <div className="w-1 h-1 bg-amber-500 rounded-full mt-1 flex-shrink-0"></div>
                <span>{displayData.visibility < 5 ? 'Low visibility' : 'Good visibility'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Updated: {new Date().toLocaleString('en-GB')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Data provided by Open-Meteo</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

