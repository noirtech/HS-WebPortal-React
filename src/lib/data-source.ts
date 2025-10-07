/**
 * Data Source Abstraction Layer
 * Implements strategy pattern for switching between mock and real database data
 * Follows SOLID principles and industry best practices
 */

import { logger } from './logger'
import { prisma } from './db'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type DataSource = 'mock' | 'database'

export interface DataSourceConfig {
  currentSource: DataSource
  isMockMode: boolean
  isDatabaseMode: boolean
}

export interface DataSourceService {
  getDataSource(): DataSource
  setDataSource(source: DataSource): void
  isMockMode(): boolean
  isDatabaseMode(): boolean
  getConfig(): DataSourceConfig
}

// ============================================================================
// MOCK DATA INTERFACES
// ============================================================================

interface MockContract {
  id: string
  contractNumber: string
  startDate: string
  endDate: string
  status: string
  monthlyRate: number
  customerId: string
  boatId: string
  berthId: string | null
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  boat: {
    id: string
    name: string
    registration: string
  }
  berth: {
    id: string
    berthNumber: string
  } | null
}

interface MockInvoice {
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

interface MockCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  dateJoined: string
  status: string
  totalBoats: number
  activeContracts: number
  totalSpent: number
  lastActivity: string
  createdAt: string
  updatedAt: string
}

interface MockBooking {
  id: string
  bookingNumber: string
  customerName: string
  customerEmail: string
  startDate: string
  endDate: string
  status: string
  totalAmount: number
  description: string
}

interface MockBoat {
  id: string
  name: string
  registration: string
  length: number
  beam: number
  draft: number
  ownerId: string
  isActive: boolean
  marinaId: string
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  status: string
}

interface MockBerth {
  id: string
  berthNumber: string
  length: number
  beam: number
  depth: number
  status: string
  monthlyRate: number
  isAvailable: boolean
  boatName?: string
  ownerFirstName?: string
  ownerLastName?: string
  contractEndDate?: string
  contractStatus?: string
}

interface MockWorkOrder {
  id: string
  workOrderNumber: string
  customerName: string
  boatName: string
  description: string
  status: string
  priority: string
  estimatedCost: number
  startDate: string
  completionDate: string | null
}

interface MockDashboardStats {
  contracts: {
    total: number
    active: number
    pending: number
    expired: number
  }
  invoices: {
    total: number
    paid: number
    pending: number
    overdue: number
  }
  bookings: {
    total: number
    active: number
  }
  payments: {
    total: number
    completed: number
    pending: number
    failed: number
  }
  owners: {
    total: number
    withContracts: number
  }
  boats: {
    total: number
    active: number
    inactive: number
  }
  berths: {
    total: number
    occupied: number
    available: number
  }
  workOrders: {
    total: number
    completed: number
    inProgress: number
    pending: number
  }
  financial: {
    totalRevenue: number
    monthlyRevenue: number
    outstandingAmount: number
  }
}

// ============================================================================
// COMPREHENSIVE MOCK DATA
// ============================================================================

// Generate 25 mock contracts
export const mockContracts: MockContract[] = Array.from({ length: 25 }, (_, i) => ({
  id: `contract-${i + 1}`,
  contractNumber: `CON-${String(i + 1).padStart(3, '0')}`,
  startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'EXPIRED'][i % 5],
  monthlyRate: 500 + Math.random() * 1000,
  customerId: `customer-${i + 1}`,
  boatId: `boat-${i + 1}`,
  berthId: `berth-${i + 1}`,
  customer: {
    id: `customer-${i + 1}`,
    firstName: `Customer${i + 1}`,
    lastName: 'Smith',
    email: `customer${i + 1}@example.com`
  },
  boat: {
    id: `boat-${i + 1}`,
    name: `Boat ${i + 1}`,
    registration: `REG-${String(i + 1).padStart(3, '0')}`
  },
  berth: {
    id: `berth-${i + 1}`,
    berthNumber: `A-${i + 1}`
  }
}))

// Generate 25 mock invoices
export const mockInvoices: MockInvoice[] = Array.from({ length: 25 }, (_, i) => ({
  id: `invoice-${i + 1}`,
  invoiceNumber: `INV-${String(i + 1).padStart(3, '0')}`,
  customerName: `Customer ${i + 1} Smith`,
  customerEmail: `customer${i + 1}@example.com`,
  issueDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: ['PAID', 'PAID', 'PAID', 'SENT', 'OVERDUE'][i % 5],
  subtotal: 500 + Math.random() * 2000,
  tax: 100 + Math.random() * 400,
  total: 600 + Math.random() * 2400,
  description: `Monthly berth rental for ${i + 1} month${i === 0 ? '' : 's'}`,
  notes: i % 3 === 0 ? 'Payment received on time' : '',
  lineItems: [
    {
      id: `item-${i + 1}`,
      description: `Berth rental - Month ${i + 1}`,
      quantity: 1,
      unitPrice: 500 + Math.random() * 2000,
      amount: 500 + Math.random() * 2000
    }
  ]
}))

