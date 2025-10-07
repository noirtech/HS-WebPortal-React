'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { formatCurrency, formatDate, formatTime } from '@/i18n/config'
import { type Locale } from '@/i18n/config'
import { useState, useEffect } from 'react'
import { Loader2, Globe, MapPin, Phone, Mail, Anchor, X, Eye, CheckCircle, AlertCircle, Settings, Save, Upload, Download, Trash2, FolderOpen, RotateCcw, Search, Play, Clock, CheckSquare, XCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { useSession } from 'next-auth/react'

// Mock Web API data for marinas - Empty array to simulate no data initially
const mockMarinasData: Marina[] = []

interface SavedConfig {
  id: string
  name: string
  description: string
  config: {
    baseUrl: string
    endpoint: string
    authMethod: string
    credentials: string
    responseFormat: string
    httpMethod: string
  }
  createdAt: string
  lastUsed?: string
}

interface ApiEndpoint {
  path: string
  method: string
  description: string
  parameters?: string[]
  responseFields?: string[]
  status: 'discovered' | 'testing' | 'success' | 'error'
  lastTested?: string
  response?: any
}

interface ApiDiscovery {
  baseUrl: string
  endpoints: ApiEndpoint[]
  discoveredAt: string
  totalEndpoints: number
  successfulTests: number
}

interface Marina {
  id: number
  name: string
  location: string
  country: string
  coordinates: { lat: number; lng: number }
  contact: {
    phone: string
    email: string
    website: string
  }
  facilities: string[]
  berthCount: number
  maxBoatLength: number
  depth: number
  status: string
  rating: number
  lastUpdated: string
}

export default function WebAPIPage() {
  const t = useTranslations()
  const locale = useLocale() as Locale
  const { data: session } = useSession()

  // Default user fallback
  const defaultUser = {
    id: 'demo-user',
    email: 'demo@marina.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['ADMIN']
  }

  // Use session user or fallback to default
  const currentUser = session?.user ? {
    firstName: (session.user as any).firstName || 'John',
    lastName: (session.user as any).lastName || 'Doe',
    email: session.user.email || 'demo@marina.com',
    roles: ['ADMIN']
  } : defaultUser
  const [marinas, setMarinas] = useState<Marina[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState({
    baseUrl: 'https://test.havenstar.com/HSWebAPI/api',
    endpoint: '/sync/MarinaList',
    authMethod: 'bearer-token',
    credentials: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3d3dy5wcmVtaWVybWFyaW5hcy5jb20vIiwiYXVkIjoiOGJkMzYwZTJjZDAxNDkzMmJlZGY4MWNhYzY4ODMzMzEiLCJleHAiOjE3ODYyMDcxODYsIm5iZiI6MTc1NjIwNzE4Nn0.ihO_eLwXXFM937RBg7e8wAKkp3FIppj0D4pqNnNsmYg',
    responseFormat: 'json',
    httpMethod: 'POST'
  })
  const [testLoading, setTestLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
    show: boolean
  }>({ type: null, message: '', show: false })
  const [showImportModal, setShowImportModal] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [showSaveConfigModal, setShowSaveConfigModal] = useState(false)
  const [showLoadConfigModal, setShowLoadConfigModal] = useState(false)
  const [newConfigName, setNewConfigName] = useState('')
  const [newConfigDescription, setNewConfigDescription] = useState('')
  const [selectedConfigId, setSelectedConfigId] = useState<string>('')
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false)
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [apiDiscovery, setApiDiscovery] = useState<ApiDiscovery | null>(null)
  const [discoveryResults, setDiscoveryResults] = useState<ApiEndpoint[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [customEndpoints, setCustomEndpoints] = useState<string>('')
  const [showEndpointResults, setShowEndpointResults] = useState<{[key: string]: any}>({})
  const [apiConnectionStatus, setApiConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [lastConnectionTest, setLastConnectionTest] = useState<string | null>(null)
  const [persistentMarinas, setPersistentMarinas] = useState<Marina[]>([])
  const [persistentDiscoveryResults, setPersistentDiscoveryResults] = useState<ApiEndpoint[]>([])

  useEffect(() => {
    // Load saved configurations from localStorage
    const loadSavedConfigs = () => {
      try {
        const saved = localStorage.getItem('webapi-saved-configs')
        if (saved) {
          setSavedConfigs(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading saved configurations:', error)
      }
    }

    // Load persistent marinas from localStorage
    const loadPersistentMarinas = () => {
      try {
        const saved = localStorage.getItem('webapi-persistent-marinas')
        if (saved) {
          const parsedMarinas = JSON.parse(saved)
          setPersistentMarinas(parsedMarinas)
          setMarinas(parsedMarinas) // Also set the regular marinas state for compatibility
        }
      } catch (error) {
        console.error('Error loading persistent marinas:', error)
      }
    }

    // Load persistent discovery results from localStorage
    const loadPersistentDiscoveryResults = () => {
      try {
        const saved = localStorage.getItem('webapi-persistent-discovery-results')
        if (saved) {
          const parsedResults = JSON.parse(saved)
          setPersistentDiscoveryResults(parsedResults)
          setDiscoveryResults(parsedResults) // Also set the regular discovery results state for compatibility
        }
      } catch (error) {
        console.error('Error loading persistent discovery results:', error)
      }
    }

    loadSavedConfigs()
    loadPersistentMarinas()
    loadPersistentDiscoveryResults()
  }, [])



  // Remove the automatic mock data fetch - we only want persistent data from localStorage or API calls

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleConfigChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    // Reset connection status when configuration changes
    if (apiConnectionStatus !== 'idle') {
      setApiConnectionStatus('idle')
    }
  }

    const testApiConnection = async () => {
    if (!config.baseUrl || !config.endpoint) {
      showNotification('error', '❌ Please complete the configuration before testing')
      return
    }

    setTestLoading(true)
    setApiConnectionStatus('connecting')
    setNotification({ type: null, message: '', show: false })
    
    try {
      const url = `${config.baseUrl}${config.endpoint}`
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add authentication headers based on method
      if (config.authMethod === 'api-key' && config.credentials) {
        headers['X-API-Key'] = config.credentials
      } else if (config.authMethod === 'bearer-token' && config.credentials) {
        headers['Authorization'] = `Bearer ${config.credentials}`
      } else if (config.authMethod === 'basic-auth' && config.credentials) {
        headers['Authorization'] = `Basic ${btoa(config.credentials)}`
      }

      const response = await fetch(url, {
        method: config.httpMethod,
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Store the complete response
      setApiResponse({
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        timestamp: new Date().toISOString()
      })
      
      // Update connection status
      setApiConnectionStatus('connected')
      setLastConnectionTest(new Date().toISOString())
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `✅ API Connection Successful! Retrieved ${data.marinas?.length || 0} marinas`,
        show: true
      })
      
      // If we got marina data, update the state
      if (data.marinas && Array.isArray(data.marinas)) {
        setMarinas(data.marinas)
        setPersistentMarinas(data.marinas)
        setError(null)
        
        // Save to localStorage for persistence
        try {
          localStorage.setItem('webapi-persistent-marinas', JSON.stringify(data.marinas))
        } catch (error) {
          console.error('Error saving marinas to localStorage:', error)
        }
      }
      
    } catch (error) {
      console.error('API Test Error:', error)
      
      // Update connection status
      setApiConnectionStatus('error')
      setLastConnectionTest(new Date().toISOString())
      
      // Store error response
      setApiResponse({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      
      // Show error notification
      setNotification({
        type: 'error',
        message: `❌ API Connection Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        show: true
      })
    } finally {
      setTestLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true })
    setTimeout(() => {
      setNotification({ type: null, message: '', show: false })
    }, 5000)
  }

  const importPostmanCollection = () => {
    try {
      const collection = JSON.parse(importJson)
      
      // Extract variables from the collection
      const variables = collection.variable || []
      const urlVar = variables.find((v: any) => v.key === 'url')
      const tokenVar = variables.find((v: any) => v.key === 'hsToken')
      
      // Extract endpoint and method from the first item
      const firstItem = collection.item?.[0]?.item?.[0]
      const endpoint = firstItem?.request?.url?.path?.join('/') || ''
      const httpMethod = firstItem?.request?.method || 'POST'
      
      // Update configuration
      setConfig({
        baseUrl: urlVar?.value || '',
        endpoint: endpoint ? `/${endpoint}` : '',
        authMethod: tokenVar ? 'bearer-token' : 'none',
        credentials: tokenVar?.value || '',
        responseFormat: 'json',
        httpMethod: httpMethod
      })
      
      setShowImportModal(false)
      setImportJson('')
      showNotification('success', '✅ Postman collection imported successfully!')
      
    } catch (error) {
      showNotification('error', '❌ Invalid JSON format. Please check your Postman collection.')
    }
  }

  // Configuration Management Functions
  const saveConfiguration = () => {
    if (!newConfigName.trim()) {
      showNotification('error', '❌ Configuration name is required')
      return
    }

    const newConfig: SavedConfig = {
      id: Date.now().toString(),
      name: newConfigName.trim(),
      description: newConfigDescription.trim(),
      config: { ...config },
      createdAt: new Date().toISOString()
    }

    const updatedConfigs = [...savedConfigs, newConfig]
    setSavedConfigs(updatedConfigs)
    
    // Save to localStorage
    try {
      localStorage.setItem('webapi-saved-configs', JSON.stringify(updatedConfigs))
      showNotification('success', '✅ Configuration saved successfully!')
    } catch (error) {
      showNotification('error', '❌ Failed to save configuration')
      console.error('Error saving configuration:', error)
    }

    // Reset form and close modal
    setNewConfigName('')
    setNewConfigDescription('')
    setShowSaveConfigModal(false)
  }

  const loadConfiguration = (savedConfig: SavedConfig) => {
    setConfig(savedConfig.config)
    
    // Update last used timestamp
    const updatedConfigs = savedConfigs.map(c => 
      c.id === savedConfig.id 
        ? { ...c, lastUsed: new Date().toISOString() }
        : c
    )
    setSavedConfigs(updatedConfigs)
    
    try {
      localStorage.setItem('webapi-saved-configs', JSON.stringify(updatedConfigs))
    } catch (error) {
      console.error('Error updating configuration usage:', error)
    }

    showNotification('success', `✅ Loaded configuration: ${savedConfig.name}`)
    
    // Close modals if they're open
    setShowLoadConfigModal(false)
    setShowSaveConfigModal(false)
  }

  const deleteConfiguration = (configToDelete: SavedConfig | string) => {
    const configId = typeof configToDelete === 'string' ? configToDelete : configToDelete.id
    const updatedConfigs = savedConfigs.filter(c => c.id !== configId)
    setSavedConfigs(updatedConfigs)
    
    // Clear selected config if it was the one being deleted
    if (selectedConfigId === configId) {
      setSelectedConfigId('')
    }
    
    try {
      localStorage.setItem('webapi-saved-configs', JSON.stringify(updatedConfigs))
      showNotification('success', '✅ Configuration deleted successfully!')
    } catch (error) {
      showNotification('error', '❌ Failed to delete configuration')
      console.error('Error deleting configuration:', error)
    }
  }

  const exportConfiguration = (configToExport?: SavedConfig) => {
    const configData = configToExport || {
      name: 'Current Configuration',
      description: 'Exported configuration',
      config: { ...config },
      exportedAt: new Date().toISOString()
    }

    const exportData = {
      name: configData.name,
      description: configData.description,
      config: configData.config,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webapi-config-${configData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showNotification('success', `✅ Configuration "${configData.name}" exported successfully!`)
  }

  // API Discovery Functions
  const commonMarinaEndpoints = [
    { path: '/sync/MarinaList', method: 'POST', description: 'List all marinas' },
    { path: '/sync/BoatList', method: 'POST', description: 'List all boats' },
    { path: '/sync/CustomerList', method: 'POST', description: 'List all customers' },
    { path: '/sync/BerthList', method: 'POST', description: 'List all berths' },
    { path: '/sync/BookingList', method: 'POST', description: 'List all bookings' },
    { path: '/sync/PaymentList', method: 'POST', description: 'List all payments' },
    { path: '/sync/InvoiceList', method: 'POST', description: 'List all invoices' },
    { path: '/sync/ContractList', method: 'POST', description: 'List all contracts' },
    { path: '/sync/ServiceList', method: 'POST', description: 'List all services' },
    { path: '/sync/ReportList', method: 'POST', description: 'List all reports' },
    { path: '/api/endpoints', method: 'GET', description: 'API endpoints discovery' },
    { path: '/api/docs', method: 'GET', description: 'API documentation' },
    { path: '/api/swagger', method: 'GET', description: 'Swagger documentation' },
    { path: '/api/openapi', method: 'GET', description: 'OpenAPI specification' }
  ]

  const testEndpoint = async (endpoint: ApiEndpoint): Promise<ApiEndpoint> => {
    const url = `${config.baseUrl}${endpoint.path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (config.authMethod === 'bearer-token' && config.credentials) {
      headers['Authorization'] = `Bearer ${config.credentials}`
    } else if (config.authMethod === 'api-key' && config.credentials) {
      headers['X-API-Key'] = config.credentials
    }

    try {
      const response = await fetch(url, {
        method: endpoint.method,
        headers
      })

      const data = await response.json()
      
      return {
        ...endpoint,
        status: response.ok ? 'success' : 'error',
        lastTested: new Date().toISOString(),
        response: data,
        responseFields: response.ok ? extractResponseFields(data) : []
      }
    } catch (error) {
      return {
        ...endpoint,
        status: 'error',
        lastTested: new Date().toISOString(),
        response: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  const extractResponseFields = (data: any): string[] => {
    const fields: string[] = []
    
    if (Array.isArray(data)) {
      if (data.length > 0) {
        fields.push(...Object.keys(data[0]))
      }
    } else if (typeof data === 'object' && data !== null) {
      fields.push(...Object.keys(data))
    }
    
    return fields
  }

  const startApiDiscovery = async () => {
    setDiscoveryLoading(true)
    setDiscoveryResults([])
    
    const endpoints: ApiEndpoint[] = commonMarinaEndpoints.map(ep => ({
      ...ep,
      status: 'discovered' as const
    }))
    
    setDiscoveryResults(endpoints)
    
    // Test each endpoint
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      const updatedEndpoint: ApiEndpoint = { ...endpoint, status: 'testing' as const }
      setDiscoveryResults(prev => prev.map((ep, index) => 
        index === i ? updatedEndpoint : ep
      ))
      
      const result = await testEndpoint(endpoint)
      
      const updatedResults = discoveryResults.map((ep, index) => 
        index === i ? result : ep
      )
      setDiscoveryResults(updatedResults)
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    const finalResults = discoveryResults
    const successfulTests = finalResults.filter(ep => ep.status === 'success').length
    
    setApiDiscovery({
      baseUrl: config.baseUrl,
      endpoints: finalResults,
      discoveredAt: new Date().toISOString(),
      totalEndpoints: endpoints.length,
      successfulTests
    })
    
    // Save to persistent state and localStorage
    setPersistentDiscoveryResults(finalResults)
    try {
      localStorage.setItem('webapi-persistent-discovery-results', JSON.stringify(finalResults))
    } catch (error) {
      console.error('Error saving discovery results to localStorage:', error)
    }
    
    setDiscoveryLoading(false)
    showNotification('success', `✅ API Discovery complete! Found ${successfulTests} working endpoints`)
  }

  const selectEndpointForUse = (endpoint: ApiEndpoint) => {
    setConfig(prev => ({
      ...prev,
      endpoint: endpoint.path,
      httpMethod: endpoint.method
    }))
    setSelectedEndpoint(null)
    showNotification('success', `✅ Selected endpoint: ${endpoint.path}`)
  }

  const clearPersistentMarinas = () => {
    setMarinas([])
    setPersistentMarinas([])
    try {
      localStorage.removeItem('webapi-persistent-marinas')
      showNotification('success', '✅ Marina data cleared')
    } catch (error) {
      console.error('Error clearing marinas from localStorage:', error)
      showNotification('error', '❌ Error clearing marina data')
    }
  }

  const clearPersistentDiscoveryResults = () => {
    setDiscoveryResults([])
    setPersistentDiscoveryResults([])
    try {
      localStorage.removeItem('webapi-persistent-discovery-results')
      showNotification('success', '✅ Discovery results cleared')
    } catch (error) {
      console.error('Error clearing discovery results from localStorage:', error)
      showNotification('error', '❌ Error clearing discovery results')
    }
  }

  // Custom endpoint discovery functions
  const parseCustomEndpoints = (endpointText: string): ApiEndpoint[] => {
    const lines = endpointText.split('\n').filter(line => line.trim())
    return lines.map((line, index) => {
      const trimmed = line.trim()
      // Support formats like: "/endpoint" or "POST /endpoint" or "GET /endpoint Description"
      const parts = trimmed.split(' ')
      let method = 'GET'
      let path = ''
      let description = ''
      
      if (parts.length >= 2 && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(parts[0].toUpperCase())) {
        method = parts[0].toUpperCase()
        path = parts[1]
        description = parts.slice(2).join(' ') || `${method} ${path}`
      } else {
        path = parts[0]
        description = `${path} endpoint`
      }
      
      return {
        path: path.startsWith('/') ? path : `/${path}`,
        method,
        description,
        status: 'discovered' as const
      }
    })
  }

  const testCustomEndpoints = async () => {
    if (!customEndpoints.trim()) {
      showNotification('error', '❌ Please enter at least one endpoint to test')
      return
    }

    if (!config.baseUrl) {
      showNotification('error', '❌ Please configure the base URL first')
      return
    }

    setDiscoveryLoading(true)
    setDiscoveryResults([])
    setShowEndpointResults({})
    
    const endpoints = parseCustomEndpoints(customEndpoints)
    setDiscoveryResults(endpoints)
    
    // Test each endpoint with real-time updates
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      
      // Update status to testing
      const testingEndpoint: ApiEndpoint = { ...endpoint, status: 'testing' as const }
      setDiscoveryResults(prev => prev.map((ep, index) => 
        index === i ? testingEndpoint : ep
      ))
      
      // Test the endpoint
      const result = await testEndpoint(endpoint)
      
      // Update results
      setDiscoveryResults(prev => prev.map((ep, index) => 
        index === i ? result : ep
      ))
      
      // Store response data for viewing
      if (result.response) {
        setShowEndpointResults(prev => ({
          ...prev,
          [`${result.method}-${result.path}`]: result.response
        }))
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Save to persistent state
    const finalResults = discoveryResults
    const successfulTests = finalResults.filter(ep => ep.status === 'success').length
    
    setPersistentDiscoveryResults(finalResults)
    try {
      localStorage.setItem('webapi-persistent-discovery-results', JSON.stringify(finalResults))
    } catch (error) {
      console.error('Error saving discovery results to localStorage:', error)
    }
    
    setDiscoveryLoading(false)
    showNotification('success', `✅ Custom endpoint testing complete! ${successfulTests}/${endpoints.length} endpoints working`)
  }

  const viewEndpointResults = (endpoint: ApiEndpoint) => {
    const resultKey = `${endpoint.method}-${endpoint.path}`
    const responseData = showEndpointResults[resultKey]
    
    if (responseData) {
      setSelectedEndpoint({
        ...endpoint,
        response: responseData
      })
    } else {
      showNotification('error', '❌ No response data available for this endpoint')
    }
  }

  return (
    <AppLayout user={currentUser}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        
        {/* Notification Toast */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : notification.type === 'error'
              ? 'bg-red-50 border-red-400 text-red-800'
              : 'bg-blue-50 border-blue-400 text-blue-800'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <Globe className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
                {apiResponse && (
                  <button
                    onClick={() => setShowResponseModal(true)}
                    className="mt-2 text-xs underline hover:no-underline flex items-center"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Full Response
                  </button>
                )}
              </div>
              <button
                onClick={() => setNotification({ type: null, message: '', show: false })}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && apiResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  API Response Details
                </h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Response Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">URL:</span> {apiResponse.url || 'N/A'}</div>
                        <div><span className="font-medium">Status:</span> {apiResponse.status || 'Error'}</div>
                        <div><span className="font-medium">Timestamp:</span> {new Date(apiResponse.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Response Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Marinas Found:</span> {apiResponse.data?.marinas?.length || 0}</div>
                        <div><span className="font-medium">Total Records:</span> {apiResponse.data?.total || 'N/A'}</div>
                        <div><span className="font-medium">Response Size:</span> {apiResponse.data ? JSON.stringify(apiResponse.data).length : 0} bytes</div>
                      </div>
                    </div>
                  </div>

                  {/* Response Headers */}
                  {apiResponse.headers && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Response Headers</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(apiResponse.headers, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Response Data */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Response Data</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(apiResponse.data || apiResponse.error, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Import Postman Collection
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste your Postman Collection JSON:
                    </label>
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder="Paste your Postman collection JSON here..."
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                    />
                  </div>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <p className="font-medium mb-1">Supported format:</p>
                    <p>• Postman Collection v2.1.0 JSON</p>
                    <p>• Will extract URL, endpoint, and authentication token</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={importPostmanCollection}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Import Collection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Configuration Modal */}
        {showSaveConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Save Configuration
                </h3>
                <button
                  onClick={() => setShowSaveConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Configuration Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newConfigName}
                      onChange={(e) => setNewConfigName(e.target.value)}
                      placeholder="e.g., HavenStar Production API"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newConfigDescription}
                      onChange={(e) => setNewConfigDescription(e.target.value)}
                      placeholder="Brief description of this configuration..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Current Configuration:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div><span className="font-medium">Base URL:</span> {config.baseUrl || 'Not set'}</div>
                      <div><span className="font-medium">Endpoint:</span> {config.endpoint || 'Not set'}</div>
                      <div><span className="font-medium">Method:</span> {config.authMethod}</div>
                      <div><span className="font-medium">Auth:</span> {config.authMethod}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowSaveConfigModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Configuration Modal */}
        {showLoadConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Load Saved Configuration
                </h3>
                <button
                  onClick={() => setShowLoadConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {savedConfigs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Configurations</h3>
                    <p className="text-gray-600 mb-4">
                      Save your first configuration to get started.
                    </p>
                    <button
                      onClick={() => {
                        setShowLoadConfigModal(false)
                        setShowSaveConfigModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save First Configuration
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedConfigs.map((savedConfig) => (
                      <div key={savedConfig.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{savedConfig.name}</h4>
                            {savedConfig.description && (
                              <p className="text-sm text-gray-600 mb-2">{savedConfig.description}</p>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Created: {new Date(savedConfig.createdAt).toLocaleDateString()}</div>
                              {savedConfig.lastUsed && (
                                <div>Last used: {new Date(savedConfig.lastUsed).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => loadConfiguration(savedConfig)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteConfiguration(savedConfig.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              title="Delete Configuration"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="font-medium">Base URL:</span> {savedConfig.config.baseUrl || 'Not set'}</div>
                            <div><span className="font-medium">Endpoint:</span> {savedConfig.config.endpoint || 'Not set'}</div>
                            <div><span className="font-medium">Method:</span> {savedConfig.config.httpMethod}</div>
                            <div><span className="font-medium">Auth:</span> {savedConfig.config.authMethod}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowLoadConfigModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Endpoint Details Modal */}
        {selectedEndpoint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Endpoint Details: {selectedEndpoint.path}
                </h3>
                <button
                  onClick={() => setSelectedEndpoint(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Endpoint Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Endpoint Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Path:</span> {selectedEndpoint.path}</div>
                        <div><span className="font-medium">Method:</span> {selectedEndpoint.method}</div>
                        <div><span className="font-medium">Description:</span> {selectedEndpoint.description}</div>
                        <div><span className="font-medium">Status:</span> 
                          <Badge variant={selectedEndpoint.status === 'success' ? 'default' : 'destructive'} className="ml-2">
                            {selectedEndpoint.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Test Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Last Tested:</span> {selectedEndpoint.lastTested ? new Date(selectedEndpoint.lastTested).toLocaleString() : 'Never'}</div>
                        <div><span className="font-medium">Response Fields:</span> {selectedEndpoint.responseFields?.length || 0} fields</div>
                        <div><span className="font-medium">Full URL:</span> {config.baseUrl}{selectedEndpoint.path}</div>
                      </div>
                    </div>
                  </div>

                  {/* Response Fields */}
                  {selectedEndpoint.responseFields && selectedEndpoint.responseFields.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Available Response Fields</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {selectedEndpoint.responseFields.map((field, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Response Data */}
                  {selectedEndpoint.response && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Response Data</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(selectedEndpoint.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedEndpoint(null)}
                    >
                      Close
                    </Button>
                    {selectedEndpoint.status === 'success' && (
                      <Button
                        onClick={() => selectEndpointForUse(selectedEndpoint)}
                      >
                        Use This Endpoint
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header with locale switcher */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Web API Testing
            </h1>
            <p className="text-gray-600 mt-2">
              Test area for connecting to external Web APIs and displaying data
            </p>
          </div>
          <LocaleSwitcher />
        </div>

        {/* API Status Card */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Globe className="mr-2 h-5 w-5" />
              API Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {apiConnectionStatus === 'connecting' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                  ) : apiConnectionStatus === 'error' ? (
                    <div className="h-4 w-4 rounded-full bg-red-500 mr-2" />
                  ) : apiConnectionStatus === 'connected' ? (
                    <div className="h-4 w-4 rounded-full bg-green-500 mr-2" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-gray-300 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    {apiConnectionStatus === 'connecting' ? 'Connecting...' : 
                     apiConnectionStatus === 'error' ? 'Connection Failed' : 
                     apiConnectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                {apiConnectionStatus === 'error' && (
                  <Badge variant="destructive" className="text-xs">
                    Error
                  </Badge>
                )}
                {apiConnectionStatus === 'connected' && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
              </div>
              
              {/* Connection Details */}
              <div className="text-xs text-gray-500">
                {lastConnectionTest && (
                  <span>Last tested: {new Date(lastConnectionTest).toLocaleTimeString()}</span>
                )}
                {!lastConnectionTest && (
                  <span>Never tested</span>
                )}
              </div>
            </div>
            
            {/* Connection URL */}
            {config.baseUrl && config.endpoint && (
              <div className="mt-2 text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {config.baseUrl}{config.endpoint}
              </div>
            )}
          </CardContent>
        </Card>

                 {/* Marinas Section */}
         <div className="mb-6">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-gray-900">Marina Data Display</h2>
             <div className="flex items-center space-x-2">
               <Badge variant="outline">
                 {persistentMarinas.length} Marinas
               </Badge>
             </div>
           </div>

          {/* Data Inspector - Temporary Debug Section */}
          {persistentMarinas.length > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-orange-900 text-sm">
                  🔍 Data Inspector (Debug)
                  <Badge variant="secondary" className="ml-2 text-xs">{persistentMarinas.length} marinas loaded</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-orange-900 mb-1 text-xs">First Marina Structure:</h4>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(persistentMarinas[0], null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-900 mb-1 text-xs">Marina Names (All {persistentMarinas.length}):</h4>
                    <div className="text-xs max-h-40 overflow-auto bg-white p-2 rounded border">
                      {persistentMarinas.map((marina, index) => (
                        <div key={index} className="mb-1">
                          {index + 1}. {(marina as any).marinaName || (marina as any).name || (marina as any).Name || 'No name found'} 
                          (ID: {(marina as any).marinaID || (marina as any).id || (marina as any).Id || 'No ID'})
                          {((marina as any).marinaCode) && ` - Code: ${(marina as any).marinaCode}`}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons - Above Marina Cards */}
          {persistentMarinas.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearPersistentMarinas}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Marinas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                {persistentMarinas.length} marina{persistentMarinas.length !== 1 ? 's' : ''} loaded
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading marina data from Web API...</p>
              </div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">API Connection Error</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : persistentMarinas.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Anchor className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Marina Data</h3>
                <p className="text-gray-600 mb-4">
                  Marina cards will appear here when you successfully test an API connection and retrieve marina data.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>To get started:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Configure your API settings above</li>
                    <li>• Click "Test Connection" to fetch marina data</li>
                    <li>• Marina cards will display automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

           {/* Marina Cards - Display when data is available */}
           {persistentMarinas.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
               {persistentMarinas.map((marina, index) => (
                 <Card key={`marina-${(marina as any).marinaID || index}`} className="hover:shadow-lg transition-shadow">
                   <CardHeader>
                     <div className="flex justify-between items-start">
                       <CardTitle className="text-lg">{(marina as any).marinaName || 'Unnamed Marina'}</CardTitle>
                       <Badge className="bg-blue-100 text-blue-800">
                         {(marina as any).marinaCode || 'N/A'}
                       </Badge>
                     </div>
                     <div className="flex items-center text-sm text-gray-600">
                       <MapPin className="h-4 w-4 mr-1" />
                       Marina ID: {(marina as any).marinaID}
                     </div>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     {/* Marina Code */}
                     {(marina as any).marinaCode && (
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium">Code:</span>
                         <div className="flex items-center">
                           <span className="font-bold text-blue-600">
                             {(marina as any).marinaCode}
                           </span>
                         </div>
                       </div>
                     )}

                     {/* Raw Data Debug (temporary) */}
                     <details className="text-xs">
                       <summary className="cursor-pointer text-gray-500">Debug: Raw Marina Data</summary>
                       <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                         {JSON.stringify(marina, null, 2)}
                       </pre>
                     </details>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </div>



         {/* Main Configuration Section */}
         <Card className="mb-4">
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center text-lg">
               <Globe className="mr-2 h-5 w-5" />
               Web API Configuration
             </CardTitle>
             {/* VPN Reminder */}
             <div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg shadow-sm">
               <div className="flex items-center">
                 <div className="flex-shrink-0">
                   <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                     <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                 </div>
                 <div className="ml-4">
                   <p className="text-base font-semibold text-amber-800">
                     🔒 VPN Connection Required
                   </p>
                   <p className="text-sm text-amber-700 mt-1">
                     Please ensure you're connected to the <span className="font-medium">Wallingford All-Traffic VPN</span> to access the WebAPI
                   </p>
                 </div>
               </div>
             </div>
           </CardHeader>
           <CardContent>
             {/* Essential Settings - Always Visible */}
             <div className="space-y-4">
               {/* Connection Settings - Compact Grid */}
               <div>
                 <h4 className="font-semibold mb-2 flex items-center text-sm">
                   <span>Connection Settings</span>
                   <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">
                       Base URL <span className="text-red-500">*</span>
                     </label>
                     <input 
                       type="text" 
                       value={config.baseUrl}
                       onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                       placeholder="https://api.example.com" 
                       className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">
                       Endpoint
                     </label>
                     <input 
                       type="text" 
                       value={config.endpoint}
                       onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                       placeholder="/marinas" 
                       className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">
                       Auth Method
                     </label>
                     <select 
                       value={config.authMethod}
                       onChange={(e) => handleConfigChange('authMethod', e.target.value)}
                       className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     >
                       <option value="none">No Authentication</option>
                       <option value="api-key">API Key</option>
                       <option value="bearer-token">Bearer Token</option>
                       <option value="basic-auth">Basic Authentication</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">
                       Credentials
                     </label>
                     <input 
                       type="password" 
                       value={config.credentials}
                       onChange={(e) => handleConfigChange('credentials', e.target.value)}
                       placeholder="API key or token" 
                       className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     />
                   </div>
                 </div>
               </div>
               
               {/* Data Settings - Compact Row */}
               <div>
                 <h4 className="font-semibold mb-2 flex items-center text-sm">
                   <span>Data Settings</span>
                   <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                 </h4>
                 <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center space-x-2">
                     <label className="text-xs font-medium text-gray-700">Format:</label>
                     <select className="px-2 py-1 border border-gray-300 rounded text-xs">
                       <option value="json">JSON</option>
                       <option value="xml">XML</option>
                       <option value="csv">CSV</option>
                     </select>
                   </div>
                   <div className="flex items-center space-x-2">
                     <input type="checkbox" id="enable-pagination" className="rounded text-xs" />
                     <label htmlFor="enable-pagination" className="text-xs text-gray-700">
                       Pagination
                     </label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <input type="checkbox" id="enable-caching" className="rounded text-xs" />
                     <label htmlFor="enable-caching" className="text-xs text-gray-700">
                       Caching
                     </label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <label className="text-xs font-medium text-gray-700">Timeout:</label>
                     <input 
                       type="number" 
                       placeholder="5000" 
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                     />
                   </div>
                 </div>
               </div>
             </div>

                           {/* Action Buttons - Prominent */}
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={testApiConnection}
                    disabled={testLoading || !config.baseUrl}
                  >
                    {testLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    {testLoading ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </div>

             {/* Advanced Settings - Collapsible */}
             <div className="mt-6 border-t pt-4">
               <details className="group">
                 <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center">
                   <span>Advanced Settings</span>
                   <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                 </summary>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Retry Attempts</label>
                       <input 
                         type="number" 
                         placeholder="3" 
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (requests/min)</label>
                       <input 
                         type="number" 
                         placeholder="60" 
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Custom Headers</label>
                       <textarea 
                         placeholder="X-Custom-Header: value&#10;Accept: application/json"
                         rows={3}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                       />
                     </div>
                   </div>
                   <div className="space-y-3">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Query Parameters</label>
                       <textarea 
                         placeholder="limit=50&#10;sort=name&#10;filter=active"
                         rows={2}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Data Structure</label>
                       <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                         <p className="font-medium mb-1">Expected Response:</p>
                         <code className="text-xs">
                           {`{
   "marinas": [...],
   "total": 150,
   "page": 1
 }`}
                         </code>
                       </div>
                     </div>
                   </div>
                 </div>
               </details>
             </div>
           </CardContent>
         </Card>

         {/* Configuration Management Section */}
         <Card className="mb-6">
           <CardHeader>
             <CardTitle className="flex items-center">
               <Settings className="h-5 w-5 mr-2" />
               Configuration Management
             </CardTitle>
             <CardDescription>
               Save, load, and manage your API configurations
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             {/* Current Configuration Display */}
             <div className="bg-gray-50 p-4 rounded-lg">
               <h4 className="font-medium text-gray-900 mb-3">Current Configuration</h4>
               <div className="grid grid-cols-2 gap-3 text-sm">
                 <div>
                   <span className="text-gray-600">Base URL:</span>
                   <div className="font-mono text-gray-800 truncate">{config.baseUrl}</div>
                 </div>
                 <div>
                   <span className="text-gray-600">Endpoint:</span>
                   <div className="font-mono text-gray-800 truncate">{config.endpoint}</div>
                 </div>
                 <div>
                   <span className="text-gray-600">Method:</span>
                   <div className="font-mono text-gray-800">{config.httpMethod}</div>
                 </div>
                 <div>
                   <span className="text-gray-600">Auth:</span>
                   <div className="font-mono text-gray-800 truncate">{config.authMethod}</div>
                 </div>
               </div>
             </div>

             {/* Saved Configurations Dropdown */}
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-medium text-gray-700">Saved Configurations</label>
                 <Badge variant="secondary" className="text-xs">
                   {savedConfigs.length} saved
                 </Badge>
               </div>
               
               {savedConfigs.length > 0 ? (
                 <div className="space-y-2">
                   <Select onValueChange={(value) => {
                     setSelectedConfigId(value)
                     const selectedConfig = savedConfigs.find(c => c.id === value)
                     if (selectedConfig) {
                       loadConfiguration(selectedConfig)
                     }
                   }} value={selectedConfigId}>
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Select a saved configuration..." />
                     </SelectTrigger>
                     <SelectContent>
                       {savedConfigs.map((savedConfig) => (
                         <SelectItem key={savedConfig.id} value={savedConfig.id}>
                           <div className="flex flex-col">
                             <span className="font-medium">{savedConfig.name}</span>
                             <span className="text-xs text-gray-500 truncate">
                               {savedConfig.config.baseUrl}/{savedConfig.config.endpoint}
                             </span>
                           </div>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   
                   {/* Quick Actions for Selected Config */}
                   <div className="flex gap-2">
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => {
                         if (selectedConfigId) {
                           const config = savedConfigs.find(c => c.id === selectedConfigId)
                           if (config) {
                             deleteConfiguration(config)
                             setSelectedConfigId('')
                           }
                         }
                       }}
                       disabled={!selectedConfigId}
                       className="flex-1"
                     >
                       <Trash2 className="h-4 w-4 mr-2" />
                       Delete Selected
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => {
                         if (selectedConfigId) {
                           const config = savedConfigs.find(c => c.id === selectedConfigId)
                           if (config) {
                             exportConfiguration(config)
                           }
                         }
                       }}
                       disabled={!selectedConfigId}
                       className="flex-1"
                     >
                       <Download className="h-4 w-4 mr-2" />
                       Export Selected
                     </Button>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-6 text-gray-500">
                   <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                   <p className="text-sm">No saved configurations yet</p>
                   <p className="text-xs">Save your first configuration to get started</p>
                 </div>
               )}
             </div>

             {/* Save Current Configuration */}
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-medium text-gray-700">Save Current Configuration</label>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => {
                     if (!config.baseUrl || !config.endpoint) {
                       showNotification('error', '❌ Please complete the configuration before saving')
                       return
                     }
                     setShowSaveConfigModal(true)
                   }}
                   disabled={!config.baseUrl || !config.endpoint}
                 >
                   <Save className="h-4 w-4 mr-2" />
                   Save Configuration
                 </Button>
               </div>
               
               {(!config.baseUrl || !config.endpoint) && (
                 <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                   ⚠️ Complete the configuration above before saving
                 </div>
               )}
             </div>

             {/* Import Section */}
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-medium text-gray-700">Import Configuration</label>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => {
                     setShowImportModal(true)
                     showNotification('info', 'ℹ️ Paste your Postman collection or exported configuration JSON')
                   }}
                 >
                   <Upload className="h-4 w-4 mr-2" />
                   Import JSON
                 </Button>
               </div>
               <div className="text-xs text-gray-500">
                 Import Postman collections or exported configurations
               </div>
             </div>

             {/* Quick Actions */}
             <div className="flex gap-2 pt-2">
                                <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => {
                     setConfig({
                       baseUrl: 'https://test.havenstar.com/HSWebAPI/api',
                       endpoint: 'sync/MarinaList',
                       authMethod: 'Bearer Token',
                       credentials: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3d3dy5wcmVtaWVybWFyaW5hcy5jb20vIiwiYXVkIjoiOGJkMzYwZTJjZDAxNDkzMmJlZGY4MWNhYzY4ODMzMzEiLCJleHAiOjE3ODYyMDcxODYsIm5iZiI6MTc1NjIwNzE4Nn0.ihO_eLwXXFM937RBg7e8wAKkp3FIppj0D4pqNnNsmYg',
                       responseFormat: 'JSON',
                       httpMethod: 'POST'
                     })
                     showNotification('success', '✅ Reset to HavenStar configuration')
                   }}
                   className="flex-1"
                 >
                   <RotateCcw className="h-4 w-4 mr-2" />
                   Reset to HavenStar
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => {
                     setConfig({
                       baseUrl: '',
                       endpoint: '',
                       authMethod: 'None',
                       credentials: '',
                       responseFormat: 'JSON',
                       httpMethod: 'GET'
                     })
                     showNotification('success', '✅ Configuration cleared')
                   }}
                   className="flex-1"
                 >
                   <X className="h-4 w-4 mr-2" />
                   Clear All
                 </Button>
             </div>
           </CardContent>
         </Card>

         {/* Enhanced API Discovery Section */}
         <Card className="mb-4">
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center text-lg">
               <Search className="mr-2 h-5 w-5" />
               API Discovery & Testing
             </CardTitle>
             <CardDescription className="text-sm">
               Enter custom endpoints to test and discover API capabilities
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-6">
               {/* Endpoint Input Section */}
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Enter Endpoints to Test
                   </label>
                   <div className="space-y-3">
                     <textarea
                       value={customEndpoints}
                       onChange={(e) => setCustomEndpoints(e.target.value)}
                       placeholder={`Enter one endpoint per line. Examples:
/sync/MarinaList
POST /sync/BoatList
GET /api/customers List all customers
PUT /api/update-marina Update marina data`}
                       rows={6}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                     />
                     <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                       <p className="font-medium mb-1">Supported formats:</p>
                       <ul className="space-y-1">
                         <li>• <code>/endpoint</code> - Uses GET method</li>
                         <li>• <code>POST /endpoint</code> - Specify HTTP method</li>
                         <li>• <code>GET /endpoint Description</code> - Add description</li>
                         <li>• One endpoint per line</li>
                       </ul>
                     </div>
                   </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <Button 
                       onClick={testCustomEndpoints}
                       disabled={discoveryLoading || !customEndpoints.trim() || !config.baseUrl}
                       className="flex items-center"
                     >
                       {discoveryLoading ? (
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       ) : (
                         <Play className="mr-2 h-4 w-4" />
                       )}
                       {discoveryLoading ? 'Testing Endpoints...' : 'Test Endpoints'}
                     </Button>
                     
                     {persistentDiscoveryResults.length > 0 && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={clearPersistentDiscoveryResults}
                         className="text-red-600 border-red-300 hover:bg-red-50"
                       >
                         <X className="h-4 w-4 mr-2" />
                         Clear Results
                       </Button>
                     )}
                   </div>
                   
                   {!config.baseUrl && (
                     <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded">
                       ⚠️ Configure base URL above first
                     </div>
                   )}
                 </div>
               </div>

               {/* Real-time Testing Progress */}
               {discoveryLoading && (
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="font-semibold text-sm">Testing Endpoints...</h4>
                     <div className="flex items-center space-x-2 text-xs">
                       <span className="text-gray-600">Progress:</span>
                       <Badge variant="outline" className="text-xs">
                         {discoveryResults.filter(ep => ep.status === 'testing').length} testing
                       </Badge>
                       <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                         {discoveryResults.filter(ep => ep.status === 'success').length} success
                       </Badge>
                       <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                         {discoveryResults.filter(ep => ep.status === 'error').length} failed
                       </Badge>
                     </div>
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div 
                       className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                       style={{ 
                         width: `${(discoveryResults.filter(ep => ep.status !== 'discovered').length / discoveryResults.length) * 100}%` 
                       }}
                     />
                   </div>
                 </div>
               )}

               {/* Results Display */}
               {persistentDiscoveryResults.length > 0 && (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="font-semibold text-sm">Test Results</h4>
                     <div className="flex items-center space-x-2 text-xs">
                       <span className="text-gray-600">Summary:</span>
                       <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                         {persistentDiscoveryResults.filter(ep => ep.status === 'success').length} working
                       </Badge>
                       <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                         {persistentDiscoveryResults.filter(ep => ep.status === 'error').length} failed
                       </Badge>
                     </div>
                   </div>
                   
                   {/* Results Grid */}
                   <div className="space-y-2">
                     {persistentDiscoveryResults.map((endpoint, index) => (
                       <div 
                         key={`${endpoint.path}-${endpoint.method}-${index}`}
                         className={`p-4 rounded-lg border transition-all ${
                           endpoint.status === 'success' 
                             ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                             : endpoint.status === 'error'
                             ? 'bg-red-50 border-red-200 hover:bg-red-100'
                             : endpoint.status === 'testing'
                             ? 'bg-blue-50 border-blue-200'
                             : 'bg-white border-gray-200'
                         }`}
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center space-x-3 mb-2">
                               <Badge 
                                 variant="outline" 
                                 className={`text-xs font-mono ${
                                   endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                   endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                                   endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                   endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                   'bg-gray-100 text-gray-800'
                                 }`}
                               >
                                 {endpoint.method}
                               </Badge>
                               <span className="font-medium text-gray-900 text-sm font-mono">
                                 {endpoint.path}
                               </span>
                               {endpoint.status === 'success' && (
                                 <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                               )}
                               {endpoint.status === 'error' && (
                                 <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                               )}
                               {endpoint.status === 'testing' && (
                                 <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                               )}
                             </div>
                             
                             <p className="text-sm text-gray-600 mb-2">
                               {endpoint.description}
                             </p>
                             
                             {/* Response Fields Preview */}
                             {endpoint.status === 'success' && endpoint.responseFields && endpoint.responseFields.length > 0 && (
                               <div className="mb-2">
                                 <p className="text-xs font-medium text-gray-700 mb-1">Available Fields:</p>
                                 <div className="flex flex-wrap gap-1">
                                   {endpoint.responseFields.slice(0, 6).map((field, fieldIndex) => (
                                     <Badge key={fieldIndex} variant="secondary" className="text-xs">
                                       {field}
                                     </Badge>
                                   ))}
                                   {endpoint.responseFields.length > 6 && (
                                     <Badge variant="secondary" className="text-xs">
                                       +{endpoint.responseFields.length - 6} more
                                     </Badge>
                                   )}
                                 </div>
                               </div>
                             )}
                             
                             {/* Error Message */}
                             {endpoint.status === 'error' && endpoint.response && (
                               <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                                 <span className="font-medium">Error:</span> {endpoint.response.error || 'Request failed'}
                               </div>
                             )}
                           </div>
                           
                           {/* Action Buttons */}
                           <div className="flex items-center space-x-2 ml-4">
                             {endpoint.status === 'success' && (
                               <>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => viewEndpointResults(endpoint)}
                                   className="text-xs h-7 px-3"
                                 >
                                   <Eye className="h-3 w-3 mr-1" />
                                   View Results
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => selectEndpointForUse(endpoint)}
                                   className="text-xs h-7 px-3"
                                 >
                                   Use This Endpoint
                                 </Button>
                               </>
                             )}
                             <Button
                               size="sm"
                               variant="ghost"
                               onClick={() => setSelectedEndpoint(endpoint)}
                               className="text-xs h-7 px-3"
                             >
                               Details
                             </Button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Empty State */}
               {!discoveryLoading && persistentDiscoveryResults.length === 0 && (
                 <div className="text-center py-12">
                   <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test Endpoints</h3>
                   <p className="text-gray-600 mb-6 max-w-md mx-auto">
                     Enter the endpoints you want to test above, then click "Test Endpoints" to see their status and response data.
                   </p>
                   <div className="text-sm text-gray-500 max-w-lg mx-auto">
                     <p className="font-medium mb-2">Example endpoints you might want to test:</p>
                     <div className="bg-gray-50 p-4 rounded-lg text-left">
                       <pre className="text-xs text-gray-700">{`/sync/MarinaList
POST /sync/BoatList
GET /api/customers
PUT /api/marina/update
DELETE /api/old-data`}</pre>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>

         {/* Marina Data Display Section - REMOVED DUPLICATE */}

        {/* API Information */}
        <Card>
          <CardHeader>
            <CardTitle>Web API Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Current Implementation</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dynamic card creation from API data</li>
                  <li>• Loading states and error handling</li>
                  <li>• Responsive card layout</li>
                  <li>• Real-time status indicators</li>
                  <li>• Configurable API endpoints</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Ready for Integration</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Connect to actual Web API endpoint</li>
                  <li>• Add authentication headers</li>
                  <li>• Implement data refresh functionality</li>
                  <li>• Add filtering and search capabilities</li>
                  <li>• Handle pagination for large datasets</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AppLayout>
  )
}
