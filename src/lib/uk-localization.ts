// UK Localisation Utilities
// Standard British practices for currency, dates, and formatting

export const UK_LOCALE = 'en-GB'
export const UK_CURRENCY = 'GBP'
export const UK_TIMEZONE = 'Europe/London'

// UK Currency formatting (£)
export const formatGBP = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(UK_LOCALE, {
    style: 'currency',
    currency: UK_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

// UK Date formatting (DD/MM/YYYY)
export const formatUKDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(UK_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

// UK Date formatting with time (DD/MM/YYYY HH:MM)
export const formatUKDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(UK_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // 24-hour format (UK standard)
  }).format(dateObj)
}

// UK Date input format (YYYY-MM-DD for HTML inputs)
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString().split('T')[0]
}

// UK Number formatting (comma as thousands separator, dot as decimal)
export const formatUKNumber = (number: number | string): string => {
  const numValue = typeof number === 'string' ? parseFloat(number) : number
  return new Intl.NumberFormat(UK_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue)
}

// UK Postal code validation
export const isValidUKPostcode = (postcode: string): boolean => {
  // UK postcode format: AA9A 9AA, A9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i
  return ukPostcodeRegex.test(postcode.trim())
}

// UK Phone number validation
export const isValidUKPhone = (phone: string): boolean => {
  // UK phone format: +44 20 7946 0958, 020 7946 0958, 07911 123456
  const ukPhoneRegex = /^(\+44|0)[1-9]\d{1,14}$/
  return ukPhoneRegex.test(phone.replace(/\s/g, ''))
}

// UK VAT number validation
export const isValidUKVAT = (vat: string): boolean => {
  // UK VAT format: GB123456789, GB123456789012, GBGD001, GBHA500
  const ukVATRegex = /^GB\d{9}(\d{3})?$|^GB(GD|HA)\d{3}$/
  return ukVATRegex.test(vat.trim().toUpperCase())
}

// UK Business hours (9:00 - 17:00)
export const UK_BUSINESS_HOURS = {
  start: '09:00',
  end: '17:00',
  timezone: UK_TIMEZONE,
}

// UK Tax rates (current as of 2024)
export const UK_TAX_RATES = {
  VAT: 0.20, // 20% VAT
  CORPORATION_TAX: 0.25, // 25% Corporation Tax
  INCOME_TAX: {
    BASIC_RATE: 0.20, // 20% Basic Rate
    HIGHER_RATE: 0.40, // 40% Higher Rate
    ADDITIONAL_RATE: 0.45, // 45% Additional Rate
  },
}

// UK Address formatting
export const formatUKAddress = (address: {
  line1: string
  line2?: string
  city: string
  county?: string
  postcode: string
}): string => {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.county,
    address.postcode.toUpperCase(),
  ].filter(Boolean)
  
  return parts.join('\n')
}

// UK Bank account validation (sort code and account number)
export const isValidUKBankAccount = (sortCode: string, accountNumber: string): boolean => {
  // Sort code: 6 digits (XX-XX-XX format)
  const sortCodeRegex = /^\d{2}-\d{2}-\d{2}$/
  
  // Account number: 8 digits
  const accountNumberRegex = /^\d{8}$/
  
  return sortCodeRegex.test(sortCode) && accountNumberRegex.test(accountNumber)
}

// UK National Insurance number validation
export const isValidUKNINumber = (ni: string): boolean => {
  // NI format: AB123456C, AB123456C, AB123456C
  const niRegex = /^[A-Z]{2}\d{6}[A-Z]$/
  return niRegex.test(ni.trim().toUpperCase())
}

// UK Company registration number validation
export const isValidUKCompanyNumber = (companyNumber: string): boolean => {
  // Company number: 8 digits or 2 letters + 6 digits
  const companyNumberRegex = /^(\d{8}|[A-Z]{2}\d{6})$/
  return companyNumberRegex.test(companyNumber.trim().toUpperCase())
}

