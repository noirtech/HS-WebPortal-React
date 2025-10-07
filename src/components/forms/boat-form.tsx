'use client'

import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Ship, User, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'

// Zod validation schema for boat form data
const BoatFormSchema = z.object({
  name: z.string()
    .min(1, 'Boat name is required')
    .min(2, 'Boat name must be at least 2 characters')
    .max(50, 'Boat name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-']+$/, 'Boat name can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  
  registration: z.string()
    .max(20, 'Registration number must be less than 20 characters')
    .regex(/^[a-zA-Z0-9-]*$/, 'Registration can only contain letters, numbers, and hyphens'),
  
  length: z.string()
    .min(1, 'Length is required')
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num > 0 && num <= 1000
    }, 'Length must be a positive number between 0.01 and 1000'),
  
  beam: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const num = parseFloat(val)
      return !isNaN(num) && num > 0 && num <= 100
    }, 'Beam must be a positive number between 0.01 and 100'),
  
  draft: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const num = parseFloat(val)
      return !isNaN(num) && num > 0 && num <= 50
    }, 'Draft must be a positive number between 0.01 and 50'),
  
  ownerId: z.string()
    .min(1, 'Boat owner is required')
    .uuid('Invalid owner ID format')
})

type BoatFormData = z.infer<typeof BoatFormSchema>

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface BoatFormProps {
  onClose: () => void
  onSuccess: () => void
  boat?: {
    id: string
    name: string
    registration?: string
    length: number
    beam?: number
    draft?: number
    ownerId: string
    owner?: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }
}

