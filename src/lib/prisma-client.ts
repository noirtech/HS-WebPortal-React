/**
 * Lazy loading Prisma client utility
 * Prevents build-time imports that cause environment validation errors
 */

let prisma: any = null;
let logAuditEvent: any = null;

/**
 * Get Prisma client with lazy loading
 * Returns null if database is not available (demo mode)
 */
export async function getPrisma() {
  // Check if we're in demo mode first
  if (isDemoMode()) {
    console.log('🔍 PRISMA: Demo mode detected, returning null');
    return null;
  }

  if (!prisma) {
    try {
      const { prisma: prismaClient } = await import('@/lib/db');
      prisma = prismaClient;
    } catch (error) {
      console.log('Prisma import failed, using demo mode');
      return null;
    }
  }
  return prisma;
}

/**
 * Get logAuditEvent function with lazy loading
 * Returns null if not available
 */
export async function getLogAuditEvent() {
  if (!logAuditEvent) {
    try {
      const { logAuditEvent: logAuditEventFn } = await import('@/lib/db');
      logAuditEvent = logAuditEventFn;
    } catch (error) {
      console.log('Log audit event import failed');
      return null;
    }
  }
  return logAuditEvent;
}

/**
 * Check if we're in demo mode
 */
export function isDemoMode(): boolean {
  // Check environment variable for data source preference
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'mock') {
    return true;
  }
  
  // Check if we're in production but don't have database URL
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    return true;
  }
  
  // Default to database mode if we have DATABASE_URL
  return !process.env.DATABASE_URL;
}

/**
 * Get demo user for API routes
 */
export function getDemoUser() {
  return { 
    id: 'demo-user-id', 
    email: 'demo@marina.com', 
    roles: [{ id: '1', role: 'admin' }] 
  };
}
