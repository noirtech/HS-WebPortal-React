import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { getRelativeTimeString } from '@/lib/utils'
import { useLocaleFormatting } from '@/lib/locale-context'
import { PendingOperation, PendingOperationStatus, PendingOperationType } from '@/types'
import { RoleGuard, StaffOnly, AdminOnly } from '@/components/auth/role-guard'

// ============================================================================
// PENDING OPERATION ITEM COMPONENT
// ============================================================================

interface PendingOperationItemProps {
  operation: PendingOperation
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRetry?: (id: string) => void
  onView?: (id: string) => void
  className?: string
}

const PendingOperationItem: React.FC<PendingOperationItemProps> = ({
  operation,
  onApprove,
  onReject,
  onRetry,
  onView,
  className,
}) => {
  const { formatDate, formatDateTime, formatDateRelative } = useLocaleFormatting()
  const getStatusIcon = (status: PendingOperationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
    }
  }

  const getStatusColor = (status: PendingOperationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'border-yellow-200 bg-yellow-50'
      case 'PROCESSING':
        return 'border-blue-200 bg-blue-50'
      case 'COMPLETED':
        return 'border-green-200 bg-green-50'
      case 'FAILED':
        return 'border-red-200 bg-red-50'
      case 'CANCELLED':
        return 'border-gray-200 bg-gray-50'
      default:
        return 'border-orange-200 bg-orange-50'
    }
  }

  const getOperationTypeLabel = (type: PendingOperationType) => {
    return type.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'Critical'
    if (priority >= 6) return 'High'
    if (priority >= 4) return 'Medium'
    if (priority >= 2) return 'Low'
    return 'Normal'
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-100'
    if (priority >= 6) return 'text-orange-600 bg-orange-100'
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100'
    if (priority >= 2) return 'text-blue-600 bg-blue-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <Card className={`${getStatusColor(operation.status)} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(operation.status)}
            <div>
              <CardTitle className="text-sm font-medium">
                {getOperationTypeLabel(operation.operationType)}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                ID: {operation.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(operation.priority)}`}>
              {getPriorityLabel(operation.priority)}
            </span>
            {operation.retryCount > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Retry {operation.retryCount}/{operation.maxRetries}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Operation Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Marina:</span>
              <p className="font-medium">{operation.marina.name}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">User:</span>
              <p className="font-medium">
                {operation.user.firstName} {operation.user.lastName}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Created:</span>
              <p className="font-medium">
                {formatDateRelative(operation.createdAt)}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Updated:</span>
              <p className="font-medium">
                {formatDateRelative(operation.updatedAt)}
              </p>
            </div>
          </div>

          {/* Operation Data Preview */}
          <div>
            <span className="font-medium text-muted-foreground text-sm">Data:</span>
            <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono max-h-20 overflow-y-auto">
              {JSON.stringify(operation.data, null, 2)}
            </div>
          </div>

          {/* Error Message */}
          {operation.errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <span className="font-medium text-red-800 text-sm">Error:</span>
              <p className="text-red-700 text-sm mt-1">{operation.errorMessage}</p>
            </div>
          )}

          {/* Scheduled Time */}
          {operation.scheduledAt && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Scheduled for:</span>
              <p className="font-medium">
                {formatDateTime(operation.scheduledAt)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(operation.id)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {operation.status === 'PENDING' && (
                <>
                  {onApprove && (
                    <Button
                      size="sm"
                      onClick={() => onApprove(operation.id)}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Approve</span>
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(operation.id)}
                      className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-3 w-3" />
                      <span>Reject</span>
                    </Button>
                  )}
                </>
              )}

              {operation.status === 'FAILED' && operation.retryCount < operation.maxRetries && onRetry && (
                <Button
                  size="sm"
                  onClick={() => onRetry(operation.id)}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// PENDING OPERATIONS LIST COMPONENT
// ============================================================================

interface PendingOperationsListProps {
  operations: PendingOperation[]
  user: any // Add user prop for role checking
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRetry?: (id: string) => void
  onView?: (id: string) => void
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

export const PendingOperationsList: React.FC<PendingOperationsListProps> = ({
  operations,
  user,
  onApprove,
  onReject,
  onRetry,
  onView,
  onRefresh,
  isLoading = false,
  className,
}) => {
  const [filterStatus, setFilterStatus] = useState<PendingOperationStatus | 'ALL'>('ALL')
  const [filterPriority, setFilterPriority] = useState<number | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<'priority' | 'createdAt' | 'updatedAt'>('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort operations
  const filteredAndSortedOperations = useMemo(() => {
    let filtered = operations.filter(operation => {
      if (filterStatus !== 'ALL' && operation.status !== filterStatus) return false
      if (filterPriority !== 'ALL' && operation.priority !== filterPriority) return false
      return true
    })

    // Sort operations
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'priority':
          aValue = a.priority
          bValue = b.priority
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [operations, filterStatus, filterPriority, sortBy, sortOrder])

  // Get unique statuses and priorities for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(operations.map(op => op.status))]
    return ['ALL', ...statuses] as const
  }, [operations])

  const uniquePriorities = useMemo(() => {
    const priorities = [...new Set(operations.map(op => op.priority))]
    return ['ALL', ...priorities.sort((a, b) => b - a)] as const
  }, [operations])

  // Get counts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    operations.forEach(op => {
      counts[op.status] = (counts[op.status] || 0) + 1
    })
    return counts
  }, [operations])

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pending Operations</h2>
          <p className="text-muted-foreground">
            Manage operations that are queued or require attention
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status} className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {status.toLowerCase().replace(/_/g, ' ')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
        <div className="flex items-center space-x-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PendingOperationStatus | 'ALL')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {uniquePriorities.map(priority => (
                <option key={priority} value={priority}>
                  {priority === 'ALL' ? 'All' : `Priority ${priority}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sorting */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'createdAt' | 'updatedAt')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="priority">Priority</option>
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Operations List */}
      {filteredAndSortedOperations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {operations.length === 0 ? (
                <p>No pending operations found.</p>
              ) : (
                <p>No operations match the current filters.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOperations.map((operation) => (
            <PendingOperationItem
              key={operation.id}
              operation={operation}
              onApprove={onApprove}
              onReject={onReject}
              onRetry={onRetry}
              onView={onView}
            />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Showing {filteredAndSortedOperations.length} of {operations.length} operations
      </div>
    </div>
  )
}

// ============================================================================
// ROLE-BASED WRAPPERS
// ============================================================================

export const StaffPendingOperationsList: React.FC<PendingOperationsListProps> = (props) => (
  <StaffOnly user={props.user}>
    <PendingOperationsList {...props} />
  </StaffOnly>
)

export const AdminPendingOperationsList: React.FC<PendingOperationsListProps> = (props) => (
  <AdminOnly user={props.user}>
    <PendingOperationsList {...props} />
  </AdminOnly>
)

// ============================================================================
// EXPORTS
// ============================================================================

export default PendingOperationsList

