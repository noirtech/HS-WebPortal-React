/**
 * Custom Hook for Data Source Fetching
 * Automatically fetches data from demo or live database based on current data source setting
 * Follows React best practices and provides consistent data fetching interface
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDataSource } from '@/lib/data-source-context'
import { createDataProvider, MockDashboardStats, MockContract, MockInvoice, MockCustomer, MockBooking, MockBoat, MockBerth, MockWorkOrder } from '@/lib/data-source'
import { logger } from '@/lib/logger'

// ============================================================================
// HOOK INTERFACES
// ============================================================================

interface UseDataSourceFetchOptions {
  autoFetch?: boolean
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
  dataType?: 'invoices' | 'contracts' | 'customers' | 'bookings' | 'boats' | 'berths' | 'workOrders' | 'payments' | 'marinas' | 'staff' | 'jobs' | 'users' | 'dashboard'
}

interface UseDataSourceFetchReturn<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  isDemoMode: boolean
  isLiveMode: boolean
}

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

export function useDataSourceFetch<T = any>(
  options: UseDataSourceFetchOptions = {}
): UseDataSourceFetchReturn<T> {
  const { autoFetch = true, onError, onSuccess, dataType } = options
  const { currentSource, isDemoMode, isLiveMode } = useDataSource()
  
  console.log('🔄 HOOK: useDataSourceFetch called', { 
    currentSource,
    isDemoMode,
    isLiveMode,
    dataType,
    timestamp: new Date().toISOString()
  })
  
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch data function - memoized to prevent infinite loops
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 FETCH: Starting data fetch', { 
        currentSource,
        isDemoMode,
        dataType,
        timestamp: new Date().toISOString()
      })
      
      logger.debug('Fetching data via useDataSourceFetch', { 
        source: currentSource,
        dataType,
        timestamp: new Date().toISOString()
      })

      // Create data provider inline to avoid circular dependencies
      const provider = createDataProvider(currentSource)

      // Fetch data based on data type and current source
      let result: T
      
      if (dataType === 'invoices') {
        result = await provider.getInvoices() as T
      } else if (dataType === 'contracts') {
        result = await provider.getContracts() as T
      } else if (dataType === 'customers') {
        result = await provider.getCustomers() as T
      } else if (dataType === 'bookings') {
        result = await provider.getBookings() as T
      } else if (dataType === 'boats') {
        result = await provider.getBoats() as T
      } else if (dataType === 'berths') {
        result = await provider.getBerths() as T
      } else if (dataType === 'workOrders') {
        result = await provider.getWorkOrders() as T
      } else if (dataType === 'payments') {
        result = await provider.getPayments() as T
      } else if (dataType === 'marinas') {
        result = await provider.getMarinas() as T
      } else if (dataType === 'staff') {
        result = await provider.getStaff() as T
      } else if (dataType === 'jobs') {
        result = await provider.getJobs() as T
      } else if (dataType === 'users') {
        result = await provider.getUsers() as T
      } else if (dataType === 'dashboard') {
        result = await provider.getDashboardStats() as T
      } else if (isDemoMode) {
        // Default behavior for dashboard data
        if (currentSource === 'mock') {
          result = await provider.getDashboardStats() as T
        } else {
          result = await provider.getMarinaOverview() as T
        }
      } else {
        // Use live database data provider
        result = await provider.getMarinaOverview() as T
      }

      setData(result)
      
      if (onSuccess) {
        onSuccess(result)
      }

      logger.debug('Data fetched successfully', { 
        source: currentSource,
        dataType: typeof result,
        timestamp: new Date().toISOString()
      })

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      
      if (onError) {
        onError(error)
      }

      logger.error('Failed to fetch data via useDataSourceFetch', { 
        source: currentSource,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentSource, isDemoMode, dataType])

  // Auto-fetch when data source changes
  useEffect(() => {
    console.log('🔄 EFFECT: useEffect triggered', { 
      currentSource,
      autoFetch,
      timestamp: new Date().toISOString()
    })
    
    if (autoFetch) {
      console.log('🔄 EFFECT: Auto-fetch triggered', { 
        currentSource,
        autoFetch,
        timestamp: new Date().toISOString()
      })
      fetchData()
    }
  }, [currentSource, autoFetch]) // Remove fetchData to avoid infinite loop

  // Return hook interface
  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    isDemoMode,
    isLiveMode
  }
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook specifically for dashboard statistics
 */
export function useDashboardStats() {
  return useDataSourceFetch<MockDashboardStats>({
    dataType: 'dashboard',
    autoFetch: true,
    onError: (error) => {
      logger.error('Dashboard stats fetch failed', { error: error.message })
    }
  })
}

/**
 * Hook specifically for marina overview data
 */
export function useMarinaOverview() {
  const { currentSource, isDemoMode } = useDataSource()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchMarinaOverview = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Create data provider inline to avoid circular dependencies
      const provider = createDataProvider(currentSource)
      const result = await provider.getMarinaOverview()
      
      setData(result)
      
      logger.debug('Marina overview fetched', { 
        source: currentSource,
        timestamp: new Date().toISOString()
      })

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      logger.error('Marina overview fetch failed', { error: error.message })
    } finally {
      setIsLoading(false)
    }
  }, [currentSource])

  // Auto-fetch when data source changes
  useEffect(() => {
    fetchMarinaOverview()
  }, [currentSource])

  return {
    data,
    isLoading,
    error,
    refetch: fetchMarinaOverview,
    isDemoMode
  }
}

