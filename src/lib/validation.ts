/**
 * Centralized validation utilities
 * Provides consistent validation patterns across the application
 */

import { ValidationError } from './error-handler'

/**
 * Validation rules and patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_UK: /^(\+44|0)\d{10}$/,
  POSTCODE_UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  DATE_DD_MM_YYYY: /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
  CURRENCY_GBP: /^£?\d+(\.\d{2})?$/,
  BOAT_REGISTRATION: /^[A-Z]{2}\d{4}$/,
  MARINA_CODE: /^[A-Z]{2,4}\d{2,4}$/
} as const

/**
 * Validation functions
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  validateRequired(email, fieldName)
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    throw new ValidationError('Invalid email format', fieldName)
  }
}

export function validatePhoneUK(phone: string, fieldName: string = 'phone'): void {
  validateRequired(phone, fieldName)
  if (!VALIDATION_PATTERNS.PHONE_UK.test(phone)) {
    throw new ValidationError('Invalid UK phone number format', fieldName)
  }
}

export function validatePostcodeUK(postcode: string, fieldName: string = 'postcode'): void {
  validateRequired(postcode, fieldName)
  if (!VALIDATION_PATTERNS.POSTCODE_UK.test(postcode)) {
    throw new ValidationError('Invalid UK postcode format', fieldName)
  }
}

export function validateDateUK(date: string, fieldName: string = 'date'): void {
  validateRequired(date, fieldName)
  if (!VALIDATION_PATTERNS.DATE_DD_MM_YYYY.test(date)) {
    throw new ValidationError('Invalid date format. Use DD/MM/YYYY', fieldName)
  }
  
  // Additional date validation
  const [day, month, year] = date.split('/').map(Number)
  const dateObj = new Date(year, month - 1, day)
  
  if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
    throw new ValidationError('Invalid date', fieldName)
  }
}

export function validateCurrencyGBP(amount: string | number, fieldName: string = 'amount'): void {
  validateRequired(amount, fieldName)
  const amountStr = String(amount)
  if (!VALIDATION_PATTERNS.CURRENCY_GBP.test(amountStr)) {
    throw new ValidationError('Invalid currency format. Use £X.XX or X.XX', fieldName)
  }
  
  const numericValue = parseFloat(amountStr.replace('£', ''))
  if (isNaN(numericValue) || numericValue < 0) {
    throw new ValidationError('Amount must be a positive number', fieldName)
  }
}

export function validateStringLength(value: string, fieldName: string, min: number, max?: number): void {
  validateRequired(value, fieldName)
  if (value.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters`, fieldName)
  }
  if (max && value.length > max) {
    throw new ValidationError(`${fieldName} must be no more than ${max} characters`, fieldName)
  }
}

export function validateBoatRegistration(registration: string, fieldName: string = 'registration'): void {
  validateRequired(registration, fieldName)
  if (!VALIDATION_PATTERNS.BOAT_REGISTRATION.test(registration)) {
    throw new ValidationError('Invalid boat registration format. Use XX1234 format', fieldName)
  }
}

export function validateMarinaCode(code: string, fieldName: string = 'marinaCode'): void {
  validateRequired(code, fieldName)
  if (!VALIDATION_PATTERNS.MARINA_CODE.test(code)) {
    throw new ValidationError('Invalid marina code format. Use 2-4 letters followed by 2-4 numbers', fieldName)
  }
}

export function validateNumericRange(value: number, fieldName: string, min: number, max: number): void {
  validateRequired(value, fieldName)
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName)
  }
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, fieldName)
  }
}

export function validateEnum<T extends string>(value: T, fieldName: string, allowedValues: readonly T[]): void {
  validateRequired(value, fieldName)
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, fieldName)
  }
}

/**
 * Object validation
 */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  validators: Record<keyof T, (value: any, fieldName: string) => void>
): void {
  for (const [key, validator] of Object.entries(validators)) {
    try {
      validator(obj[key], key)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new ValidationError(`Validation failed for ${key}`, key)
    }
  }
}

/**
 * Array validation
 */
export function validateArray<T>(
  arr: T[],
  validator: (item: T, index: number) => void,
  fieldName: string = 'array'
): void {
  validateRequired(arr, fieldName)
  if (!Array.isArray(arr)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName)
  }
  
  arr.forEach((item, index) => {
    try {
      validator(item, index)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new ValidationError(`Validation failed for item at index ${index}`, `${fieldName}[${index}]`)
    }
  })
}

/**
 * Conditional validation
 */
export function validateConditional(
  condition: boolean,
  validator: () => void,
  message: string
): void {
  if (condition) {
    validator()
  }
}

/**
 * Sanitization functions
 */
export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^0/, '+44')
}

export function sanitizePostcode(postcode: string): string {
  return postcode.trim().toUpperCase().replace(/\s+/g, '')
}



