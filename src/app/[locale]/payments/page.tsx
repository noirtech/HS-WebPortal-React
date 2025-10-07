'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { usePayments } from '@/hooks/use-data-source-fetch'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  X,
  FileText,
  Receipt,
  Settings
} from 'lucide-react'

// Mock user for demo purposes
const mockUser = {
  id: 'demo-user',
  email: 'demo@marina.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: [
    { role: 'ADMIN' },
    { role: 'STAFF_FRONT_DESK' }
  ]
}

// Mock payments data - REMOVED - Now using data source hook

const paymentStatusColors = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800'
}

const paymentMethodColors = {
  CREDIT_CARD: 'bg-blue-100 text-blue-800',
  BANK_TRANSFER: 'bg-green-100 text-green-800',
  CASH: 'bg-purple-100 text-purple-800',
  CHECK: 'bg-orange-100 text-orange-800'
}

export default function PaymentsPage() {
  const { formatCurrency, formatDate, formatDateLong, localeConfig } = useLocaleFormatting()
  const { data: payments, isLoading, error } = usePayments()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  
  // New state for modals and forms
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [newPayment, setNewPayment] = useState({
    customerName: '',
    customerEmail: '',
    invoiceNumber: '',
    amount: '',
    method: 'CREDIT_CARD',
    reference: '',
    description: ''
  })

  // Debug logging for locale changes
  useEffect(() => {
    logger.debug('PaymentsPage Locale config updated', {
      currentLocale: localeConfig.name,
      currency: localeConfig.currency,
      dateFormat: localeConfig.dateFormat,
      sampleDate: formatDate(new Date()),
      sampleCurrency: formatCurrency(1234.56)
    })
  }, [localeConfig, formatDate, formatCurrency])

  // Filter payments based on search and filters
  const filteredPayments = (payments || []).filter((payment: any) => {
    if (searchTerm) {
      const matchesSearch = 
        payment.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
    }

    if (statusFilter !== 'ALL' && payment.status !== statusFilter) {
      return false
    }

    if (methodFilter !== 'ALL' && payment.method !== methodFilter) {
      return false
    }

    if (dateFilter !== 'ALL') {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      // Ensure payment.paymentDate is a Date object
      const paymentDate = payment.paymentDate instanceof Date ? payment.paymentDate : new Date(payment.paymentDate)
      
      switch (dateFilter) {
        case 'THIS_MONTH':
          if (paymentDate < thirtyDaysAgo) return false
          break
        case 'TODAY':
          if (paymentDate.toDateString() !== today.toDateString()) return false
          break
        case 'THIS_WEEK':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          if (paymentDate < weekAgo) return false
          break
      }
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[status as keyof typeof paymentStatusColors]}`}>
        {status}
      </span>
    )
  }

  const getMethodBadge = (method: string) => {
    const methodLabels = {
      CREDIT_CARD: 'Credit Card',
      BANK_TRANSFER: 'Bank Transfer',
      CASH: 'Cash',
      CHECK: localeConfig.spelling === 'british' ? 'Cheque' : 'Check'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentMethodColors[method as keyof typeof paymentMethodColors]}`}>
        {methodLabels[method as keyof typeof methodLabels] || method}
      </span>
    )
  }

  const getTotalPayments = () => (payments || []).reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0)
  const getCompletedPayments = () => (payments || []).filter((p: any) => p.status === 'COMPLETED').reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0)
  const getPendingPayments = () => (payments || []).filter((p: any) => p.status === 'PENDING').reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0)
  const getFailedPayments = () => (payments || []).filter((p: any) => p.status === 'FAILED').reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0)

  // New payment handlers
  const handleNewPaymentChange = (field: string, value: string) => {
    setNewPayment(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreatePayment = () => {
    // Validate required fields
    if (!newPayment.customerName || !newPayment.invoiceNumber || !newPayment.amount) {
      alert('Please fill in all required fields')
      return
    }

    // Create new payment
    const newPaymentData = {
      id: (payments.length + 1).toString(),
      paymentNumber: `PAY-2024-${String(payments.length + 1).padStart(3, '0')}`,
      customerName: newPayment.customerName,
      customerEmail: newPayment.customerEmail,
      invoiceNumber: newPayment.invoiceNumber,
      paymentDate: new Date(),
      amount: parseFloat(newPayment.amount),
      method: newPayment.method,
      status: 'COMPLETED',
      reference: newPayment.reference || `${newPayment.method.toUpperCase()}-${Date.now()}`,
      description: newPayment.description || `Payment for Invoice ${newPayment.invoiceNumber}`
    }

    // In demo mode, show alert instead of updating state
    alert('Payment recorded successfully! (Demo mode - no actual payment recorded)')

    // Reset form and close modal
    setNewPayment({
      customerName: '',
      customerEmail: '',
      invoiceNumber: '',
      amount: '',
      method: 'CREDIT_CARD',
      reference: '',
      description: ''
    })
    setShowRecordPaymentModal(false)
  }

  const handleCancelNewPayment = () => {
    setNewPayment({
      customerName: '',
      customerEmail: '',
      invoiceNumber: '',
      amount: '',
      method: 'CREDIT_CARD',
      reference: '',
      description: ''
    })
    setShowRecordPaymentModal(false)
  }

  // View payment handlers
  const handleViewPayment = (payment: any) => {
    // Show payment details in a modal or navigate to detail page
    const details = `
Payment Details:
- Payment Number: ${payment.paymentNumber}
- Customer: ${payment.customerName}
- Invoice: ${payment.invoiceNumber}
- Amount: ${formatCurrency(payment.amount)}
- Method: ${payment.method}
- Status: ${payment.status}
- Date: ${formatDate(payment.paymentDate)}
- Reference: ${payment.reference}
- Description: ${payment.description}
    `;
    
    alert(details);
  };

  const handleCloseViewModal = () => {
    setSelectedPayment(null)
    setShowViewModal(false)
  }

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      if (!confirm('Are you sure you want to confirm this payment?')) {
        return;
      }

      // In a real app, this would be an API call
      // await fetch(`/api/payments/${paymentId}/confirm`, { method: 'POST' });
      
      // In demo mode, show alert instead of updating state
      logger.info('Payment confirmed successfully', { paymentId });
      alert('Payment confirmed successfully! (Demo mode - no actual payment confirmed)');
    } catch (error) {
      logger.error('Error confirming payment', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to confirm payment. Please try again.');
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      if (!confirm('Are you sure you want to retry this payment?')) {
        return;
      }

      // In a real app, this would be an API call
      // await fetch(`/api/payments/${paymentId}/retry`, { method: 'POST' });
      
      // In demo mode, show alert instead of updating state
      logger.info('Payment retry initiated', { paymentId });
      alert('Payment retry initiated successfully! (Demo mode - no actual payment retry)');
    } catch (error) {
      logger.error('Error retrying payment', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to retry payment. Please try again.');
    }
  };

  const handleGenerateReceipt = async (payment: any) => {
    try {
      // Generate receipt PDF
      const receiptData = {
        paymentNumber: payment.paymentNumber,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        invoiceNumber: payment.invoiceNumber,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        description: payment.description
      };
      
      // In a real app, this would generate and download a PDF receipt
      const receiptContent = `
RECEIPT
========

Payment Number: ${receiptData.paymentNumber}
Date: ${formatDate(receiptData.paymentDate)}
Customer: ${receiptData.customerName}
Email: ${receiptData.customerEmail}

Invoice: ${receiptData.invoiceNumber}
Amount: ${formatCurrency(receiptData.amount)}
Method: ${receiptData.method}
Reference: ${receiptData.reference}

Description: ${receiptData.description}

Thank you for your payment!
      `;
      
      // Create downloadable receipt
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.paymentNumber}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      logger.info('Receipt generated successfully', { paymentId: payment.id });
      alert('Receipt generated and downloaded successfully');
    } catch (error) {
      logger.error('Error generating receipt', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to generate receipt. Please try again.');
    }
  };

  // Reports handler
  const handleShowReports = () => {
    setShowReportsModal(true)
  }

  const handleCloseReportsModal = () => {
    setShowReportsModal(false)
  }

  return (
    <AppLayout user={mockUser}>
      <div className="p-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="payments"
            dataCount={payments?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalPayments: payments?.length || 0,
              successfulPayments: payments?.filter((p: any) => p.status === 'SUCCESSFUL').length || 0,
              pendingPayments: payments?.filter((p: any) => p.status === 'PENDING').length || 0,
              totalAmount: payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
            }}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-2">
              Track payment status and manage financial transactions
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {localeConfig.name} • {localeConfig.currency} • {localeConfig.dateFormat}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={handleShowReports}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button onClick={() => setShowRecordPaymentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Payment Tracking</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Track payment status and manage financial transactions for marina services.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> Record payments received from customers, track payment methods (Credit Card, Bank Transfer, Cash, Check), monitor status (Pending, Completed, Failed), and generate receipts. Links payments to specific invoices for reconciliation.
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
                        <strong>Payment Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">payments</code> table contains 50 payment records with details like amounts, payment methods, dates, and status. 
                        Each payment has a unique ID, invoice reference, and links to customers through foreign key relationships.
                      </p>
                      <p>
                        <strong>Payment Method Support:</strong> The system supports multiple payment methods including CASH, CARD, BANK_TRANSFER, and CHEQUE. 
                        Each method is stored as an enum value with appropriate validation and processing logic.
                      </p>
                      <p>
                        <strong>Status Tracking:</strong> The system tracks payment status through an enum: PENDING, COMPLETED, FAILED, and REFUNDED. 
                        Status changes trigger automatic updates to related invoices and generate audit trails for financial compliance.
                      </p>
                      <p>
                        <strong>Key Tables for Payments:</strong> <code className="bg-green-100 px-1 rounded">payments</code> (50 total), <code className="bg-green-100 px-1 rounded">invoices</code> (50 invoices), 
                        <code className="bg-green-100 px-1 rounded">customers</code> (51 customers), <code className="bg-green-100 px-1 rounded">audit_events</code> (for payment tracking). 
                        The system automatically updates invoice status when payments are completed and maintains payment history.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPayments())}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(getCompletedPayments())}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(getPendingPayments())}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(getFailedPayments())}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search payments, customers, invoices, or references..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Methods</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">{localeConfig.spelling === 'british' ? 'Cheque' : 'Check'}</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Show advanced filter options
                    const filters = prompt(`
Advanced Filters:

1. Amount Range:
   - Min Amount: 
   - Max Amount: 

2. Customer Type:
   - All
   - Premium
   - Standard

3. Payment Channel:
   - All
   - Online
   - In-Person
   - Phone

Enter filter values (press Cancel to skip):
                    `)
                    if (filters) {
                      logger.info('Advanced filters applied', { filters })
                      alert('Advanced filters would be applied here')
                    }
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <div className="space-y-4">
          {(payments || []).map((payment: any) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {payment.paymentNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {payment.customerName} • {payment.customerEmail}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(payment.status)}
                        {getMethodBadge(payment.method)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Invoice: {payment.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Date: {formatDate(payment.paymentDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Amount: {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Ref: {payment.reference}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {payment.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewPayment(payment)}>
                      View
                    </Button>
                    {payment.status === 'PENDING' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmPayment(payment.id)}>
                        Confirm
                      </Button>
                    )}
                    {payment.status === 'FAILED' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleRetryPayment(payment.id)}>
                        Retry
                      </Button>
                    )}
                    {payment.status === 'COMPLETED' && (
                      <Button variant="outline" size="sm" onClick={() => handleGenerateReceipt(payment)}>
                        <Receipt className="w-4 h-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(payments || []).length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' || methodFilter !== 'ALL' || dateFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by recording your first payment'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && methodFilter === 'ALL' && dateFilter === 'ALL' && (
                <Button onClick={() => setShowRecordPaymentModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Record Payment</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelNewPayment}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <Input
                  value={newPayment.customerName}
                  onChange={(e) => handleNewPaymentChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email
                </label>
                <Input
                  type="email"
                  value={newPayment.customerEmail}
                  onChange={(e) => handleNewPaymentChange('customerEmail', e.target.value)}
                  placeholder="Enter customer email"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number *
                </label>
                <Input
                  value={newPayment.invoiceNumber}
                  onChange={(e) => handleNewPaymentChange('invoiceNumber', e.target.value)}
                  placeholder="e.g., INV-2024-001"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (£) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => handleNewPaymentChange('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={newPayment.method}
                  onChange={(e) => handleNewPaymentChange('method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">{localeConfig.spelling === 'british' ? 'Cheque' : 'Check'}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <Input
                  value={newPayment.reference}
                  onChange={(e) => handleNewPaymentChange('reference', e.target.value)}
                  placeholder="Payment reference"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={newPayment.description}
                  onChange={(e) => handleNewPaymentChange('description', e.target.value)}
                  placeholder="Payment description"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreatePayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Record Payment
              </Button>
              <Button
                onClick={handleCancelNewPayment}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {showViewModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseViewModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPayment.paymentNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <p className="text-gray-900">{selectedPayment.customerName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <p className="text-gray-900">{selectedPayment.customerEmail}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <p className="text-gray-900">{selectedPayment.invoiceNumber}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[selectedPayment.status as keyof typeof paymentStatusColors]}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentMethodColors[selectedPayment.method as keyof typeof paymentMethodColors]}`}>
                    {getMethodBadge(selectedPayment.method).props.children}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <p className="text-gray-900">{formatDate(selectedPayment.paymentDate)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <p className="text-gray-900">{selectedPayment.reference}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedPayment.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCloseViewModal}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              {selectedPayment.status === 'COMPLETED' && (
                <Button
                  onClick={() => handleGenerateReceipt(selectedPayment)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate Receipt
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Payment Reports & Analytics</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseReportsModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalPayments())}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Payment Success Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round((getCompletedPayments() / getTotalPayments()) * 100)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Average Payment</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(getTotalPayments() / payments.length)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Payment Methods Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(paymentMethodColors).map(([method, colors]) => {
                      const methodPayments = payments.filter((p: any) => p.method === method)
                      const methodTotal = methodPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
                      const methodCount = methodPayments.length
                      
                      return (
                        <div key={method} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
                              {getMethodBadge(method).props.children}
                            </span>
                            <span className="text-sm text-gray-600">{methodCount} payments</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(methodTotal)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payment Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            payment.status === 'COMPLETED' ? 'bg-green-500' :
                            payment.status === 'PENDING' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">{payment.paymentNumber}</span>
                          <span className="text-sm text-gray-600">{payment.customerName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCloseReportsModal}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* DataSourceDebug Component - REMOVED TO FIX DUPLICATE BUTTONS */}
    </AppLayout>
  )
}
