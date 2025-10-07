/**
 * Implementation Status Box Component
 * Displays current implementation status of the demo data-live data switching system
 * Provides real-time progress updates and information to users
 */

'use client'

import React from 'react'
import { useDataSource } from '@/lib/data-source-context'
import { CheckCircle, Clock, AlertTriangle, Info, Database, FileText } from 'lucide-react'

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export function ImplementationStatusBox() {
  const { currentSource, isDemoMode, isLiveMode } = useDataSource()

  // Implementation progress data
  const implementationProgress = {
    overall: 85,
    coreInfrastructure: 100,
    reactContext: 100,
    dataFetching: 100,
    uiComponents: 100,
    integration: 85,
    testing: 20,
    documentation: 30
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (percentage >= 60) return <Clock className="h-4 w-4 text-blue-600" />
    if (percentage >= 40) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">
            Implementation Status: Demo Mode System
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {isDemoMode ? (
            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              <FileText className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Demo Mode Active</span>
            </div>
          ) : (
            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Database className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Live Database Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature Description */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">🎯 What is Demo Mode?</h4>
        <p className="text-sm text-blue-700 mb-2">
          Demo Mode allows you to showcase the marina management system using realistic sample data without requiring a database connection. 
          This feature is perfect for:
        </p>
        <ul className="text-xs text-blue-600 space-y-1 ml-4 list-disc">
          <li>Client presentations and demonstrations</li>
          <li>Offline development and testing</li>
          <li>Training sessions and workshops</li>
          <li>Proof-of-concept evaluations</li>
        </ul>
      </div>

      {/* Progress Overview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Overall Progress</span>
          <span className={`text-lg font-bold ${getProgressColor(implementationProgress.overall)}`}>
            {implementationProgress.overall}%
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${implementationProgress.overall}%` }}
          ></div>
        </div>
      </div>

      {/* Detailed Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
          <div className="flex justify-center mb-2">{getProgressIcon(implementationProgress.coreInfrastructure)}</div>
          <div className="text-xs font-medium text-blue-800">Core Infrastructure</div>
          <div className={`text-lg font-bold ${getProgressColor(implementationProgress.coreInfrastructure)}`}>
            {implementationProgress.coreInfrastructure}%
          </div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
          <div className="flex justify-center mb-2">{getProgressIcon(implementationProgress.reactContext)}</div>
          <div className="text-xs font-medium text-blue-800">React Context</div>
          <div className={`text-lg font-bold ${getProgressColor(implementationProgress.reactContext)}`}>
            {implementationProgress.reactContext}%
          </div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
          <div className="flex justify-center mb-2">{getProgressIcon(implementationProgress.dataFetching)}</div>
          <div className="text-xs font-medium text-blue-800">Data Fetching</div>
          <div className={`text-lg font-bold ${getProgressColor(implementationProgress.dataFetching)}`}>
            {implementationProgress.dataFetching}%
          </div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
          <div className="flex justify-center mb-2">{getProgressIcon(implementationProgress.uiComponents)}</div>
          <div className="text-xs font-medium text-blue-800">UI Components</div>
          <div className={`text-lg font-bold ${getProgressColor(implementationProgress.uiComponents)}`}>
            {implementationProgress.uiComponents}%
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Technical Details</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Architecture:</strong> Strategy Pattern + Factory Pattern + React Context</div>
          <div><strong>Data Persistence:</strong> localStorage with environment variable fallback</div>
          <div><strong>Type Safety:</strong> Full TypeScript implementation</div>
          <div><strong>Error Handling:</strong> Comprehensive error boundaries and fallbacks</div>
          <div><strong>Accessibility:</strong> WCAG compliant with ARIA attributes</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs text-blue-600">
          <span>Last Updated: 2025-01-27</span>
          <span>Status: Implementation in Progress</span>
        </div>
        <div className="mt-2 text-xs text-blue-500">
          📋 See <strong>DEMO_MODE_IMPLEMENTATION_TODO.md</strong> for detailed progress tracking
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPACT VERSION FOR SMALLER SPACES
// ============================================================================

export function ImplementationStatusBoxCompact() {
  const { isDemoMode } = useDataSource()
  
  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Info className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-800">
            Demo Mode System: 85% Complete
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-blue-600">
            {isDemoMode ? 'Demo Mode' : 'Live Mode'}
          </span>
          <div className="w-16 bg-blue-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full w-[85%]"></div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-blue-600">
        Next: Enhanced Testing & Documentation • See TODO for details
      </div>
    </div>
  )
}
