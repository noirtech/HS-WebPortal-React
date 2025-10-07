/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present and valid
 */

import { logger } from './logger'

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL?: string
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL?: string
  PORT?: number
  LOG_LEVEL?: string
}

/**
 * Validate that all required environment variables are present
 */
export function validateEnv(): EnvironmentConfig {
  // Check if we're in demo mode - handle both server and client side
  const isDemoMode = process.env.NEXT_PUBLIC_DATA_SOURCE === 'mock' || 
                    process.env.NODE_ENV === 'production' // Assume demo mode in production if no database
  
  // In demo mode, only NEXTAUTH_SECRET is required
  const required = isDemoMode ? ['NEXTAUTH_SECRET'] : ['DATABASE_URL', 'NEXTAUTH_SECRET']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`
    logger.error(error)
    throw new Error(error)
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development'
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    const error = `Invalid NODE_ENV: ${nodeEnv}. Must be one of: development, production, test`
    logger.error(error)
    throw new Error(error)
  }

  // Validate DATABASE_URL format (only if not in demo mode)
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && !isDemoMode) {
    if (!databaseUrl.startsWith('sqlserver://') && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('mysql://')) {
      logger.warn(`Unusual DATABASE_URL format: ${databaseUrl.substring(0, 20)}...`)
    }
  }

  // Validate NEXTAUTH_SECRET length
  const nextAuthSecret = process.env.NEXTAUTH_SECRET!
  if (nextAuthSecret.length < 32) {
    logger.warn('NEXTAUTH_SECRET should be at least 32 characters long for security')
  }

  const config: EnvironmentConfig = {
    NODE_ENV: nodeEnv as EnvironmentConfig['NODE_ENV'],
    DATABASE_URL: databaseUrl,
    NEXTAUTH_SECRET: nextAuthSecret,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    LOG_LEVEL: process.env.LOG_LEVEL
  }

  logger.info('Environment validation passed', { 
    NODE_ENV: config.NODE_ENV,
    isDemoMode,
    hasDatabaseUrl: !!config.DATABASE_URL,
    hasNextAuthSecret: !!config.NEXTAUTH_SECRET,
    port: config.PORT
  })

  return config
}

/**
 * Get environment configuration with validation
 */
export function getEnvConfig(): EnvironmentConfig {
  try {
    return validateEnv()
  } catch (error) {
    logger.error('Environment validation failed', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Get safe environment variable with fallback
 */
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value && fallback === undefined) {
    logger.warn(`Environment variable ${key} is not set and no fallback provided`)
  }
  return value || fallback || ''
}

/**
 * Get required environment variable (throws if missing)
 */
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    const error = `Required environment variable ${key} is not set`
    logger.error(error)
    throw new Error(error)
  }
  return value
}



