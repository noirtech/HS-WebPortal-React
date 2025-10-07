'use client'

import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select'
import { LocaleDateInput } from '@/components/ui/locale-date-input'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { Plus, X, Save, Loader2, AlertCircle, Trash2 } from 'lucide-react'


// Zod validation schema for invoice creation/update
const InvoiceFormSchema = z.object({
  invoiceNumber: z.string()
    .min(1, 'Invoice number is required')
    .max(50, 'Invoice number must be less than 50 characters')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Invoice number can only contain letters, numbers, hyphens, and underscores'),
  
  customerName: z.string()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name must be less than 100 characters')
    .regex(/^[A-Za-z\s\-'\.]+$/, 'Customer name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  customerEmail: z.string()
    .min(1, 'Customer email is required')
    .max(254, 'Email address is too long (maximum 254 characters)')
    .email('Please enter a valid email address')
    .refine((email) => !email.includes('..'), 'Email address cannot contain consecutive dots')
    .refine((email) => !email.startsWith('.') && !email.endsWith('.'), 'Email address cannot start or end with a dot'),
  
  issueDate: z.string()
    .min(1, 'Issue date is required')
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, 'Issue date cannot be in the past'),
  
  dueDate: z.string()
    .min(1, 'Due date is required'),
  
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
    .default('DRAFT'),
  
  subtotal: z.string()
    .refine((value) => {
      const numValue = parseFloat(value)
      return !isNaN(numValue) && numValue >= 0 && numValue <= 999999.99
    }, 'Subtotal must be a positive number between £0.00 and £999,999.99'),
  
  tax: z.string()
    .refine((value) => {
      const numValue = parseFloat(value)
      return !isNaN(numValue) && numValue >= 0 && numValue <= 999999.99
    }, 'Tax must be a positive number between £0.00 and £999,999.99'),
  
  total: z.string()
    .refine((value) => {
      const numValue = parseFloat(value)
      return !isNaN(numValue) && numValue >= 0
    }, 'Total must be a positive number'),
  
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  
  notes: z.string().optional(),
  
  lineItems: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, 'Line item description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
    amount: z.number().min(0, 'Amount cannot be negative')
  })).optional()
})

type InvoiceFormData = z.infer<typeof InvoiceFormSchema>

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface InvoiceFormProps {
  onClose: () => void
  onSuccess: () => void
  editingInvoice?: InvoiceFormData & { id: string } | null
}