// Generate 25 mock customers
export const mockCustomers: MockCustomer[] = Array.from({ length: 25 }, (_, i) => ({
  id: `customer-${i + 1}`,
  firstName: `Customer${i + 1}`,
  lastName: 'Smith',
  email: `customer${i + 1}@example.com`,
  phone: `+44 7${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
  address: `${i + 1} Marina Street`,
  city: 'Harbor City',
  state: 'CA',
  zipCode: `HC${String(i + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 9) + 1)}AB`,
  country: 'United Kingdom',
  dateJoined: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'PENDING'][i % 5],
  totalBoats: Math.floor(Math.random() * 3) + 1,
  activeContracts: Math.floor(Math.random() * 2) + 1,
  totalSpent: 1000 + Math.random() * 10000,
  lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
}))

// Generate 25 mock bookings
export const mockBookings: MockBooking[] = Array.from({ length: 25 }, (_, i) => ({
  id: `booking-${i + 1}`,
  bookingNumber: `BK-${String(i + 1).padStart(3, '0')}`,
  customerName: `Customer ${i + 1} Smith`,
  customerEmail: `customer${i + 1}@example.com`,
  startDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date(Date.now() + (30 + Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING', 'CANCELLED'][i % 5],
  totalAmount: 200 + Math.random() * 800,
  description: `Berth booking for ${i + 1} day${i === 0 ? '' : 's'}`
}))

// Generate 25 mock boats
export const mockBoats: MockBoat[] = Array.from({ length: 25 }, (_, i) => ({
  id: `boat-${i + 1}`,
  name: `Boat ${i + 1}`,
  registration: `REG-${String(i + 1).padStart(3, '0')}`,
  length: Math.round((20 + Math.random() * 30)), // Round to whole numbers
  beam: Math.round((5 + Math.random() * 10)), // Round to whole numbers
  draft: Math.round((1 + Math.random() * 3)), // Round to whole numbers
  ownerId: `customer-${i + 1}`,
  isActive: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'MAINTENANCE'][i % 5] !== 'INACTIVE',
  marinaId: 'marina-1',
  owner: {
    id: `customer-${i + 1}`,
    firstName: `Customer`,
    lastName: `${i + 1}`,
    email: `customer${i + 1}@email.com`
  },
  status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'MAINTENANCE'][i % 5]
}))

// Generate 25 mock berths
export const mockBerths: MockBerth[] = Array.from({ length: 25 }, (_, i) => ({
  id: `berth-${i + 1}`,
  berthNumber: `A-${i + 1}`,
  length: Math.round(30 + Math.random() * 20), // Round to whole numbers
  beam: Math.round(8 + Math.random() * 12), // Round to whole numbers
  depth: Math.round((2 + Math.random() * 3) * 10) / 10, // Round to 1 decimal place for depth
  status: ['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'MAINTENANCE'][i % 5],
  monthlyRate: Math.round(500 + Math.random() * 1000), // Round to whole numbers
  isAvailable: ['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'MAINTENANCE'][i % 5] === 'AVAILABLE',
  boatName: ['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'MAINTENANCE'][i % 5] === 'OCCUPIED' ? `Boat ${i + 1}` : undefined,
  ownerFirstName: ['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'MAINTENANCE'][i % 5] === 'OCCUPIED' ? 'Customer' : undefined,
  ownerLastName: ['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'MAINTENANCE'][i % 5] === 'OCCUPIED' ? `${i + 1}` : undefined,
  contractEndDate: ['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'MAINTENANCE'][i % 5] === 'OCCUPIED' ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
  contractStatus: ['OCCUPIED', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'MAINTENANCE'][i % 5] === 'OCCUPIED' ? 'ACTIVE' : undefined
}))

// Generate 25 mock work orders
export const mockWorkOrders: MockWorkOrder[] = Array.from({ length: 25 }, (_, i) => ({
  id: `workorder-${i + 1}`,
  workOrderNumber: `WO-${String(i + 1).padStart(3, '0')}`,
  customerName: `Customer ${i + 1} Smith`,
  boatName: `Boat ${i + 1}`,
  description: `Maintenance work for ${i + 1} item${i === 0 ? '' : 's'}`,
  status: ['COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'PENDING'][i % 5],
  priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
  estimatedCost: 200 + Math.random() * 1000,
  startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  completionDate: i % 3 === 0 ? new Date().toISOString().split('T')[0] : null
}))

// Generate 25 mock payments
export const mockPayments: any[] = Array.from({ length: 25 }, (_, i) => ({
  id: `payment-${i + 1}`,
  paymentNumber: `PAY-${String(i + 1).padStart(3, '0')}`,
  customerName: `Customer ${i + 1} Smith`,
  customerEmail: `customer${i + 1}@email.com`,
  invoiceNumber: `INV-${String(i + 1).padStart(3, '0')}`,
  paymentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'FAILED'][i % 5],
  method: ['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHEQUE'][i % 4],
  amount: 500 + Math.random() * 2000,
  reference: `REF-${String(i + 1).padStart(3, '0')}`,
  description: `Payment for invoice ${i + 1}`
}))

export const mockDashboardData: MockDashboardStats = {
  contracts: {
    total: 25,
    active: 20,
    pending: 3,
    expired: 2
  },
  invoices: {
    total: 25,
    paid: 22,
    pending: 2,
    overdue: 1
  },
  bookings: {
    total: 25,
    active: 23
  },
  payments: {
    total: 25,
    completed: 23,
    pending: 2,
    failed: 0
  },
  owners: {
    total: 25,
    withContracts: 22
  },
  boats: {
    total: 25,
    active: 20,
    inactive: 5
  },
  berths: {
    total: 25,
    occupied: 20,
    available: 5
  },
  workOrders: {
    total: 25,
    completed: 18,
    inProgress: 4,
    pending: 3
  },
  financial: {
    totalRevenue: 25000,
    monthlyRevenue: 2500,
    outstandingAmount: 2500
  }
}

// ============================================================================
// DATA SOURCE SERVICE IMPLEMENTATION
// ============================================================================

class DataSourceServiceImpl implements DataSourceService {
  private currentSource: DataSource = 'database'
  private readonly STORAGE_KEY = 'marina-data-source'
  private readonly DEFAULT_SOURCE: DataSource = 'database'

  constructor() {
    this.initializeDataSource()
  }

  private initializeDataSource(): void {
    try {
      // Check localStorage for saved preference
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(this.STORAGE_KEY)
        if (saved && (saved === 'mock' || saved === 'database')) {
          this.currentSource = saved as DataSource
          logger.debug('Data source loaded from localStorage', { source: this.currentSource })
        } else {
          // Check environment variable as fallback
          const envSource = process.env.NEXT_PUBLIC_DATA_SOURCE
          if (envSource === 'mock') {
            this.currentSource = 'mock'
            logger.debug('Data source set from environment variable', { source: this.currentSource })
          } else {
            logger.debug('Data source using default', { source: this.currentSource })
          }
        }
      } else {
        logger.debug('Data source initialization on server side', { source: this.currentSource })
      }

      logger.info('Data source initialized', { 
        source: this.currentSource,
        isClient: typeof window !== 'undefined'
      })
    } catch (error) {
      logger.error('Failed to initialize data source', { error })
      this.currentSource = this.DEFAULT_SOURCE
    }
  }

  getDataSource(): DataSource {
    return this.currentSource
  }

  setDataSource(source: DataSource): void {
    try {
      this.currentSource = source
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, source)
      }

      logger.info('Data source changed', { 
        newSource: source,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Failed to set data source', { source, error })
    }
  }

  isMockMode(): boolean {
    return this.currentSource === 'mock'
  }

  isDatabaseMode(): boolean {
    return this.currentSource === 'database'
  }

  getConfig(): DataSourceConfig {
    return {
      currentSource: this.currentSource,
      isMockMode: this.isMockMode(),
      isDatabaseMode: this.isDatabaseMode()
    }
  }

  // Debug function to check persistence
  debugPersistence(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      logger.debug('Data source persistence debug', {
        currentSource: this.currentSource,
        localStorageValue: saved,
        storageKey: this.STORAGE_KEY,
        isClient: true
      })
    } else {
      logger.debug('Data source persistence debug (server side)', {
        currentSource: this.currentSource,
        isClient: false
      })
    }
  }
}

// ============================================================================
// DATA PROVIDER INTERFACES
// ============================================================================

interface DashboardDataProvider {
  getDashboardStats(): Promise<MockDashboardStats>
  getMarinaOverview(): Promise<any>
  getRecentActivity(): Promise<any[]>
  getQuickActions(): Promise<any[]>
  getContracts(): Promise<MockContract[]>
  getInvoices(): Promise<MockInvoice[]>
  getCustomers(): Promise<MockCustomer[]>
  getBookings(): Promise<MockBooking[]>
  getBoats(): Promise<MockBoat[]>
  getBerths(): Promise<MockBerth[]>
  getWorkOrders(): Promise<MockWorkOrder[]>
  getPayments(): Promise<any[]>
  getMarinas(): Promise<any[]>
  getStaff(): Promise<any[]>
  getJobs(): Promise<any[]>
  getUsers(): Promise<any[]>
  getPendingOperations(): Promise<any[]>
  getSyncStatus(): Promise<any>
  getUserProfile(): Promise<any>
  updateUserProfile(profileData: any): Promise<void>
}

// ============================================================================
// MOCK DATA PROVIDER
// ============================================================================

class MockDataProvider implements DashboardDataProvider {
  async getDashboardStats(): Promise<MockDashboardStats> {
    // Simulate API delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    logger.debug('Mock data provider: getDashboardStats called')
    return mockDashboardData
  }

  async getPendingOperations(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    logger.debug('Mock data provider: getPendingOperations called')
    return [
      {
        id: 1,
        operationType: 'CONTRACT_CREATION',
        status: 'PENDING',
        priority: 'HIGH',
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T15:00:00Z',
        scheduledAt: null,
        autoResolve: false,
        metadata: {
          title: 'New Contract - Blue Horizon',
          description: 'Create contract for Blue Horizon yacht (Owner: John Smith)',
          attempts: 2,
          maxAttempts: 5,
          user: 'Mike Chen',
          department: 'Front Desk'
        }
      },
      {
        id: 2,
        operationType: 'INVOICE_UPDATE',
        status: 'PENDING',
        priority: 'MEDIUM',
        createdAt: '2024-01-15T13:45:00Z',
        updatedAt: '2024-01-15T14:15:00Z',
        scheduledAt: null,
        autoResolve: true,
        metadata: {
          title: 'Invoice Payment - Invoice #2024-001',
          description: 'Update payment status for invoice #2024-001',
          attempts: 1,
          maxAttempts: 3,
          user: 'Lisa Rodriguez',
          department: 'Finance'
        }
      },
      {
        id: 3,
        operationType: 'WORK_ORDER_CREATION',
        status: 'FAILED',
        priority: 'HIGH',
        createdAt: '2024-01-15T12:20:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
        scheduledAt: null,
        autoResolve: false,
        metadata: {
          title: 'Maintenance Request - Electrical Issue',
          description: 'Create work order for electrical system maintenance',
          attempts: 3,
          maxAttempts: 3,
          user: 'David Thompson',
          department: 'Maintenance'
        }
      }
    ]
  }

  async getSyncStatus(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    logger.debug('Mock data provider: getSyncStatus called')
    return {
      isOnline: true,
      lastSync: new Date().toISOString(),
      nextSync: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      syncInterval: 30,
      pendingOperations: 3,
      failedOperations: 1,
      totalOperations: 15,
      syncProgress: 80,
      isSyncing: false,
      connectionQuality: 'EXCELLENT',
      serverLatency: 25,
      dataTransferRate: '1.2 MB/s'
    }
  }

  async getMarinaOverview(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300))
    
    logger.debug('Mock data provider: getMarinaOverview called')
    
    // Calculate occupancy rate
    const occupancyRate = mockDashboardData.berths.total > 0 
      ? (mockDashboardData.berths.occupied / mockDashboardData.berths.total) * 100 
      : 0
    
    // Calculate customer engagement rate
    const engagementRate = mockDashboardData.owners.total > 0 
      ? (mockDashboardData.owners.withContracts / mockDashboardData.owners.total) * 100 
      : 0
    
    // Calculate boat utilization
    const utilization = mockDashboardData.boats.total > 0 
      ? (mockDashboardData.boats.active / mockDashboardData.boats.total) * 100 
      : 0
    
    // Calculate contract renewal rate
    const renewalRate = mockDashboardData.contracts.total > 0 
      ? (mockDashboardData.contracts.active / mockDashboardData.contracts.total) * 100 
      : 0
    
    // Calculate work order completion rate
    const completionRate = mockDashboardData.workOrders.total > 0 
      ? (mockDashboardData.workOrders.completed / mockDashboardData.workOrders.total) * 100 
      : 0
    
    return {
      generatedAt: new Date().toISOString(),
      marinaId: 'marina-1',
      summary: {
        totalRevenue: mockDashboardData.financial.totalRevenue,
        monthlyRevenue: mockDashboardData.financial.monthlyRevenue,
        outstandingAmount: mockDashboardData.financial.outstandingAmount,
        totalBoats: mockDashboardData.boats.total,
        totalBerths: mockDashboardData.berths.total,
        totalCustomers: mockDashboardData.owners.total,
        occupancyRate: occupancyRate
      },
      financial: {
        totalRevenue: mockDashboardData.financial.totalRevenue,
        monthlyRevenue: mockDashboardData.financial.monthlyRevenue,
        outstandingAmount: mockDashboardData.financial.outstandingAmount,
        revenueGrowth: 5.2,
        invoices: {
          total: mockDashboardData.invoices.total,
          paid: mockDashboardData.invoices.paid,
          pending: mockDashboardData.invoices.pending,
          overdue: mockDashboardData.invoices.overdue,
          totalPaid: mockDashboardData.invoices.paid * 1000, // Mock calculation
          totalPending: mockDashboardData.invoices.pending * 1000, // Mock calculation
          totalOverdue: mockDashboardData.invoices.overdue * 1000 // Mock calculation
        },
        payments: {
          total: mockDashboardData.payments.total,
          completed: mockDashboardData.payments.completed,
          pending: mockDashboardData.payments.pending,
          failed: mockDashboardData.payments.failed,
          totalCompleted: mockDashboardData.payments.completed * 1000, // Mock calculation
          avgAmount: 850 // Mock average
        }
      },
      boats: {
        total: mockDashboardData.boats.total,
        active: mockDashboardData.boats.active,
        inactive: mockDashboardData.boats.inactive,
        avgLength: 12.5, // Mock average
        avgBeam: 4.2, // Mock average
        avgDraft: 1.8, // Mock average
        utilization: utilization
      },
      contracts: {
        total: mockDashboardData.contracts.total,
        active: mockDashboardData.contracts.active,
        pending: mockDashboardData.contracts.pending,
        expired: mockDashboardData.contracts.expired,
        avgMonthlyRate: 850, // Mock average
        totalMonthlyRevenue: mockDashboardData.contracts.active * 850, // Mock calculation
        renewalRate: renewalRate
      },
      berths: {
        total: mockDashboardData.berths.total,
        occupied: mockDashboardData.berths.occupied,
        available: mockDashboardData.berths.available,
        occupancyRate: occupancyRate,
        occupancyGrowth: 2.1
      },
      customers: {
        total: mockDashboardData.owners.total,
        withContracts: mockDashboardData.owners.withContracts,
        engagementRate: engagementRate,
        avgContractsPerCustomer: mockDashboardData.owners.total > 0 
          ? mockDashboardData.contracts.total / mockDashboardData.owners.total 
          : 0
      },
      maintenance: {
        total: mockDashboardData.workOrders.total,
        completed: mockDashboardData.workOrders.completed,
        inProgress: mockDashboardData.workOrders.inProgress,
        pending: mockDashboardData.workOrders.pending,
        completionRate: completionRate,
        avgCompletionDays: 7.5, // Mock average
        totalCost: 12500
      },
      trends: {
        revenueGrowth: 5.2,
        occupancyGrowth: 2.1,
        customerGrowth: 3.8,
        maintenanceEfficiency: 85.5
      }
    }
  }

  async getRecentActivity(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    
    logger.debug('Mock data provider: getRecentActivity called')
    return [
      {
        id: '1',
        type: 'contract_renewed',
        title: 'Contract Renewed',
        description: 'Annual contract renewed for Berth A-15',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        priority: 'low'
      },
      {
        id: '2',
        type: 'payment_received',
        title: 'Payment Received',
        description: 'Monthly payment received from John Smith',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        priority: 'medium'
      },
      {
        id: '3',
        type: 'work_order_completed',
        title: 'Work Order Completed',
        description: 'Engine maintenance completed for vessel Sea Breeze',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        priority: 'high'
      }
    ]
  }

  async getQuickActions(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 70))
    
    logger.debug('Mock data provider: getQuickActions called')
    return [
      {
        id: '1',
        title: 'New Contract',
        description: 'Create a new berth contract',
        icon: 'file-text',
        action: 'create_contract',
        priority: 'high'
      },
      {
        id: '2',
        title: 'Process Payment',
        description: 'Record a new payment',
        icon: 'credit-card',
        action: 'process_payment',
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Schedule Maintenance',
        description: 'Create work order for vessel',
        icon: 'wrench',
        action: 'schedule_maintenance',
        priority: 'medium'
      }
    ]
  }

  async getContracts(): Promise<MockContract[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    console.log('📄 MOCK: getContracts called, returning mock data', { 
      count: mockContracts.length,
      timestamp: new Date().toISOString()
    })
    logger.debug('Mock data provider: getContracts called')
    return mockContracts
  }

  async getInvoices(): Promise<MockInvoice[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getInvoices called')
    return mockInvoices
  }

  async getCustomers(): Promise<MockCustomer[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getCustomers called')
    return mockCustomers
  }

  async getBookings(): Promise<MockBooking[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getBookings called')
    return mockBookings
  }

  async getBoats(): Promise<MockBoat[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getBoats called')
    return mockBoats
  }

  async getBerths(): Promise<MockBerth[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getBerths called')
    return mockBerths
  }

  async getWorkOrders(): Promise<MockWorkOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getWorkOrders called')
    return mockWorkOrders
  }

  async getPayments(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getPayments called')
    return mockPayments
  }

  async getMarinas(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getMarinas called')
    return [
      {
        id: '1',
        name: 'Harbor Point Marina',
        code: 'HPM',
        address: '123 Harbor Drive, Harbor City, HC 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@harborpoint.com',
        timezone: 'America/New_York',
        isActive: true,
        isOnline: true,
        lastSyncAt: new Date(Date.now() - 30 * 60 * 1000),
        marinaGroup: { name: 'East Coast Group' }
      },
      {
        id: '2',
        name: 'Sunset Bay Marina',
        code: 'SBM',
        address: '456 Sunset Boulevard, Bay City, BC 67890',
        phone: '+1 (555) 987-6543',
        email: 'info@sunsetbay.com',
        timezone: 'America/Los_Angeles',
        isActive: true,
        isOnline: false,
        lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        marinaGroup: { name: 'West Coast Group' }
      }
    ]
  }

  async getStaff(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getStaff called')
    return [
      { id: 'staff-1', name: 'Mike Johnson', role: 'Senior Marine Engineer', email: 'mike.johnson@marina.com' },
      { id: 'staff-2', name: 'Alex Chen', role: 'Electrical Specialist', email: 'alex.chen@marina.com' },
      { id: 'staff-3', name: 'Tom Wilson', role: 'Hull & Paint Technician', email: 'tom.wilson@marina.com' },
      { id: 'staff-4', name: 'Lisa Rodriguez', role: 'Safety & Compliance Officer', email: 'lisa.rodriguez@marina.com' },
      { id: 'staff-5', name: 'Sarah Kim', role: 'Junior Engineer', email: 'sarah.kim@marina.com' }
    ]
  }

  async getJobs(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getJobs called')
    return [
      {
        id: 'job-1',
        title: 'Engine Maintenance - Port Engine',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        requestedDate: new Date(),
        estimatedHours: 4,
        actualHours: 2.5,
        jobCategory: 'Engine Maintenance',
        jobNotes: 'Port engine showing unusual vibration. Need to check mounts and alignment.',
        isUrgent: true,
        assignedToStaffId: 'staff-1',
        assignedToStaffName: 'Mike Johnson',
        assignedToStaffRole: 'Senior Marine Engineer',
        customerName: 'John Smith',
        customerEmail: 'john.smith@email.com',
        customerPhone: '+44 7700 900123',
        boatName: 'Sea Spirit',
        boatRegistration: 'GB-12345',
        boatType: 'Motor Yacht',
        cost: 450.00,
        timeStarted: new Date(new Date().setHours(9, 0, 0, 0)),
        timeStopped: undefined,
        isTimerRunning: true,
        progress: 65,
        workOrderId: 'wo-001',
        workOrderNumber: 'WO-2024-001',
        photos: ['engine1.jpg', 'engine2.jpg'],
        comments: [
          {
            id: 'comment-1',
            text: 'Initial inspection complete. Engine mounts appear loose.',
            authorId: 'staff-1',
            authorName: 'Mike Johnson',
            authorRole: 'Senior Marine Engineer',
            timestamp: new Date(new Date().setHours(9, 30, 0, 0))
          }
        ]
      }
    ]
  }

  async getUsers(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    logger.debug('Mock data provider: getUsers called')
    return [
      { id: 'user-1', email: 'admin@marina.com', firstName: 'Admin', lastName: 'User', roles: ['ADMIN'] },
      { id: 'user-2', email: 'staff@marina.com', firstName: 'Staff', lastName: 'User', roles: ['STAFF_FRONT_DESK'] },
      { id: 'user-3', email: 'customer@marina.com', firstName: 'Customer', lastName: 'User', roles: ['CUSTOMER'] }
    ]
  }

  async getUserProfile(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    logger.debug('Mock data provider: getUserProfile called')
    return {
      id: 'demo-user',
      email: 'demo@marina.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+44 20 7946 0958',
      address: '123 Marina Way',
      city: 'Portsmouth',
      county: 'Hampshire',
      postcode: 'PO1 1AA',
      country: 'United Kingdom',
      roles: [
        { role: 'ADMIN' },
        { role: 'STAFF_FRONT_DESK' }
      ],
      preferences: {
        language: 'en-GB',
        timezone: 'Europe/London',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    }
  }

  async updateUserProfile(profileData: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
    
    logger.debug('Mock data provider: updateUserProfile called', { profileData })
    // In mock mode, we just simulate a successful update
    return Promise.resolve()
  }
}

// ============================================================================
// DATABASE DATA PROVIDER
// ============================================================================

class DatabaseDataProvider implements DashboardDataProvider {
  async getDashboardStats(): Promise<MockDashboardStats> {
    try {
      logger.debug('Database data provider: getDashboardStats called')
      
      // Check if we're in a browser environment and API is available
      if (typeof window === 'undefined') {
        // Server-side, return mock data
        return mockDashboardData
      }
      
      // This would typically call your existing API endpoints
      const response = await fetch('/api/reports/marina-overview')
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockDashboardData
      }
      
      const data = await response.json()
      
      // Transform database data to match mock data structure
      return {
        contracts: {
          total: data.contracts?.total || 0,
          active: data.contracts?.active || 0,
          pending: data.contracts?.pending || 0,
          expired: data.contracts?.expired || 0
        },
        invoices: {
          total: data.financial?.invoices?.total || 0,
          paid: data.financial?.invoices?.paid || 0,
          pending: data.financial?.invoices?.pending || 0,
          overdue: data.financial?.invoices?.overdue || 0
        },
        bookings: {
          total: data.bookings?.total || 0,
          active: data.bookings?.active || 0
        },
        payments: {
          total: data.financial?.payments?.total || 0,
          completed: data.financial?.payments?.completed || 0,
          pending: data.financial?.payments?.pending || 0,
          failed: data.financial?.payments?.failed || 0
        },
        owners: {
          total: data.customers?.total || 0,
          withContracts: data.customers?.withContracts || 0
        },
        boats: {
          total: data.boats?.total || 0,
          active: data.boats?.active || 0,
          inactive: data.boats?.inactive || 0
        },
        berths: {
          total: data.berths?.total || 0,
          occupied: data.berths?.occupied || 0,
          available: data.berths?.available || 0
        },
        workOrders: {
          total: data.maintenance?.total || 0,
          completed: data.maintenance?.completed || 0,
          inProgress: data.maintenance?.inProgress || 0,
          pending: data.maintenance?.pending || 0
        },
        financial: {
          totalRevenue: data.financial?.invoices?.totalPaid || 0,
          monthlyRevenue: data.financial?.monthlyRevenue || 0,
          outstandingAmount: data.financial?.outstandingAmount || 0
        }
      }
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      // Fallback to mock data instead of throwing
      return mockDashboardData
    }
  }

  async getPendingOperations(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getPendingOperations called')
      if (typeof window === 'undefined') {
        return []
      }
      
      const response = await fetch('/api/pending-operations', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to empty array', { 
          status: response.status,
          statusText: response.statusText 
        })
        return []
      }
      
      const data = await response.json()
      
      // Check if we have the expected data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database pending operations data', {
          count: data.length
        })
        return data
      }

      // Fallback to empty array if response format is unexpected
      logger.warn('Unexpected response format, falling back to empty array', { data })
      return []
    } catch (error) {
      logger.error('Database data provider error, falling back to empty array', { error })
      return []
    }
  }

  async getSyncStatus(): Promise<any> {
    try {
      logger.debug('Database data provider: getSyncStatus called')
      if (typeof window === 'undefined') {
        return {
          isOnline: true,
          lastSync: new Date().toISOString(),
          nextSync: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          syncInterval: 30,
          pendingOperations: 0,
          failedOperations: 0,
          totalOperations: 0,
          syncProgress: 100,
          isSyncing: false,
          connectionQuality: 'EXCELLENT',
          serverLatency: 0,
          dataTransferRate: '0 MB/s'
        }
      }
      
      const response = await fetch('/api/sync/status', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to default data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return {
          isOnline: true,
          lastSync: new Date().toISOString(),
          nextSync: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          syncInterval: 30,
          pendingOperations: 0,
          failedOperations: 0,
          totalOperations: 0,
          syncProgress: 100,
          isSyncing: false,
          connectionQuality: 'EXCELLENT',
          serverLatency: 0,
          dataTransferRate: '0 MB/s'
        }
      }
      
      const data = await response.json()
      
      // Check if we have the expected data structure
      if (data && data.success && data.data) {
        logger.debug('Using live database sync status data', {
          isOnline: data.data.isOnline,
          pendingOperations: data.data.pendingOperations
        })
        return data.data
      }

      // Fallback to default data if response format is unexpected
      logger.warn('Unexpected response format, falling back to default data', { data })
      return {
        isOnline: true,
        lastSync: new Date().toISOString(),
        nextSync: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        syncInterval: 30,
        pendingOperations: 0,
        failedOperations: 0,
        totalOperations: 0,
        syncProgress: 100,
        isSyncing: false,
        connectionQuality: 'EXCELLENT',
        serverLatency: 0,
        dataTransferRate: '0 MB/s'
      }
    } catch (error) {
      logger.error('Database data provider error, falling back to default data', { error })
      return {
        isOnline: true,
        lastSync: new Date().toISOString(),
        nextSync: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        syncInterval: 30,
        pendingOperations: 0,
        failedOperations: 0,
        totalOperations: 0,
        syncProgress: 100,
        isSyncing: false,
        connectionQuality: 'EXCELLENT',
        serverLatency: 0,
        dataTransferRate: '0 MB/s'
      }
    }
  }

  async getMarinaOverview(): Promise<any> {
    try {
      logger.debug('Database data provider: getMarinaOverview called')
      
      if (typeof window === 'undefined') {
        // Server-side, return mock data structure
        return {
          contracts: mockDashboardData.contracts,
          financial: {
            invoices: mockDashboardData.invoices,
            payments: mockDashboardData.payments,
            totalPaid: mockDashboardData.financial.totalRevenue,
            monthlyRevenue: mockDashboardData.financial.monthlyRevenue,
            outstandingAmount: mockDashboardData.financial.outstandingAmount
          },
          bookings: mockDashboardData.bookings,
          maintenance: mockDashboardData.workOrders,
          boats: mockDashboardData.boats,
          berths: mockDashboardData.berths,
          customers: mockDashboardData.owners
        }
      }
      
      const response = await fetch('/api/reports/marina-overview', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        // Return mock data structure instead of throwing
        return {
          contracts: mockDashboardData.contracts,
          financial: {
            invoices: mockDashboardData.invoices,
            payments: mockDashboardData.payments,
            totalPaid: mockDashboardData.financial.totalRevenue,
            monthlyRevenue: mockDashboardData.financial.monthlyRevenue,
            outstandingAmount: mockDashboardData.financial.outstandingAmount
          },
          bookings: mockDashboardData.bookings,
          maintenance: mockDashboardData.workOrders,
          boats: mockDashboardData.boats,
          berths: mockDashboardData.berths,
          customers: mockDashboardData.owners
        }
      }
      
      const data = await response.json()
      if (data && typeof data === 'object') {
        return data
      }
      
      // Fallback to mock data if response is not valid
      return {
        contracts: mockDashboardData.contracts,
        financial: {
          invoices: mockDashboardData.invoices,
          payments: mockDashboardData.payments,
          totalPaid: mockDashboardData.financial.totalRevenue,
          monthlyRevenue: mockDashboardData.financial.monthlyRevenue,
          outstandingAmount: mockDashboardData.financial.outstandingAmount
        },
        bookings: mockDashboardData.bookings,
        maintenance: mockDashboardData.workOrders,
        boats: mockDashboardData.boats,
        berths: mockDashboardData.berths,
        customers: mockDashboardData.owners
      }
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      // Return mock data structure instead of throwing
      return {
        contracts: mockDashboardData.contracts,
        financial: {
          invoices: mockDashboardData.invoices,
          payments: mockDashboardData.payments,
          totalPaid: mockDashboardData.financial.totalRevenue,
          monthlyRevenue: mockDashboardData.financial.monthlyRevenue,
          outstandingAmount: mockDashboardData.financial.outstandingAmount
        },
        bookings: mockDashboardData.bookings,
        maintenance: mockDashboardData.workOrders,
        boats: mockDashboardData.boats,
        berths: mockDashboardData.berths,
        customers: mockDashboardData.owners
      }
    }
  }

  async getRecentActivity(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getRecentActivity called')
      // Implement actual database queries here
      return []
    } catch (error) {
      logger.error('Database data provider error', { error })
      throw error
    }
  }

  async getQuickActions(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getQuickActions called')
      // Implement actual database queries here
      return []
    } catch (error) {
      logger.error('Database data provider error', { error })
      throw error
    }
  }

  async getContracts(): Promise<MockContract[]> {
    try {
      console.log('🗄️ DB: getContracts called, attempting API call', { 
        timestamp: new Date().toISOString()
      })
      logger.debug('Database data provider: getContracts called')
      if (typeof window === 'undefined') {
        console.log('🗄️ DB: Server-side, returning mock data')
        return mockContracts
      }
      
      const response = await fetch('/api/contracts')
      if (!response.ok) {
        console.log('🗄️ DB: API call failed, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockContracts
      }
      const data = await response.json()
      console.log('🗄️ DB: API call successful, returning database data', { 
        count: data.data?.length,
        timestamp: new Date().toISOString()
      })
      return data.data || data
    } catch (error) {
      console.log('🗄️ DB: Error occurred, falling back to mock data', { 
        error: error instanceof Error ? error.message : String(error)
      })
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockContracts
    }
  }

  async getInvoices(): Promise<MockInvoice[]> {
    try {
      logger.debug('Database data provider: getInvoices called')
      if (typeof window === 'undefined') {
        return mockInvoices
      }
      
      const response = await fetch('/api/invoices')
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockInvoices
      }
      return await response.json()
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockInvoices
    }
  }

  async getCustomers(): Promise<MockCustomer[]> {
    try {
      logger.debug('Database data provider: getCustomers called')
      if (typeof window === 'undefined') {
        return mockCustomers
      }
      
      const response = await fetch('/api/customers', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockCustomers
      }
      
      const data = await response.json()
      
      // Check if we have the expected customers data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database customers data', {
          customerCount: data.length
        })
        return data
      }

      // Fallback to mock data if response format is unexpected
      logger.warn('Unexpected response format, falling back to mock data', { data })
      return mockCustomers
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockCustomers
    }
  }

  async getBookings(): Promise<MockBooking[]> {
    try {
      logger.debug('Database data provider: getBookings called')
      if (typeof window === 'undefined') {
        return mockBookings
      }
      
      const response = await fetch('/api/bookings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockBookings
      }
      
      const data = await response.json()
      
      // Check if we have the expected bookings data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database bookings data', {
          bookingCount: data.length
        })
        return data
      }

      // Fallback to mock data if response format is unexpected
      logger.warn('Unexpected response format, falling back to mock data', { data })
      return mockBookings
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockBookings
    }
  }

  async getBoats(): Promise<MockBoat[]> {
    try {
      logger.debug('Database data provider: getBoats called')
      if (typeof window === 'undefined') {
        return mockBoats
      }
      
      const response = await fetch('/api/boats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockBoats
      }
      
      const data = await response.json()
      
      // Check if we have the expected boats data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database boats data', {
          boatCount: data.length
        })
        return data
      }

      // Fallback to mock data if response format is unexpected
      logger.warn('Unexpected response format, falling back to mock data', { data })
      return mockBoats
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockBoats
    }
  }

  async getBerths(): Promise<MockBerth[]> {
    try {
      logger.debug('Database data provider: getBerths called')
      if (typeof window === 'undefined') {
        return mockBerths
      }
      
      const response = await fetch('/api/berths', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockBerths
      }
      
      const data = await response.json()
      
      // Check if we have the expected berths data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database berths data', {
          berthCount: data.length
        })
        return data
      }

      // Fallback to mock data if response format is unexpected
      logger.warn('Unexpected response format, falling back to mock data', { data })
      return mockBerths
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockBerths
    }
  }

  async getWorkOrders(): Promise<MockWorkOrder[]> {
    try {
      logger.debug('Database data provider: getWorkOrders called')
      if (typeof window === 'undefined') {
        return mockWorkOrders
      }
      
      const response = await fetch('/api/work-orders', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockWorkOrders
      }
      
      const data = await response.json()
      
      // Check if we have the expected work orders data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database work orders data', {
          workOrderCount: data.length
        })
        return data
      }

      // Fallback to mock data if response format is unexpected
      logger.warn('Unexpected response format, falling back to mock data', { data })
      return mockWorkOrders
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockWorkOrders
    }
  }

  async getPayments(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getPayments called')
      if (typeof window === 'undefined') {
        return mockPayments
      }
      
      const response = await fetch('/api/payments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to mock data', { 
          status: response.status,
          statusText: response.statusText 
        })
        return mockPayments
      }
      
      const data = await response.json()
      
      // Check if we have the expected payments data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database payments data', {
          paymentCount: data.length
        })
        return data
      }

      // Fallback to mock data if response format is unexpected
      logger.warn('Unexpected response format, falling back to mock data', { data })
      return mockPayments
    } catch (error) {
      logger.error('Database data provider error, falling back to mock data', { error })
      return mockPayments
    }
  }

  async getMarinas(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getMarinas called')
      if (typeof window === 'undefined') {
        return []
      }
      
      const response = await fetch('/api/marinas', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to empty array', { 
          status: response.status,
          statusText: response.statusText 
        })
        return []
      }
      
      const data = await response.json()
      
      // Check if we have the expected marinas data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database marinas data', {
          marinaCount: data.length
        })
        return data
      }

      // Fallback to empty array if response format is unexpected
      logger.warn('Unexpected response format, falling back to empty array', { data })
      return []
    } catch (error) {
      logger.error('Database data provider error, falling back to empty array', { error })
      return []
    }
  }

  async getStaff(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getStaff called')
      if (typeof window === 'undefined') {
        return []
      }
      
      const response = await fetch('/api/staff', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to empty array', { 
          status: response.status,
          statusText: response.statusText 
        })
        return []
      }
      
      const data = await response.json()
      
      // Check if we have the expected staff data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database staff data', {
          staffCount: data.length
        })
        return data
      }

      // Fallback to empty array if response format is unexpected
      logger.warn('Unexpected response format, falling back to empty array', { data })
      return []
    } catch (error) {
      logger.error('Database data provider error, falling back to empty array', { error })
      return []
    }
  }

  async getJobs(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getJobs called')
      if (typeof window === 'undefined') {
        return []
      }
      
      const response = await fetch('/api/jobs', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to empty array', { 
          status: response.status,
          statusText: response.statusText 
        })
        return []
      }
      
      const data = await response.json()
      
      // Check if we have the expected jobs data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database jobs data', {
          jobCount: data.length
        })
        return data
      }

      // Fallback to empty array if response format is unexpected
      logger.warn('Unexpected response format, falling back to empty array', { data })
      return []
    } catch (error) {
      logger.error('Database data provider error, falling back to empty array', { error })
      return []
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      logger.debug('Database data provider: getUsers called')
      if (typeof window === 'undefined') {
        return []
      }
      
      const response = await fetch('/api/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to empty array', { 
          status: response.status,
          statusText: response.statusText 
        })
        return []
      }
      
      const data = await response.json()
      
      // Check if we have the expected users data structure
      if (Array.isArray(data)) {
        logger.debug('Using live database users data', {
          userCount: data.length
        })
        return data
      }

      // Fallback to empty array if response format is unexpected
      logger.warn('Unexpected response format, falling back to empty array', { data })
      return []
    } catch (error) {
      logger.error('Database data provider error, falling back to empty array', { error })
      return []
    }
  }

  async getUserProfile(): Promise<any> {
    try {
      logger.debug('Database data provider: getUserProfile called')
      if (typeof window === 'undefined') {
        return null
      }
      
      const response = await fetch('/api/user/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to null', { 
          status: response.status,
          statusText: response.statusText 
        })
        return null
      }
      
      const data = await response.json()
      logger.debug('Using live database user profile data', { data })
      return data
    } catch (error) {
      logger.error('Database data provider error, falling back to null', { error })
      return null
    }
  }

  async updateUserProfile(profileData: any): Promise<void> {
    try {
      logger.debug('Database data provider: updateUserProfile called', { profileData })
      if (typeof window === 'undefined') {
        return Promise.resolve()
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })
      if (!response.ok) {
        logger.warn('API endpoint not available, falling back to success', { 
          status: response.status,
          statusText: response.statusText 
        })
        return Promise.resolve()
      }
      
      logger.debug('User profile updated successfully')
      return Promise.resolve()
    } catch (error) {
      logger.error('Database data provider error, falling back to success', { error })
      return Promise.resolve()
    }
  }
}

// ============================================================================
// FACTORY AND EXPORTS
// ============================================================================

export function createDataProvider(source: DataSource): DashboardDataProvider {
  console.log('🏭 FACTORY: Creating data provider', { 
    source,
    timestamp: new Date().toISOString()
  })
  
  switch (source) {
    case 'mock':
      console.log('🏭 FACTORY: Creating MockDataProvider')
      return new MockDataProvider()
    case 'database':
      console.log('🏭 FACTORY: Creating DatabaseDataProvider')
      return new DatabaseDataProvider()
    default:
      logger.warn('Unknown data source, falling back to database', { source })
      return new DatabaseDataProvider()
  }
}

// Singleton instance
export const dataSourceService = new DataSourceServiceImpl()

// Export types for use in components
export type { MockDashboardStats, DashboardDataProvider, MockContract, MockInvoice, MockCustomer, MockBooking, MockBoat, MockBerth, MockWorkOrder }
