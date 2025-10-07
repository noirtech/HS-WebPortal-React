'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Mail,
  Phone,
  MapPin,
  Anchor,
  FileText,
  Calendar,
  DollarSign,
  Download,
  Archive
} from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { useCustomers } from '@/hooks/use-data-source-fetch'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Settings } from 'lucide-react'

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

// Mock customers data - REMOVED - Now using data source hook

const customerStatusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800'
}

export default function CustomersPage() {
  const { formatDate, formatCurrency, localeConfig } = useLocaleFormatting()
  const { data: customers, isLoading, error } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [cityFilter, setCityFilter] = useState('ALL')

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Customers</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show empty state if no customers
  if (!customers || customers.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Customers Found</h2>
            <p className="text-gray-600 mb-4">There are no customers to display at the moment.</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add First Customer
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Filter customers based on search and filters
  const filteredCustomers = customers.filter((customer: any) => {
    if (searchTerm) {
      const matchesSearch = 
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
    }

    if (statusFilter !== 'ALL' && customer.status !== statusFilter) {
      return false
    }

    if (cityFilter !== 'ALL' && customer.city !== cityFilter) {
      return false
    }

    return true
  })



  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customerStatusColors[status as keyof typeof customerStatusColors]}`}>
        {status}
      </span>
    )
  }

  const getTotalCustomers = () => customers?.length || 0
  const getActiveCustomers = () => customers?.filter((c: any) => c.status === 'ACTIVE').length || 0
  const getTotalRevenue = () => customers?.reduce((sum: number, customer: any) => sum + (customer.totalSpent || 0), 0) || 0
  const getTotalBoats = () => customers?.reduce((sum: number, customer: any) => sum + (customer.totalBoats || 0), 0) || 0

  const getCities = () => Array.from(new Set((customers || []).map((customer: any) => customer.city)))

  const handleDownloadCustomer = async (customer: any) => {
    try {
      // Import the PDF generator dynamically to avoid SSR issues
      const { downloadCustomerPDF } = await import('@/lib/pdf-generator')
      
      // Convert mock data to CustomerData format
      const customerData = {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        isActive: customer.status === 'ACTIVE',
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }
      
      // Generate and download PDF
      downloadCustomerPDF(customerData)
      
      logger.info('Customer PDF generated and downloaded successfully')
    } catch (error) {
      logger.error('Error generating customer PDF', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to generate customer PDF. Please try again.')
    }
  }

  const handleBulkDownload = async () => {
    try {
      logger.debug('Starting bulk download for customers')
      
      if (!customers || customers.length === 0) {
        alert('No customers to download')
        return
      }
      
      // Import the PDF generator dynamically to avoid SSR issues
      const { generateCustomerPDFBlob } = await import('@/lib/pdf-generator')
      logger.info('PDF generator imported successfully')
      
      // Create a zip file with all PDFs
      const JSZip = await import('jszip')
      const zip = new JSZip.default()
      logger.info('JSZip imported successfully')
      
      // Generate PDFs for each customer
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i]
        logger.debug('Processing customer', { current: i + 1, total: customers.length, name: `${customer.firstName} ${customer.lastName}` })
        
        const customerData = {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
                  isActive: customer.status === 'ACTIVE',
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
        }
        
        try {
          const pdfBlob = generateCustomerPDFBlob(customerData)
          logger.info('PDF generated for customer', { name: `${customer.firstName} ${customer.lastName}` })
          
          const filename = `customer-${customer.lastName}-${customer.firstName}-${new Date().toISOString().split('T')[0]}.pdf`
          
          // Add to zip
          zip.file(filename, pdfBlob)
          logger.info('Added file to zip', { filename })
        } catch (pdfError) {
          logger.error('Error generating PDF for customer', { name: `${customer.firstName} ${customer.lastName}`, error: pdfError instanceof Error ? pdfError.message : String(pdfError) })
          // Continue with other customers
        }
      }
      
      logger.debug('Generating zip file')
      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      logger.info('Zip file generated')
      
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `customers-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      logger.info('Bulk download completed', { count: customers.length })
    } catch (error) {
      logger.error('Error in bulk download', { error: error instanceof Error ? error.message : String(error) })
      alert(`Failed to download customers: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleViewCustomer = (customer: any) => {
    // Show customer details in a modal or navigate to detail page
    const details = `
Customer Details:
- Name: ${customer.firstName} ${customer.lastName}
- Email: ${customer.email}
- Phone: ${customer.phone}
- Address: ${customer.address}
- City: ${customer.city}, ${customer.state} ${customer.zipCode}
- Country: ${customer.country}
- Member Since: ${formatDate(customer.dateJoined)}
- Status: ${customer.status}
- Total Boats: ${customer.totalBoats}
- Active Contracts: ${customer.activeContracts}
- Total Spent: ${formatCurrency(customer.totalSpent)}
- Last Activity: ${formatDate(customer.lastActivity)}
    `;
    
    alert(details);
  };

  const handleEditCustomer = (customer: any) => {
    // Navigate to edit page or show edit form
    alert(`Edit functionality for ${customer.firstName} ${customer.lastName} would be implemented here`);
  };

  const handleViewBoats = (customer: any) => {
    // Navigate to boats page filtered by customer
    alert(`View boats for ${customer.firstName} ${customer.lastName} would be implemented here`);
  };

  const handleViewHistory = (customer: any) => {
    // Show customer transaction history
    const history = `
Transaction History for ${customer.firstName} ${customer.lastName}:

1. Contract Renewal - ${formatDate(customer.lastActivity)} - ${formatCurrency(customer.totalSpent * 0.3)}
2. Berth Rental - ${formatDate(new Date(customer.lastActivity.getTime() - 30 * 24 * 60 * 60 * 1000))} - ${formatCurrency(customer.totalSpent * 0.2)}
3. Maintenance Service - ${formatDate(new Date(customer.lastActivity.getTime() - 60 * 24 * 60 * 60 * 1000))} - ${formatCurrency(customer.totalSpent * 0.1)}
4. Initial Contract - ${formatDate(customer.dateJoined)} - ${formatCurrency(customer.totalSpent * 0.4)}

Total Transactions: 4
    `;
    
    alert(history);
  };

  const handleAddCustomer = () => {
    // Show add customer form
    alert('Add Customer form would be implemented here');
  };

  const handleMoreFilters = () => {
    // Show advanced filter options
    const filters = prompt(`
Advanced Filters:

1. Date Range:
   - Joined After: 
   - Joined Before: 

2. Spending Range:
   - Min Spent: 
   - Max Spent: 

3. Boat Count:
   - Min Boats: 
   - Max Boats: 

4. Contract Status:
   - All
   - Active Only
   - Expired Only

Enter filter values (press Cancel to skip):
    `)
    if (filters) {
      logger.info('Advanced filters applied', { filters })
      alert('Advanced filters would be applied here')
    }
  };

  return (
    <AppLayout user={mockUser}>
      <div className="p-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="customers"
            dataCount={customers?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalCustomers: customers?.length || 0,
              activeCustomers: customers?.filter((c: any) => c.status === 'ACTIVE').length || 0,
              inactiveCustomers: customers?.filter((c: any) => c.status === 'INACTIVE').length || 0,
              premiumCustomers: customers?.filter((c: any) => c.membershipType === 'PREMIUM').length || 0
            }}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-2">
              Manage customer relationships and boat owner information
            </p>
            <p className="text-sm text-gray-500 mt-1">
                              {localeConfig.displayName} • {localeConfig.currency} • {localeConfig.spelling === 'british' ? 'British English' : 'American English'}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              variant="outline"
              onClick={handleBulkDownload}
              disabled={!customers || customers.length === 0}
            >
              <Archive className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Customer
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Customer Management</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage customer relationships and boat owner information for the marina.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> View customer profiles, track boat ownership, monitor spending history, and manage customer status (Active/Inactive). Each customer can have multiple boats and contracts, with full transaction history and contact information.
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
                        <strong>Customer Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">owners</code> table contains 51 customer records with personal details like names, email addresses, phone numbers, and addresses. 
                        Each customer has a unique ID, contact information, and links to boats and contracts through foreign key relationships.
                      </p>
                      <p>
                        <strong>Boat Ownership Tracking:</strong> The system tracks which boats belong to which customers through the <code className="bg-green-100 px-1 rounded">boats</code> table. 
                        Each boat record contains an ownerId that links to the customer, allowing the system to show all boats owned by a specific customer.
                      </p>
                      <p>
                        <strong>Contract History:</strong> Customer contract history is maintained through the <code className="bg-green-100 px-1 rounded">contracts</code> table, which links customers to specific berths. 
                        This allows the system to show current and historical berth assignments for each customer.
                      </p>
                      <p>
                        <strong>Key Tables for Customers:</strong> <code className="bg-green-100 px-1 rounded">owners</code> (51 customers), <code className="bg-green-100 px-1 rounded">boats</code> (50 vessels), 
                        <code className="bg-green-100 px-1 rounded">contracts</code> (51 records), <code className="bg-green-100 px-1 rounded">invoices</code> (50 invoices). 
                        The system uses LEFT JOINs to display comprehensive customer information including their boats, contracts, and billing history.
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
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalCustomers()}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-green-600">{getActiveCustomers()}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Boats</p>
                  <p className="text-2xl font-bold text-blue-600">{getTotalBoats()}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Anchor className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalRevenue())}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
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
                    placeholder="Search customers by name, email, or phone..."
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
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="PENDING">Pending</option>
                </select>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Cities</option>
                  {getCities().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={handleMoreFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        <div className="space-y-4">
          {(customers || []).map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Member since {formatDate(customer.dateJoined)}
                        </p>
                      </div>
                      {getStatusBadge(customer.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{customer.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{customer.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{customer.city}, {customer.state}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Anchor className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{customer.totalBoats} boats</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Active Contracts:</span>
                        <span className="ml-2 text-gray-900">{customer.activeContracts}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Total Spent:</span>
                        <span className="ml-2 text-gray-900">{formatCurrency(customer.totalSpent)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Last Activity:</span>
                        <span className="ml-2 text-gray-900">{formatDate(customer.lastActivity)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Address:</span>
                        <span className="ml-2 text-gray-900">{customer.address}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewCustomer(customer)}>
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadCustomer(customer)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                      disabled={customer.status === 'INACTIVE' || customer.status === 'SUSPENDED'}
                      className={customer.status === 'INACTIVE' || customer.status === 'SUSPENDED' ? "text-gray-400 bg-gray-100 cursor-not-allowed" : ""}
                    >
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewBoats(customer)}>
                      Boats
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewHistory(customer)}>
                      History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {customers.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' || cityFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first customer'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && cityFilter === 'ALL' && (
                <Button onClick={handleAddCustomer}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
