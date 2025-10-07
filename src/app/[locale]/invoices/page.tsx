'use client'

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocaleDateInput } from '@/components/ui/locale-date-input'
import InvoiceForm from '@/components/forms/invoice-form'
import { useLocaleFormatting, useLocale } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { useInvoices } from '@/hooks/use-data-source-fetch'
import { PageInfoBox } from '@/components/ui/page-info-box'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, DollarSign, Calendar, User, FileText, AlertCircle, Settings } from 'lucide-react'
import { z } from 'zod'

// Zod validation schema for invoice creation/update (same as backend)
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
  
  notes: z.string().optional()
})

type InvoiceFormData = z.infer<typeof InvoiceFormSchema>

// Type definitions
interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  issueDate: string
  dueDate: string
  status: string
  subtotal: number
  tax: number
  total: number
  description: string
  notes: string
  lineItems?: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
}

// Add line item interface
interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

// Helper function for parsing amounts with decimal support
const parseAmount = (value: string): number => {
  if (!value || value === '') return 0
  if (value === '.') return 0
  if (value.startsWith('.')) return parseFloat('0' + value) || 0
  return parseFloat(value) || 0
}

// Mock data for demonstration
const mockUser = {
  id: 'admin-user',
  email: 'admin@marina.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: [{ role: 'ADMIN' }]
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

export default function InvoicesPage() {
  const router = useRouter()
  const { formatCurrency, formatDate, formatDateLong, getTaxLabel, getTaxRate, calculateTax, localeConfig } = useLocaleFormatting()
  const { currentLocale } = useLocale()
  
  // Use data source hook instead of hardcoded mock data
  const { data: invoices, isLoading, error } = useInvoices()
  

  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  // VISUAL DEBUG - Show what's actually being rendered
  const debugInfo = {
    currentLocale: localeConfig.name,
    dateFormat: localeConfig.dateFormat,
    sampleDate: formatDate('2025-08-21'),
    sampleCurrency: formatCurrency(1234.56),
    timestamp: new Date().toISOString()
  }

  // Filter invoices based on search and status
  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Form state for create/edit
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    customerName: '',
    customerEmail: '',
    issueDate: '',
    dueDate: '',
    status: 'DRAFT',
    subtotal: '',
    tax: '',
    total: '0.00',
    description: '',
    notes: ''
  })

  // Add line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [useLineItems, setUseLineItems] = useState(false)

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [isCheckingInvoiceNumber, setIsCheckingInvoiceNumber] = useState(false)
  const [invoiceNumberExists, setInvoiceNumberExists] = useState(false)

  // Input sanitization functions
  const sanitizeNumericInput = (value: string): string => {
    let sanitized = value.replace(/[^0-9.]/g, '')
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('')
    }
    if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
      sanitized = sanitized.substring(1)
    }
    if (sanitized.includes('.')) {
      const [whole, decimal] = sanitized.split('.')
      if (decimal && decimal.length > 2) {
        sanitized = whole + '.' + decimal.substring(0, 2)
      }
    }
    return sanitized
  }

  const sanitizeInvoiceNumberInput = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase()
  }

  const sanitizeTextInput = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9\s\-\'\.]/g, '')
  }

  const sanitizeEmailInput = (value: string): string => {
    // Remove invalid email characters but preserve email structure
    return value.replace(/[^\w@.\-+]/g, '')
  }

  // Validation helper functions
  const validateForm = (): boolean => {
    try {
      InvoiceFormSchema.parse(formData)
      
      // Additional business logic validation
      if (formData.issueDate && formData.dueDate) {
        const issueDate = new Date(formData.issueDate)
        const dueDate = new Date(formData.dueDate)
        
        if (dueDate <= issueDate) {
          setValidationErrors(prev => ({ ...prev, dueDate: 'Due date must be after issue date' }))
          return false
        }
        
        // Check for reasonable date ranges (industry standard: max 1 year)
        const maxDueDate = new Date(issueDate)
        maxDueDate.setFullYear(maxDueDate.getFullYear() + 1)
        
        if (dueDate > maxDueDate) {
          setValidationErrors(prev => ({ ...prev, dueDate: 'Due date cannot be more than 1 year from issue date' }))
          return false
        }
      }
      
      // Invoice number duplicate validation
      if (invoiceNumberExists) {
        setValidationErrors(prev => ({ ...prev, invoiceNumber: 'Invoice number already exists' }))
        return false
      }
      
      setValidationErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: {[key: string]: string} = {}
        error.errors.forEach(err => {
          const field = err.path[0] as string
          errors[field] = err.message
        })
        setValidationErrors(errors)
      }
      return false
    }
  }

  const validateField = (field: keyof InvoiceFormData, value: string): string | null => {
    try {
      const fieldSchema = InvoiceFormSchema.shape[field]
      if (fieldSchema) {
        fieldSchema.parse(value)
      }
      return null
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || null
      }
      return null
    }
  }

  // Error display helpers
  const renderFieldError = (field: keyof InvoiceFormData) => {
    if (!validationErrors[field]) return null
    
    return (
      <div 
        className="flex items-center gap-2 text-red-500 text-sm mt-1"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="w-4 h-4" />
        <span id={`${field}-error`}>{validationErrors[field]}</span>
      </div>
    )
  }

  const renderGeneralError = (message: string) => {
    return (
      <div 
        className="flex items-center gap-2 text-red-500 text-sm mt-1"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="w-4 h-4" />
        <span>{message}</span>
      </div>
    )
  }



  const handleCreateInvoice = () => {
    logger.debug('Invoices handleCreateInvoice clicked')
    setShowCreateForm(true)
    setEditingInvoice(null)
    // Reset form data
    setFormData({
      invoiceNumber: '',
      customerName: '',
      customerEmail: '',
      issueDate: new Date().toISOString().split('T')[0], // Set today as default
      dueDate: '',
      status: 'DRAFT',
      subtotal: '',
      tax: '',
      total: '0.00',
      description: '',
      notes: ''
    })
    // Clear validation errors and checks
    setValidationErrors({})
    setInvoiceNumberExists(false)
    setIsCheckingInvoiceNumber(false)
    setLineItems([])
    setUseLineItems(false)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    logger.debug('Invoices handleEditInvoice invoice', { invoice })
    setEditingInvoice(invoice)
    setShowCreateForm(true)
    // Populate form data
    setFormData({
      invoiceNumber: invoice.invoiceNumber || '',
      customerName: invoice.customerName || '',
      customerEmail: invoice.customerEmail || '',
      issueDate: invoice.issueDate || '',
      dueDate: invoice.dueDate || '',
      status: (invoice.status as InvoiceFormData['status']) || 'DRAFT',
      subtotal: invoice.subtotal?.toString() || '0',
      tax: invoice.tax?.toString() || '0',
      total: ((invoice.subtotal || 0) + (invoice.tax || 0)).toFixed(2),
      description: invoice.description || '',
      notes: invoice.notes || ''
    })
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' })
      
      // For demo mode, just show a success message
      alert('Invoice deleted successfully!')
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice. Please try again.')
    }
  }

  const handleViewInvoice = (invoiceId: string) => {
    logger.debug('Invoices handleViewInvoice invoiceId', { invoiceId })
    router.push(`/${currentLocale}/invoices/${invoiceId}`)
  }

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { downloadInvoicePDF } = await import('@/lib/pdf-generator')
      
      // Prepare invoice data for PDF generation
      const invoiceData = {
        ...invoice,
        lineItems: invoice.lineItems || []
      }
      
      // Generate and download PDF
      downloadInvoicePDF(invoiceData)
      
      logger.info('PDF generated and downloaded successfully')
    } catch (error) {
      logger.error('Error generating PDF', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleDownloadFromForm = async () => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { downloadInvoicePDF } = await import('@/lib/pdf-generator')
      
      // Create invoice data from form data
      const invoiceData = {
        id: editingInvoice?.id || 'temp-id',
        invoiceNumber: formData.invoiceNumber,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: formData.status,
        subtotal: parseAmount(formData.subtotal),
        tax: parseAmount(formData.tax),
        total: parseAmount(formData.total),
        description: formData.description,
        notes: formData.notes || '',
        lineItems: useLineItems ? lineItems : []
      }
      
      // Generate and download PDF
      downloadInvoicePDF(invoiceData)
      
      logger.info('PDF generated and downloaded successfully from form')
    } catch (error) {
      logger.error('Error generating PDF from form', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleBulkDownload = async () => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { generateInvoicePDFBlob } = await import('@/lib/pdf-generator')
      
      if (filteredInvoices.length === 0) {
        alert('No invoices to download')
        return
      }
      
      // Create a zip file with all PDFs
      const JSZip = await import('jszip')
      const zip = new JSZip.default()
      
      // Generate PDFs for each invoice
      for (let i = 0; i < filteredInvoices.length; i++) {
        const invoice = filteredInvoices[i]
        const pdfBlob = generateInvoicePDFBlob({
          ...invoice,
          lineItems: invoice.lineItems || []
        })
        
        const filename = `invoice-${invoice.invoiceNumber || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`
        
        // Add to zip
        zip.file(filename, pdfBlob)
      }
      
      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoices-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      logger.info('Bulk download completed', { count: filteredInvoices.length })
    } catch (error) {
      logger.error('Error in bulk download', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to download invoices. Please try again.')
    }
  }

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0]
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField)
        element?.scrollIntoView({ [localeConfig.spelling === 'british' ? 'behaviour' : 'behavior']: 'smooth', block: 'center' })
      }
      return
    }
    
    // Validate line items if using them
    if (useLineItems && lineItems.length > 0) {
      const invalidItems = lineItems.filter(item => !item.description || item.unitPrice <= 0)
      if (invalidItems.length > 0) {
        alert('Please fill in all line item descriptions and ensure unit prices are greater than 0.')
        return
      }
    }
    
    logger.debug('Invoices handleFormSubmit', { mode: editingInvoice ? 'edit' : 'create', payload: formData })
    
    // Prepare payload with line items
    const payload = {
      ...formData,
      lineItems: useLineItems ? lineItems : undefined,
      subtotal: parseAmount(formData.subtotal),
      tax: parseAmount(formData.tax),
      total: parseAmount(formData.total)
    }
    
    logger.debug('Invoices payload prepared', { payload })
    
    try {
      const request = {
        method: editingInvoice ? 'PUT' : 'POST',
        endpoint: editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices'
      }
      logger.debug('Invoices request', { request })
      
      const response = await fetch(request.endpoint, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      // Parse response body once and store it
      const responseBody = await response.json().catch(() => ({}))
      
      logger.debug('Invoices response', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: responseBody
      })
      
      if (response.ok) {
        logger.debug('Invoices response body', { responseBody })
        
        // Check if we have a successful response (either success flag or invoice ID)
        if (responseBody.success || responseBody.id) {
          logger.info('Invoice saved successfully', { responseBody })
          alert(editingInvoice ? 'Invoice updated successfully!' : 'Invoice created successfully!')
          
          // Reset form and close modal
          setShowCreateForm(false)
          setEditingInvoice(null)
          setFormData({
            invoiceNumber: '',
            customerName: '',
            customerEmail: '',
            issueDate: '',
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
          setInvoiceNumberExists(false)
          setIsCheckingInvoiceNumber(false)
          
          // Refresh the page to show new invoice
          window.location.reload()
        } else {
          logger.error('Response indicates failure', { responseBody })
          const errorMessage = responseBody?.error || responseBody?.message || 'Failed to create invoice'
          throw new Error(errorMessage)
        }
      } else {
        const errorMessage = responseBody?.error || 'Failed to create invoice'
        throw new Error(errorMessage)
      }
    } catch (error) {
      logger.error('Error saving invoice', { error: error instanceof Error ? error.message : String(error) })
      const errorMessage = error instanceof Error ? error.message : 'Error saving invoice. Please try again.'
      alert(errorMessage)
      console.groupEnd()
    }
  }

  // Enhanced validation functions with industry best practices
  const validateEmail = (email: string): boolean => {
    // Simplified email validation regex that's more reliable
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateRequired = (value: string, fieldName: string): string | null => {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`
    }
    return null
  }

  // Comprehensive currency validation with industry standards
  const validateCurrency = (value: string, fieldName: string): string | null => {
    if (!value || value.trim() === '') return null // Allow empty for optional fields
    
    // Check for valid number format
    const numValue = parseAmount(value)
    
    // Check for negative values
    if (numValue < 0) {
      return `${fieldName} cannot be negative`
    }
    
            // Check for reasonable maximum (industry standard: £999,999.99)
        if (numValue > 999999.99) {
          return `${fieldName} cannot exceed ${localeConfig.currencySymbol}999,999.99`
        }
    
    // Check decimal places (max 2 for currency)
    if (value.includes('.') && value.split('.')[1]?.length > 2) {
      return `${fieldName} cannot have more than 2 decimal places`
    }
    
    // Check for valid currency format (no multiple decimal points, valid characters)
    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return `${fieldName} must be a valid currency amount`
    }
    
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Auto-calculate total when subtotal or tax changes
      if (field === 'subtotal' || field === 'tax') {
        // Handle partial decimal inputs (e.g., ".1" should become 0.1)
        const subtotal = parseAmount(newData.subtotal)
        const tax = parseAmount(newData.tax)
        const calculatedTotal = subtotal + tax
        
        // Format total with proper decimal places
        newData.total = calculatedTotal.toFixed(2)
        
        // Log the calculation for debugging (only when values change significantly)
        if (Math.abs(subtotal - parseAmount(prev.subtotal)) > 0.01 || Math.abs(tax - parseAmount(prev.tax)) > 0.01) {
          logger.debug('Invoices Calculation', { subtotal, tax, calculatedTotal })
        }
      }
      
      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
      
      // Real-time date validation
      if ((field === 'issueDate' || field === 'dueDate') && newData.issueDate && newData.dueDate) {
        const issueDate = new Date(newData.issueDate)
        const dueDate = new Date(newData.dueDate)
        
        if (dueDate < issueDate) {
          setValidationErrors(prev => ({
            ...prev,
            dueDate: 'Due date must be on or after issue date'
          }))
        }
      }
      
      // Enhanced real-time validation for different field types
      if (field === 'subtotal' || field === 'tax') {
        // Real-time currency validation using the comprehensive validateCurrency function
        const currencyError = validateCurrency(value, field === 'subtotal' ? 'Subtotal' : 'Tax')
        if (currencyError) {
          setValidationErrors(prev => ({
            ...prev,
            [field]: currencyError
          }))
          // For decimal place violations, don't update the field
          if (currencyError.includes('decimal places')) {
            return prev
          }
        } else {
          // Clear error if validation passes
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[field]
            return newErrors
          })
        }
      }

      // Real-time email validation
      if (field === 'customerEmail' && value) {
        if (!validateEmail(value)) {
          setValidationErrors(prev => ({
            ...prev,
            customerEmail: 'Please enter a valid email address'
          }))
        } else if (value.length > 254) {
          setValidationErrors(prev => ({
            ...prev,
            customerEmail: 'Email address is too long (maximum 254 characters)'
          }))
        } else if (value.includes('..')) {
          setValidationErrors(prev => ({
            ...prev,
            customerEmail: 'Email address cannot contain consecutive dots'
          }))
        } else if (value.startsWith('.') || value.endsWith('.')) {
          setValidationErrors(prev => ({
            ...prev,
            customerEmail: 'Email address cannot start or end with a dot'
          }))
        } else {
          // Clear error if validation passes
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.customerEmail
            return newErrors
          })
        }
      }

      // Real-time invoice number validation
      if (field === 'invoiceNumber' && value) {
        if (value.length > 50) {
          setValidationErrors(prev => ({
            ...prev,
            invoiceNumber: 'Invoice number is too long (maximum 50 characters)'
          }))
        } else if (!/^[A-Za-z0-9\-_]+$/.test(value)) {
          setValidationErrors(prev => ({
            ...prev,
            invoiceNumber: 'Invoice number can only contain letters, numbers, hyphens, and underscores'
          }))
        } else {
          // Clear error if validation passes
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.invoiceNumber
            return newErrors
          })
        }
      }

      // Real-time customer name validation
      if (field === 'customerName' && value) {
        if (value.length > 100) {
          setValidationErrors(prev => ({
            ...prev,
            customerName: 'Customer name is too long (maximum 100 characters)'
          }))
        } else if (!/^[A-Za-z\s\-'\.]+$/.test(value)) {
          setValidationErrors(prev => ({
            ...prev,
            customerName: 'Customer name can only contain letters, spaces, hyphens, apostrophes, and periods'
          }))
        } else {
          // Clear error if validation passes
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.customerName
            return newErrors
          })
        }
      }

      // Real-time description validation
      if (field === 'description' && value) {
        if (value.length > 500) {
          setValidationErrors(prev => ({
            ...prev,
            description: 'Description is too long (maximum 500 characters)'
          }))
        } else {
          // Clear error if validation passes
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.description
            return newErrors
          })
        }
      }
      
      return newData
    })
  }

  // Check if invoice number already exists
  const checkInvoiceNumberExists = async (invoiceNumber: string) => {
    if (!invoiceNumber || invoiceNumber.trim() === '') return
    
    setIsCheckingInvoiceNumber(true)
    try {
      const response = await fetch(`/api/invoices?checkNumber=${encodeURIComponent(invoiceNumber)}`)
      if (response.ok) {
        const data = await response.json()
        setInvoiceNumberExists(data.exists)
        
        if (data.exists) {
          setValidationErrors(prev => ({
            ...prev,
            invoiceNumber: 'Invoice number already exists'
          }))
        }
      }
    } catch (error) {
      console.error('Error checking invoice number:', error)
    } finally {
      setIsCheckingInvoiceNumber(false)
    }
  }

  // Debounced invoice number check
  const debouncedCheckInvoiceNumber = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout
      return (invoiceNumber: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          checkInvoiceNumberExists(invoiceNumber)
        }, 500) // Wait 500ms after user stops typing
      }
    }, []),
    []
  )



  // Line items management functions
  const addLineItem = () => {
    const newLineItem: LineItem = {
      id: `line-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }
    setLineItems([...lineItems, newLineItem])
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        // Recalculate amount
        updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice
        return updatedItem
      }
      return item
    }))
  }

  // Calculate subtotal from line items
  const calculateSubtotalFromLineItems = () => {
    if (!useLineItems || lineItems.length === 0) return 0
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  // Update subtotal when line items change
  useEffect(() => {
    if (useLineItems && lineItems.length > 0) {
      const calculatedSubtotal = calculateSubtotalFromLineItems()
      setFormData(prev => ({
        ...prev,
        subtotal: calculatedSubtotal.toFixed(2)
      }))
    }
  }, [lineItems, useLineItems])

  const getStatusBadge = (status: string) => (
    <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  )

  return (
    <AppLayout user={mockUser}>
      <div className="p-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="invoices"
            dataCount={invoices?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalInvoices: invoices?.length || 0,
              totalAmount: invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0,
              overdueCount: invoices?.filter((inv: any) => inv.status === 'OVERDUE').length || 0,
              paidCount: invoices?.filter((inv: any) => inv.status === 'PAID').length || 0
            }}
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Manage customer invoices and payment tracking</p>
          <p className="text-sm text-gray-500 mt-1">
            {localeConfig.name} • {localeConfig.currency} • {getTaxLabel()} {getTaxRate()}%
          </p>
          

        </div>

        {/* Collapsible Information Box */}
        <CollapsibleInfoBox title="Click to find out what this page does">
          <div className="space-y-4">
            {/* Page Overview Box */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">?</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Invoice Management</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Create, manage, and track customer invoices for marina services and berth rentals.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> Generate invoices with line items or single descriptions, set due dates, track payment status (Draft, Sent, Paid, Overdue, Cancelled), and download PDFs. Supports both simple invoices and detailed line-item billing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Architecture Box */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Settings className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">System Architecture & Database</h3>
                    <div className="text-sm text-green-700 space-y-2">
                      <p>
                        <strong>Invoice Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">invoices</code> table contains 50 invoices with billing details like amounts, due dates, status, and customer information. 
                        Each invoice has a unique invoice number, customer details, and links to payments through foreign key relationships.
                      </p>
                      <p>
                        <strong>Billing Status Management:</strong> The system tracks invoice status through an enum: DRAFT, SENT, PAID, OVERDUE, and CANCELLED. 
                        Status changes are managed through the API with validation to ensure proper workflow progression.
                      </p>
                      <p>
                        <strong>Line Item Support:</strong> The system supports both simple invoices (single description) and complex line-item billing. 
                        Line items are stored in a separate table with quantity, rate, and description, allowing for detailed service breakdowns.
                      </p>
                      <p>
                        <strong>Key Tables for Invoices:</strong> <code className="bg-green-100 px-1 rounded">invoices</code> (50 total), <code className="bg-green-100 px-1 rounded">customers</code> (51 customers), 
                        <code className="bg-green-100 px-1 rounded">payments</code> (50 records), <code className="bg-green-100 px-1 rounded">line_items</code> (for detailed billing). 
                        The system automatically calculates totals, taxes, and payment status through SQL aggregation functions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button onClick={handleCreateInvoice} className="sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
          
          {filteredInvoices.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => handleBulkDownload()}
              className="sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All ({filteredInvoices.length})
            </Button>
          )}
          
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoices Grid */}
        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first invoice'
                  }
                </p>
                {!searchTerm && statusFilter === 'ALL' && (
                  <Button onClick={handleCreateInvoice}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">{invoice.invoiceNumber || 'N/A'}</CardTitle>
                        {getStatusBadge(invoice.status || 'DRAFT')}
                      </div>
                      <CardDescription className="text-base">
                        {invoice.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.total || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {formatDate(invoice.dueDate || new Date().toISOString().split('T')[0])}
                      </div>

                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{invoice.customerName || 'Unknown Customer'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Issued: {formatDate(invoice.issueDate || new Date().toISOString().split('T')[0])}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Subtotal: {formatCurrency(invoice.subtotal || 0)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Line Items */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Line Items</h4>
                    <div className="space-y-2">
                      {invoice.lineItems && invoice.lineItems.length > 0 ? (
                        invoice.lineItems.map((item: any, index: number) => (
                          <div key={item.id || `item-${index}`} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.description || 'No description'}</span>
                            <span className="text-gray-900">{formatCurrency(item.amount || 0)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">
                          <span>Single item: {invoice.description || 'No description'}</span>
                          <span className="float-right">{formatCurrency(invoice.total || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice.id || '')}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadInvoice(invoice)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteInvoice(invoice.id || '')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit Invoice Form */}
        {showCreateForm && (
          <InvoiceForm
            onClose={() => {
              setShowCreateForm(false)
              setEditingInvoice(null)
            }}
            onSuccess={async () => {
              try {
                // Refresh the page to show new/updated invoice
                window.location.reload()
              } catch (error) {
                console.error('Error refreshing invoice list:', error)
                // You could show a toast notification here
              }
            }}
            editingInvoice={editingInvoice ? {
              id: editingInvoice.id,
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
              notes: editingInvoice.notes || '',
              lineItems: editingInvoice.lineItems || []
            } : undefined}
          />
        )}
      </div>
      
      {/* Data Source Debug Component - REMOVED TO FIX DUPLICATE BUTTONS */}
    </AppLayout>
  )
}
