'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDataSource } from '@/lib/data-source-context'
import { logger } from '@/lib/logger'

interface ValidationResult {
  isValid: boolean
  sourceVerified: boolean
  countVerified: boolean
  integrityVerified: boolean
  expectedCount: number
  actualCount: number
  source: string
  error?: string
  lastChecked: string
}

interface ExpectedDataCounts {
  customers: number
  boats: number
  berths: number
  invoices: number
  payments: number
  bookings: number
  workOrders: number
  contracts: number
  dashboard: number
  'marina-walk': number
  reports: number
  marinas: number
  users: number
  staff: number
  jobs: number
  'pending-operations': number
  'sync-status': number
  settings: number
  profile: number
}

// Expected record counts for each data type
const EXPECTED_COUNTS: ExpectedDataCounts = {
  customers: 25, // Mock data has 25 customers/owners
  boats: 25, // Mock data has 25 boats
  berths: 25, // Mock data has 25 berths
  invoices: 25, // Mock data has 25 invoices
  payments: 25, // Mock data has 25 payments
  bookings: 25, // Mock data has 25 bookings
  workOrders: 25, // Mock data has 25 work orders
  contracts: 25, // Mock data has 25 contracts
  dashboard: 1, // Dashboard returns a single object, not an array
  'marina-walk': 1, // Marina walk returns a single object, not an array
  reports: 1, // Reports returns a single marina overview object
  marinas: 3, // Mock marinas count
  users: 5, // Mock users count
  staff: 10, // Mock staff count
  jobs: 15, // Mock jobs count
  'pending-operations': 3, // Mock pending operations count
  'sync-status': 1, // Sync status returns a single object, not an array
  settings: 1, // Settings returns a single object, not an array
  profile: 1 // Profile returns a single object, not an array
}

// Database expected counts (for when in database mode)
const DATABASE_EXPECTED_COUNTS: ExpectedDataCounts = {
  customers: 50, // Database has 50 customers/owners
  boats: 50, // Database has 50 boats
  berths: 50, // Database has 50 berths
  invoices: 50, // Database has 50 invoices
  payments: 50, // Database has 50 payments
  bookings: 50, // Database has 50 bookings
  workOrders: 50, // Database has 50 work orders
  contracts: 50, // Database has 50 contracts
  dashboard: 1, // Dashboard returns a single object, not an array
  'marina-walk': 1, // Marina walk returns a single object, not an array
  reports: 1, // Reports returns a single marina overview object
  marinas: 3, // Mock marinas count
  users: 5, // Mock users count
  staff: 10, // Mock staff count
  jobs: 15, // Mock jobs count
  'pending-operations': 3, // Mock pending operations count
  'sync-status': 1, // Sync status returns a single object, not an array
  settings: 1, // Settings returns a single object, not an array
  profile: 1 // Profile returns a single object, not an array
}

