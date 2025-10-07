'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, X, Save, Loader2, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

// Zod validation schema for contract creation
const ContractFormSchema = z.object({
  contractNumber: z.string()
    .min(1, 'Contract number is required')
    .regex(/^CTR-\d{4}-\d{2}-\d{3}$/, 'Contract number must follow format CTR-YYYY-MM-XXX')
    .max(50, 'Contract number must be less than 50 characters'),
  
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, 'Start date cannot be in the past'),
  
  endDate: z.string()
    .min(1, 'End date is required'),
  
  monthlyRate: z.string()
    .min(1, 'Monthly rate is required')
    .refine((rate) => {
      const numRate = parseFloat(rate)
      return !isNaN(numRate) && numRate > 0 && numRate <= 10000
    }, 'Monthly rate must be a positive number between £0.01 and £10,000'),
  
  customerId: z.string()
    .min(1, 'Boat owner selection is required')
    .uuid('Invalid customer ID format'),
  
  boatId: z.string()
    .min(1, 'Boat selection is required')
    .uuid('Invalid boat ID format'),
  
  berthId: z.string()
    .optional()
    .refine((berthId) => {
      if (berthId === 'none' || berthId === '') return true
      return berthId && berthId.length > 0
    }, 'Invalid berth selection')
})

type ContractFormData = z.infer<typeof ContractFormSchema>

interface Owner {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Boat {
  id: string
  name: string
  registration: string
}

interface Berth {
  id: string
  berthNumber: string
  isAvailable: boolean
}

interface ContractFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function ContractForm({ onClose, onSuccess }: ContractFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [owners, setOwners] = useState<Owner[]>([])
  const [boats, setBoats] = useState<Boat[]>([])
  const [berths, setBerths] = useState<Berth[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: '',
    startDate: '',
    endDate: '',
    monthlyRate: '',
    customerId: '',
    boatId: '',
    berthId: ''
  })

