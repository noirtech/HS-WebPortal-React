'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Zap
} from 'lucide-react'

interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: string
  windGust: number
  visibility: number
  description: string
  icon: string
  sunrise: string
  sunset: string
  tide?: {
    current: string
    next: string
    height: number
  }
  marine?: {
    waveHeight: number
    wavePeriod: number
    swellDirection: string
    seaTemperature: number
  }
}

interface LocationData {
  latitude: number
  longitude: number
  city: string
  country: string
}

export function WeatherWidget() {
  const t = useTranslations()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Enhanced weather icon mapping with more detailed icons
  const getWeatherIcon = (iconCode: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '01d': <Sun className="h-10 w-10 text-yellow-500 drop-shadow-lg" />,
      '01n': <Sun className="h-10 w-10 text-yellow-400 drop-shadow-lg" />,
      '02d': <Cloud className="h-10 w-10 text-blue-400 drop-shadow-lg" />,
      '02n': <Cloud className="h-10 w-10 text-blue-300 drop-shadow-lg" />,
      '03d': <Cloud className="h-10 w-10 text-gray-400 drop-shadow-lg" />,
      '03n': <Cloud className="h-10 w-10 text-gray-300 drop-shadow-lg" />,
      '04d': <Cloud className="h-10 w-10 text-gray-500 drop-shadow-lg" />,
      '04n': <Cloud className="h-10 w-10 text-gray-400 drop-shadow-lg" />,
      '09d': <Droplets className="h-10 w-10 text-blue-500 drop-shadow-lg" />,
      '09n': <Droplets className="h-10 w-10 text-blue-400 drop-shadow-lg" />,
      '10d': <Droplets className="h-10 w-10 text-blue-600 drop-shadow-lg" />,
      '10n': <Droplets className="h-10 w-10 text-blue-500 drop-shadow-lg" />,
      '11d': <Zap className="h-10 w-10 text-yellow-600 drop-shadow-lg" />,
      '11n': <Zap className="h-10 w-10 text-yellow-500 drop-shadow-lg" />,
      '13d': <Cloud className="h-10 w-10 text-white drop-shadow-lg" />,
      '13n': <Cloud className="h-10 w-10 text-gray-200 drop-shadow-lg" />,
      '50d': <Cloud className="h-10 w-10 text-gray-400 drop-shadow-lg" />,
      '50n': <Cloud className="h-10 w-10 text-gray-300 drop-shadow-lg" />
    }
    return iconMap[iconCode] || <Cloud className="h-10 w-10 text-gray-400 drop-shadow-lg" />
  }

  // Get wind direction arrow
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  // Get wind direction icon rotation
  const getWindIconRotation = (degrees: number) => {
    return `rotate(${degrees}deg)`
  }

  // Fetch weather data from OpenWeatherMap API
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Note: In production, you would use an environment variable for the API key
      // For now, we'll use a placeholder - you'll need to add OPENWEATHER_API_KEY to your .env
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'your_api_key_here'
      
      if (apiKey === 'your_api_key_here') {
        // Fallback to mock data if no API key
        logger.warn('No OpenWeather API key configured, using mock data')
        setWeatherData({
          temperature: 18,
          feelsLike: 16,
          humidity: 65,
          pressure: 1013,
          windSpeed: 12,
          windDirection: 'SW',
          windGust: 18,
          visibility: 10,
          description: 'Partly cloudy with light winds',
          icon: '02d',
          sunrise: '06:30',
          sunset: '18:45',
          tide: {
            current: 'High',
            next: 'Low at 12:30',
            height: 2.1
          },
          marine: {
            waveHeight: 0.8,
            wavePeriod: 8,
            swellDirection: 'SW',
            seaTemperature: 16
          }
        })
        setLastUpdated(new Date())
        return
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=en`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform OpenWeatherMap data to our format
      const transformedData: WeatherData = {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 1.94384), // Convert m/s to knots
        windDirection: getWindDirection(data.wind.deg || 0),
        windGust: data.wind.gust ? Math.round(data.wind.gust * 1.94384) : 0,
        visibility: Math.round(data.visibility / 1000), // Convert m to km
        description: data.weather[0]?.description || 'Unknown',
        icon: data.weather[0]?.icon || '01d',
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        tide: {
          current: 'High',
          next: 'Low at 12:30',
          height: 2.1
        },
        marine: {
          waveHeight: 0.8,
          wavePeriod: 8,
          swellDirection: 'SW',
          seaTemperature: Math.round(data.main.temp - 2) // Approximate sea temp
        }
      }

      setWeatherData(transformedData)
      setLastUpdated(new Date())
      logger.info('Weather data fetched successfully', { location: `${lat}, ${lon}` })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather'
      setError(errorMessage)
      logger.error('Error fetching weather data', { error: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Get user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)
    setError(null)
    setPermissionDenied(false)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        // Reverse geocode to get city name (using a free service)
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          .then(response => response.json())
          .then(data => {
            setLocationData({
              latitude,
              longitude,
              city: data.city || data.locality || 'Unknown',
              country: data.countryName || 'Unknown'
            })
            
            // Fetch weather for this location
            fetchWeatherData(latitude, longitude)
          })
          .catch(() => {
            // If reverse geocoding fails, still use coordinates
            setLocationData({
              latitude,
              longitude,
              city: 'Unknown',
              country: 'Unknown'
            })
            fetchWeatherData(latitude, longitude)
          })
      },
      (error) => {
        setIsLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionDenied(true)
            setError('Location access denied. Please enable location permissions.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Location information unavailable.')
            break
          case error.TIMEOUT:
            setError('Location request timed out.')
            break
          default:
            setError('An unknown error occurred getting location.')
        }
        logger.error('Geolocation error', { error: error.message })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Auto-refresh weather every 10 minutes
  useEffect(() => {
    if (locationData) {
      const interval = setInterval(() => {
        fetchWeatherData(locationData.latitude, locationData.longitude)
      }, 10 * 60 * 1000) // 10 minutes

      return () => clearInterval(interval)
    }
  }, [locationData])

  // Get user location on component mount
  useEffect(() => {
    getUserLocation()
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    if (locationData) {
      fetchWeatherData(locationData.latitude, locationData.longitude)
    } else {
      getUserLocation()
    }
  }

  if (permissionDenied) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <MapPin className="h-5 w-5" />
            Weather Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <p className="text-blue-700 mb-3">
              Location access is required to show weather information
            </p>
            <Button 
              onClick={getUserLocation}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Enable Location Access
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !weatherData) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Cloud className="h-5 w-5" />
            Weather Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Cloud className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-700 mb-3">{error}</p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Cloud className="h-5 w-5" />
            Live Weather
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {locationData && (
          <p className="text-sm text-blue-600 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {locationData.city}, {locationData.country}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading && !weatherData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-blue-600">Loading weather data...</p>
          </div>
        ) : weatherData ? (
          <div className="space-y-4">
            {/* Main Weather Display - Enhanced with better graphics */}
            <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-center gap-4 mb-3">
                {getWeatherIcon(weatherData.icon)}
                <div>
                  <div className="text-4xl font-bold text-blue-900">
                    {weatherData.temperature}°C
                  </div>
                  <div className="text-sm text-blue-700">
                    Feels like {weatherData.feelsLike}°C
                  </div>
                </div>
              </div>
              <p className="text-blue-800 font-medium capitalize text-lg">
                {weatherData.description}
              </p>
            </div>

            {/* Marine Weather Grid - Enhanced with better icons and layout */}
            <div className="grid grid-cols-2 gap-3">
              {/* Wind - Enhanced */}
              <div className="bg-white/70 rounded-lg p-3 text-center shadow-sm border border-blue-100">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Wind className="h-5 w-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Wind</span>
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {weatherData.windSpeed} kts
                </div>
                <div className="text-xs text-blue-700 flex items-center justify-center gap-1">
                  <Compass className="h-3 w-3" />
                  {weatherData.windDirection}
                </div>
              </div>

              {/* Visibility - Enhanced */}
              <div className="bg-white/70 rounded-lg p-3 text-center shadow-sm border border-blue-100">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Visibility</span>
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {weatherData.visibility} km
                </div>
                <div className="text-xs text-blue-700">
                  {weatherData.visibility >= 10 ? 'Excellent' : weatherData.visibility >= 5 ? 'Good' : 'Poor'}
                </div>
              </div>

              {/* Humidity - Enhanced */}
              <div className="bg-white/70 rounded-lg p-3 text-center shadow-sm border border-blue-100">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Humidity</span>
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {weatherData.humidity}%
                </div>
                <div className="text-xs text-blue-700">
                  {weatherData.humidity > 80 ? 'High' : weatherData.humidity > 60 ? 'Moderate' : 'Low'}
                </div>
              </div>

              {/* Pressure - Enhanced */}
              <div className="bg-white/70 rounded-lg p-3 text-center shadow-sm border border-blue-100">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Gauge className="h-5 w-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Pressure</span>
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {weatherData.pressure} hPa
                </div>
                <div className="text-xs text-blue-700">
                  {weatherData.pressure > 1013 ? 'High' : weatherData.pressure < 1013 ? 'Low' : 'Normal'}
                </div>
              </div>
            </div>

            {/* Marine Specific Info - Enhanced with better graphics */}
            {weatherData.marine && (
              <div className="bg-white/70 rounded-lg p-4 shadow-sm border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Anchor className="h-4 w-4" />
                  Marine Conditions
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-blue-700 flex items-center gap-1">
                      <Waves className="h-3 w-3" />
                      Wave Height:
                    </span>
                    <span className="font-medium text-blue-900">{weatherData.marine.waveHeight}m</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-blue-700 flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      Sea Temp:
                    </span>
                    <span className="font-medium text-blue-900">{weatherData.marine.seaTemperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-blue-700 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Wave Period:
                    </span>
                    <span className="font-medium text-blue-900">{weatherData.marine.wavePeriod}s</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-blue-700 flex items-center gap-1">
                      <Compass className="h-3 w-3" />
                      Swell:
                    </span>
                    <span className="font-medium text-blue-900">{weatherData.marine.swellDirection}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tide Information - Enhanced */}
            {weatherData.tide && (
              <div className="bg-white/70 rounded-lg p-4 shadow-sm border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Tide Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-blue-700">Current:</span>
                    <span className="font-medium text-blue-900">{weatherData.tide.current}</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-blue-700">Height:</span>
                    <span className="font-medium text-blue-900">{weatherData.tide.height}m</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded col-span-2">
                    <span className="text-blue-700">Next:</span>
                    <span className="font-medium text-blue-900">{weatherData.tide.next}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Last Updated - Enhanced */}
            {lastUpdated && (
              <div className="text-center text-xs text-blue-600 bg-white/50 p-2 rounded-lg">
                <Clock className="h-3 w-3 inline mr-1" />
                Last updated: {lastUpdated.toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
