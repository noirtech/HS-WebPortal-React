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
import { Plus, X, Save, Loader2, AlertCircle, Trash2, Calculator, Sparkles, Zap } from 'lucide-react'

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
  const { formatCurrency } = useLocaleFormatting()
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [useLineItems, setUseLineItems] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [activeRow, setActiveRow] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string>('')
  const [showAddSuccess, setShowAddSuccess] = useState(false)
  const [originalLineItems, setOriginalLineItems] = useState<LineItem[]>([])
  const [showCloseWarning, setShowCloseWarning] = useState(false)

  // Enhanced keyboard shortcuts and click-outside handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeRow) {
        cancelLineItemEdit()
      }
      if (e.key === 'Enter' && e.ctrlKey && activeRow) {
        saveLineItemEdit()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (activeRow && !target.closest('.line-item-row')) {
        cancelLineItemEdit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [activeRow, lineItems, originalLineItems])

  // Enhanced common items with better categorization and colors
  const commonItems = [
    { 
      label: 'Berth Rental', 
      description: 'Monthly berth rental', 
      unitPrice: 1200.00,
      category: 'rental',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    { 
      label: 'Electricity', 
      description: 'Electricity and power services', 
      unitPrice: 150.00,
      category: 'utilities',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    },
    { 
      label: 'Water Services', 
      description: 'Water and sanitation services', 
      unitPrice: 80.00,
      category: 'utilities',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-700'
    },
    { 
      label: 'WiFi Access', 
      description: 'Marina WiFi and internet access', 
      unitPrice: 45.00,
      category: 'services',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    { 
      label: 'Pump Out', 
      description: 'Waste pump out service', 
      unitPrice: 35.00,
      category: 'services',
      color: 'bg-orange-50 border-orange-200 text-orange-700'
    },
    { 
      label: 'Fuel Dock', 
      description: 'Fuel and diesel services', 
      unitPrice: 0.00,
      category: 'fuel',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    { 
      label: 'Laundry', 
      description: 'Laundry and washing facilities', 
      unitPrice: 25.00,
      category: 'amenities',
      color: 'bg-pink-50 border-pink-200 text-pink-700'
    },
    { 
      label: 'Shower', 
      description: 'Shower and bathroom facilities', 
      unitPrice: 15.00,
      category: 'amenities',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    }
  ]

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    customerName: '',
    customerEmail: '',
    issueDate: '',
    dueDate: '',
    status: 'DRAFT',
    subtotal: '0',
    tax: '0',
    total: '0',
    description: '',
    notes: ''
  })

  // Enhanced form data handling with better UX
  useEffect(() => {
    if (editingInvoice) {
      setFormData({
        invoiceNumber: editingInvoice.invoiceNumber || '',
        customerName: editingInvoice.customerName || '',
        customerEmail: editingInvoice.customerEmail || '',
        issueDate: editingInvoice.issueDate || '',
        dueDate: editingInvoice.dueDate || '',
        status: (editingInvoice.status as InvoiceFormData['status']) || 'DRAFT',
        subtotal: editingInvoice.subtotal?.toString() || '0',
        tax: editingInvoice.tax?.toString() || '0',
        total: editingInvoice.total?.toString() || '0',
        description: editingInvoice.description || '',
        notes: editingInvoice.notes || ''
      })
      const lineItemsData = editingInvoice.lineItems || []
      setLineItems(lineItemsData)
      setOriginalLineItems(lineItemsData)
      setUseLineItems((editingInvoice.lineItems?.length || 0) > 0)
    }
  }, [editingInvoice])

  // Enhanced input sanitization with better UX
  const sanitizeNumericInput = (value: string): string => {
    return value
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1')
      .replace(/^0+(\d)/, '$1')
      .replace(/^(\d+\.\d{2}).*/, '$1')
  }

  const parseAmount = (value: string): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Enhanced line item management with better UX
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

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
    if (activeRow === id) setActiveRow(null)
  }

  const cancelLineItemEdit = () => {
    if (activeRow) {
      // Revert the line item to its original state
      const originalItem = originalLineItems.find(item => item.id === activeRow)
      if (originalItem) {
        setLineItems(lineItems.map(item => 
          item.id === activeRow ? originalItem : item
        ))
      }
      setActiveRow(null)
    }
  }

  const saveLineItemEdit = () => {
    if (activeRow) {
      // Update the original line items with current changes
      setOriginalLineItems(lineItems)
      setActiveRow(null)
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedItems = lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    })
    setLineItems(updatedItems)
    updateTotals(updatedItems)
  }

  const updateTotals = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const tax = subtotal * 0.25 // 25% VAT
    const total = subtotal + tax
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    }))
  }

  // Enhanced form handling with better UX
  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors(prev => ({ ...prev, [field]: '' }))
  }

  const renderFieldError = (field: keyof InvoiceFormData) => {
    return validationErrors[field] ? (
      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {validationErrors[field]}
      </div>
    ) : null
  }

  const hasChanges = () => {
    if (!editingInvoice) return true
    
    // Check form data changes
    const formDataChanged = JSON.stringify(formData) !== JSON.stringify({
      invoiceNumber: editingInvoice.invoiceNumber,
      customerName: editingInvoice.customerName,
      customerEmail: editingInvoice.customerEmail,
      issueDate: editingInvoice.issueDate,
      dueDate: editingInvoice.dueDate,
      status: editingInvoice.status,
      subtotal: editingInvoice.subtotal?.toString(),
      tax: editingInvoice.tax?.toString(),
      total: editingInvoice.total?.toString(),
      description: editingInvoice.description,
      notes: editingInvoice.notes
    })
    
    // Check line items changes
    const originalLineItemsData = editingInvoice.lineItems || []
    const lineItemsChanged = JSON.stringify(lineItems) !== JSON.stringify(originalLineItemsData)
    
    return formDataChanged || lineItemsChanged
  }

  const handleReset = () => {
    if (editingInvoice) {
      setFormData({
        invoiceNumber: editingInvoice.invoiceNumber || '',
        customerName: editingInvoice.customerName || '',
        customerEmail: editingInvoice.customerEmail || '',
        issueDate: editingInvoice.issueDate || '',
        dueDate: editingInvoice.dueDate || '',
        status: (editingInvoice.status as InvoiceFormData['status']) || 'DRAFT',
        subtotal: editingInvoice.subtotal?.toString() || '0',
        tax: editingInvoice.tax?.toString() || '0',
        total: editingInvoice.total?.toString() || '0',
        description: editingInvoice.description || '',
        notes: editingInvoice.notes || ''
      })
      const lineItemsData = editingInvoice.lineItems || []
      setLineItems(lineItemsData)
      setOriginalLineItems(lineItemsData)
      setActiveRow(null)
      setValidationErrors({})
    }
  }

  const handleClose = () => {
    if (editingInvoice && hasChanges()) {
      setShowCloseWarning(true)
    } else {
      onClose()
    }
  }

  const handleConfirmClose = () => {
    setShowCloseWarning(false)
    onClose()
  }

  const handleCancelClose = () => {
    setShowCloseWarning(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setValidationErrors({})

    try {
      const validatedData = InvoiceFormSchema.parse({
        ...formData,
        lineItems: useLineItems ? lineItems : undefined
      })

      const endpoint = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices'
      const method = editingInvoice ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      })

      if (!response.ok) {
        throw new Error('Failed to save invoice')
      }

      logger.info('Invoice saved successfully', { invoiceId: editingInvoice?.id })
      onSuccess()
      onClose()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path) {
            errors[err.path[0] as string] = err.message
          }
        })
        setValidationErrors(errors)
      } else {
        logger.error('Error saving invoice', { error })
        setValidationErrors({ general: 'Failed to save invoice. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

     return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
       {/* Close Warning Modal */}
       {showCloseWarning && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
           <Card className="w-full max-w-md">
             <CardHeader className="bg-red-50 border-b border-red-200">
               <CardTitle className="text-red-800 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5" />
                 Unsaved Changes
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <p className="text-gray-700 mb-4">
                 You have unsaved changes. Are you sure you want to close without saving?
               </p>
               <div className="flex gap-3 justify-end">
                 <Button
                   variant="outline"
                   onClick={handleCancelClose}
                   className="border-gray-300 hover:border-gray-400"
                 >
                   Continue Editing
                 </Button>
                 <Button
                   variant="destructive"
                   onClick={handleConfirmClose}
                   className="bg-red-600 hover:bg-red-700"
                 >
                   Close Without Saving
                 </Button>
               </div>
             </CardContent>
           </Card>
         </div>
       )}
       
       <Card className="w-full h-full sm:max-w-4xl sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
              </CardTitle>
              <CardDescription className="text-blue-100">
                {editingInvoice ? 'Update invoice details' : 'Create a new invoice'}
              </CardDescription>
            </div>
                         <Button
               variant="ghost"
               size="sm"
               onClick={handleClose}
               className="text-white hover:bg-blue-600"
             >
               <X className="w-4 h-4" />
             </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[calc(100vh-280px)] sm:max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Information Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Pro Tip:</span>
                <span className="text-sm">Fields marked with * are required. Use line items for detailed billing.</span>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber" className="text-sm font-medium">Invoice Number *</Label>
                <Input 
                  id="invoiceNumber" 
                  placeholder="INV-2024-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className={`h-9 text-sm ${validationErrors.invoiceNumber ? 'border-red-500' : ''}`}
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">Letters, numbers, hyphens, underscores only</p>
                {renderFieldError('invoiceNumber')}
              </div>
              
              <div>
                <Label htmlFor="customerName" className="text-sm font-medium">Customer Name *</Label>
                <Input 
                  id="customerName" 
                  placeholder="John Smith"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className={`h-9 text-sm ${validationErrors.customerName ? 'border-red-500' : ''}`}
                  maxLength={100}
                />
                {renderFieldError('customerName')}
              </div>
              
              <div>
                <Label htmlFor="customerEmail" className="text-sm font-medium">Customer Email *</Label>
                <Input 
                  id="customerEmail" 
                  type="email"
                  placeholder="john.smith@email.com"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className={`h-9 text-sm ${validationErrors.customerEmail ? 'border-red-500' : ''}`}
                  maxLength={254}
                />
                {renderFieldError('customerEmail')}
              </div>
              
              <div>
                <Label htmlFor="issueDate" className="text-sm font-medium">Issue Date *</Label>
                <LocaleDateInput
                  id="issueDate"
                  value={formData.issueDate}
                  onChange={(value) => handleInputChange('issueDate', value)}
                  className={`h-9 text-sm ${validationErrors.issueDate ? 'border-red-500' : ''}`}
                />
                {renderFieldError('issueDate')}
              </div>
              
              <div>
                <Label htmlFor="dueDate" className="text-sm font-medium">Due Date *</Label>
                <LocaleDateInput
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(value) => handleInputChange('dueDate', value)}
                  className={`h-9 text-sm ${validationErrors.dueDate ? 'border-red-500' : ''}`}
                />
                {renderFieldError('dueDate')}
              </div>
              
              <div>
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
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
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
              <Input 
                id="description" 
                placeholder="Monthly berth rental"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`h-9 text-sm ${validationErrors.description ? 'border-red-500' : ''}`}
                maxLength={500}
              />
              {renderFieldError('description')}
            </div>
            
            {/* Enhanced Line Items Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-lg font-semibold text-gray-900">Line Items</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Add detailed line items for professional invoicing
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 cursor-pointer"
                    onClick={() => setUseLineItems(!useLineItems)}
                  >
                    <div className={`absolute inset-0 rounded-full transition-colors ${
                      useLineItems ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                    <span className={`relative inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      useLineItems ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </div>
                  <Label className="text-sm font-medium cursor-pointer" onClick={() => setUseLineItems(!useLineItems)}>
                    {useLineItems ? (
                      <span className="text-green-700 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Line Items Active
                      </span>
                    ) : (
                      <span className="text-gray-600">Enable Line Items</span>
                    )}
                  </Label>
                </div>
              </div>
              
              {useLineItems && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                                     {/* Enhanced Quick Add Section */}
                   <div className="mb-6">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2">
                         <Calculator className="w-5 h-5 text-blue-600" />
                         <h3 className="text-lg font-semibold text-gray-800">Quick Add Services</h3>
                       </div>
                       <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                         {lineItems.length} item{lineItems.length !== 1 ? 's' : ''} added
                       </div>
                     </div>
                     
                     {/* Popular Services - One-click buttons */}
                     <div className="mb-4">
                       <div className="text-sm font-medium text-gray-700 mb-2">Popular Services (Click to Add):</div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                         {commonItems.slice(0, 4).map((item, index) => (
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
                             className={`h-10 px-3 border-2 ${item.color} hover:scale-105 transition-transform flex flex-col items-center gap-1`}
                           >
                             <Plus className="w-4 h-4" />
                             <span className="text-xs font-medium">{item.label}</span>
                             {item.unitPrice > 0 && (
                               <span className="text-xs font-bold">£{item.unitPrice}</span>
                             )}
                           </Button>
                         ))}
                       </div>
                     </div>
                     
                     {/* All Services Dropdown */}
                     <div className="mb-4">
                       <div className="text-sm font-medium text-gray-700 mb-2">All Available Services:</div>
                       <div className="flex items-center gap-3">
                                                   <Select 
                            value={selectedService}
                            onValueChange={(value) => {
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
                                  // Reset dropdown to show it's ready for another selection
                                  setSelectedService('')
                                  // Show success message
                                  setShowAddSuccess(true)
                                  setTimeout(() => setShowAddSuccess(false), 3000)
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-80 h-10 text-sm bg-white border-2 border-blue-200 focus:border-blue-400">
                              <SelectValue placeholder="Select a service to add to invoice..." />
                            </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="select" disabled>
                               <div className="text-gray-400 italic">Choose a service to add...</div>
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
                         
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={addLineItem}
                           className="h-10 px-4 bg-white border-2 border-gray-300 hover:border-gray-400 flex items-center gap-2"
                         >
                           <Plus className="w-4 h-4" />
                           <span>Add Custom Item</span>
                         </Button>
                       </div>
                     </div>
                     
                                           {/* Visual Feedback */}
                      {lineItems.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-800">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-sm font-medium">
                              {lineItems.length} service{lineItems.length !== 1 ? 's' : ''} added to invoice
                            </span>
                          </div>
                                                     {lineItems.some(item => item.description === '') && (
                             <div className="mt-2 text-sm text-yellow-700">
                               💡 <strong>Tip:</strong> Click on any highlighted row to edit the item details
                             </div>
                           )}
                           {activeRow && (
                             <div className="mt-2 text-sm text-blue-700">
                               ⌨️ <strong>Keyboard:</strong> Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to cancel or <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Enter</kbd> to save
                             </div>
                           )}
                        </div>
                      )}
                      
                      {/* Success Message for Dropdown Additions */}
                      {showAddSuccess && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 text-blue-800">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">
                              ✅ Service added successfully! Dropdown reset and ready for next selection.
                            </span>
                          </div>
                        </div>
                      )}
                   </div>
                  
                  {/* Line Items Table */}
                  {lineItems.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-700">
                          <div className="col-span-5">Description</div>
                          <div className="col-span-2">Quantity</div>
                          <div className="col-span-2">Unit Price</div>
                          <div className="col-span-2">Total</div>
                          <div className="col-span-1"></div>
                        </div>
                      </div>
                      
                                             <div className="divide-y divide-gray-100">
                         {lineItems.map((item, index) => (
                                                       <div 
                              key={item.id} 
                              className={`line-item-row px-4 py-3 transition-colors cursor-pointer group ${
                                activeRow === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 
                                item.description === '' ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setActiveRow(item.id)}
                            >
                                                           {/* Edit indicator */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-500 font-medium">
                                  {activeRow === item.id ? (
                                    <span className="text-blue-600 flex items-center gap-1">
                                      ✏️ Editing item {index + 1}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                      Click to edit item {index + 1}
                                    </span>
                                  )}
                                </div>
                                {activeRow === item.id && (
                                  <div className="flex items-center gap-2">
                                                                         <Button
                                       type="button"
                                       variant="ghost"
                                       size="sm"
                                       onClick={(e) => {
                                         e.stopPropagation()
                                         saveLineItemEdit()
                                       }}
                                       className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                     >
                                       ✓ Done
                                     </Button>
                                     <Button
                                       type="button"
                                       variant="ghost"
                                       size="sm"
                                       onClick={(e) => {
                                         e.stopPropagation()
                                         cancelLineItemEdit()
                                       }}
                                       className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                     >
                                       ✕ Cancel
                                     </Button>
                                  </div>
                                )}
                              </div>
                            <div className="grid grid-cols-12 gap-3 items-center">
                                                             <div className="col-span-5">
                                 {activeRow === item.id ? (
                                   <Input
                                     value={item.description}
                                     onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                     placeholder="Enter item description..."
                                     className="text-sm h-8 border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                                   />
                                 ) : (
                                   <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border border-gray-200">
                                     {item.description || <span className="text-gray-400 italic">No description</span>}
                                   </div>
                                 )}
                               </div>
                                                             <div className="col-span-2">
                                 {activeRow === item.id ? (
                                   <Input
                                     type="text"
                                     inputMode="decimal"
                                     value={item.quantity}
                                     onChange={(e) => updateLineItem(item.id, 'quantity', sanitizeNumericInput(e.target.value))}
                                     placeholder="Qty"
                                     className="text-sm font-mono h-8 border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                                   />
                                 ) : (
                                   <div className="text-sm font-mono text-gray-900 py-2 px-3 bg-gray-50 rounded border border-gray-200">
                                     {item.quantity}
                                   </div>
                                 )}
                               </div>
                                                             <div className="col-span-2">
                                 {activeRow === item.id ? (
                                   <Input
                                     type="text"
                                     inputMode="decimal"
                                     value={item.unitPrice}
                                     onChange={(e) => updateLineItem(item.id, 'unitPrice', sanitizeNumericInput(e.target.value))}
                                     placeholder="Price"
                                     className="text-sm font-mono h-8 border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                                   />
                                 ) : (
                                   <div className="text-sm font-mono text-gray-900 py-2 px-3 bg-gray-50 rounded border border-gray-200">
                                     {formatCurrency(item.unitPrice)}
                                   </div>
                                 )}
                               </div>
                              <div className="col-span-2">
                                <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                  {formatCurrency(item.amount)}
                                </div>
                              </div>
                              <div className="col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLineItem(item.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Enhanced Financial Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subtotal" className="text-sm font-medium text-gray-700">Subtotal *</Label>
                  <Input 
                    id="subtotal" 
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.subtotal}
                    onChange={(e) => handleInputChange('subtotal', sanitizeNumericInput(e.target.value))}
                    className="font-mono h-10 text-lg bg-white border-green-300 focus:border-green-500"
                  />
                  {renderFieldError('subtotal')}
                </div>
                <div>
                  <Label htmlFor="tax" className="text-sm font-medium text-gray-700">VAT (25%) *</Label>
                  <Input 
                    id="tax" 
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.tax}
                    onChange={(e) => handleInputChange('tax', sanitizeNumericInput(e.target.value))}
                    className="font-mono h-10 text-lg bg-white border-green-300 focus:border-green-500"
                  />
                  {renderFieldError('tax')}
                </div>
                <div>
                  <Label htmlFor="total" className="text-sm font-medium text-gray-700">Total</Label>
                  <Input 
                    id="total" 
                    type="text"
                    placeholder="0.00"
                    value={formData.total}
                    readOnly
                    className="font-mono h-10 text-lg bg-green-100 border-green-400 text-green-900 font-bold"
                  />
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <div className="text-xs font-medium text-green-800 mb-2">Live Calculation:</div>
                <div className="text-xs text-green-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(parseAmount(formData.subtotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (25%):</span>
                    <span className="font-mono">{formatCurrency(parseAmount(formData.tax))}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-300 pt-1 font-semibold">
                    <span>Total:</span>
                    <span className="font-mono">{formatCurrency(parseAmount(formData.total))}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional notes or special instructions..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="text-sm h-16 resize-none"
              />
            </div>
          </form>
        </CardContent>
        
        {/* Enhanced Footer */}
        <div className="flex-shrink-0 border-t bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Changes Indicator */}
            <div className="flex-shrink-0">
              {editingInvoice && hasChanges() && (
                <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                  Changes detected
                </div>
              )}
              
              {editingInvoice && !hasChanges() && (
                <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  No changes to save
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {editingInvoice && hasChanges() && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={isLoading}
                  size="sm"
                  className="border-gray-300 hover:border-gray-400 w-full sm:w-auto"
                >
                  Reset Changes
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
                size="sm"
                className="border-gray-300 hover:border-gray-400 w-full sm:w-auto"
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full sm:w-auto"
                onClick={handleSubmit}
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
