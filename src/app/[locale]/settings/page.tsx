'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Database, TestTube, Clock, Info, Bell } from 'lucide-react'
import { useDataSource } from '@/lib/data-source-context'
import { useToggleVisibility } from '@/hooks/use-toggle-visibility'
import { AppLayout } from '@/components/layout/app-layout'

// Default user fallback - John Doe
const defaultUser = {
  id: 'demo-user',
  email: 'demo@marina.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: ['ADMIN']
}

function SettingsPageContent() {
  const currentLocale = useLocale()
  const { currentSource, setDataSource, forcedMode } = useDataSource()
  const { forcedMode: localForcedMode, updateForcedMode, isLoading } = useToggleVisibility()
  
  // Connection frequency state
  const [connectionFrequency, setConnectionFrequency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('connectionFrequency') || '5'
    }
    return '5'
  })

  // Mock data offline simulation state
  const [mockDataOffline, setMockDataOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mockDataOffline') === 'true'
    }
    return false
  })

  const handleForcedModeChange = (mode: 'none' | 'mock' | 'database') => {
    updateForcedMode(mode)
    
    // If forcing to a specific mode, also set the data source
    if (mode === 'mock') {
      setDataSource('mock')
    } else if (mode === 'database') {
      setDataSource('database')
    }
  }

  const handleConnectionFrequencyChange = (value: string) => {
    setConnectionFrequency(value)
    localStorage.setItem('connectionFrequency', value)
    
    // Dispatch custom event to notify banner of frequency change
    window.dispatchEvent(new CustomEvent('connectionFrequencyChanged', {
      detail: { frequency: parseInt(value) * 1000 }
    }))
  }

  const handleMockDataOfflineChange = (enabled: boolean) => {
    setMockDataOffline(enabled)
    localStorage.setItem('mockDataOffline', enabled.toString())
    
    // Dispatch custom event to notify banner of mock data offline status
    window.dispatchEvent(new CustomEvent('mockDataOfflineChanged', {
      detail: { isOffline: enabled }
    }))
  }

  const handleResetSettings = () => {
    updateForcedMode('none')
    setDataSource('mock') // Reset to demo mode
    setConnectionFrequency('5')
    localStorage.setItem('connectionFrequency', '5')
    setMockDataOffline(false)
    localStorage.setItem('mockDataOffline', 'false')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">


      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Configure application settings and preferences. The connection status banner remains visible to show database connectivity.
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          <TestTube className="h-4 w-4 mr-1" />
          Testing Only
        </Badge>
      </div>

      

      {/* Data Source Configuration Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="h-6 w-6 text-green-600" />
          Data Source Configuration
        </h2>
        
        {/* Current Data Source Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Data Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active data source:</p>
                <p className="font-medium">
                  {currentSource === 'mock' ? 'Demo Mode (Mock Data)' : 'Production Mode (Live Database)'}
                </p>
              </div>
              <Badge variant={currentSource === 'mock' ? 'secondary' : 'default'}>
                {currentSource === 'mock' ? 'DEMO' : 'PRODUCTION'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Connection Check Frequency */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Connection Check Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium">Check Database Connection</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      How often to check database connectivity status
                    </p>
                  </div>
                </div>
              </div>
              <Select value={connectionFrequency} onValueChange={handleConnectionFrequencyChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mock Data Offline Simulation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Mock Data Offline Simulation
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <TestTube className="w-4 h-4 text-gray-600" />
                <div>
                  <Label className="text-sm font-medium">Simulate Mock Data Offline</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mockDataOffline ? 'Mock data appears offline' : 'Mock data appears online'}
                  </p>
                </div>
              </div>
            </div>
            <Switch
              checked={mockDataOffline}
              onCheckedChange={handleMockDataOfflineChange}
            />
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-700">How it works:</p>
                <ul className="space-y-0.5">
                  <li>• <code className="bg-gray-100 px-1 rounded text-xs">localStorage.setItem('mockDataOffline', 'true')</code></li>
                  <li>• Banner makes a real failed request to <code className="bg-gray-100 px-1 rounded text-xs">/api/mock-offline-simulation</code></li>
                  <li>• This triggers actual offline detection logic (not just a variable change)</li>
                  <li>• Uses custom event <code className="bg-gray-100 px-1 rounded text-xs">mockDataOfflineChanged</code> for real-time updates</li>
                </ul>
              </div>
            </div>
          </div>

          {mockDataOffline && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <TestTube className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">
                  Simulation Active
                </span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                The banner will show "Offline" even though mock data is available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Unified Data Source Control */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Source Control
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Current Status:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentSource === 'mock' ? 'bg-orange-500' : 'bg-green-500'
                }`}></div>
                <span className="text-gray-700">
                  <strong>Mode:</strong> {currentSource === 'mock' ? 'Demo' : 'Production'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className={`w-4 h-4 ${
                  localForcedMode !== 'none' ? 'text-amber-600' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-gray-700">
                  <strong>Locked:</strong> {localForcedMode !== 'none' ? 'Yes' : 'No'}
                </span>
              </div>

            </div>
            
            {localForcedMode !== 'none' && (
              <div className={`mt-3 p-3 rounded-lg border ${
                localForcedMode === 'mock' 
                  ? 'bg-orange-50 border-orange-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${
                    localForcedMode === 'mock' ? 'text-orange-600' : 'text-green-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className={`text-sm font-medium ${
                    localForcedMode === 'mock' ? 'text-orange-700' : 'text-green-700'
                  }`}>
                    {localForcedMode === 'mock' ? 'Demo Mode Locked' : 'Production Mode Locked'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${
                  localForcedMode === 'mock' ? 'text-orange-600' : 'text-green-600'
                }`}>
                  Users cannot switch to {localForcedMode === 'mock' ? 'production' : 'demo'} mode
                </p>
              </div>
            )}
          </div>

          {/* Mode Selection with Lock Integration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Select Data Source Mode</Label>
              <p className="text-sm text-gray-600">
                Choose which data source to use and optionally lock it to prevent changes
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demo Mode Option */}
              <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                currentSource === 'mock' 
                  ? 'border-orange-300 bg-orange-50' 
                  : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-25'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    currentSource === 'mock' 
                      ? 'border-orange-500 bg-orange-500' 
                      : 'border-gray-300'
                  }`}>
                    {currentSource === 'mock' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-orange-700">Demo Mode</span>
                      {localForcedMode === 'mock' && (
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Use sample data for presentations and testing</p>
                    <div className="mt-2 text-xs text-orange-600">
                      • 25 sample records per category
                      • Perfect for demos
                      • No database connection needed
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setDataSource('mock')}
                    className={`w-[120px] px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentSource === 'mock'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                    }`}
                  >
                    {currentSource === 'mock' ? '✓ Selected' : 'Select Demo'}
                  </button>
                  <button
                    onClick={() => {
                      if (localForcedMode === 'mock') {
                        handleForcedModeChange('none')
                      } else {
                        handleForcedModeChange('mock')
                      }
                    }}
                    disabled={currentSource !== 'mock'}
                    className={`w-[80px] px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      localForcedMode === 'mock'
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : currentSource === 'mock'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {localForcedMode === 'mock' ? '🔓 Unlock' : '🔒 Lock'}
                  </button>
                </div>
              </div>

              {/* Production Mode Option */}
              <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                currentSource === 'database' 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-green-200 hover:bg-green-25'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    currentSource === 'database' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {currentSource === 'database' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700">Production Mode</span>
                      {localForcedMode === 'database' && (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Connect to live database for real data</p>
                    <div className="mt-2 text-xs text-green-600">
                      • Live SQL Server database
                      • Real customer data
                      • Requires database connection
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setDataSource('database')}
                    className={`w-[120px] px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentSource === 'database'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300'
                    }`}
                  >
                    {currentSource === 'database' ? '✓ Selected' : 'Select Production'}
                  </button>
                  <button
                    onClick={() => {
                      if (localForcedMode === 'database') {
                        handleForcedModeChange('none')
                      } else {
                        handleForcedModeChange('database')
                      }
                    }}
                    disabled={currentSource !== 'database'}
                    className={`w-[80px] px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      localForcedMode === 'database'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : currentSource === 'database'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {localForcedMode === 'database' ? '🔓 Unlock' : '🔒 Lock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Reset Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Reset Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Reset all settings to their default values. This will allow mode switching and switch to demo mode.
              </p>
              <Button
                variant="outline"
                onClick={handleResetSettings}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Reset All Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AppLayout user={defaultUser}>
      <SettingsPageContent />
    </AppLayout>
  )
}