export function BoatForm({ onClose, onSuccess, boat }: BoatFormProps) {
  logger.debug('BOAT FORM: Received boat data', { boat })
  logger.debug('BOAT FORM: Boat owner', { owner: boat?.owner })
  logger.debug('BOAT FORM: Boat ownerId', { ownerId: boat?.ownerId })
  
  const { localeConfig } = useLocaleFormatting()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [originalData, setOriginalData] = useState<typeof formData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<BoatFormData>({
    name: boat?.name || '',
    registration: boat?.registration || '',
    length: boat?.length ? boat.length.toString() : '',
    beam: boat?.beam ? boat.beam.toString() : '',
    draft: boat?.draft ? boat.draft.toString() : '',
    ownerId: boat?.ownerId || ''
  })

  // Update form data when boat prop changes (for editing)
  useEffect(() => {
    if (boat) {
      const newFormData = {
        name: boat.name || '',
        registration: boat.registration || '',
        length: boat.length?.toString() || '',
        beam: boat.beam?.toString() || '',
        draft: boat.draft?.toString() || '',
        ownerId: boat.owner?.id || boat.ownerId || ''
      }
      setFormData(newFormData)
      setOriginalData(newFormData) // Store original data for comparison
    } else {
      setOriginalData(null)
    }
  }, [boat])

  useEffect(() => {
    // Fetch customers for the dropdown
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers')
        if (response.ok) {
          const data = await response.json()
          setCustomers(data)
        }
      } catch (error) {
        logger.error('Error fetching customers', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    fetchCustomers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    logger.info('BOAT FORM: Form submission started', { 
      action: boat ? 'update' : 'create', 
      boatId: boat?.id,
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
      logger.warn('BOAT FORM: Form validation failed', { errors, formData })
      return
    }
    
    setIsLoading(true)

    try {
      const url = boat ? `/api/boats/${boat.id}` : '/api/boats'
      const method = boat ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        logger.info('BOAT FORM: Boat saved successfully', { 
          action: boat ? 'update' : 'create',
          boatId: boat?.id,
          formData 
        })
        setShowSuccess(true)
        // Show success message for 2 seconds, then redirect
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        const errorData = await response.json()
        logger.error('BOAT FORM: Failed to save boat', { 
          error: errorData.error,
          action: boat ? 'update' : 'create',
          boatId: boat?.id,
          formData 
        })
        setErrors({ general: `Error: ${errorData.error}` })
      }
    } catch (error) {
      logger.error('BOAT FORM: Error saving boat', { 
        error: error instanceof Error ? error.message : String(error),
        action: boat ? 'update' : 'create',
        boatId: boat?.id,
        formData 
      })
      setErrors({ general: 'Failed to save boat. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof BoatFormData, value: string) => {
    let sanitizedValue = value
    
    // Apply field-specific sanitization immediately
    switch (field) {
      case 'name':
        sanitizedValue = sanitizeBoatNameInput(value)
        break
      case 'registration':
        sanitizedValue = sanitizeRegistrationInput(value)
        break
      case 'length':
      case 'beam':
      case 'draft':
        sanitizedValue = sanitizeNumericInput(value)
        break
      default:
        sanitizedValue = value
    }
    
    // Update form data with sanitized value
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
    
    // Validate field in real-time (with slight delay for better UX)
    setTimeout(() => {
      const error = validateField(field, sanitizedValue)
      setErrors(prev => ({
        ...prev,
        [field]: error
      }))
    }, 300)
  }

  // Check if there are any changes to the form
  const hasChanges = () => {
    if (!originalData || !boat) return false
    
    return Object.keys(formData).some(key => {
      const currentValue = formData[key as keyof typeof formData]
      const originalValue = originalData[key as keyof typeof originalData]
      return currentValue !== originalValue
    })
  }

  // Check if a specific field has changed
  const hasFieldChanged = (fieldName: keyof typeof formData) => {
    if (!originalData || !boat) return false
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

  // Helper function to sanitize numeric input (length, beam, draft)
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

  // Helper function to sanitize boat name input
  const sanitizeBoatNameInput = (value: string): string => {
    // Remove special characters but allow letters, numbers, spaces, hyphens, and apostrophes
    return value.replace(/[^a-zA-Z0-9\s\-']/g, '')
  }

  // Helper function to sanitize registration number input
  const sanitizeRegistrationInput = (value: string): string => {
    // Allow only: letters, digits, hyphens, and backspace/delete
    // Convert to uppercase for consistency
    return value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
  }

  // Validate a single field using Zod schema
  const validateField = (field: keyof BoatFormData, value: string): string => {
    try {
      // Create a partial object with just the field being validated
      const testData = { ...formData, [field]: value }
      BoatFormSchema.parse(testData)
      return ''
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === field)
        return fieldError ? fieldError.message : ''
      }
      return ''
    }
  }

  // Validate entire form using Zod schema
  const validateForm = (): boolean => {
    try {
      // Parse the form data using Zod schema
      BoatFormSchema.parse(formData)
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
        logger.warn('BOAT FORM: Validation failed', { errors: newErrors, formData })
      }
      return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              {boat ? 'Edit Boat' : 'Add New Boat'}
            </CardTitle>
            <CardDescription>
              {boat ? 'Update boat information' : 'Enter boat details to add to the registry'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    {boat ? 'Boat Updated Successfully!' : 'Boat Created Successfully!'}
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {boat 
                      ? `"${formData.name}" has been updated in the registry.`
                      : `"${formData.name}" has been added to the registry.`
                    }
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
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Boat Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Boat Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Boat Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter boat name"
                    required
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    aria-invalid={!!errors.name}
                    className={`${hasFieldChanged('name') ? 'border-blue-300 bg-blue-50' : ''} ${
                      touched.name && errors.name ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {touched.name && errors.name && (
                    <p id="name-error" className="text-sm text-red-600 flex items-center" role="alert" aria-live="polite">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration">Registration Number</Label>
                  <Input
                    id="registration"
                    value={formData.registration}
                    onChange={(e) => handleInputChange('registration', e.target.value)}
                    placeholder="Enter registration number"
                    className={`${hasFieldChanged('registration') ? 'border-blue-300 bg-blue-50' : ''} ${
                      touched.registration && errors.registration ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {touched.registration && errors.registration && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.registration}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                                        <Label htmlFor="length">Length ({localeConfig.measurement === 'metric' ? 'm' : 'ft'}) *</Label>
                  <Input
                    id="length"
                    type="text"
                    inputMode="decimal"
                    value={formData.length}
                    onChange={(e) => handleInputChange('length', e.target.value)}
                    placeholder="0.0"
                    required
                    className={`${hasFieldChanged('length') ? 'border-blue-300 bg-blue-50' : ''} ${
                      touched.length && errors.length ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only numbers and decimal point allowed. Invalid characters will be automatically removed.
                  </p>
                  {touched.length && errors.length && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.length}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beam">Beam ({localeConfig.measurement === 'metric' ? 'm' : 'ft'})</Label>
                  <Input
                    id="beam"
                    type="text"
                    inputMode="decimal"
                    value={formData.beam}
                    onChange={(e) => handleInputChange('beam', e.target.value)}
                    placeholder="0.0"
                    className={`${hasFieldChanged('beam') ? 'border-blue-300 bg-blue-50' : ''} ${
                      touched.beam && errors.beam ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only numbers and decimal point allowed. Invalid characters will be automatically removed.
                  </p>
                  {touched.beam && errors.beam && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.beam}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="draft">Draft ({localeConfig.measurement === 'metric' ? 'm' : 'ft'})</Label>
                  <Input
                    id="draft"
                    type="text"
                    inputMode="decimal"
                    value={formData.draft}
                    onChange={(e) => handleInputChange('draft', e.target.value)}
                    placeholder="0.0"
                    className={`${hasFieldChanged('draft') ? 'border-blue-300 bg-blue-50' : ''} ${
                      touched.draft && errors.draft ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only numbers and decimal point allowed. Invalid characters will be automatically removed.
                  </p>
                  {touched.draft && errors.draft && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.draft}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="ownerId">Boat Owner *</Label>
                <Select
                  value={formData.ownerId}
                  onValueChange={(value) => handleInputChange('ownerId', value)}
                  required
                >
                  <SelectTrigger className={`${hasFieldChanged('ownerId') ? 'border-blue-300 bg-blue-50' : ''} ${
                    touched.ownerId && errors.ownerId ? 'border-red-300 focus:border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.ownerId && errors.ownerId && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.ownerId}
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4">
              {/* Changes Indicator */}
              {boat && hasChanges() && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                  Changes detected
                </div>
              )}
              
              {boat && !hasChanges() && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  No changes to save
                </div>
              )}
              
              <div className="flex gap-3">
                {boat && hasChanges() && (
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
                  disabled={isLoading || (boat && !hasChanges()) || Object.keys(errors).length > 0} 
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    boat ? 'Update Boat' : 'Add Boat'
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
