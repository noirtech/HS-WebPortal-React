/**
 * Data Source Toggle Component
 * Allows users to switch between demo data and live database data
 * Provides clear visual feedback and helpful descriptions
 * 
 * DEMO MODE ONLY - Production mode disabled for this build
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDataSource } from '@/lib/data-source-context'
import { Database, FileText, AlertTriangle, Info, RefreshCw } from 'lucide-react'

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export function DataSourceToggle() {
  const { 
    currentSource, 
    isDemoMode, 
    isLiveMode, 
    toggleDataSource, 
    isLoading,
    isProductionModeDisabled
  } = useDataSource()

  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    lastChecked: Date | null;
  }>({
    isConnected: false,
    isLoading: true,
    error: null,
    lastChecked: null
  });

  // Check connection status with automatic retry
  const checkConnectionStatus = useCallback(async () => {
    if (isProductionModeDisabled) {
      setConnectionStatus({
        isConnected: false,
        isLoading: false,
        error: 'Production mode disabled',
        lastChecked: new Date()
      });
      return;
    }

    if (isDemoMode) {
      setConnectionStatus({
        isConnected: true,
        isLoading: false,
        error: null,
        lastChecked: new Date()
      });
      return;
    }

    setConnectionStatus(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        setConnectionStatus({
          isConnected: true,
          isLoading: false,
          error: null,
          lastChecked: new Date()
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date()
      });
    }
  }, [isDemoMode, currentSource, isProductionModeDisabled]);

  // Auto-check connection status
  useEffect(() => {
    checkConnectionStatus();
    
    const interval = setInterval(() => {
      checkConnectionStatus();
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [isDemoMode, currentSource, checkConnectionStatus]);

  const handleToggle = () => {
    if (isProductionModeDisabled) {
      return;
    }
    
    if (!isLoading) {
      toggleDataSource()
      
      // Check connection status immediately after toggling
      setTimeout(() => {
        checkConnectionStatus();
      }, 200); // Much faster delay for immediate feedback
    }
  }

  // Format last checked time
  const formatLastChecked = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isDemoMode ? (
            <FileText className="w-5 h-5 text-orange-600" />
          ) : (
            <Database className="w-5 h-5 text-green-600" />
          )}
          <span className="font-medium text-gray-900">
            {isProductionModeDisabled ? 'Demo Mode Only' : 'Data Source'}
          </span>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isLoading || isProductionModeDisabled}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            ${isProductionModeDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : isDemoMode 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-green-500 hover:bg-green-600'
            }
          `}
          aria-label={isProductionModeDisabled 
            ? 'Production mode disabled' 
            : `Switch to ${isDemoMode ? 'database' : 'demo'} data source`
          }
          role="switch"
          aria-checked={isDemoMode}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isProductionModeDisabled 
                ? 'translate-x-1' 
                : isDemoMode 
                  ? 'translate-x-6' 
                  : 'translate-x-1'
              }
            `}
          />
        </button>
      </div>

      {/* Status */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {isProductionModeDisabled ? 'Demo Mode (Production Disabled)' : (isDemoMode ? 'Demo Data' : 'Live Database')}
          </span>
          <div className="flex items-center space-x-2">
            {isProductionModeDisabled && (
              <div className="flex items-center space-x-1 text-xs text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Disabled</span>
              </div>
            )}
            {!isProductionModeDisabled && (
              <div className={`flex items-center space-x-1 text-xs ${
                connectionStatus.isLoading 
                  ? 'text-blue-600' 
                  : connectionStatus.isConnected 
                    ? 'text-green-600' 
                    : 'text-red-600'
              }`}>
                {connectionStatus.isLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : connectionStatus.isConnected ? (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                )}
                <span>
                  {connectionStatus.isLoading 
                    ? 'Checking...' 
                    : connectionStatus.isConnected 
                      ? 'Connected' 
                      : 'Disconnected'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
        
        {!isProductionModeDisabled && connectionStatus.lastChecked && (
          <div className="text-xs text-gray-500 mt-1">
            Last checked: {formatLastChecked(connectionStatus.lastChecked)}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600">
          {isProductionModeDisabled 
            ? 'Production mode is temporarily disabled for this build. All data is from sample files.'
            : isDemoMode 
              ? 'Perfect for demonstrations and offline presentations. Switch to live data when ready to connect to your database.'
              : 'Connected to your live database. Switch to demo data for demonstrations or when offline.'
          }
        </p>
        
        {/* Auto-checking Info */}
        {!isProductionModeDisabled && (
          <div className="mt-2 text-xs text-blue-600">
            <Info className="inline w-3 h-3 mr-1" />
            Connection status automatically checked every 15 seconds
          </div>
        )}
      </div>

      {/* Environment Info - Dynamic based on actual environment */}
      <div className="mt-2 p-2 rounded border text-xs">
        {isProductionModeDisabled ? (
          <div className="bg-amber-50 border-amber-200">
            <p className="text-amber-700">
              <strong>Demo Mode Only:</strong> Production mode temporarily disabled for this build
            </p>
          </div>
        ) : process.env.NODE_ENV === 'development' ? (
          <div className="bg-blue-50 border-blue-200">
            <p className="text-blue-700">
              <strong>Development Mode:</strong> Data source preference is saved in localStorage
            </p>
          </div>
        ) : process.env.NODE_ENV === 'production' ? (
          <div className="bg-green-50 border-green-200">
            <p className="text-green-700">
              <strong>Production Mode:</strong> Data source preference is saved in database
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border-gray-200">
            <p className="text-gray-700">
              <strong>Environment:</strong> {process.env.NODE_ENV || 'Unknown'} - Data source preference saved locally
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPACT VERSION FOR SMALLER SPACES
// ============================================================================

export function DataSourceToggleCompact() {
  const { currentSource, isDemoMode, toggleDataSource, isLoading, isProductionModeDisabled } = useDataSource()

  const handleToggle = () => {
    if (isProductionModeDisabled || isLoading) {
      return
    }
    toggleDataSource()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-700">Data Source:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isProductionModeDisabled 
              ? 'bg-gray-100 text-gray-600' 
              : isDemoMode 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-green-100 text-green-800'
          }`}>
            {isProductionModeDisabled ? 'Demo Only' : (isDemoMode ? 'Demo' : 'Live')}
          </span>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isProductionModeDisabled}
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            ${isProductionModeDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : isDemoMode 
                ? 'bg-amber-500 hover:bg-amber-600' 
                : 'bg-green-500 hover:bg-green-600'
            }
          `}
          aria-label={isProductionModeDisabled 
            ? 'Production mode disabled' 
            : `Switch to ${isDemoMode ? 'database' : 'demo'} data source`
          }
          role="switch"
          aria-checked={isDemoMode}
        >
          <span
            className={`
              inline-block h-3 w-3 transform rounded-full bg-white transition-transform
              ${isProductionModeDisabled 
                ? 'translate-x-1' 
                : isDemoMode 
                  ? 'translate-x-5' 
                  : 'translate-x-1'
              }
            `}
          />
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        {isProductionModeDisabled 
          ? 'Production mode temporarily disabled'
          : isDemoMode 
            ? 'Using sample data for demonstrations'
            : 'Connected to live database'
        }
      </div>
    </div>
  )
}

