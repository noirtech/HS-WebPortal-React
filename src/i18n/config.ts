// Define the locales that your application supports
export const locales = ['en-GB', 'en-US'] as const
export const defaultLocale = 'en-GB' as const

export type Locale = (typeof locales)[number]

export interface LocaleConfig {
  name: string
  displayName: string
  flag: string
  currency: string
  currencySymbol: string
  dateFormat: string
  timeFormat: string
  timezone: string
  weekStart: 'monday' | 'sunday'
  measurement: 'metric' | 'imperial'
  distance: 'miles' | 'kilometres'
  volume: 'pints' | 'gallons'
  temperature: 'celsius' | 'fahrenheit'
  taxRate: number
  taxName: string
  postcodeFormat: string
  phoneFormat: string
  numberFormat: {
    decimalSeparator: string
    thousandSeparator: string
    decimalPlaces: number
  }
  spelling: 'british' | 'american'
}

export const localeConfigs: Record<Locale, LocaleConfig> = {
  'en-GB': {
    name: 'British English',
    displayName: 'English (UK)',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    timezone: 'Europe/London',
    weekStart: 'monday',
    measurement: 'metric',
    distance: 'miles',
    volume: 'pints',
    temperature: 'celsius',
    taxRate: 20,
    taxName: 'VAT',
    postcodeFormat: 'AA9A 9AA',
    phoneFormat: '+44 20 7946 0958',
    numberFormat: {
      decimalSeparator: '.',
      thousandSeparator: ',',
      decimalPlaces: 2
    },
    spelling: 'british'
  },
  'en-US': {
    name: 'American English',
    displayName: 'English (US)',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    timezone: 'America/New_York',
    weekStart: 'sunday',
    measurement: 'imperial',
    distance: 'miles',
    volume: 'gallons',
    temperature: 'fahrenheit',
    taxRate: 0,
    taxName: 'Sales Tax',
    postcodeFormat: '12345-6789',
    phoneFormat: '+1 (555) 123-4567',
    numberFormat: {
      decimalSeparator: '.',
      thousandSeparator: ',',
      decimalPlaces: 2
    },
    spelling: 'american'
  }
}

// Helper function to get locale configuration
export function getLocaleConfig(locale: Locale) {
  return localeConfigs[locale]
}

// Helper function to format currency based on locale
export function formatCurrency(amount: number, locale: Locale): string {
  const config = localeConfigs[locale]
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Helper function to format date based on locale
export function formatDate(date: Date | string, locale: Locale, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const config = localeConfigs[locale]
  
  if (format === 'long') {
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return dateObj.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Helper function to format time based on locale
export function formatTime(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const config = localeConfigs[locale]
  
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: config.timeFormat === '12h'
  })
}

// Helper function to format numbers based on locale
export function formatNumber(number: number, locale: Locale): string {
  const config = localeConfigs[locale]
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number)
}

// Helper function to get business days between two dates
export function getBusinessDays(startDate: Date, endDate: Date, locale: Locale): number {
  const config = localeConfigs[locale]
  let businessDays = 0
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return businessDays
}

// Helper function to check if a locale is valid
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// Helper function to get fallback locale
export function getFallbackLocale(locale: Locale): Locale {
  return defaultLocale
}
