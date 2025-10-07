/**
 * Data Source Context and Hook
 * Provides React context for managing data source state across the application
 * Follows React best practices and established patterns
 * 
 * FEATURES:
 * - Remembers user's data source preference between sessions using localStorage
 * - Defaults to 'mock' mode for safety (unless forced mode is set)
 * - Supports forced mode settings from the settings page
 * - Provides toggle functionality for easy switching
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { dataSourceService, DataSource, DataSourceConfig } from './data-source'
import { logger } from './logger'

// ============================================================================
// FORCED MODE UTILITIES
// ============================================================================

const getForcedModeSetting = (): 'none' | 'mock' | 'database' => {
  if (typeof window === 'undefined') return 'none'
  try {
    const saved = localStorage.getItem('forcedDataSourceMode')
    return saved ? JSON.parse(saved) : 'none'
  } catch {
    return 'none'
  }
}



// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

interface DataSourceContextType {
  currentSource: DataSource
  isDemoMode: boolean
  isLiveMode: boolean
  setDataSource: (source: DataSource) => void
  toggleDataSource: () => void
  config: DataSourceConfig
  isLoading: boolean
  modeLabel: string
  modeDescription: string
  isProductionModeDisabled: boolean
  forcedMode: 'none' | 'mock' | 'database'
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface DataSourceProviderProps {
  children: ReactNode
}

export function DataSourceProvider({ children }: DataSourceProviderProps) {
  const [currentSource, setCurrentSource] = useState<DataSource>('mock')
  const [isLoading, setIsLoading] = useState(true)
  const [forcedMode, setForcedMode] = useState<'none' | 'mock' | 'database'>('none')

  // Initialize data source on mount
  useEffect(() => {
    const initializeDataSource = () => {
      try {
        // Get forced mode setting
        const forcedModeSetting = getForcedModeSetting()
        
        setForcedMode(forcedModeSetting)
        
        let initialSource: DataSource = 'mock' // Default to mock mode for safety
        
        // Determine initial source based on forced mode
        if (forcedModeSetting === 'mock') {
          initialSource = 'mock'
        } else if (forcedModeSetting === 'database') {
          initialSource = 'database'
        } else {
          // No forced mode - default to mock mode and lock it
          initialSource = 'mock'
          // Automatically set forced mode to mock for safety
          setForcedMode('mock')
        }
        
        setCurrentSource(initialSource)
        
        logger.debug('Data source context initialized', { 
          source: initialSource,
          forcedMode: forcedModeSetting,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        logger.error('Failed to initialize data source context', { error })
        setCurrentSource('mock') // Default to mock on error for safety
      } finally {
        setIsLoading(false)
      }
    }

    initializeDataSource()
  }, [])

  // Listen for forced mode changes from settings
  useEffect(() => {
    const handleForcedModeChange = (e: CustomEvent) => {
      const newForcedMode = e.detail.forcedMode
      console.log('🔄 FORCED MODE CHANGE: Received from settings', { 
        newForcedMode,
        currentForcedMode: forcedMode,
        timestamp: new Date().toISOString()
      })
      
      setForcedMode(newForcedMode)
      
      // Update data source if forcing to a specific mode
      if (newForcedMode === 'mock' && currentSource !== 'mock') {
        console.log('🔄 FORCED MODE: Switching to mock due to forced mode')
        setCurrentSource('mock')
        dataSourceService.setDataSource('mock')
      } else if (newForcedMode === 'database' && currentSource !== 'database') {
        console.log('🔄 FORCED MODE: Switching to database due to forced mode')
        setCurrentSource('database')
        dataSourceService.setDataSource('database')
      }
    }

    // Listen for custom events from settings page
    window.addEventListener('forcedModeChanged', handleForcedModeChange as EventListener)

    return () => {
      window.removeEventListener('forcedModeChanged', handleForcedModeChange as EventListener)
    }
  }, [currentSource, forcedMode])

  // Update data source
  const updateDataSource = (source: DataSource) => {
    // Check if mode is forced
    if (forcedMode === 'mock' && source === 'database') {
      console.log('🚫 FORCED MODE: Cannot switch to database - forced to mock mode')
      logger.warn('Data source switch blocked - forced to mock mode', { attemptedSource: source })
      return
    }
    
    if (forcedMode === 'database' && source === 'mock') {
      console.log('🚫 FORCED MODE: Cannot switch to mock - forced to database mode')
      logger.warn('Data source switch blocked - forced to database mode', { attemptedSource: source })
      return
    }
    
    try {
      console.log('🔄 UPDATE: Switching data source', { 
        from: currentSource,
        to: source,
        forcedMode,
        timestamp: new Date().toISOString()
      })
      
      dataSourceService.setDataSource(source)
      setCurrentSource(source)
      
      // Save to localStorage only if not in forced mode
      if (forcedMode === 'none' && typeof window !== 'undefined') {
        localStorage.setItem('dataSource', source)
      }
      
      // Dispatch custom event for other components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dataSourceChanged', {
          detail: { 
            newSource: source,
            previousSource: currentSource,
            forcedMode,
            timestamp: new Date().toISOString()
          }
        }))
      }
      
      console.log('🔄 UPDATE: Data source updated', { 
        newSource: source,
        timestamp: new Date().toISOString()
      })
      
      logger.info('Data source updated', { 
        newSource: source,
        forcedMode,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Failed to update data source', { source, error })
    }
  }

  // Toggle between demo and live database
  const toggleDataSource = () => {
    // Check if mode is forced
    if (forcedMode === 'mock') {
      console.log('🚫 FORCED MODE: Cannot toggle - forced to mock mode')
      return
    }
    
    if (forcedMode === 'database') {
      console.log('🚫 FORCED MODE: Cannot toggle - forced to database mode')
      return
    }
    
    const newSource: DataSource = currentSource === 'mock' ? 'database' : 'mock'
    console.log('🔄 TOGGLE: Switching data source', { 
      from: currentSource, 
      to: newSource,
      forcedMode,
      timestamp: new Date().toISOString()
    })
    updateDataSource(newSource)
  }

  // Mode information - memoized to prevent unnecessary re-renders
  const modeInfo = useMemo(() => {
    const isDemoMode = currentSource === 'mock'
    const isLiveMode = currentSource === 'database'
    
    let modeLabel = isDemoMode ? 'Demo Mode' : 'Production Mode'
    let modeDescription = isDemoMode ? 'Using sample data for demonstration' : 'Using live database data'
    
    if (forcedMode === 'mock') {
      modeLabel = 'Demo Mode (Forced)'
      modeDescription = 'Using sample data - mode locked to demo'
    } else if (forcedMode === 'database') {
      modeLabel = 'Production Mode (Forced)'
      modeDescription = 'Using live database data - mode locked to production'
    }
    
    return { isDemoMode, isLiveMode, modeLabel, modeDescription }
  }, [currentSource, forcedMode])

  // Context value - created directly to ensure React detects changes
  const contextValue: DataSourceContextType = {
    currentSource,
    setDataSource: updateDataSource,
    toggleDataSource,
    config: {
      currentSource,
      isMockMode: currentSource === 'mock',
      isDatabaseMode: currentSource === 'database',
    },
    isLoading,
    isProductionModeDisabled: false, // No longer always disabled
    forcedMode,
    ...modeInfo
  }

  return (
    <DataSourceContext.Provider value={contextValue}>
      {children}
    </DataSourceContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

export function useDataSource() {
  const context = useContext(DataSourceContext)
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider')
  }
  return context
}

export function useMockMode() {
  const { isDemoMode } = useDataSource()
  return isDemoMode
}

export function useDatabaseMode() {
  const { isLiveMode } = useDataSource()
  return isLiveMode
}

export function useCurrentDataSource() {
  const { currentSource } = useDataSource()
  return currentSource
}

