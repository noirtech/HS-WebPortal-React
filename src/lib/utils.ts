import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

interface UserWithRoles {
  id: string
  email: string
  roles: Array<{
    id: string
    role: string
    marinaId?: string
  }>
  permissions?: Array<{
    resource: string
    action: string
    conditions?: {
      marinaId?: string
    }
  }>
}

export function hasRole(user: UserWithRoles | null | undefined, role: string, marinaId?: string): boolean {
  if (!user?.roles) return false
  
  return user.roles.some((userRole) => {
    if (userRole.role !== role) return false
    
    // If marinaId is specified, check if role applies to that marina
    if (marinaId && userRole.marinaId) {
      return userRole.marinaId === marinaId
    }
    
    // If no marinaId specified, role applies to all marinas or group level
    return true
  })
}

export function hasAnyRole(user: UserWithRoles | null | undefined, roles: string[], marinaId?: string): boolean {
  return roles.some(role => hasRole(user, role, marinaId))
}

export function hasPermission(user: UserWithRoles | null | undefined, resource: string, action: string, marinaId?: string): boolean {
  // Admin and Group Admin have all permissions
  if (hasAnyRole(user, ['ADMIN', 'GROUP_ADMIN'])) {
    return true
  }
  
  // Check specific permissions
  if (user?.permissions) {
    return user.permissions.some((permission) => {
      if (permission.resource !== resource || permission.action !== action) {
        return false
      }
      
      // Check marina-specific conditions
      if (marinaId && permission.conditions?.marinaId) {
        return permission.conditions.marinaId === marinaId
      }
      
      return true
    })
  }
  
  return false
}

// ============================================================================
// MARINA STATUS & OFFLINE HANDLING
// ============================================================================

interface Marina {
  id: string
  name: string
  isOnline: boolean
}

export function isMarinaOnline(marina: Marina | null | undefined): boolean {
  return marina?.isOnline ?? false
}

export function shouldQueueOperation(marina: Marina | null | undefined): boolean {
  return !isMarinaOnline(marina)
}

export function getOfflineMessage(marina: Marina | null | undefined): string {
  if (isMarinaOnline(marina)) {
    return "Marina is online and operations will be processed immediately."
  }
  
  return `Marina ${marina?.name || 'Unknown'} is currently offline. Your action has been queued and will be processed when the marina comes back online.`
}

// ============================================================================
// PAYMENT HELPERS - DEPRECATED
// ============================================================================

/**
 * @deprecated Use formatCurrency from useLocaleFormatting() hook instead
 * This function uses hardcoded locale and should not be used
 */
export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  console.warn('⚠️ [UTILS] DEPRECATED formatCurrency called - Use useLocaleFormatting() instead:', {
    amount,
    currency,
    hardcodedLocale: 'en-GB',
    timestamp: new Date().toISOString(),
    recommendation: 'Import { useLocaleFormatting } from "@/lib/locale-context" and use formatCurrency from the hook',
    stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
  })
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round((subtotal * taxRate) * 100) / 100
}

export function getPaymentGatewayName(gateway: string): string {
  const gatewayNames: Record<string, string> = {
    'STRIPE': 'Stripe',
    'CARDSTREAM': 'Cardstream',
    'WORLDPAY': 'Worldpay',
    'SAGE_PAY': 'Sage Pay',
    'GOOGLE_PAY': 'Google Pay',
  }
  
  return gatewayNames[gateway] || gateway
}

// ============================================================================
// DATE & TIME HELPERS - DEPRECATED
// ============================================================================

/**
 * @deprecated Use formatDate from useLocaleFormatting() hook instead
 * This function uses hardcoded locale and should not be used
 */
export function formatDate(date: Date | string, format: 'long' | 'short' = 'short'): string {
  console.warn('⚠️ [UTILS] DEPRECATED formatDate called - Use useLocaleFormatting() instead:', {
    date,
    format,
    hardcodedLocale: 'en-GB',
    timestamp: new Date().toISOString(),
    recommendation: 'Import { useLocaleFormatting } from "@/lib/locale-context" and use formatDate from the hook',
    stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
  })
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * @deprecated Use formatDateTime from useLocaleFormatting() hook instead
 * This function uses hardcoded locale and should not be used
 */
export function formatDateTime(date: Date | string): string {
  console.warn('⚠️ [UTILS] DEPRECATED formatDateTime called - Use useLocaleFormatting() instead')
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24-hour format (UK standard)
  })
}

export function getRelativeTimeString(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
  
  return formatDate(date, 'short')
}

export function isOverdue(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj < new Date()
}

export function getDaysUntilDue(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = dateObj.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function isValidPostalCode(postalCode: string): boolean {
  const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/
  return postalRegex.test(postalCode)
}

// ============================================================================
// STRING HELPERS
// ============================================================================

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// ARRAY & OBJECT HELPERS
// ============================================================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  
  if (error?.message) return error.message
  
  if (error?.error) return error.error
  
  return 'An unexpected error occurred'
}

export function isNetworkError(error: any): boolean {
  return error?.code === 'NETWORK_ERROR' || 
         error?.message?.includes('network') ||
         error?.message?.includes('fetch')
}

// ============================================================================
// FILE HELPERS
// ============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = getFileExtension(filename).toLowerCase()
  return allowedTypes.includes(extension)
}

