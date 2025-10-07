import React from 'react'
import { hasRole, hasAnyRole, hasPermission } from '@/lib/utils'
import { UserRole, Role } from '@/types'

// ============================================================================
// ROLE GUARD COMPONENT
// ============================================================================

interface RoleGuardProps {
  user: any
  roles?: string[]
  permissions?: Array<{ resource: string; action: string }>
  marinaId?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  user,
  roles,
  permissions,
  marinaId,
  fallback = null,
  children,
}) => {
  // Check if user has required roles
  if (roles && roles.length > 0) {
    if (!hasAnyRole(user, roles, marinaId)) {
      return <>{fallback}</>
    }
  }

  // Check if user has required permissions
  if (permissions && permissions.length > 0) {
    const hasAllPermissions = permissions.every(({ resource, action }) =>
      hasPermission(user, resource, action, marinaId)
    )
    
    if (!hasAllPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// ============================================================================
// ROLE-BASED COMPONENT WRAPPERS
// ============================================================================

export const CustomerOnly: React.FC<Omit<RoleGuardProps, 'roles'>> = (props) => (
  <RoleGuard {...props} roles={['CUSTOMER']} />
)

export const StaffOnly: React.FC<Omit<RoleGuardProps, 'roles'> & { 
  staffTypes?: Role[] 
}> = ({ staffTypes = ['STAFF_FRONT_DESK', 'STAFF_FINANCE', 'STAFF_MAINTENANCE'], ...props }) => (
  <RoleGuard {...props} roles={staffTypes} />
)

export const AdminOnly: React.FC<Omit<RoleGuardProps, 'roles'>> = (props) => (
  <RoleGuard {...props} roles={['ADMIN', 'GROUP_ADMIN']} />
)

export const FinanceStaffOnly: React.FC<Omit<RoleGuardProps, 'roles'>> = (props) => (
  <RoleGuard {...props} roles={['STAFF_FINANCE', 'ADMIN', 'GROUP_ADMIN']} />
)

export const MaintenanceStaffOnly: React.FC<Omit<RoleGuardProps, 'roles'>> = (props) => (
  <RoleGuard {...props} roles={['STAFF_MAINTENANCE', 'ADMIN', 'GROUP_ADMIN']} />
)

export const FrontDeskStaffOnly: React.FC<Omit<RoleGuardProps, 'roles'>> = (props) => (
  <RoleGuard {...props} roles={['STAFF_FRONT_DESK', 'ADMIN', 'GROUP_ADMIN']} />
)

// ============================================================================
// PERMISSION-BASED COMPONENTS
// ============================================================================

export const CanViewContracts: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'contracts', action: 'read' }]} />
)

export const CanEditContracts: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'contracts', action: 'write' }]} />
)

export const CanViewInvoices: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'invoices', action: 'read' }]} />
)

export const CanEditInvoices: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'invoices', action: 'write' }]} />
)

export const CanProcessPayments: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'payments', action: 'process' }]} />
)

export const CanViewBookings: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'bookings', action: 'read' }]} />
)

export const CanEditBookings: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'bookings', action: 'write' }]} />
)

export const CanViewWorkOrders: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'workOrders', action: 'read' }]} />
)

export const CanEditWorkOrders: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'workOrders', action: 'write' }]} />
)

export const CanViewPendingOperations: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'pendingOperations', action: 'read' }]} />
)

export const CanApprovePendingOperations: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'pendingOperations', action: 'approve' }]} />
)

export const CanViewReports: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'reports', action: 'read' }]} />
)

export const CanGenerateReports: React.FC<Omit<RoleGuardProps, 'permissions'>> = (props) => (
  <RoleGuard {...props} permissions={[{ resource: 'reports', action: 'generate' }]} />
)

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useRoleCheck = (user: any, marinaId?: string) => {
  const isCustomer = () => hasRole(user, 'CUSTOMER', marinaId)
  const isStaff = () => hasAnyRole(user, ['STAFF_FRONT_DESK', 'STAFF_FINANCE', 'STAFF_MAINTENANCE'], marinaId)
  const isAdmin = () => hasAnyRole(user, ['ADMIN', 'GROUP_ADMIN'], marinaId)
  const isFinanceStaff = () => hasAnyRole(user, ['STAFF_FINANCE', 'ADMIN', 'GROUP_ADMIN'], marinaId)
  const isMaintenanceStaff = () => hasAnyRole(user, ['STAFF_MAINTENANCE', 'ADMIN', 'GROUP_ADMIN'], marinaId)
  const isFrontDeskStaff = () => hasAnyRole(user, ['STAFF_FRONT_DESK', 'ADMIN', 'GROUP_ADMIN'], marinaId)

  const hasPermissionFor = (resource: string, action: string) => 
    hasPermission(user, resource, action, marinaId)

  return {
    isCustomer,
    isStaff,
    isAdmin,
    isFinanceStaff,
    isMaintenanceStaff,
    isFrontDeskStaff,
    hasPermissionFor,
  }
}

// ============================================================================
// CONDITIONAL RENDERING UTILITIES
// ============================================================================

export const renderIfRole = (
  user: any,
  roles: Role[],
  component: React.ReactNode,
  fallback: React.ReactNode = null,
  marinaId?: string
) => {
  return hasAnyRole(user, roles, marinaId) ? component : fallback
}

export const renderIfPermission = (
  user: any,
  resource: string,
  action: string,
  component: React.ReactNode,
  fallback: React.ReactNode = null,
  marinaId?: string
) => {
  return hasPermission(user, resource, action, marinaId) ? component : fallback
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RoleGuard

