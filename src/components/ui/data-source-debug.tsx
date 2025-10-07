'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Database, TestTube, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useDataSource } from '@/lib/data-source-context'
import { useDataSourceValidation } from '@/hooks/use-data-source-validation'

interface DataSourceDebugProps {
  dataType: string
  dataCount?: number
  isLoading?: boolean
  error?: Error | null
  additionalInfo?: Record<string, any>
}

export function DataSourceDebug({ 
  dataType, 
  dataCount, 
  isLoading, 
  error, 
  additionalInfo = {} 
}: DataSourceDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { currentSource, isDemoMode, isLiveMode } = useDataSource()
  
  // Foolproof validation
  const {
    isValid,
    sourceVerified,
    countVerified,
    integrityVerified,
    expectedCount,
    actualCount,
    error: validationError,
    lastChecked,
    revalidate
  } = useDataSourceValidation(dataType as any, dataCount)

  const getSourceIcon = () => {
    return currentSource === 'mock' ? (
      <TestTube className="w-4 h-4 text-orange-500" />
    ) : (
      <Database className="w-4 h-4 text-green-500" />
    )
  }

  const getSourceColor = () => {
    return currentSource === 'mock' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
  }

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-100 text-blue-800'
    if (error) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = () => {
    if (isLoading) return 'Loading...'
    if (error) return 'Error'
    return 'Ready'
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        className={`flex items-center space-x-2 border shadow-lg ${
          isValid 
            ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
            : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
        }`}
      >
        {isValid ? <CheckCircle className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4 text-white" />}
        <span className="text-xs font-medium text-white">
          {isValid ? 'Data Source Valid' : 'Data Source Invalid'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white" />
        )}
      </Button>

      {isExpanded && (
        <Card className="absolute top-full left-0 mt-2 w-80 bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              {getSourceIcon()}
              <span>Data Source Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {/* Data Source */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Source:</span>
              <Badge className={getSourceColor()}>
                {currentSource === 'mock' ? 'Demo Mode' : 'Production Mode'}
              </Badge>
            </div>

            {/* Data Source Details */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-medium text-gray-800">
                {isDemoMode ? 'Demo' : 'Live'} ({isLiveMode ? 'Database' : 'Mock'})
              </span>
            </div>

            {/* Foolproof Data Verification */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Validation:</span>
              <Badge className={isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {isValid ? '✓ Valid' : '✗ Invalid'}
              </Badge>
            </div>

            {/* Source Verification */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Source:</span>
              <Badge className={sourceVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {sourceVerified ? '✓ Verified' : '✗ Failed'}
              </Badge>
            </div>

            {/* Count Verification */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Count:</span>
              <Badge className={countVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {countVerified ? `✓ ${actualCount}/${expectedCount}` : `✗ ${actualCount}/${expectedCount}`}
              </Badge>
            </div>

            {/* Integrity Verification */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Integrity:</span>
              <Badge className={integrityVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {integrityVerified ? '✓ Valid' : '✗ Failed'}
              </Badge>
            </div>

            {/* Data Type */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Data Type:</span>
              <span className="font-medium text-gray-800 capitalize">{dataType}</span>
            </div>

            {/* Data Count */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Records:</span>
              <span className="font-medium text-gray-800">
                {isLoading ? '...' : dataCount !== undefined ? dataCount : 'N/A'}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700">
                <span className="font-medium">Data Error:</span> {error.message}
              </div>
            )}

            {validationError && (
              <div className="p-2 bg-orange-50 border border-orange-200 rounded text-orange-700">
                <span className="font-medium">Validation Error:</span> {validationError}
              </div>
            )}

            {/* Additional Info */}
            {Object.keys(additionalInfo).length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Additional Info:</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(additionalInfo).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-500">{key}:</span>
                      <span className="font-medium text-gray-800">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Source Info */}
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Data Source Info:</span>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Current Source:</span>
                  <span className="font-medium text-gray-800">{currentSource}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Demo Mode:</span>
                  <span className="font-medium text-gray-800">{isDemoMode ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Live Mode:</span>
                  <span className="font-medium text-gray-800">{isLiveMode ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Validation Actions */}
            <div className="pt-2 border-t border-gray-200">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={revalidate}
                className="w-full text-xs"
              >
                🔄 Revalidate Data Source
              </Button>
            </div>

            {/* Timestamp */}
            <div className="pt-2 border-t border-gray-200 text-gray-500">
              Last validated: {new Date(lastChecked).toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
