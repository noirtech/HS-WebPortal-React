'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, X, Save, Loader2, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

// Zod validation schema for edit contract form data
const EditContractFormSchema = z.object({
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
  
  berthId: z.string()
    .optional()
    .refine((berthId) => {
      if (berthId === 'none' || berthId === '') return true
      return berthId && berthId.length > 0
    }, 'Invalid berth selection')
})

type EditContractFormData = z.infer<typeof EditContractFormSchema>

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
}

interface Contract {
  id: string
  contractNumber: string
  startDate: string
  endDate: string
  monthlyRate: number
  status: string
  customerId: string
  boatId: string
  berthId: string | null
  customer: Owner
  boat: Boat
  berth: Berth | null
}

interface EditContractFormProps {
  contract: Contract
  onClose: () => void
  onSuccess: () => void
}

export default function EditContractForm({ contract, onClose, onSuccess }: EditContractFormProps) {
  logger.debug('EDIT CONTRACT FORM: Received contract data', { contract })
  logger.debug('EDIT CONTRACT FORM: Contract berth', { berth: contract.berth })
  logger.debug('EDIT CONTRACT FORM: Contract berthId', { berthId: contract.berthId })
  
  const [formData, setFormData] = useState<EditContractFormData>({
    startDate: contract.startDate.split('T')[0], // Convert ISO string to YYYY-MM-DD
    endDate: contract.endDate.split('T')[0],
    monthlyRate: contract.monthlyRate.toString(),
    berthId: contract.berthId || 'none'
  })
  
  const [originalData, setOriginalData] = useState<EditContractFormData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  
  logger.debug('EDIT CONTRACT FORM: Initial formData berthId', { berthId: formData.berthId })

  const [owners, setOwners] = useState<Owner[]>([])
  const [boats, setBoats] = useState<Boat[]>([])
  const [berths, setBerths] = useState<Berth[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Set original data for change detection
  useEffect(() => {
    setOriginalData({
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate.split('T')[0],
      monthlyRate: contract.monthlyRate.toString(),
      berthId: contract.berthId || 'none'
    })
  }, [contract])

  // Fetch owners, boats, and berths for the form
  useEffect(() => {
    const fetchFormData = async () => {
      logger.debug('EDIT CONTRACT FORM: Starting to fetch form data')
      try {
        // Fetch owners
        logger.debug('EDIT CONTRACT FORM: Fetching owners')
        const customersResponse = await fetch('/api/customers')
            if (customersResponse.ok) {
      const customersData = await customersResponse.json()
      logger.info('EDIT CONTRACT FORM: Customers fetched successfully', { count: customersData.length })
      setOwners(customersData)
    } else {
      logger.warn('EDIT CONTRACT FORM: Customers fetch failed', { status: customersResponse.status })
    }

        // Fetch boats
        logger.debug('EDIT CONTRACT FORM: Fetching boats')
        const boatsResponse = await fetch('/api/boats')
        if (boatsResponse.ok) {
          const boatsData = await boatsResponse.json()
          logger.info('EDIT CONTRACT FORM: Boats fetched successfully', { count: boatsData.length })
          setBoats(boatsData)
        } else {
          logger.warn('EDIT CONTRACT FORM: Boats fetch failed', { status: boatsResponse.status })
        }

        // Fetch berths
        logger.debug('EDIT CONTRACT FORM: Fetching berths')
        const berthsResponse = await fetch('/api/berths')
        if (berthsResponse.ok) {
          const berthsData = await berthsResponse.json()
          logger.info('EDIT CONTRACT FORM: Berths fetched successfully', { count: berthsData.length })
          setBerths(berthsData)
        } else {
          logger.warn('EDIT CONTRACT FORM: Berths fetch failed', { status: berthsResponse.status })
        }
      } catch (error) {
        logger.error('Error fetching form data', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    fetchFormData()
  }, [])

  // Check if there are any changes to the form
  const hasChanges = (): boolean => {
    if (!originalData) return false
    
    return Object.keys(formData).some(key => {
      const currentValue = formData[key as keyof typeof formData]
      const originalValue = originalData[key as keyof typeof originalData]
      return currentValue !== originalValue
    })
  }

  // Check if a specific field has changed
  const hasFieldChanged = (fieldName: keyof EditContractFormData): boolean => {
    if (!originalData) return false
    return formData[fieldName] !== originalData[fieldName]
  }

  // Reset form to original values
  const handleReset = () => {
    if (originalData) {
      setFormData(originalData)
      setErrors({})
      setTouched({})
    }
  }

  // Helper function to sanitize numeric input (monthly rate)
  const sanitizeNumericInput = (value: string): string => {
    // Remove all non-numeric characters except decimal point
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

  const handleInputChange = (field: keyof EditContractFormData, value: string) => {
    let sanitizedValue = value
    
    // Apply field-specific sanitization
    switch (field) {
      case 'monthlyRate':
        sanitizedValue = sanitizeNumericInput(value)
        break
      default:
        sanitizedValue = value
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))
    
    // Clear validation error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validate entire form using Zod schema
  const validateForm = (): boolean => {
    try {
      // Parse the form data using Zod schema
      EditContractFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
        logger.warn('EDIT CONTRACT FORM: Validation failed', { errors: newErrors, formData })
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    logger.info('EDIT CONTRACT FORM: Form submission started', { 
      action: 'update',
      contractId: contract.id,
      formData 
    })
    
    // Validate form before submission
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allTouched: Record<string, boolean> = {}
      Object.keys(formData).forEach(field => {
        allTouched[field] = true
      })
      setTouched(allTouched)
      logger.warn('EDIT CONTRACT FORM: Form validation failed', { errors, formData })
      return
    }
    
    setIsLoading(true)

    try {
      // Handle "none" berth value
      const submitData = {
        ...formData,
        berthId: formData.berthId === 'none' ? null : formData.berthId
      }

      logger.debug('EDIT CONTRACT FORM: Submitting update for contract', { contractId: contract.id })
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        logger.info('EDIT CONTRACT FORM: Contract updated successfully', { 
          contractId: contract.id,
          formData 
        })
        setShowSuccess(true)
        // Show success message for 2 seconds, then redirect
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        const errorData = await response.json()
        logger.error('EDIT CONTRACT FORM: Failed to update contract', { 
          error: errorData.error,
          contractId: contract.id,
          formData 
        })
        setErrors({ general: `Error: ${errorData.error}` })
      }
    } catch (error) {
      logger.error('EDIT CONTRACT FORM: Error updating contract', { 
        error: error instanceof Error ? error.message : String(error),
        contractId: contract.id,
        formData 
      })
      setErrors({ general: 'Failed to update contract. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Contract - {contract.contractNumber}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-600 rounded-full mr-2 flex-shrink-0"></div>
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    Contract Updated Successfully!
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    Contract "{contract.contractNumber}" has been updated.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Redirecting in a moment...
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* General Error Display */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{errors.general}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contract Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractNumber">Contract Number</Label>
                <Input
                  id="contractNumber"
                  name="contractNumber"
                  value={contract.contractNumber}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  name="owner"
                  value={`${contract.customer.firstName} ${contract.customer.lastName}`}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="boat">Boat</Label>
                <Input
                  id="boat"
                  name="boat"
                  value={`${contract.boat.name} (${contract.boat.registration || 'No Reg'})`}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  name="status"
                  value={contract.status}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                  aria-describedby={errors.startDate ? 'startDate-error' : undefined}
                  aria-invalid={!!errors.startDate}
                  className={`${hasFieldChanged('startDate') ? 'border-blue-300 bg-blue-50' : ''} ${
                    touched.startDate && errors.startDate ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                />
                {touched.startDate && errors.startDate && (
                  <p id="startDate-error" className="text-sm text-red-600 flex items-center mt-1" role="alert" aria-live="polite">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                  aria-describedby={errors.endDate ? 'endDate-error' : undefined}
                  aria-invalid={!!errors.endDate}
                  className={`${hasFieldChanged('endDate') ? 'border-blue-300 bg-blue-50' : ''} ${
                    touched.endDate && errors.endDate ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                />
                {touched.endDate && errors.endDate && (
                  <p id="endDate-error" className="text-sm text-red-600 flex items-center mt-1" role="alert" aria-live="polite">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyRate">Monthly Rate (£)</Label>
                <Input
                  id="monthlyRate"
                  name="monthlyRate"
                  type="text"
                  inputMode="decimal"
                  value={formData.monthlyRate}
                  onChange={(e) => handleInputChange('monthlyRate', e.target.value)}
                  placeholder="850.00"
                  required
                  aria-describedby={errors.monthlyRate ? 'monthlyRate-error' : undefined}
                  aria-invalid={!!errors.monthlyRate}
                  className={`${hasFieldChanged('monthlyRate') ? 'border-blue-300 bg-blue-50' : ''} ${
                    touched.monthlyRate && errors.monthlyRate ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only numbers and decimal point allowed. Invalid characters will be automatically removed.
                </p>
                {touched.monthlyRate && errors.monthlyRate && (
                  <p id="monthlyRate-error" className="text-sm text-red-600 flex items-center mt-1" role="alert" aria-live="polite">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.monthlyRate}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="berthId">Berth Assignment</Label>
                <Select
                  value={formData.berthId}
                  onValueChange={(value) => handleInputChange('berthId', value)}
                >
                  <SelectTrigger 
                    id="berthId" 
                    name="berthId"
                    className={`${hasFieldChanged('berthId') ? 'border-blue-300 bg-blue-50' : ''} ${
                      touched.berthId && errors.berthId ? 'border-red-300 focus:border-red-500' : ''
                    }`}
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
                {touched.berthId && errors.berthId && (
                  <p id="berthId-error" className="text-sm text-red-600 flex items-center mt-1" role="alert" aria-live="polite">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.berthId}
                  </p>
                )}
              </div>
            </div>



            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              {/* Changes Indicator */}
              {hasChanges() && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                  Changes detected
                </div>
              )}
              
              {!hasChanges() && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  No changes to save
                </div>
              )}
              
              <div className="flex gap-3">
                {hasChanges() && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={isLoading}
                    size="sm"
                  >
                    Reset Changes
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !hasChanges()}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