export function useDataSourceValidation(dataType: keyof ExpectedDataCounts, actualCount?: number) {
  const { currentSource, isDemoMode } = useDataSource()
  const [validationResult, setValidationResult] = useState<ValidationResult>(() => {
    const expectedCounts = currentSource === 'mock' || isDemoMode ? EXPECTED_COUNTS : DATABASE_EXPECTED_COUNTS
    return {
      isValid: false,
      sourceVerified: false,
      countVerified: false,
      integrityVerified: false,
      expectedCount: expectedCounts[dataType] || 0,
      actualCount: actualCount || 0,
      source: currentSource,
      lastChecked: new Date().toISOString()
    }
  })

  // Validate data source by checking mock data first, then other sources
  const validateDataSource = useCallback(async () => {
    try {
      // Determine expected count based on current data source
      const expectedCounts = currentSource === 'mock' || isDemoMode ? EXPECTED_COUNTS : DATABASE_EXPECTED_COUNTS
      const expectedCount = expectedCounts[dataType] || 0
      
      logger.info('🔍 Starting data source validation', { 
        dataType, 
        currentSource, 
        isDemoMode,
        expectedCount,
        expectedCountsSource: currentSource === 'mock' || isDemoMode ? 'mock' : 'database'
      })
      
      const actualCountValue = actualCount || 0
      
      // STEP 1: MOCK DATA VERIFICATION (Priority Check)
      let sourceVerified = false
      let countVerified = false
      let integrityVerified = false
      
      if (currentSource === 'mock' || isDemoMode) {
        logger.info('🔍 MOCK DATA: Verifying mock data baseline', { dataType, expectedCount, actualCountValue })
        
        // Mock data source verification - always true since it's local
        sourceVerified = true
        
        // Mock data count verification - strict check against expected mock counts
        countVerified = actualCountValue === expectedCount
        logger.info('🔍 MOCK DATA: Count verification', { 
          dataType, 
          expectedCount, 
          actualCountValue, 
          countVerified,
          mockDataExpected: EXPECTED_COUNTS[dataType]
        })
        
        // Mock data integrity verification - check if we have data and it matches expected structure
        integrityVerified = actualCountValue > 0 && actualCountValue === expectedCount
        
        logger.info('🔍 MOCK DATA: Validation results', { 
          dataType, 
          sourceVerified, 
          countVerified, 
          integrityVerified,
          expectedCount,
          actualCount: actualCountValue
        })
        
      } else {
        // STEP 2: DATABASE VERIFICATION (Secondary Check)
        logger.info('🔍 DATABASE: Verifying database connection', { dataType })
        
        try {
          // Special handling for dashboard - it doesn't have a direct API endpoint
          if (dataType === 'dashboard') {
            // For dashboard, we consider it verified if we have any data
            sourceVerified = actualCountValue > 0
            logger.info('🔍 DATABASE: Dashboard source verification', { dataType, hasData: sourceVerified })
          } else {
            const response = await fetch(`/api/${dataType}`)
            if (response.ok) {
              const data = await response.json()
              // Source is verified if API responds successfully
              sourceVerified = Array.isArray(data)
              logger.info('🔍 DATABASE: API test successful', { dataType, count: data.length })
            } else {
              logger.error('🔍 DATABASE: API test failed', { dataType, status: response.status })
            }
          }
        } catch (error) {
          logger.error('🔍 DATABASE: API test error', { dataType, error: error instanceof Error ? error.message : String(error) })
        }
        
        // Database count verification - strict check for database mode
        countVerified = actualCountValue === expectedCount
        
        // Database integrity verification - check if we have the expected amount of data
        integrityVerified = actualCountValue === expectedCount
      }

      // STEP 3: OVERALL VALIDATION
      const isValid = sourceVerified && countVerified && integrityVerified

      const result: ValidationResult = {
        isValid,
        sourceVerified,
        countVerified,
        integrityVerified,
        expectedCount,
        actualCount: actualCountValue,
        source: currentSource,
        lastChecked: new Date().toISOString()
      }

      if (!isValid) {
        const validationType = currentSource === 'mock' || isDemoMode ? 'MOCK DATA' : 'DATABASE'
        result.error = `[${validationType}] Validation failed: Source=${sourceVerified}, Count=${countVerified} (expected ${expectedCount}, got ${actualCountValue}), Integrity=${integrityVerified}`
      }

      setValidationResult(result)
      
      const validationPath = currentSource === 'mock' || isDemoMode ? 'MOCK_DATA' : 'DATABASE'
      logger.info(`🔍 ${validationPath}: Data source validation completed`, { 
        dataType, 
        isValid, 
        sourceVerified, 
        countVerified, 
        integrityVerified,
        expectedCount,
        actualCount: actualCountValue,
        source: currentSource,
        validationPath
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const expectedCounts = currentSource === 'mock' || isDemoMode ? EXPECTED_COUNTS : DATABASE_EXPECTED_COUNTS
      
      logger.error('🔍 Data source validation error', { dataType, error: errorMessage })
      
      setValidationResult({
        isValid: false,
        sourceVerified: false,
        countVerified: false,
        integrityVerified: false,
        expectedCount: expectedCounts[dataType] || 0,
        actualCount: actualCount || 0,
        source: currentSource,
        error: errorMessage,
        lastChecked: new Date().toISOString()
      })
    }
  }, [dataType, currentSource, actualCount, isDemoMode])

  // Auto-validate when data changes
  useEffect(() => {
    validateDataSource()
  }, [validateDataSource])

  // Manual validation function
  const revalidate = useCallback(() => {
    validateDataSource()
  }, [validateDataSource])

  return {
    validation: validationResult,
    revalidate,
    isValid: validationResult.isValid,
    sourceVerified: validationResult.sourceVerified,
    countVerified: validationResult.countVerified,
    integrityVerified: validationResult.integrityVerified,
    expectedCount: validationResult.expectedCount,
    actualCount: validationResult.actualCount,
    error: validationResult.error,
    lastChecked: validationResult.lastChecked
  }
}
