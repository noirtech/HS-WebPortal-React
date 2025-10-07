'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import {
  Cloud,
  Sun,
  Wind,
  Droplets,
  Waves,
  MapPin,
  Clock,
  ExternalLink,
  Thermometer,
  Eye,
  Gauge,
  Anchor
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

interface MiniWeatherWidgetProps {
  onOpenDetailed: () => void
  onWeatherDataUpdate?: (data: WeatherData) => void
  refreshTrigger?: number // Add this to trigger manual refresh
}

export function MiniWeatherWidget({ onOpenDetailed, onWeatherDataUpdate, refreshTrigger }: MiniWeatherWidgetProps) {
  const t = useTranslations()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Debug logging


  // Get weather icon based on OpenWeatherMap icon codes
  const getWeatherIcon = (iconCode: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '01d': <Sun className="h-4 w-4 text-yellow-500" />,
      '01n': <Sun className="h-4 w-4 text-yellow-400" />,
      '02d': <Cloud className="h-4 w-4 text-blue-400" />,
      '02n': <Cloud className="h-4 w-4 text-blue-300" />,
      '03d': <Cloud className="h-4 w-4 text-gray-400" />,
      '03n': <Cloud className="h-4 w-4 text-gray-300" />,
      '04d': <Cloud className="h-4 w-4 text-gray-500" />,
      '04n': <Cloud className="h-4 w-4 text-gray-400" />,
      '09d': <Droplets className="h-4 w-4 text-blue-500" />,
      '09n': <Droplets className="h-4 w-4 text-blue-400" />,
      '10d': <Droplets className="h-4 w-4 text-blue-600" />,
      '10n': <Droplets className="h-4 w-4 text-blue-500" />,
      '11d': <Cloud className="h-4 w-4 text-yellow-600" />,
      '11n': <Cloud className="h-4 w-4 text-yellow-500" />,
      '13d': <Cloud className="h-4 w-4 text-white" />,
      '13n': <Cloud className="h-4 w-4 text-gray-200" />,
      '50d': <Cloud className="h-4 w-4 text-gray-400" />,
      '50n': <Cloud className="h-4 w-4 text-gray-300" />
    }
    return iconMap[iconCode] || <Cloud className="h-4 w-4 text-gray-400" />
  }

  // Get wind direction as compass direction
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  // Convert Open-Meteo weather code to description
  const getWeatherDescription = (code: number) => {
    const descriptions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    }
    return descriptions[code] || 'Unknown'
  }

  // Convert Open-Meteo weather code to icon code
  const getWeatherIconCode = (code: number) => {
    const iconMap: Record<number, string> = {
      0: '01d', // Clear sky
      1: '02d', // Mainly clear
      2: '03d', // Partly cloudy
      3: '04d', // Overcast
      45: '50d', // Foggy
      48: '50d', // Depositing rime fog
      51: '09d', // Light drizzle
      53: '09d', // Moderate drizzle
      55: '09d', // Dense drizzle
      56: '13d', // Light freezing drizzle
      57: '13d', // Dense freezing drizzle
      61: '10d', // Slight rain
      63: '10d', // Moderate rain
      65: '10d', // Heavy rain
      66: '13d', // Light freezing rain
      67: '13d', // Heavy freezing rain
      71: '13d', // Slight snow
      73: '13d', // Moderate snow
      75: '13d', // Heavy snow
      77: '13d', // Snow grains
      80: '09d', // Slight rain showers
      81: '09d', // Moderate rain showers
      82: '09d', // Violent rain showers
      85: '13d', // Slight snow showers
      86: '13d', // Heavy snow showers
      95: '11d', // Thunderstorm
      96: '11d', // Thunderstorm with slight hail
      99: '11d'  // Thunderstorm with heavy hail
    }
    return iconMap[code] || '01d'
  }

  // Get wind speed category for marina operations
  const getWindSpeedCategory = (speed: number) => {
    if (speed < 10) return { category: 'Light', color: 'text-green-600', bg: 'bg-green-100' }
    if (speed < 20) return { category: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (speed < 30) return { category: 'Strong', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { category: 'High', color: 'text-red-600', bg: 'bg-red-100' }
  }

  // Get wave height category
  const getWaveHeightCategory = (height: number) => {
    if (height < 0.5) return { category: 'Calm', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (height < 1.0) return { category: 'Slight', color: 'text-blue-500', bg: 'bg-blue-50' }
    if (height < 2.0) return { category: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { category: 'Rough', color: 'text-orange-600', bg: 'bg-orange-100' }
  }

  // Format last updated time in a user-friendly way
  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Weather refresh interval (15 minutes)
  const REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes in milliseconds

  // Fetch weather data function
  const fetchWeather = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use St Katharine Docks coordinates
      const latitude = 51.5074
      const longitude = -0.0719
      if (process.env.NODE_ENV === 'development') {
        logger.info('Fetching weather data for St Katharine Docks', { latitude, longitude })
      }

      // Fetch weather data from Open-Meteo API (free, no API key required)
      let data = null
      
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=Europe/London&forecast_days=7`
        )

        if (response.ok) {
          data = await response.json()
          if (process.env.NODE_ENV === 'development') {
            logger.info('Live weather data fetched from Open-Meteo API', { data })
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Open-Meteo API error, falling back to mock data', { status: response.status })
          }
        }
      } catch (apiError) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Open-Meteo API request failed, falling back to mock data', { error: apiError })
        }
      }

      // Transform Open-Meteo data to our enhanced marina format
      const transformedData: WeatherData = data ? {
        // Live data from Open-Meteo API
        location: 'St Katharine Docks',
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m * 3.6), // Convert m/s to km/h
        windDirection: data.current.wind_direction_10m,
        windGust: data.current.wind_gusts_10m ? Math.round(data.current.wind_gusts_10m * 3.6) : 0,
        pressure: Math.round(data.current.pressure_msl),
        pressureTrend: 'stable', // Would need historical data for trend
        visibility: Math.round(data.current.visibility / 1000), // Convert m to km
        description: getWeatherDescription(data.current.weather_code),
        iconCode: getWeatherIconCode(data.current.weather_code),
        dataSource: 'live',
        uvIndex: Math.round(data.current.uv_index),
        pollenCount: 3, // Mock pollen count (not available in Open-Meteo)
        marineData: {
          waveHeight: Math.random() * 2 + 0.5, // Mock data for now
          wavePeriod: Math.round(Math.random() * 8 + 4), // 4-12 seconds
          waveDirection: Math.round(Math.random() * 360),
          waterTemp: Math.round(data.current.temperature_2m - 2), // Usually cooler than air
          tideInfo: {
            current: Math.round(Math.random() * 3 + 1), // 1-4m
            high: { time: '14:30', height: 4.2 },
            low: { time: '20:45', height: 0.8 },
            nextChange: { time: '14:30', type: 'high' as const }
          },
          marineForecast: 'Light winds, calm seas, good visibility'
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
      } : {
        // Mock data when API is not available
        location: 'St Katharine Docks',
        temperature: 22,
        feelsLike: 24,
        humidity: 65,
        windSpeed: 12,
        windDirection: 180,
        windGust: 18,
        pressure: 1013,
        pressureTrend: 'stable',
        visibility: 10,
        description: 'Partly cloudy',
        iconCode: '02d',
        dataSource: 'demo',
        uvIndex: 5,
        pollenCount: 3,
        marineData: {
          waveHeight: 1.2,
          wavePeriod: 8,
          waveDirection: 185,
          waterTemp: 20,
          tideInfo: {
            current: 2.1,
            high: { time: '14:30', height: 4.2 },
            low: { time: '20:45', height: 0.8 },
            nextChange: { time: '14:30', type: 'high' }
          },
          marineForecast: 'Moderate winds, slight seas, excellent visibility'
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

      setWeatherData(transformedData)
      setLastUpdated(new Date())
      if (process.env.NODE_ENV === 'development') {
        logger.info('Weather data refreshed and set', { 
          dataSource: transformedData.dataSource,
          location: transformedData.location,
          temperature: transformedData.temperature,
          timestamp: new Date().toISOString()
        })
      }
      
      // Update parent component with weather data
      if (onWeatherDataUpdate) {
        onWeatherDataUpdate(transformedData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    // Fetch weather data immediately on mount
    fetchWeather()

    // Set up automatic refresh every 15 minutes
    const refreshInterval = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Auto-refreshing weather data', { timestamp: new Date().toISOString() })
      }
      fetchWeather()
    }, REFRESH_INTERVAL)

    // Cleanup interval on component unmount
    return () => {
      clearInterval(refreshInterval)
      if (process.env.NODE_ENV === 'development') {
        logger.info('Weather refresh interval cleared')
      }
    }
  }, [onWeatherDataUpdate])

  // Manual refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Manual weather refresh triggered', { refreshTrigger })
      }
      fetchWeather()
    }
  }, [refreshTrigger])

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-2 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
        onClick={onOpenDetailed}
      >
        <div className="text-center">
          <div className="text-sm font-bold text-gray-900 mb-1">St Katharine Docks</div>
          <div className="text-xs text-gray-600">Loading marine conditions...</div>
          <div className="text-xs text-blue-500 mt-1">Click to open detailed view</div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !weatherData) {
    return (
      <div 
        className="bg-gradient-to-br from-red-50 to-white rounded-xl p-2 border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
        onClick={onOpenDetailed}
      >
        <div className="text-center">
          <div className="text-sm font-bold text-gray-900 mb-1">St Katharine Docks</div>
          <div className="text-xs text-red-600">Error loading conditions</div>
          <div className="text-xs text-blue-500 mt-1">Click to retry</div>
        </div>
      </div>
    )
  }

  // Show enhanced marina weather data - ULTRA COMPACT
  if (weatherData) {
    const windCategory = getWindSpeedCategory(weatherData.windSpeed)
    const waveCategory = getWaveHeightCategory(weatherData.marineData.waveHeight)
    
    return (
      <div 
        className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-2 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
        onClick={() => {
          onOpenDetailed()
        }}
      >
        <div className="space-y-1.5">
          {/* Header with location and last updated - ultra compact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-900">{weatherData.location}</span>
              {weatherData.dataSource === 'live' ? (
                <span className="text-xs text-green-600 bg-green-100 px-1 py-0.5 rounded">Live</span>
              ) : (
                <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">Demo</span>
              )}
            </div>
            {lastUpdated && (
              <div className="text-xs text-gray-400 flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity">
                <Clock className="h-2.5 w-2.5" />
                <span>{formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
          </div>

          {/* Main weather display - ultra compact */}
          <div className="flex items-center justify-center gap-2">
            {getWeatherIcon(weatherData.iconCode)}
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {Math.round(weatherData.temperature)}°C
              </div>
              <div className="text-xs text-gray-600">{weatherData.description}</div>
            </div>
          </div>

          {/* Marine conditions grid - ultra compact */}
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {/* Wind conditions */}
            <div className="bg-white/60 rounded-lg p-1 border border-blue-100">
              <div className="flex items-center gap-1 mb-0.5">
                <Wind className="h-2.5 w-2.5 text-blue-600" />
                <span className="font-medium text-gray-700 text-xs">Wind</span>
              </div>
              <div className="text-gray-900 font-semibold text-xs">{weatherData.windSpeed} km/h</div>
              <div className="text-gray-600 text-xs">{getWindDirection(weatherData.windDirection)}</div>
              <div className={`inline-block px-1 py-0.5 rounded text-xs ${windCategory.bg} ${windCategory.color}`}>
                {windCategory.category}
              </div>
            </div>

            {/* Wave conditions */}
            <div className="bg-white/60 rounded-lg p-1 border border-blue-100">
              <div className="flex items-center gap-1 mb-0.5">
                <Waves className="h-2.5 w-2.5 text-blue-600" />
                <span className="font-medium text-gray-700 text-xs">Waves</span>
              </div>
              <div className="text-gray-900 font-semibold text-xs">{weatherData.marineData.waveHeight.toFixed(1)}m</div>
              <div className="text-gray-600 text-xs">{weatherData.marineData.wavePeriod}s</div>
              <div className={`inline-block px-1 py-0.5 rounded text-xs ${waveCategory.bg} ${waveCategory.color}`}>
                {waveCategory.category}
              </div>
            </div>

            {/* Water temperature */}
            <div className="bg-white/60 rounded-lg p-1 border border-blue-100">
              <div className="flex items-center gap-1 mb-0.5">
                <Thermometer className="h-2.5 w-2.5 text-blue-600" />
                <span className="font-medium text-gray-700 text-xs">Water</span>
              </div>
              <div className="text-gray-900 font-semibold text-xs">{weatherData.marineData.waterTemp}°C</div>
              <div className="text-gray-600 text-xs">Sea temp</div>
            </div>

            {/* Tide info */}
            <div className="bg-white/60 rounded-lg p-1 border border-blue-100">
              <div className="flex items-center gap-1 mb-0.5">
                <Anchor className="h-2.5 w-2.5 text-blue-600" />
                <span className="font-medium text-gray-700 text-xs">Tide</span>
              </div>
              <div className="text-gray-900 font-semibold text-xs">{weatherData.marineData.tideInfo.current.toFixed(1)}m</div>
              <div className="text-gray-600 text-xs">Current</div>
            </div>
          </div>

          {/* Marine forecast preview - ultra compact */}
          <div className="bg-blue-50/80 rounded-lg p-1 border border-blue-200">
            <div className="text-xs text-blue-800 font-medium mb-0.5">Marine Forecast</div>
            <div className="text-xs text-blue-700 leading-tight">
              {weatherData.marineData.marineForecast}
            </div>
          </div>

          {/* Call to action - ultra compact */}
          <div className="text-center">
            <div className="text-xs text-blue-700 font-semibold hover:text-blue-800 transition-colors duration-200 group-hover:text-blue-800">
              Click for detailed marine conditions
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Data provided by Open-Meteo
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback - should never reach here but just in case
  return (
    <div 
      className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-2 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
      onClick={onOpenDetailed}
    >
      <div className="text-center">
        <div className="text-sm font-bold text-gray-900 mb-1">Marine Weather</div>
        <div className="text-xs text-gray-600">Click to open detailed view</div>
        <div className="text-xs text-blue-500 mt-1">Fallback Mode</div>
      </div>
    </div>
  )
}
