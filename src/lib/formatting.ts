/**
 * UK-specific formatting utilities
 * Provides consistent formatting for dates, currency, and other locale-specific data
 */

/**
 * UK date formatting (DD/MM/YYYY)
 */
export function formatDateUK(date: Date | string | number): string {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided')
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * UK date parsing (DD/MM/YYYY)
 */
export function parseDateUK(dateString: string): Date {
  const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) {
    throw new Error('Invalid UK date format. Expected DD/MM/YYYY')
  }
  
  const [, day, month, year] = match
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date values')
  }
  
  return date
}

/**
 * UK currency formatting (£X.XX)
 */
export function formatCurrencyGBP(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount provided')
  }
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * UK currency parsing (£X.XX or X.XX)
 */
export function parseCurrencyGBP(currencyString: string): number {
  const cleaned = currencyString.replace(/[£,\s]/g, '')
  const amount = parseFloat(cleaned)
  
  if (isNaN(amount)) {
    throw new Error('Invalid currency format')
  }
  
  return Math.round(amount * 100) / 100 // Round to 2 decimal places
}

/**
 * UK number formatting with comma separators
 */
export function formatNumberUK(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Invalid number provided')
  }
  
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * UK decimal formatting (dot for decimal, comma for thousands)
 */
export function formatDecimalUK(value: number, decimalPlaces: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Invalid number provided')
  }
  
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value)
}

/**
 * UK time formatting (24-hour format)
 */
export function formatTimeUK(date: Date | string | number): string {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided')
  }
  
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj)
}

/**
 * UK datetime formatting (DD/MM/YYYY HH:MM)
 */
export function formatDateTimeUK(date: Date | string | number): string {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided')
  }
  
  const dateStr = formatDateUK(dateObj)
  const timeStr = formatTimeUK(dateObj)
  
  return `${dateStr} ${timeStr}`
}

/**
 * UK phone number formatting (+44 XXXX XXXXXX)
 */
export function formatPhoneUK(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length !== 11 && digits.length !== 12) {
    throw new Error('Invalid UK phone number length')
  }
  
  // Handle +44 format
  if (digits.startsWith('44')) {
    const number = digits.substring(2)
    return `+44 ${number.substring(0, 4)} ${number.substring(4)}`
  }
  
  // Handle 0 format
  if (digits.startsWith('0')) {
    const number = digits.substring(1)
    return `+44 ${number.substring(0, 4)} ${number.substring(4)}`
  }
  
  throw new Error('Invalid UK phone number format')
}

/**
 * UK postcode formatting (XX1 1XX)
 */
export function formatPostcodeUK(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase()
  
  if (cleaned.length < 5 || cleaned.length > 7) {
    throw new Error('Invalid UK postcode length')
  }
  
  // Format as XX1 1XX or XXX1 1XX
  if (cleaned.length === 5) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`
  } else if (cleaned.length === 6) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`
  } else {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`
  }
}

/**
 * UK address formatting
 */
export function formatAddressUK(address: {
  line1: string
  line2?: string
  city: string
  county?: string
  postcode: string
}): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.county,
    formatPostcodeUK(address.postcode)
  ].filter(Boolean)
  
  return parts.join('\n')
}

/**
 * UK measurement formatting
 */
export function formatMeasurement(value: number, unit: 'metres' | 'feet' | 'miles' | 'pints'): string {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Invalid measurement value')
  }
  
  const formatted = formatDecimalUK(value, 1)
  
  switch (unit) {
    case 'metres':
      return `${formatted}m`
    case 'feet':
      return `${formatted}ft`
    case 'miles':
      return `${formatted} miles`
    case 'pints':
      return `${formatted} pints`
    default:
      return `${formatted} ${unit}`
  }
}

/**
 * UK week start (Monday = 0)
 */
export function getWeekStartUK(date: Date): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  return new Date(date.setDate(diff))
}

/**
 * UK tax calculation (VAT at 20%)
 */
export function calculateVAT(amount: number, rate: number = 0.20): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount provided')
  }
  
  if (rate < 0 || rate > 1) {
    throw new Error('Invalid VAT rate. Must be between 0 and 1')
  }
  
  return Math.round(amount * rate * 100) / 100
}

/**
 * UK tax-inclusive amount
 */
export function addVAT(amount: number, rate: number = 0.20): number {
  const vat = calculateVAT(amount, rate)
  return Math.round((amount + vat) * 100) / 100
}



