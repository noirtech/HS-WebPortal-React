'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/app-layout'
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Trash2, 
  FileText, 
  Calendar,
  PoundSterling,
  User,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard
} from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import InvoiceForm from '@/components/forms/invoice-form'

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
  createdAt: string
  updatedAt: string
  lineItems?: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
}

// Invoice status colors and labels
const invoiceStatusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

const invoiceStatusLabels = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled'
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const { formatCurrency, formatDate, formatDateTime } = useLocaleFormatting()
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    // Fetch invoice details
    const fetchInvoice = async () => {
      try {
        logger.debug('INVOICE DETAIL: Fetching invoice', { invoiceId })
        const response = await fetch(`/api/invoices/${invoiceId}`)
        
        if (response.ok) {
          const data = await response.json()
          logger.info('INVOICE DETAIL: Invoice fetched successfully', { data })
          setInvoice(data)
        } else {
          const errorData = await response.json()
          logger.error('INVOICE DETAIL: Failed to fetch invoice', { errorData })
          setError(errorData.error || 'Failed to fetch invoice')
        }
      } catch (error) {
        logger.error('INVOICE DETAIL: Error fetching invoice', { error: error instanceof Error ? error.message : String(error) })
        setError('Failed to fetch invoice')
      } finally {
        setIsLoading(false)
      }
    }

    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId, status, router])

  const handleEditInvoice = () => {
    logger.debug('INVOICE DETAIL: handleEditInvoice clicked', { invoice })
    if (invoice) {
      setEditingInvoice(invoice)
      setShowEditForm(true)
    }
  }

  const handleEditSuccess = () => {
    logger.debug('INVOICE DETAIL: Edit successful, refreshing data')
    setShowEditForm(false)
    setEditingInvoice(null)
    // Refresh the invoice data
    if (invoice?.id) {
      window.location.reload() // Simple refresh for now
    }
  }

  const handleEditClose = () => {
    logger.debug('INVOICE DETAIL: Edit form closed')
    setShowEditForm(false)
    setEditingInvoice(null)
  }

  const handleDownloadInvoice = async () => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { downloadInvoicePDF } = await import('@/lib/pdf-generator')
      
      // Prepare invoice data for PDF generation
      const invoiceData = {
        ...invoice!,
        lineItems: invoice!.lineItems || []
      }
      
      // Generate and download PDF
      downloadInvoicePDF(invoiceData)
      
      logger.info('PDF generated and downloaded successfully')
    } catch (error) {
      logger.error('Error generating PDF', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const isOverdue = () => {
    if (!invoice || invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      return false
    }
    const dueDate = new Date(invoice.dueDate)
    const today = new Date()
    return dueDate < today
  }

  const getDaysOverdue = () => {
    if (!isOverdue()) return 0
    const dueDate = new Date(invoice!.dueDate)
    const today = new Date()
    const diffTime = today.getTime() - dueDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  if (error) {
    return (
      <AppLayout user={session.user}>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Invoice</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/invoices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!invoice) {
    return (
      <AppLayout user={session.user}>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
            <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/invoices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${invoiceStatusColors[status as keyof typeof invoiceStatusColors]}`}>
        {invoiceStatusLabels[status as keyof typeof invoiceStatusLabels]}
      </span>
    )
  }

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/invoices')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
          
          {/* Title and Status */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-4xl font-bold text-gray-900">
                Invoice {invoice.invoiceNumber}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-xl text-gray-600">
              {invoice.customerName} • {invoice.customerEmail}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {invoice.status !== 'CANCELLED' && (
              <>
                <Button variant="outline" onClick={handleEditInvoice}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Invoice
                </Button>
                <Button variant="outline" onClick={handleDownloadInvoice}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
                      // Handle delete
                      router.push('/invoices')
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Invoice Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Invoice Status</h2>
                <p className="text-gray-600">Current status and key information</p>
              </div>
              <div className="flex items-center gap-3">
                {isOverdue() && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getDaysOverdue()} day{getDaysOverdue() !== 1 ? 's' : ''} overdue
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Information
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadInvoice}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Invoice Number</label>
                  <p className="text-gray-900 font-semibold">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-900">{invoiceStatusLabels[invoice.status as keyof typeof invoiceStatusLabels]}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Issue Date</label>
                  <p className="text-gray-900">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              {invoice.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900">{invoice.description}</p>
                </div>
              )}

              {invoice.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <p className="text-gray-900">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900 font-semibold">{invoice.customerName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {invoice.customerEmail}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PoundSterling className="w-5 h-5" />
                  Financial Summary
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadInvoice}
                  className="text-green-600 hover:text-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Subtotal</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(invoice.subtotal)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tax</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(invoice.tax)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-600">Total Amount</label>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(invoice.total)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Line Items
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of services and charges
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadInvoice}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 py-3 border-b border-gray-200 font-medium text-gray-700 text-sm">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  
                  {/* Line Items */}
                  {invoice.lineItems.map((item, index) => (
                    <div key={item.id || index} className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="col-span-6">
                        <p className="font-medium text-gray-900">{item.description}</p>
                      </div>
                      <div className="col-span-2 text-center text-gray-600">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right text-gray-600">
                        {formatCurrency(item.unitPrice)}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-blue-600 border-t border-gray-200 pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(invoice.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Line Items</h3>
                  <p className="text-gray-600 mb-4">
                    This invoice doesn't have any line items yet.
                  </p>
                  <Button variant="outline" onClick={handleEditInvoice}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Invoice to Add Line Items
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-gray-900">{formatDateTime(invoice.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900">{formatDateTime(invoice.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Edit Form Modal */}
        {showEditForm && editingInvoice && (
          <InvoiceForm
            onClose={handleEditClose}
            onSuccess={handleEditSuccess}
            editingInvoice={{
              id: editingInvoice.id,
              invoiceNumber: editingInvoice.invoiceNumber,
              customerName: editingInvoice.customerName,
              customerEmail: editingInvoice.customerEmail,
              issueDate: editingInvoice.issueDate,
              dueDate: editingInvoice.dueDate,
              status: editingInvoice.status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED",
              subtotal: editingInvoice.subtotal.toString(),
              tax: editingInvoice.tax.toString(),
              total: editingInvoice.total.toString(),
              description: editingInvoice.description,
              notes: editingInvoice.notes,
              lineItems: editingInvoice.lineItems || []
            }}
          />
        )}
        
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
            <div>showEditForm: {showEditForm.toString()}</div>
            <div>editingInvoice: {editingInvoice ? 'Yes' : 'No'}</div>
            <div>Invoice ID: {invoice?.id || 'None'}</div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