// UK Financial year calculation (6th April to 5th April)
export const getUKFinancialYear = (date: Date = new Date()): { start: Date; end: Date } => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() returns 0-11
  
  let financialYearStart: number
  let financialYearEnd: number
  
  if (month >= 4) {
    // If date is April or later, financial year starts this year
    financialYearStart = year
    financialYearEnd = year + 1
  } else {
    // If date is before April, financial year started last year
    financialYearStart = year - 1
    financialYearEnd = year
  }
  
  return {
    start: new Date(financialYearStart, 3, 6), // 6th April (month 3 = April)
    end: new Date(financialYearEnd, 3, 5), // 5th April
  }
}

// UK Working days calculation (excluding weekends and bank holidays)
export const getUKWorkingDays = (startDate: Date, endDate: Date, excludeBankHolidays: boolean = true): number => {
  let workingDays = 0
  const current = new Date(startDate)
  
  // Basic UK bank holidays (2024-2025)
  const bankHolidays = [
    '2024-01-01', // New Year's Day
    '2024-03-29', // Good Friday
    '2024-04-01', // Easter Monday
    '2024-05-06', // Early May Bank Holiday
    '2024-05-27', // Spring Bank Holiday
    '2024-08-26', // Summer Bank Holiday
    '2024-12-25', // Christmas Day
    '2024-12-26', // Boxing Day
    '2025-01-01', // New Year's Day
    '2025-04-18', // Good Friday
    '2025-04-21', // Easter Monday
    '2025-05-05', // Early May Bank Holiday
    '2025-05-26', // Spring Bank Holiday
    '2025-08-25', // Summer Bank Holiday
    '2025-12-25', // Christmas Day
    '2025-12-26', // Boxing Day
  ]
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    const dateString = current.toISOString().split('T')[0]
    
    // Check if it's a weekend
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Check if it's a bank holiday
    const isBankHoliday = excludeBankHolidays && bankHolidays.includes(dateString)
    
    if (!isWeekend && !isBankHoliday) {
      workingDays++
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return workingDays
}

// UK Distance formatting (metric with UK exceptions)
export const formatUKDistance = (distance: number, unit: 'm' | 'km' | 'miles' = 'm'): string => {
  if (unit === 'miles') {
    // Keep miles for road distances (UK standard)
    return `${distance.toFixed(1)} miles`
  } else if (unit === 'km') {
    return `${distance.toFixed(1)} kilometres`
  } else {
    return `${distance.toFixed(1)} metres`
  }
}

// UK Weight formatting (metric)
export const formatUKWeight = (weight: number, unit: 'kg' | 'g' | 'tonnes' = 'kg'): string => {
  if (unit === 'tonnes') {
    return `${weight.toFixed(2)} tonnes`
  } else if (unit === 'g') {
    return `${weight.toFixed(0)} grams`
  } else {
    return `${weight.toFixed(2)} kilograms`
  }
}

// UK Temperature formatting (Celsius)
export const formatUKTemperature = (temperature: number): string => {
  return `${temperature.toFixed(1)}°C`
}

// UK Volume formatting (metric with UK exceptions)
export const formatUKVolume = (volume: number, unit: 'l' | 'ml' | 'pints' = 'l'): string => {
  if (unit === 'pints') {
    // Keep pints for drinks (UK standard)
    return `${volume.toFixed(1)} pints`
  } else if (unit === 'ml') {
    return `${volume.toFixed(0)} millilitres`
  } else {
    return `${volume.toFixed(2)} litres`
  }
}

// Export default UK settings
export const UK_SETTINGS = {
  locale: UK_LOCALE,
  currency: UK_CURRENCY,
  timezone: UK_TIMEZONE,
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currencySymbol: '£',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  taxRates: UK_TAX_RATES,
  businessHours: UK_BUSINESS_HOURS,
  weekStartsOn: 1, // Monday
  country: 'United Kingdom',
  language: 'British English',
}