/**
 * Hook specifically for recent activity
 */
export function useRecentActivity() {
  const { currentSource, isDemoMode } = useDataSource()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchActivity = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Create data provider inline to avoid circular dependencies
      const provider = createDataProvider(currentSource)
      const result = await provider.getRecentActivity()
      
      setData(result)
      
      logger.debug('Recent activity fetched', { 
        source: currentSource,
        count: result.length,
        timestamp: new Date().toISOString()
      })

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      logger.error('Failed to fetch recent activity', { error: error.message })
    } finally {
      setIsLoading(false)
    }
  }, [currentSource])

  // Auto-fetch when data source changes
  useEffect(() => {
    fetchActivity()
  }, [currentSource])

  return {
    data,
    isLoading,
    error,
    refetch: fetchActivity,
    isDemoMode
  }
}

/**
 * Hook specifically for contracts
 */
export function useContracts() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('📋 CONTRACTS: useContracts hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<MockContract[]>({
    autoFetch: true,
    dataType: 'contracts',
    onError: (error) => {
      logger.error('Contracts fetch failed', { error: error.message })
    }
  })

  console.log('📋 CONTRACTS: useContracts returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for invoices
 */
export function useInvoices() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('📄 INVOICES: useInvoices hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<MockInvoice[]>({
    autoFetch: true,
    dataType: 'invoices',
    onError: (error) => {
      logger.error('Invoices fetch failed', { error: error.message })
    }
  })

  console.log('📄 INVOICES: useInvoices returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for customers
 */
export function useCustomers() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('👥 CUSTOMERS: useCustomers hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<MockCustomer[]>({
    autoFetch: true,
    dataType: 'customers',
    onError: (error) => {
      logger.error('Customers fetch failed', { error: error.message })
    }
  })

  console.log('👥 CUSTOMERS: useCustomers returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for bookings
 */
export function useBookings() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('📅 BOOKINGS: useBookings hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<MockBooking[]>({
    autoFetch: true,
    dataType: 'bookings',
    onError: (error) => {
      logger.error('Bookings fetch failed', { error: error.message })
    }
  })

  console.log('📅 BOOKINGS: useBookings returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for boats
 */
export function useBoats() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('🚤 BOATS: useBoats hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<MockBoat[]>({
    autoFetch: true,
    dataType: 'boats',
    onError: (error) => {
      logger.error('Boats fetch failed', { error: error.message })
    }
  })

  console.log('🚤 BOATS: useBoats returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for berths
 */
export function useBerths() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('⚓ BERTHS: useBerths hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<MockBerth[]>({
    autoFetch: true,
    dataType: 'berths',
    onError: (error) => {
      logger.error('Berths fetch failed', { error: error.message })
    }
  })

  console.log('⚓ BERTHS: useBerths returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for work orders
 */
export function useWorkOrders() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('🔧 WORK ORDERS: useWorkOrders hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<MockWorkOrder[]>({
    autoFetch: true,
    dataType: 'workOrders',
    onError: (error) => {
      logger.error('Work orders fetch failed', { error: error.message })
    }
  })

  console.log('🔧 WORK ORDERS: useWorkOrders returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for payments
 */
export function usePayments() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('💳 PAYMENTS: usePayments hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<any>({
    autoFetch: true,
    dataType: 'payments',
    onError: (error) => {
      logger.error('Payments fetch failed', { error: error.message })
    }
  })

  console.log('💳 PAYMENTS: usePayments returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for marinas
 */
export function useMarinas() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('🏢 MARINAS: useMarinas hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<any>({
    autoFetch: true,
    dataType: 'marinas',
    onError: (error) => {
      logger.error('Marinas fetch failed', { error: error.message })
    }
  })

  console.log('🏢 MARINAS: useMarinas returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for staff
 */
export function useStaff() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('👥 STAFF: useStaff hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<any>({
    autoFetch: true,
    dataType: 'staff',
    onError: (error) => {
      logger.error('Staff fetch failed', { error: error.message })
    }
  })

  console.log('👥 STAFF: useStaff returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for jobs
 */
export function useJobs() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('🔧 JOBS: useJobs hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<any>({
    autoFetch: true,
    dataType: 'jobs',
    onError: (error) => {
      logger.error('Jobs fetch failed', { error: error.message })
    }
  })

  console.log('🔧 JOBS: useJobs returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}

/**
 * Hook specifically for users
 */
export function useUsers() {
  const { currentSource, isDemoMode } = useDataSource()

  console.log('👥 USERS: useUsers hook called', {
    currentSource,
    isDemoMode,
    timestamp: new Date().toISOString()
  })

  const result = useDataSourceFetch<any>({
    autoFetch: true,
    dataType: 'users',
    onError: (error) => {
      logger.error('Users fetch failed', { error: error.message })
    }
  })

  console.log('👥 USERS: useUsers returning result', {
    currentSource,
    isDemoMode,
    hasData: !!result.data,
    dataLength: result.data?.length,
    timestamp: new Date().toISOString()
  })

  return result
}