  // Fetch owners, boats, and berths for the form
  useEffect(() => {
    const fetchFormData = async () => {
      logger.debug('CONTRACT FORM: Starting to fetch form data')
      try {
        // Fetch owners
        logger.debug('CONTRACT FORM: Fetching owners')
        const customersResponse = await fetch('/api/customers')
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          logger.info('CONTRACT FORM: Customers fetched successfully', { count: customersData.length })
          setOwners(customersData)
        } else {
          logger.warn('CONTRACT FORM: Customers fetch failed', { status: customersResponse.status })
        }

        // Fetch boats
        logger.debug('CONTRACT FORM: Fetching boats')
        const boatsResponse = await fetch('/api/boats')
        if (boatsResponse.ok) {
          const boatsData = await boatsResponse.json()
          logger.info('CONTRACT FORM: Boats fetched successfully', { count: boatsData.length })
          setBoats(boatsData)
        } else {
          logger.warn('CONTRACT FORM: Boats fetch failed', { status: boatsResponse.status })
        }

        // Fetch available berths
        const berthsResponse = await fetch('/api/berths')
        if (berthsResponse.ok) {
          const berthsData = await berthsResponse.json()
          setBerths(berthsData.filter((berth: Berth) => berth.isAvailable))
        }
      } catch (error) {
        logger.error('Error fetching form data', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    fetchFormData()
  }, [])

  // Validate form data using Zod schema
  const validateForm = (data: ContractFormData): Record<string, string> => {
    try {
      ContractFormSchema.parse(data)
      return {}
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message
          }
        })
        return errors
      }
      return { general: 'Validation failed' }
    }
  }

  // Validate specific field
  const validateField = (field: keyof ContractFormData, value: string): string => {
    try {
      const testData = { ...formData, [field]: value }
      ContractFormSchema.parse(testData)
      return ''
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === field)
        return fieldError ? fieldError.message : ''
      }
      return ''
    }
  }

  // Helper function to sanitize numeric input (monthly rate)
  const sanitizeNumericInput = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    // Allow only: digits 0-9, single decimal point, and backspace/delete
    let sanitized = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Remove leading zeros (except for decimal numbers like 0.50)
    if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
      sanitized = sanitized.substring(1)
    }
    
    // Limit to 2 decimal places
    if (sanitized.includes('.')) {
      const [whole, decimal] = sanitized.split('.')
      if (decimal && decimal.length > 2) {
        sanitized = whole + '.' + decimal.substring(0, 2)
      }
    }
    
    return sanitized
  }

  // Helper function to sanitize contract number input
  const sanitizeContractNumberInput = (value: string): string => {
    // Allow only: letters, digits, hyphens, and backspace/delete
    // Convert to uppercase for consistency
    return value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
  }

  // Helper function to sanitize general text input (names, etc.)
  const sanitizeTextInput = (value: string): string => {
    // Remove special characters but allow letters, numbers, spaces, hyphens, and apostrophes
    return value.replace(/[^a-zA-Z0-9\s\-']/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous validation errors
    setValidationErrors({})
    
    // Validate form data using Zod schema
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      logger.warn('CONTRACT FORM: Validation failed', { errors })
      return
    }
    
    // Additional business logic validation
    const businessErrors: Record<string, string> = {}
    
    // Date validation: End date must be after start date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      if (startDate >= endDate) {
        businessErrors.endDate = 'End date must be after start date'
      }
      
      // Contract duration validation: Minimum 1 month, maximum 5 years
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth())
      if (monthsDiff < 1) {
        businessErrors.endDate = 'Contract must be at least 1 month long'
      }
      if (monthsDiff > 60) {
        businessErrors.endDate = 'Contract cannot exceed 5 years'
      }
    }
    
    if (Object.keys(businessErrors).length > 0) {
      setValidationErrors(businessErrors)
      logger.warn('CONTRACT FORM: Business validation failed', { businessErrors })
      return
    }
    
    setIsLoading(true)

    try {
      // Handle "none" berth value
      const submitData = {
        ...formData,
        berthId: formData.berthId === 'none' ? null : formData.berthId
      }

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        logger.info('CONTRACT FORM: Contract created successfully')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        logger.error('CONTRACT FORM: API error', { error: errorData.error })
        setValidationErrors({ general: `Error: ${errorData.error}` })
      }
    } catch (error) {
      logger.error('Error creating contract', { error: error instanceof Error ? error.message : String(error) })
      setValidationErrors({ general: 'Failed to create contract. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ContractFormData, value: string) => {
    let sanitizedValue = value
    
    // Apply field-specific sanitization
    switch (field) {
      case 'monthlyRate':
        sanitizedValue = sanitizeNumericInput(value)
        break
      case 'contractNumber':
        sanitizedValue = sanitizeContractNumberInput(value)
        break
      default:
        sanitizedValue = value
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Real-time validation for certain fields
    if (field === 'endDate' && sanitizedValue && formData.startDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(sanitizedValue)
      if (startDate >= endDate) {
        setValidationErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }))
      } else {
        setValidationErrors(prev => ({ ...prev, endDate: '' }))
      }
    }
  }

  const generateContractNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const contractNumber = `CTR-${year}-${month}-${random}`
    setFormData(prev => ({ ...prev, contractNumber }))
    
    // Clear validation error for contract number
    if (validationErrors.contractNumber) {
      setValidationErrors(prev => ({ ...prev, contractNumber: '' }))
    }
  }

  // Helper function to render field error
  const renderFieldError = (field: keyof ContractFormData) => {
    const error = validationErrors[field]
    if (!error) return null
    
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 mt-1" role="alert" aria-live="polite">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    )
  }

  // Helper function to render general error
  const renderGeneralError = () => {
    const error = validationErrors.general
    if (!error) return null
    
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Contract</CardTitle>
              <CardDescription>
                Add a new berth contract for a boat owner
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Fields marked with * are required. Please ensure all required information is provided before creating the contract.
            </p>
          </div>
          
          {renderGeneralError()}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contract Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="contractNumber">Contract Number *</Label>
                <Input
                  id="contractNumber"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                  placeholder="CTR-2024-001"
                  required
                  aria-describedby={validationErrors.contractNumber ? 'contractNumber-error' : undefined}
                  aria-invalid={!!validationErrors.contractNumber}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only letters, numbers, and hyphens allowed. Will be converted to uppercase.
                </p>
                {renderFieldError('contractNumber')}
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateContractNumber}
                  className="w-full"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                  aria-describedby={validationErrors.startDate ? 'startDate-error' : undefined}
                  aria-invalid={!!validationErrors.startDate}
                />
                {renderFieldError('startDate')}
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                  aria-describedby={validationErrors.endDate ? 'endDate-error' : undefined}
                  aria-invalid={!!validationErrors.endDate}
                />
                {renderFieldError('endDate')}
              </div>
            </div>

            {/* Owner and Boat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerId">Boat Owner *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => handleInputChange('customerId', value)}
                  required
                >
                  <SelectTrigger 
                    id="customerId" 
                    name="customerId"
                    aria-describedby={validationErrors.customerId ? 'customerId-error' : undefined}
                    aria-invalid={!!validationErrors.customerId}
                  >
                    <SelectValue placeholder="Select owner *" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.firstName} {owner.lastName} ({owner.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError('customerId')}
              </div>
              <div>
                <Label htmlFor="boatId">Boat *</Label>
                <Select
                  value={formData.boatId}
                  onValueChange={(value) => handleInputChange('boatId', value)}
                  required
                >
                  <SelectTrigger 
                    id="boatId" 
                    name="boatId"
                    aria-describedby={validationErrors.boatId ? 'boatId-error' : undefined}
                    aria-invalid={!!validationErrors.boatId}
                  >
                    <SelectValue placeholder="Select boat *" />
                  </SelectTrigger>
                  <SelectContent>
                    {boats.map((boat) => (
                      <SelectItem key={boat.id} value={boat.id}>
                        {boat.name} ({boat.registration || 'No Reg'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError('boatId')}
              </div>
            </div>

            {/* Berth and Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="berthId">Berth (Optional)</Label>
                <Select
                  value={formData.berthId}
                  onValueChange={(value) => handleInputChange('berthId', value)}
                >
                  <SelectTrigger 
                    id="berthId" 
                    name="berthId"
                    aria-describedby={validationErrors.berthId ? 'berthId-error' : undefined}
                    aria-invalid={!!validationErrors.berthId}
                  >
                    <SelectValue placeholder="Select berth (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No berth assigned</SelectItem>
                    {berths.map((berth) => (
                      <SelectItem key={berth.id} value={berth.id}>
                        {berth.berthNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError('berthId')}
              </div>
              <div>
                <Label htmlFor="monthlyRate">Monthly Rate (£) *</Label>
                <Input
                  id="monthlyRate"
                  name="monthlyRate"
                  type="text"
                  inputMode="decimal"
                  value={formData.monthlyRate}
                  onChange={(e) => handleInputChange('monthlyRate', e.target.value)}
                  placeholder="850.00"
                  required
                  aria-describedby={validationErrors.monthlyRate ? 'monthlyRate-error' : undefined}
                  aria-invalid={!!validationErrors.monthlyRate}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only numbers and decimal point allowed. Invalid characters will be automatically removed.
                </p>
                {renderFieldError('monthlyRate')}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Contract
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
