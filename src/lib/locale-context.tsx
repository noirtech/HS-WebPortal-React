'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { localeConfigs, type Locale } from '@/i18n/config'
import { logger } from './logger'

interface LocaleContextType {
  currentLocale: Locale
  localeConfig: typeof localeConfigs[Locale]
  setLocale: (locale: Locale) => void
  switchLocale: (newLocale: Locale) => Promise<void>
  forceUpdate: () => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentLocale, setCurrentLocale] = useState<Locale>('en-GB')
  const [updateTrigger, setUpdateTrigger] = useState(0)
  
  // Force UK locale on initialization
  useEffect(() => {
    console.log('🔍 LOCALE PROVIDER: Initializing with UK locale')
    setCurrentLocale('en-GB')
  }, [])
  
  // Initialize with default locale if no pathname locale is detected
  useEffect(() => {
    if (!pathname || pathname === '/') {
      console.log('🔍 LOCALE PROVIDER: Root path detected, setting UK locale')
      setCurrentLocale('en-GB')
    }
  }, [pathname])

  useEffect(() => {
    // Extract locale from pathname (e.g., /en-GB/dashboard -> en-GB)
    const pathLocale = pathname.split('/')[1] as Locale
    if (pathLocale && localeConfigs[pathLocale]) {
      // Only update if the path locale is different and valid
      if (pathLocale !== currentLocale) {
        logger.debug('Pathname changed, updating locale', { 
          from: currentLocale, 
          to: pathLocale, 
          pathname,
          timestamp: new Date().toISOString(),
          trigger: 'pathname_change'
        })
        setCurrentLocale(pathLocale)
        // Force update when pathname changes
        setUpdateTrigger(prev => prev + 1)
      }
    } else if (pathname && pathname !== '/') {
      // If no valid locale in pathname, default to en-GB
      logger.debug('No valid locale in pathname, defaulting to en-GB', { 
        pathname,
        currentLocale,
        timestamp: new Date().toISOString()
      })
      if (currentLocale !== 'en-GB') {
        setCurrentLocale('en-GB')
        setUpdateTrigger(prev => prev + 1)
      }
    }
  }, [pathname]) // Remove currentLocale from dependencies to prevent circular updates

  const setLocale = useCallback((locale: Locale) => {
    logger.debug('Setting locale', { 
      from: currentLocale, 
      to: locale,
      timestamp: new Date().toISOString(),
      trigger: 'manual_set'
    })
    setCurrentLocale(locale)
    // Force update when locale is set
    setUpdateTrigger(prev => prev + 1)
  }, [currentLocale])

  const switchLocale = useCallback(async (newLocale: Locale) => {
    if (newLocale === currentLocale) return
    
    logger.debug('Switching locale', { 
      from: currentLocale, 
      to: newLocale,
      timestamp: new Date().toISOString(),
      trigger: 'user_switch'
    })
    
    // Update the current locale immediately
    setCurrentLocale(newLocale)
    
    // Force update immediately
    setUpdateTrigger(prev => prev + 1)
    
    // Get the current path without locale
    const pathWithoutLocale = pathname.split('/').slice(2).join('/')
    const newPath = `/${newLocale}/${pathWithoutLocale || 'dashboard'}`
    
    logger.debug('Navigation path', {
      currentPath: pathname,
      newPath,
      pathWithoutLocale
    })
    
    // Navigate to the new locale path
    await router.push(newPath)
  }, [currentLocale, pathname, router])

  const forceUpdate = useCallback(() => {
    logger.debug('Force update triggered')
    setUpdateTrigger(prev => prev + 1)
  }, [])

  // Ensure locale is always valid and synchronized with pathname
  const pathLocale = pathname.split('/')[1] as Locale
  const validLocale = localeConfigs[pathLocale] ? pathLocale : currentLocale
  const finalLocale = validLocale || 'en-GB'
  
  // Force UK locale for demo user - always default to en-GB
  const safeLocale = 'en-GB'
  
  // Log the locale determination process
  console.log('🔍 LOCALE PROVIDER: Locale determination', {
    pathLocale,
    validLocale,
    finalLocale,
    safeLocale,
    pathname
  })
  
  const value: LocaleContextType = {
    currentLocale: safeLocale,
    localeConfig: localeConfigs[safeLocale],
    setLocale,
    switchLocale,
    forceUpdate
  }

  // Debug logging
  useEffect(() => {
    logger.debug('Current locale config', {
      locale: currentLocale,
      finalLocale,
      safeLocale,
      pathLocale,
      config: localeConfigs[safeLocale],
      pathname,
      updateTrigger
    })
  }, [currentLocale, pathname, updateTrigger, finalLocale, safeLocale, pathLocale])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

