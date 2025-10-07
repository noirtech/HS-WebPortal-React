// ============================================================================
// CORE TYPES
// ============================================================================

export interface MarinaGroup {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Marina {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  timezone: string
  isActive: boolean
  isOnline: boolean
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
  marinaGroupId: string
  marinaGroup: MarinaGroup
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  marinaId?: string
  marinaGroupId?: string
  marina?: Marina
  marinaGroup?: MarinaGroup
  roles: UserRole[]
}

// ============================================================================
// ROLE TYPES
// ============================================================================

export type Role = 
  | 'CUSTOMER'
  | 'STAFF_FRONT_DESK'
  | 'STAFF_FINANCE'
  | 'STAFF_MAINTENANCE'
  | 'ADMIN'
  | 'GROUP_ADMIN'
  | 'SUPER_ADMIN'
  | 'USER'

export interface UserRole {
  id: string
  userId: string
  role: Role // Changed from string to Role type
  marinaId?: string
  createdAt: Date
  user: User
  marina?: Marina
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface Customer {
  id: string
  externalId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  marinaId: string
  marina: Marina
}

// Alias for backward compatibility
export type Owner = Customer

export interface Boat {
  id: string
  externalId: string
  name: string
  registration?: string
  length: number
  beam?: number
  draft?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  marinaId: string
  customerId: string
  marina: Marina
  customer: Customer
}

export interface Berth {
  id: string
  externalId: string
  berthNumber: string
  length: number
  beam?: number
  isAvailable: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  marinaId: string
  marina: Marina
}

export interface Contract {
  id: string
  externalId: string
  contractNumber: string
  startDate: Date
  endDate: Date
  status: string // Changed from enum to string
  monthlyRate: number
  createdAt: Date
  updatedAt: Date
  marinaId: string
  customerId: string
  boatId: string
  berthId?: string
  marina: Marina
  customer: Customer
  boat: Boat
  berth?: Berth
}

export interface Booking {
  id: string
  externalId: string
  startDate: Date
  endDate: Date
  status: string // Changed from enum to string
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  marinaId: string
  customerId: string
  boatId: string
  berthId?: string
  marina: Marina
  customer: Customer
  boat: Boat
  berth?: Berth
}

export interface Invoice {
  id: string
  externalId: string
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  status: string // Changed from enum to string
  subtotal: number
  tax: number
  total: number
  description?: string
  createdAt: Date
  updatedAt: Date
  marinaId: string
  customerId: string
  contractId?: string
  bookingId?: string
  marina: Marina
  customer: Customer
  contract?: Contract
  booking?: Booking
}

export interface Payment {
  id: string
  externalId: string
  amount: number
  paymentDate: Date
  status: string // Changed from enum to string
  gateway: string // Changed from enum to string
  gatewayTransactionId?: string
  createdAt: Date
  updatedAt: Date
  marinaId: string
  customerId: string
  invoiceId: string
  marina: Marina
  customer: Customer
  invoice: Invoice
}

export interface WorkOrder {
  id: string
  externalId: string
  title: string
  description?: string
  status: string // Changed from enum to string
  priority: string // Changed from enum to string
  workOrderType: string // Added: type of work order
  requestedDate: Date
  completedDate?: Date
  estimatedCost?: number // Added: estimated cost
  actualCost?: number // Added: actual cost
  totalCost?: number
  suppliesNeeded?: Array<{ // Added: supplies needed for the work
    id: string
    name: string
    quantity: number
    estimatedCost: number
    actualCost?: number
  }>
  requiresBoatOut?: boolean // Added: whether boat needs to be moved out
  requiresSpecialEquipment?: boolean // Added: whether special equipment is needed
  createdAt: Date
  updatedAt: Date
  marinaId: string
  customerId: string
  boatId?: string
  marina: Marina
  customer: Customer
  boat?: Boat
}

// ============================================================================
// OPERATION TYPES
// ============================================================================

// ============================================================================
// PENDING OPERATION TYPES
// ============================================================================

export type PendingOperationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type PendingOperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'NOTIFICATION' | 'PAYMENT' | 'REPORT'

export interface PendingOperation {
  id: string
  operationType: PendingOperationType
  status: PendingOperationStatus
  data: string // JSON string for SQLite
  priority: number
  retryCount: number
  maxRetries: number
  errorMessage?: string
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
  marinaId: string
  userId: string
  marina: Marina
  user: User
}

export interface AuditEvent {
  id: string
  eventType: string
  entityType: string
  entityId: string
  action: string
  resourceType?: string // Added: type of resource being audited
  oldValues?: string // JSON string for SQLite
  newValues?: string // JSON string for SQLite
  metadata?: string // JSON string for SQLite
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  marinaId: string
  userId: string
  marina: Marina
  user: User
}

export interface Notification {
  id: string
  type: string // Changed from enum to string
  title: string
  message: string
  isRead: boolean
  priority: string // Changed from enum to string
  scheduledAt?: Date
  sentAt?: Date
  metadata?: string // JSON string for SQLite
  createdAt: Date
  marinaId?: string
  userId: string
  marina?: Marina
  user: User
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface Session {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    roles: UserRole[]
    marinaId?: string
    marinaGroupId?: string
    marina?: Marina
    marinaGroup?: MarinaGroup
  }
  expires: string
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface ContractFormData {
  id?: string
  contractNumber: string
  startDate: Date
  endDate: Date
  monthlyRate: number
  ownerId: string
  boatId: string
  berthId?: string
}

export interface BookingFormData {
  id?: string
  startDate: Date
  endDate: Date
  totalAmount: number
  ownerId: string
  boatId: string
  berthId?: string
}

export interface InvoiceFormData {
  id?: string
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  subtotal: number
  tax: number
  total: number
  description?: string
  contractId?: string
  bookingId?: string
}

export interface PaymentFormData {
  id?: string
  amount: number
  paymentDate: Date
  gateway: string
  gatewayTransactionId?: string
  invoiceId: string
}

export interface WorkOrderFormData {
  id?: string
  title: string
  description?: string
  priority: string
  requestedDate: Date
  totalCost?: number
  ownerId: string
  boatId?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalContracts: number
  activeContracts: number
  totalInvoices: number
  overdueInvoices: number
  totalRevenue: number
  pendingOperations: number
  pendingWorkOrders: number
  pendingPayments: number
  totalBookings: number
  activeBookings: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }[]
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface FilterOptions {
  search?: string
  status?: string
  dateRange?: {
    start: Date
    end: Date
  }
  marinaId?: string
  ownerId?: string
  boatId?: string
  berthId?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  type: string
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  inApp: boolean
  push: boolean
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ReportDefinition {
  id: string
  name: string
  description: string
  query: string
  parameters: ReportParameter[]
  schedule?: string
  recipients: string[]
}

export interface ReportParameter {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required: boolean
  defaultValue?: any
}

export interface ReportResult {
  id: string
  reportId: string
  generatedAt: Date
  data: any[]
  summary: any
  status: 'completed' | 'failed' | 'processing'
  error?: string
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface IntegrationConfig {
  id: string
  name: string
  type: 'sql-server' | 'api' | 'file' | 'database'
  config: Record<string, any>
  isActive: boolean
  lastSyncAt?: Date
  syncInterval: number
  errorCount: number
  lastError?: string
}

export interface SyncJob {
  id: string
  integrationId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsDeleted: number
  error?: string
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  action: string
  entityType: string
  entityId: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export interface AuditFilter {
  startDate?: Date
  endDate?: Date
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface FormatDateOptions {
  format?: 'relative' | 'short' | 'long' | 'iso'
  locale?: string
}

export type FormatDateFunction = (date: Date | string, options?: FormatDateOptions) => string

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// Remove the redundant export statement that was causing conflicts
// The types are already exported above where they're defined

