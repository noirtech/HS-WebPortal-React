import { PrismaClient } from '@prisma/client'
import { logger } from './logger'
import { validateEnv } from './env'
import { handleDatabaseError } from './error-handler'

// Validate environment before initializing database (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  try {
    validateEnv()
  } catch (error) {
    logger.error('Environment validation failed during database initialization', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

logger.info('Initializing Prisma client...', { 
  NODE_ENV: process.env.NODE_ENV,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + '...'
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export db as an alias for prisma for backward compatibility
export const db = prisma

// Production database connection with retry logic
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// Handle process termination
process.on('SIGINT', disconnectDatabase)
process.on('SIGTERM', disconnectDatabase)

// ============================================================================
// MARINA STATUS FUNCTIONS
// ============================================================================

export async function updateMarinaStatus(marinaId: string, isOnline: boolean): Promise<void> {
  try {
    await prisma.marina.update({
      where: { id: marinaId },
      data: { 
        isOnline,
        lastSyncAt: new Date()
      }
    })
    logger.info('Marina status updated', { marinaId, isOnline })
  } catch (error) {
    logger.error('Failed to update marina status', { marinaId, isOnline, error })
    throw error
  }
}

export async function getMarinaStatus(marinaId: string): Promise<{ isOnline: boolean; lastSyncAt: Date | null } | null> {
  try {
    const marina = await prisma.marina.findUnique({
      where: { id: marinaId },
      select: { isOnline: true, lastSyncAt: true }
    })
    return marina
  } catch (error) {
    logger.error('Failed to get marina status', { marinaId, error })
    throw error
  }
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

export async function createNotification(data: {
  type: string
  title: string
  message: string
  priority: string
  userId: string
  marinaId?: string
  metadata?: string
}): Promise<any> {
  try {
    const notification = await prisma.notification.create({
      data: {
        ...data,
        isRead: false,
        createdAt: new Date()
      }
    })
    logger.info('Notification created', { notificationId: notification.id, type: data.type })
    return notification
  } catch (error) {
    logger.error('Failed to create notification', { data, error })
    throw error
  }
}

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

export async function logAuditEvent(data: {
  eventType: string
  entityType: string
  entityId: string
  action: string
  oldValues?: string
  newValues?: string
  metadata?: string
  ipAddress?: string
  userAgent?: string
  marinaId: string
  userId: string
}): Promise<any> {
  try {
    const auditEvent = await prisma.auditEvent.create({
      data: {
        ...data,
        createdAt: new Date()
      }
    })
    logger.info('Audit event logged', { eventId: auditEvent.id, action: data.action })
    return auditEvent
  } catch (error) {
    logger.error('Failed to log audit event', { data, error })
    throw error
  }
}

// ============================================================================
// PENDING OPERATION FUNCTIONS
// ============================================================================

export async function createPendingOperation(data: {
  operationType: string
  status: string
  data: string
  priority: number
  marinaId: string
  userId: string
  scheduledAt?: Date
}): Promise<any> {
  try {
    const operation = await prisma.pendingOperation.create({
      data: {
        ...data,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      }
    })
    logger.info('Pending operation created', { operationId: operation.id, type: data.operationType })
    return operation
  } catch (error) {
    logger.error('Failed to create pending operation', { data, error })
    throw error
  }
}

export async function updatePendingOperationStatus(
  operationId: string, 
  status: string, 
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.pendingOperation.update({
      where: { id: operationId },
      data: { 
        status,
        errorMessage
      }
    })
    logger.info('Pending operation status updated', { operationId, status })
  } catch (error) {
    logger.error('Failed to update pending operation status', { operationId, status, error })
    throw error
  }
}

export async function incrementRetryCount(operationId: string): Promise<void> {
  try {
    await prisma.pendingOperation.update({
      where: { id: operationId },
      data: { 
        retryCount: { increment: 1 },
        updatedAt: new Date()
      }
    })
    logger.info('Pending operation retry count incremented', { operationId })
  } catch (error) {
    logger.error('Failed to increment retry count', { operationId, error })
    throw error
  }
}