export function useLocaleFormatting() {
  const { localeConfig, currentLocale, forceUpdate } = useLocale()

  // Force re-render when locale changes
  useEffect(() => {
    // This will ensure the hook re-renders when locale changes
    const handleLocaleChange = () => {
      logger.debug('Locale changed, re-rendering formatting functions')
    }
    
    // Listen for locale changes
    return () => {
      // Cleanup if needed
    }
  }, [localeConfig])

  const formatCurrency = useCallback((amount: number): string => {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: localeConfig.currency,
      minimumFractionDigits: localeConfig.numberFormat.decimalPlaces,
      maximumFractionDigits: localeConfig.numberFormat.decimalPlaces
    }

    // Use the currentLocale from context instead of name comparison
    const result = new Intl.NumberFormat(currentLocale, options).format(amount)
    return result
  }, [localeConfig.currency, localeConfig.numberFormat.decimalPlaces, currentLocale])

  const formatDate = useCallback((date: string | Date): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided to formatDate:', date)
        return 'Invalid Date'
      }
      
      // Use the currentLocale from context instead of name comparison
      if (localeConfig.spelling === 'british') {
        // British format: DD/MM/YYYY
        const result = dateObj.toLocaleDateString(currentLocale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        return result
      } else {
        // American format: MM/DD/YYYY
        const result = dateObj.toLocaleDateString(currentLocale, {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
        return result
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date)
      return 'Invalid Date'
    }
  }, [localeConfig.spelling, currentLocale])

  const formatDateRelative = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    } else {
      return formatDate(dateObj)
    }
  }

  const formatDateLong = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Use the currentLocale from context
    const locale = currentLocale
    
    if (localeConfig.spelling === 'british') {
      // British format: 21st August 2025
      return dateObj.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } else {
      // American format: August 21, 2025
      return dateObj.toLocaleDateString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  const formatTime = (time: string | Date): string => {
    const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time
    
    if (localeConfig.timeFormat === '24-hour') {
      // 24-hour format: 13:45
      return timeObj.toLocaleTimeString(currentLocale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } else {
      // 12-hour format: 1:45 PM
      return timeObj.toLocaleTimeString(currentLocale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const formatDateTime = (date: string | Date | null | undefined): string => {
    // Handle null/undefined dates
    if (!date) {
      return 'N/A'
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    if (localeConfig.spelling === 'british') {
      // British format: DD/MM/YYYY, HH:MM
      return dateObj.toLocaleString(currentLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      // American format: MM/DD/YYYY, HH:MM
      return dateObj.toLocaleString(currentLocale, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatNumber = (num: number): string => {
    if (localeConfig.spelling === 'british') {
      // British formatting: 1,234.56
      return new Intl.NumberFormat(currentLocale, {
        minimumFractionDigits: localeConfig.numberFormat.decimalPlaces,
        maximumFractionDigits: localeConfig.numberFormat.decimalPlaces
      }).format(num)
    } else {
      // American formatting: 1,234.56
      return new Intl.NumberFormat(currentLocale, {
        minimumFractionDigits: localeConfig.numberFormat.decimalPlaces,
        maximumFractionDigits: localeConfig.numberFormat.decimalPlaces
      }).format(num)
    }
  }

  const formatDistance = (distanceInMiles: number): string => {
    if (localeConfig.measurement === 'metric') {
      // Convert to kilometres for metric display
      const kilometres = distanceInMiles * 1.60934
      return `${formatNumber(kilometres)} km`
    } else {
      // Keep in miles for imperial
      return `${formatNumber(distanceInMiles)} miles`
    }
  }

  const formatVolume = (volumeInPints: number): string => {
    if (localeConfig.volume === 'pints') {
      return `${formatNumber(volumeInPints)} pints`
    } else {
      // Convert to gallons for US display
      const gallons = volumeInPints / 8
      return `${formatNumber(gallons)} gallons`
    }
  }

  const formatTemperature = (temperatureInCelsius: number): string => {
    if (localeConfig.temperature === 'celsius') {
      return `${formatNumber(temperatureInCelsius)}°C`
    } else {
      // Convert to Fahrenheit for US display
      const fahrenheit = (temperatureInCelsius * 9/5) + 32
      return `${formatNumber(fahrenheit)}°F`
    }
  }

  // Boat measurement formatting functions
  const formatLength = (lengthInFeet: number): string => {
    if (localeConfig.measurement === 'metric') {
      // Convert feet to metres for metric display
      const metres = lengthInFeet * 0.3048
      return `${formatNumber(metres)} m`
    } else {
      // Keep in feet for imperial
      return `${formatNumber(lengthInFeet)} ft`
    }
  }

  const formatBeam = (beamInFeet: number): string => {
    if (localeConfig.measurement === 'metric') {
      // Convert feet to metres for metric display
      const metres = beamInFeet * 0.3048
      return `${formatNumber(metres)} m`
    } else {
      // Keep in feet for imperial
      return `${formatNumber(beamInFeet)} ft`
    }
  }

  const formatDraft = (draftInFeet: number): string => {
    if (localeConfig.measurement === 'metric') {
      // Convert feet to metres for metric display
      const metres = draftInFeet * 0.3048
      return `${formatNumber(metres)} m`
    } else {
      // Keep in feet for imperial
      return `${formatNumber(draftInFeet)} ft`
    }
  }

  const formatWeight = (weightInPounds: number): string => {
    if (localeConfig.measurement === 'metric') {
      // Convert pounds to kilograms for metric display
      const kilograms = weightInPounds * 0.453592
      return `${formatNumber(kilograms)} kg`
    } else {
      // Keep in pounds for imperial
      return `${formatNumber(weightInPounds)} lbs`
    }
  }

  const getMeasurementUnit = (type: 'length' | 'weight' | 'volume'): string => {
    if (localeConfig.measurement === 'metric') {
      switch (type) {
        case 'length': return 'm'
        case 'weight': return 'kg'
        case 'volume': return 'L'
        default: return ''
      }
    } else {
      switch (type) {
        case 'length': return 'ft'
        case 'weight': return 'lbs'
        case 'volume': return 'gal'
        default: return ''
      }
    }
  }

  const getTimeUnit = (type: 'month' | 'day'): string => {
    if (localeConfig.spelling === 'british') {
      return type === 'month' ? '/month' : '/day'
    } else {
      return type === 'month' ? '/month' : '/day'
    }
  }

  // Berth measurement formatting functions
  const formatBerthSize = (sizeString: string): string => {
    // Parse size string like "40ft" or "12.5m"
    const match = sizeString.match(/^([\d.]+)(ft|m)$/i)
    if (!match) return sizeString // Return as-is if no match
    
    const value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    
    if (localeConfig.measurement === 'metric') {
      if (unit === 'ft') {
        // Convert feet to metres
        const metres = value * 0.3048
        return `${formatNumber(metres)} m`
      } else {
        // Already in metres
        return `${formatNumber(value)} m`
      }
    } else {
      if (unit === 'm') {
        // Convert metres to feet
        const feet = value / 0.3048
        return `${formatNumber(feet)} ft`
      } else {
        // Already in feet
        return `${formatNumber(value)} ft`
      }
    }
  }

  const formatBerthDepth = (depthString: string): string => {
    // Parse depth string like "2.5m" or "8ft"
    const match = depthString.match(/^([\d.]+)(ft|m)$/i)
    if (!match) return depthString // Return as-is if no match
    
    const value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    
    if (localeConfig.measurement === 'metric') {
      if (unit === 'ft') {
        // Convert feet to metres
        const metres = value * 0.3048
        return `${formatNumber(metres)} m`
      } else {
        // Already in metres
        return `${formatNumber(value)} m`
      }
    } else {
      if (unit === 'm') {
        // Convert metres to feet
        const feet = value / 0.3048
        return `${formatNumber(value)} ft`
      } else {
        // Already in feet
        return `${formatNumber(value)} ft`
      }
    }
  }

  const formatPostcode = (postcode: string): string => {
    if (localeConfig.spelling === 'british') {
      // UK postcode format: AA9A 9AA
      return postcode.toUpperCase().replace(/(\w{1,2})(\d{1,2})(\w{1,2})(\d{1,2})(\w{1,2})/, '$1$2 $3$4$5')
    } else {
      // US ZIP format: 12345-6789
      return postcode.replace(/(\d{5})(\d{4})/, '$1-$2')
    }
  }

  const formatPhone = (phone: string): string => {
    if (localeConfig.spelling === 'british') {
      // UK format: +44 20 7946 0958
      return phone.replace(/(\+44)(\d{2})(\d{4})(\d{4})/, '$1 $2 $3 $4')
    } else {
      // US format: +1 (555) 123-4567
      return phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4')
    }
  }

  const getTaxLabel = (): string => {
    return localeConfig.taxName
  }

  const getTaxRate = (): number => {
    return localeConfig.taxRate
  }

  const calculateTax = (amount: number): number => {
    return (amount * localeConfig.taxRate) / 100
  }

  const getWeekStart = (): 'monday' | 'sunday' => {
    return localeConfig.weekStart
  }

  return {
    formatCurrency,
    formatDate,
    formatDateRelative,
    formatDateLong,
    formatTime,
    formatDateTime,
    formatNumber,
    formatDistance,
    formatVolume,
    formatTemperature,
    formatLength,
    formatBeam,
    formatDraft,
    formatWeight,
    formatBerthSize,
    formatBerthDepth,
    getMeasurementUnit,
    getTimeUnit,
    formatPostcode,
    formatPhone,
    getTaxLabel,
    getTaxRate,
    calculateTax,
    getWeekStart,
    localeConfig,
    currentLocale
  }
}