export default function InvoiceForm({ onClose, onSuccess, editingInvoice }: InvoiceFormProps) {
  const { formatCurrency, getTaxLabel, getTaxRate, localeConfig } = useLocaleFormatting()
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    customerName: '',
    customerEmail: '',
    issueDate: editingInvoice?.issueDate || new Date().toISOString().split('T')[0],
    dueDate: editingInvoice?.dueDate || '',
    status: editingInvoice?.status || 'DRAFT',
    subtotal: editingInvoice?.subtotal || '',
    tax: editingInvoice?.tax || '',
    total: editingInvoice?.total || '0.00',
    description: editingInvoice?.description || '',
    notes: editingInvoice?.notes || ''
  })

  const [lineItems, setLineItems] = useState<LineItem[]>(editingInvoice?.lineItems || [])
  const [useLineItems, setUseLineItems] = useState(editingInvoice?.lineItems ? true : false)
  
  const [originalData, setOriginalData] = useState<InvoiceFormData | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Common line items for quick selection
  const commonItems = [
    { label: 'Berth Rental', description: 'Monthly berth rental', unitPrice: 1200.00 },
    { label: 'Electricity', description: 'Electricity and power services', unitPrice: 150.00 },
    { label: 'Water Services', description: 'Water and sanitation services', unitPrice: 80.00 },
    { label: 'WiFi Access', description: 'Marina WiFi and internet access', unitPrice: 45.00 },
    { label: 'Pump Out', description: 'Waste pump out service', unitPrice: 35.00 },
    { label: 'Fuel Dock', description: 'Fuel and diesel services', unitPrice: 0.00 },
    { label: 'Laundry', description: 'Laundry and washing facilities', unitPrice: 25.00 },
    { label: 'Shower', description: 'Shower and bathroom facilities', unitPrice: 15.00 }
  ]

  // Validation functions
  const validateForm = (data: InvoiceFormData): Record<string, string> => {
    try {
      InvoiceFormSchema.parse(data)
      return {}
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path.join('.')
          errors[field] = err.message
        })
        return errors
      }
      return {}
    }
  }

  // Helper functions for input sanitization
  const sanitizeNumericInput = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    return value.replace(/[^0-9.]/g, '')
  }

  const sanitizeInvoiceNumberInput = (value: string): string => {
    // Allow only: letters, digits, hyphens, underscores
    return value.replace(/[^A-Za-z0-9\-_]/g, '')
  }

  const sanitizeTextInput = (value: string): string => {
    // Remove special characters but allow letters, numbers, spaces, hyphens, apostrophes, and periods
    return value.replace(/[^A-Za-z0-9\s\-'\.]/g, '')
  }

  const sanitizeEmailInput = (value: string): string => {
    // Basic email sanitization - remove spaces and invalid characters
    return value.replace(/\s/g, '').toLowerCase()
  }

  // Line item management
  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        // Auto-calculate amount
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  // Set original data for change detection
  useEffect(() => {
    if (editingInvoice) {
      setOriginalData({
        invoiceNumber: editingInvoice.invoiceNumber,
        customerName: editingInvoice.customerName,
        customerEmail: editingInvoice.customerEmail,
        issueDate: editingInvoice.issueDate,
        dueDate: editingInvoice.dueDate,
        status: editingInvoice.status,
        subtotal: editingInvoice.subtotal,
        tax: editingInvoice.tax,
        total: editingInvoice.total,
        description: editingInvoice.description,
        notes: editingInvoice.notes || '',
        lineItems: editingInvoice.lineItems || []
      })
    }
  }, [editingInvoice])

  // Calculate totals
  const calculateSubtotalFromLineItems = (): number => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const parseAmount = (value: string): number => {
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  }

  // Check if there are any changes to the form
  const hasChanges = (): boolean => {
    if (!originalData || !editingInvoice) return false
    
    return Object.keys(formData).some(key => {
      const currentValue = formData[key as keyof typeof formData]
      const originalValue = originalData[key as keyof typeof originalData]
      return currentValue !== originalValue
    }) || JSON.stringify(lineItems) !== JSON.stringify(originalData.lineItems || [])
  }

  // Check if a specific field has changed
  const hasFieldChanged = (fieldName: keyof InvoiceFormData): boolean => {
    if (!originalData || !editingInvoice) return false
    return formData[fieldName] !== originalData[fieldName]
  }

  // Reset form to original values
  const handleReset = () => {
    if (originalData) {
      setFormData(originalData)
      setLineItems(originalData.lineItems || [])
      setValidationErrors({})
      setTouched({})
    }
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous validation errors
    setValidationErrors({})
    
    // Validate form data using Zod schema
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      logger.warn('INVOICE FORM: Validation failed', { errors })
      return
    }
    
    // Additional business logic validation
    const businessErrors: Record<string, string> = {}
    
    // Date validation: Due date must be after issue date
    if (formData.issueDate && formData.dueDate) {
      const issueDate = new Date(formData.issueDate)
      const dueDate = new Date(formData.dueDate)
      if (dueDate <= issueDate) {
        businessErrors.dueDate = 'Due date must be after issue date'
      }
    }

    // Line items validation
    if (useLineItems && lineItems.length > 0) {
      const invalidItems = lineItems.filter(item => !item.description || item.unitPrice <= 0)
      if (invalidItems.length > 0) {
        businessErrors.lineItems = 'Please fill in all line item descriptions and ensure unit prices are greater than 0'
      }
    }
    
    if (Object.keys(businessErrors).length > 0) {
      setValidationErrors(businessErrors)
      logger.warn('INVOICE FORM: Business validation failed', { businessErrors })
      return
    }
    
    setIsLoading(true)

    try {
      // Prepare payload
      const payload = {
        ...formData,
        lineItems: useLineItems ? lineItems : undefined,
        subtotal: parseAmount(formData.subtotal),
        tax: parseAmount(formData.tax),
        total: parseAmount(formData.total)
      }

      const endpoint = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices'
      const method = editingInvoice ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        logger.info('INVOICE FORM: Invoice saved successfully')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        logger.error('INVOICE FORM: API error', { error: errorData.error })
        setValidationErrors({ general: `Error: ${errorData.error}` })
      }
    } catch (error) {
      logger.error('INVOICE FORM: Error saving invoice', { error: error instanceof Error ? error.message : String(error) })
      setValidationErrors({ general: 'Failed to save invoice. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    let sanitizedValue = value
    
    // Apply field-specific sanitization
    switch (field) {
      case 'subtotal':
      case 'tax':
        sanitizedValue = sanitizeNumericInput(value)
        break
      case 'invoiceNumber':
        sanitizedValue = sanitizeInvoiceNumberInput(value)
        break
      case 'customerName':
      case 'description':
      case 'notes':
        sanitizedValue = sanitizeTextInput(value)
        break
      case 'customerEmail':
        sanitizedValue = sanitizeEmailInput(value)
        break
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: sanitizedValue
      }
      
      // Auto-calculate total when subtotal or tax changes
      if (field === 'subtotal' || field === 'tax') {
        const subtotal = parseAmount(newData.subtotal)
        const tax = parseAmount(newData.tax)
        newData.total = (subtotal + tax).toFixed(2)
      }
      
      return newData
    })
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Render field errors
  const renderFieldError = (field: string) => {
    const error = validationErrors[field]
    if (!error) return null
    
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
        <AlertCircle className="w-4 h-4" />
        <span id={`${field}-error`}>{error}</span>
      </div>
    )
  }

  // Render general error
  const renderGeneralError = () => {
    const error = validationErrors.general
    if (!error) return null
    
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[75vh] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </CardTitle>
              <CardDescription className="text-sm">
                {editingInvoice ? 'Update invoice details' : 'Fill in the invoice information'}
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
        
        <CardContent className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="mb-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Fields marked with * are required.
            </p>
          </div>
          
          {renderGeneralError()}
          
          <form onSubmit={handleSubmit} className="space-y-2" id="invoice-form">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="invoiceNumber" className="text-sm">Invoice Number *</Label>
                <Input 
                  id="invoiceNumber" 
                  placeholder="INV-2024-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className={`font-mono h-8 text-sm ${validationErrors.invoiceNumber ? 'border-red-500' : ''}`}
                  maxLength={50}
                  aria-describedby={validationErrors.invoiceNumber ? 'invoiceNumber-error' : undefined}
                  aria-invalid={!!validationErrors.invoiceNumber}
                />
                {renderFieldError('invoiceNumber')}
                <p className="text-xs text-gray-500 mt-1">
                  Letters, numbers, hyphens, underscores only
                </p>
              </div>
              <div>
                <Label htmlFor="customerName" className="text-sm">Customer Name *</Label>
                <Input 
                  id="customerName" 
                  placeholder="John Smith"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className={`h-8 text-sm ${validationErrors.customerName ? 'border-red-500' : ''}`}
                  maxLength={100}
                />
                {renderFieldError('customerName')}
              </div>
            </div>
            
            <div>
              <Label htmlFor="customerEmail" className="text-sm">Customer Email *</Label>
              <Input 
                id="customerEmail" 
                type="email"
                placeholder="john.smith@email.com"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className={`h-8 text-sm ${validationErrors.customerEmail ? 'border-red-500' : ''}`}
                maxLength={254}
              />
              {renderFieldError('customerEmail')}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="issueDate" className="text-sm">Issue Date *</Label>
                <LocaleDateInput 
                  id="issueDate" 
                  value={formData.issueDate}
                  onChange={(value) => handleInputChange('issueDate', value)}
                  className={`h-8 text-sm ${validationErrors.issueDate ? 'border-red-500' : ''}`}
                />
                {renderFieldError('issueDate')}
              </div>
              <div>
                <Label htmlFor="dueDate" className="text-sm">Due Date *</Label>
                <LocaleDateInput 
                  id="dueDate" 
                  value={formData.dueDate}
                  onChange={(value) => handleInputChange('dueDate', value)}
                  className={`h-8 text-sm ${validationErrors.dueDate ? 'border-red-500' : ''}`}
                />
                {renderFieldError('dueDate')}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm">Description *</Label>
                <Input 
                  id="description" 
                  placeholder="Monthly berth rental"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`h-8 text-sm ${validationErrors.description ? 'border-red-500' : ''}`}
                  maxLength={500}
                />
                {renderFieldError('description')}
              </div>
            </div>
            
            {/* Unified Line Items Section */}
            <div className="border-t pt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-sm font-medium">Line Items</Label>
                  <p className="text-xs text-gray-500">
                    Use line items for detailed billing or leave unchecked for simple invoices
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 cursor-pointer"
                    onClick={() => setUseLineItems(!useLineItems)}
                  >
                    <div className={`absolute inset-0 rounded-full transition-colors ${
                      useLineItems ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                    <span className={`relative inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      useLineItems ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <Label className="text-sm font-medium text-blue-900 cursor-pointer" onClick={() => setUseLineItems(!useLineItems)}>
                    {useLineItems ? 'Line Items Enabled' : 'Line Items Disabled'}
                  </Label>
                </div>
              </div>
              
              {useLineItems && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    {/* Quick Action Buttons - Top Section */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {commonItems.slice(0, 6).map((item, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newItem = {
                            id: `item-${Date.now()}`,
                            description: item.description,
                            quantity: 1,
                            unitPrice: item.unitPrice,
                            amount: item.unitPrice
                          }
                          setLineItems([...lineItems, newItem])
                        }}
                        className="text-xs h-7 px-2"
                      >
                        {item.label}
                        {item.unitPrice > 0 && (
                          <span className="ml-1 text-gray-500">({formatCurrency(item.unitPrice)})</span>
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Quick Add Section */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Quick Add Common Items:</span>
                      <span className="text-xs text-gray-500">Select from common marina services</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLineItem}
                      className="px-3 py-1.5 text-xs h-7"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Custom
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <Select onValueChange={(value) => {
                      if (value && value !== 'select') {
                        const selectedItem = commonItems.find(item => item.label === value)
                        if (selectedItem) {
                          const newItem = {
                            id: `item-${Date.now()}`,
                            description: selectedItem.description,
                            quantity: 1,
                            unitPrice: selectedItem.unitPrice,
                            amount: selectedItem.unitPrice
                          }
                          setLineItems([...lineItems, newItem])
                        }
                      }
                    }}>
                      <SelectTrigger className="w-64 h-9 text-sm">
                        <SelectValue placeholder="Choose a common service..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select" disabled>
                          <div className="text-gray-400 italic">Select a service to add...</div>
                        </SelectItem>
                        <SelectSeparator />
                        {commonItems.map((item, index) => (
                          <SelectItem key={index} value={item.label} className="cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {item.unitPrice > 0 ? formatCurrency(item.unitPrice) : 'Set price'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="text-xs text-gray-500">
                      {lineItems.length} item{lineItems.length !== 1 ? 's' : ''} added
                    </div>
                  </div>
                  
                  {/* Line Items Table */}
                  {lineItems.length > 0 && (
                    <div>
                      <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                        <div className="col-span-5">
                          <Label className="text-xs font-medium text-gray-600">Description</Label>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-gray-600">Qty</Label>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-gray-600">Unit Price</Label>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-gray-600">Total</Label>
                        </div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      <div className="space-y-2">
                        {lineItems.map((item) => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md bg-white">
                            <div className="col-span-5">
                              <Input
                                id={`desc-${item.id}`}
                                value={item.description}
                                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                placeholder="Item description"
                                className="text-xs h-7"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                id={`qty-${item.id}`}
                                type="text"
                                inputMode="decimal"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', sanitizeNumericInput(e.target.value))}
                                className="text-xs font-mono h-7"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                id={`price-${item.id}`}
                                type="text"
                                inputMode="decimal"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, 'unitPrice', sanitizeNumericInput(e.target.value))}
                                className="text-xs font-mono h-7"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                id={`total-${item.id}`}
                                value={item.amount}
                                readOnly
                                className="text-xs font-mono bg-gray-100 cursor-not-allowed h-7"
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(item.id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="subtotal" className="text-sm">Subtotal *</Label>
                <Input 
                  id="subtotal" 
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.subtotal}
                  onChange={(e) => handleInputChange('subtotal', sanitizeNumericInput(e.target.value))}
                  className={`font-mono h-8 text-sm ${validationErrors.subtotal ? 'border-red-500' : ''}`}
                />
                {renderFieldError('subtotal')}
              </div>
              <div>
                <Label htmlFor="tax" className="text-sm">Tax *</Label>
                <Input 
                  id="tax" 
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.tax}
                  onChange={(e) => handleInputChange('tax', sanitizeNumericInput(e.target.value))}
                  className={`font-mono h-8 text-sm ${validationErrors.tax ? 'border-red-500' : ''}`}
                />
                {renderFieldError('tax')}
              </div>
              <div>
                <Label htmlFor="total" className="text-sm">Total</Label>
                <Input 
                  id="total" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.total}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed h-8 text-sm"
                />
                <div className="mt-1 p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="text-xs font-medium text-blue-900">
                    Live Calculation:
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>Subtotal: {formatCurrency(parseAmount(formData.subtotal))}</div>
                    <div>Tax: {formatCurrency(parseAmount(formData.tax))}</div>
                    <div className="border-t border-blue-300 pt-1 font-semibold">
                      Total: {formatCurrency(parseAmount(formData.total))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-sm">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="text-sm h-10"
              />
            </div>
          </form>
        </CardContent>
        
        {/* Fixed footer with submit button - always visible */}
        <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-2">
          <div className="flex justify-between items-center">
            {/* Changes Indicator */}
            {editingInvoice && hasChanges() && (
              <div className="flex items-center text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                Changes detected
              </div>
            )}
            
            {editingInvoice && !hasChanges() && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                No changes to save
              </div>
            )}
            
            <div className="flex gap-2">
              {editingInvoice && hasChanges() && (
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
              <Button 
                type="button"
                variant="outline" 
                onClick={onClose}
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    invoiceNumber: '',
                    customerName: '',
                    customerEmail: '',
                    issueDate: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    status: 'DRAFT',
                    subtotal: '',
                    tax: '',
                    total: '0.00',
                    description: '',
                    notes: ''
                  })
                  setLineItems([])
                  setUseLineItems(false)
                  setValidationErrors({})
                }}
                size="sm"
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || (editingInvoice ? !hasChanges() : false)} 
                form="invoice-form" 
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
