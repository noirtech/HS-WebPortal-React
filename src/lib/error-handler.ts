/**
 * Centralized error handling utilities
 * Provides consistent error handling patterns across the application
 */

import { logger } from './logger'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
    if (field) {
      this.message = `${field}: ${message}`
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
    super(message, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR')
    this.name = 'DatabaseError'

  }
}

/**
 * Central error handler that processes all errors consistently
 */
export function handleError(error: unknown, context?: { component?: string; action?: string }): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    logger.error(`Handled ${error.name}: ${error.message}`, context)
    return error
  }
  
  // If it's a standard Error, wrap it
  if (error instanceof Error) {
    logger.error(`Standard error caught: ${error.message}`, context)
    return new AppError(error.message, 500, 'INTERNAL_ERROR')
  }
  
  // If it's a string, create an AppError
  if (typeof error === 'string') {
    logger.error(`String error caught: ${error}`, context)
    return new AppError(error, 500, 'INTERNAL_ERROR')
  }
  
  // For unknown error types
  logger.error(`Unknown error type caught: ${String(error)}`, context)
  return new AppError('An unexpected error occurred', 500, 'UNKNOWN_ERROR')
}

/**
 * Async error wrapper for API routes and async functions
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: { component?: string; action?: string }
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = handleError(error, context)
      throw appError
    }
  }
}

/**
 * Validation utilities
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email')
  }
}

export function validateStringLength(value: string, fieldName: string, min: number, max?: number): void {
  if (value.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters`, fieldName)
  }
  if (max && value.length > max) {
    throw new ValidationError(`${fieldName} must be no more than ${max} characters`, fieldName)
  }
}

/**
 * Database error handling
 */
export function isDatabaseError(error: any): boolean {
  return error?.code === 'P2002' || // Unique constraint violation
         error?.code === 'P2025' || // Record not found
         error?.code === 'P2003' || // Foreign key constraint violation
         error?.code === 'P2014'    // Invalid ID
}

export function handleDatabaseError(error: any, context?: { component?: string; action?: string }): never {
  if (isDatabaseError(error)) {
    logger.error(`Database error: ${error.message}`, context)
    
    switch (error.code) {
      case 'P2002':
        throw new ValidationError('A record with this information already exists')
      case 'P2025':
        throw new NotFoundError('Record')
      case 'P2003':
        throw new ValidationError('Referenced record does not exist')
      case 'P2014':
        throw new ValidationError('Invalid ID format')
      default:
        throw new DatabaseError('Database operation failed', error)
    }
  }
  
  throw new DatabaseError('Database operation failed', error)
}



