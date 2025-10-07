'use client'

import React, { useState, useEffect } from 'react'
import { useDataSource } from '@/lib/data-source-context'
import { useToggleVisibility } from '@/hooks/use-toggle-visibility'
import { createDataProvider } from '@/lib/data-source'
import { Database, FileText, AlertTriangle, Settings, Info, Wifi, WifiOff } from 'lucide-react'

export function DataSourceToggleBanner() {
  const { currentSource, isDemoMode, modeLabel, modeDescription, forcedMode } = useDataSource()
  const { isLoading } = useToggleVisibility()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [checkFrequency, setCheckFrequency] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('connectionFrequency')
      return stored ? parseInt(stored) * 1000 : 5000 // Default 5 seconds
    }
    return 5000
  })

  const [mockDataOffline, setMockDataOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mockDataOffline') === 'true'
    }
    return false
  })

  // Check connection status periodically using the proven database connection test
  useEffect(() => {
    const checkConnection = async () => {
      // In demo mode, check if mock data offline simulation is active
      if (currentSource === 'mock') {
        if (mockDataOffline) {
          setConnectionStatus('checking')
          try {
            // Simulate a real connection failure by making an actual failed request
            // This ensures we're testing the actual offline detection logic
            const response = await fetch('/api/mock-offline-simulation', {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            })
            // This should never succeed, but just in case
            setConnectionStatus('disconnected')
          } catch (error) {
            // This is expected - we're simulating offline by making a real failed request
            setConnectionStatus('disconnected')
          }
        } else {
          setConnectionStatus('connected')
        }
        return
      }

      // In production mode, test actual database connection using dedicated endpoint
      try {
        const response = await fetch('/api/db-connection-test', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const result = await response.json()
          const isConnected = result.isOnline
          

          
          setConnectionStatus(isConnected ? 'connected' : 'disconnected')
        } else {
          // Only show as disconnected if it's a persistent error (not a temporary 500)
          if (response.status === 500) {
            // For 500 errors, we might want to be more lenient and not immediately show as disconnected
            // This could be a temporary database issue
          }
          setConnectionStatus('disconnected')
        }
      } catch (error) {
        setConnectionStatus('disconnected')
      }
    }

    // Check immediately
    checkConnection()

    // Check at the configured frequency
    const interval = setInterval(checkConnection, checkFrequency)
    return () => clearInterval(interval)
  }, [currentSource, checkFrequency, mockDataOffline]) // Re-run when data source, frequency, or mock offline status changes

  // Listen for data source changes from other components/tabs
  useEffect(() => {
    const handleDataSourceChange = () => {
      // Trigger a connection check when data source changes
      const checkConnection = async () => {
        if (currentSource === 'mock') {
          setConnectionStatus('connected')
          return
        }

        try {
          const response = await fetch('/api/db-connection-test', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (response.ok) {
            const result = await response.json()
            setConnectionStatus(result.isOnline ? 'connected' : 'disconnected')
          } else {
            setConnectionStatus('disconnected')
          }
        } catch (error) {
          setConnectionStatus('disconnected')
        }
      }
      
      checkConnection()
    }

    // Listen for custom events when data source changes
    window.addEventListener('dataSourceChanged', handleDataSourceChange)
    
    return () => {
      window.removeEventListener('dataSourceChanged', handleDataSourceChange)
    }
  }, [currentSource])

  // Listen for connection frequency changes from settings
  useEffect(() => {
        const handleFrequencyChange = (e: CustomEvent) => {
      const newFrequency = e.detail.frequency
      setCheckFrequency(newFrequency)
    }

    // Listen for custom events when frequency changes
    window.addEventListener('connectionFrequencyChanged', handleFrequencyChange as EventListener)
    
    return () => {
      window.removeEventListener('connectionFrequencyChanged', handleFrequencyChange as EventListener)
    }
  }, [checkFrequency])

  // Listen for mock data offline simulation changes
  useEffect(() => {
    const handleMockDataOfflineChange = (e: CustomEvent) => {
      const isOffline = e.detail.isOffline
      setMockDataOffline(isOffline)
    }

    // Listen for custom events when mock data offline status changes
    window.addEventListener('mockDataOfflineChanged', handleMockDataOfflineChange as EventListener)
    
    return () => {
      window.removeEventListener('mockDataOfflineChanged', handleMockDataOfflineChange as EventListener)
    }
  }, [currentSource])

  // Don't render if still loading
  if (isLoading) {
    return null
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-600" />
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-red-500" />
      case 'checking':
        return <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return isDemoMode ? 'Connected (Mock)' : 'Connected'
      case 'disconnected':
        return 'Offline'
      case 'checking':
        return 'Checking...'
    }
  }



  return (
    <div className={`px-4 py-3 border-b transition-all duration-300 z-10 relative ${
        isDemoMode 
          ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200' 
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
      }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left side - Mode info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isDemoMode ? (
                <FileText className="w-5 h-5 text-orange-600" />
              ) : (
                <Database className="w-5 h-5 text-green-600" />
              )}
              <span className={`text-sm font-medium ${
                isDemoMode ? 'text-orange-800' : 'text-green-800'
              }`}>
                {modeLabel}
              </span>
            </div>
            <span className={`text-xs hidden sm:inline ${
              isDemoMode ? 'text-orange-600' : 'text-green-600'
            }`}>
              {modeDescription}
            </span>
            {forcedMode === 'mock' && (
              <div className="flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3" />
                <span>Demo mode locked</span>
              </div>
            )}
            {forcedMode === 'database' && (
              <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3" />
                <span>Production mode locked</span>
              </div>
            )}
          </div>

          {/* Right side - Connection status and Settings link */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-1 text-xs">
              {getConnectionIcon()}
              <span className={`hidden sm:inline ${
                connectionStatus === 'connected' ? 'text-green-600' : 
                connectionStatus === 'disconnected' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {getConnectionText()}
              </span>
            </div>

            {/* Settings link */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Info className="w-3 h-3" />
                <span className="hidden sm:inline">Need to change mode?</span>
                <span className="sm:hidden">Change mode?</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-gray-500">Visit</span>
                <div className="flex items-center space-x-1 text-blue-600 font-medium">
                  <Settings className="w-3 h-3" />
                  <span>Settings</span>
                </div>
                <span className="text-gray-500">→</span>
                <span className="text-gray-500">For Testing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional info for locked modes */}
        {forcedMode !== 'none' && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-xs">
              <Info className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">
                Mode switching is currently disabled. To change modes, go to Settings → For Testing → Data Source Control
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
