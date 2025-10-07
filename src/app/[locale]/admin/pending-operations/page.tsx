'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Pause,
  Trash2,
  Eye,
  FileText,
  Calendar,
  CreditCard,
  Users,
  Anchor,
  Wrench,
  Ship
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { useDataSource } from '@/lib/data-source-context';
import { createDataProvider } from '@/lib/data-source'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Settings } from 'lucide-react';

// Mock pending operations data
const mockPendingOperations = [
  {
    id: 1,
    type: 'CONTRACT_CREATION',
    title: 'New Contract - Blue Horizon',
    description: 'Create contract for Blue Horizon yacht (Owner: John Smith)',
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: '2024-01-15T14:30:00Z',
    lastAttempt: '2024-01-15T15:00:00Z',
    attempts: 2,
    maxAttempts: 5,
    data: {
      ownerId: 123,
      boatId: 456,
      startDate: '2024-02-01',
      endDate: '2024-12-31',
      rate: 850
    },
    user: 'Mike Chen',
    department: 'Front Desk'
  },
  {
    id: 2,
    type: 'INVOICE_UPDATE',
    title: 'Invoice Payment - Invoice #2024-001',
    description: 'Update payment status for invoice #2024-001',
    status: 'PENDING',
    priority: 'MEDIUM',
    createdAt: '2024-01-15T13:45:00Z',
    lastAttempt: '2024-01-15T14:15:00Z',
    attempts: 1,
    maxAttempts: 3,
    data: {
      invoiceId: '2024-001',
      paymentAmount: 1250.00,
      paymentMethod: 'CREDIT_CARD',
      transactionId: 'TXN_789456'
    },
    user: 'Lisa Rodriguez',
    department: 'Finance'
  },
  {
    id: 3,
    type: 'WORK_ORDER_CREATION',
    title: 'Maintenance Request - Electrical Issue',
    description: 'Create work order for electrical system maintenance',
    status: 'FAILED',
    priority: 'HIGH',
    createdAt: '2024-01-15T12:20:00Z',
    lastAttempt: '2024-01-15T13:00:00Z',
    attempts: 3,
    maxAttempts: 3,
    data: {
      boatId: 789,
      issue: 'Electrical system malfunction',
      priority: 'URGENT',
      estimatedCost: 500
    },
    user: 'David Thompson',
    department: 'Maintenance'
  },
  {
    id: 4,
    type: 'BOOKING_UPDATE',
    title: 'Booking Modification - Slip A12',
    description: 'Update booking dates for slip A12',
    status: 'PENDING',
    priority: 'LOW',
    createdAt: '2024-01-15T11:30:00Z',
    lastAttempt: null,
    attempts: 0,
    maxAttempts: 5,
    data: {
      bookingId: 'BK_2024_001',
      newStartDate: '2024-02-15',
      newEndDate: '2024-03-15',
      reason: 'Owner request'
    },
    user: 'Emma Wilson',
    department: 'Front Desk'
  },
  {
    id: 5,
    type: 'PAYMENT_PROCESSING',
    title: 'Payment Processing - Auto-debit',
    description: 'Process automatic payment for monthly berth rental',
    status: 'PENDING',
    priority: 'MEDIUM',
    createdAt: '2024-01-15T10:00:00Z',
    lastAttempt: '2024-01-15T10:30:00Z',
    attempts: 1,
    maxAttempts: 3,
    data: {
      contractId: 'CT_2024_001',
      amount: 450.00,
      paymentMethod: 'AUTO_DEBIT',
      dueDate: '2024-01-20'
    },
    user: 'System',
    department: 'Automated'
  }
];

const operationTypeIcons = {
  CONTRACT_CREATION: FileText,
  INVOICE_UPDATE: Calendar,
  WORK_ORDER_CREATION: Wrench,
  BOOKING_UPDATE: Calendar,
  PAYMENT_PROCESSING: CreditCard,
  OWNER_UPDATE: Users,
  BOAT_UPDATE: Ship
};

const operationTypeColors = {
  CONTRACT_CREATION: 'bg-blue-100 text-blue-800',
  INVOICE_UPDATE: 'bg-green-100 text-green-800',
  WORK_ORDER_CREATION: 'bg-orange-100 text-orange-800',
  BOOKING_UPDATE: 'bg-purple-100 text-purple-800',
  PAYMENT_PROCESSING: 'bg-emerald-100 text-emerald-800',
  OWNER_UPDATE: 'bg-indigo-100 text-indigo-800',
  BOAT_UPDATE: 'bg-cyan-100 text-cyan-800'
};

const priorityColors = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-800'
};

const statusColors = {
  PENDING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800'
};

export default function PendingOperationsPage() {
  const { data: session, status } = useSession();
  const { currentSource, isDemoMode } = useDataSource();
  const [pendingOperations, setPendingOperations] = useState(mockPendingOperations);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data fetching logic
  const fetchPendingOperations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const provider = createDataProvider(currentSource);
      const data = await provider.getPendingOperations();
      
      setPendingOperations(data);
      
      logger.debug('Pending operations fetched', { 
        source: currentSource,
        count: data.length,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      logger.error('Pending operations fetch failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [currentSource]);

  // Auto-fetch when data source changes
  useEffect(() => {
    fetchPendingOperations();
  }, [currentSource]);

  const filteredOperations = pendingOperations.filter((operation: any) => {
    // Handle both mock data structure and API data structure
    const title = operation.title || operation.metadata?.title || '';
    const description = operation.description || operation.metadata?.description || '';
    const type = operation.type || operation.operationType || '';
    const status = operation.status || '';
    const priority = operation.priority || '';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOperationTypeDisplayName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      CONTRACT_CREATION: 'Contract Creation',
      INVOICE_UPDATE: 'Invoice Update',
      WORK_ORDER_CREATION: 'Work Order Creation',
      BOOKING_UPDATE: 'Booking Update',
      PAYMENT_PROCESSING: 'Payment Processing',
      OWNER_UPDATE: 'Owner Update',
      BOAT_UPDATE: 'Boat Update'
    };
    return typeNames[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleRetryOperation = async (operationId: number) => {
    try {
      logger.debug('Retrying operation', { operationId });
      
      // Find the operation
      const operation = mockPendingOperations.find(op => op.id === operationId);
      if (!operation) {
        alert('Operation not found');
        return;
      }

      // Simulate retry process
      const updatedOperations = mockPendingOperations.map(op => 
        op.id === operationId 
          ? { 
              ...op, 
              status: 'PENDING',
              attempts: Math.min(op.attempts + 1, op.maxAttempts),
              lastAttempt: new Date().toISOString()
            }
          : op
      );

      // In a real app, this would be an API call
      // await fetch(`/api/pending-operations/${operationId}/retry`, { method: 'POST' });
      
      // Update local state
      // setMockPendingOperations(updatedOperations);
      
      logger.info('Operation retry initiated', { operationId, operation });
      alert(`Retry initiated for operation: ${operation.title}`);
    } catch (error) {
      logger.error('Error retrying operation', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to retry operation. Please try again.');
    }
  };

  const handleProcessAll = async () => {
    try {
      setIsProcessing(true);
      logger.info('Processing all pending operations');
      
      // Simulate processing all operations
      const processingOperations = mockPendingOperations.filter(op => op.status === 'PENDING');
      
      if (processingOperations.length === 0) {
        alert('No pending operations to process');
        setIsProcessing(false);
        return;
      }

      // In a real app, this would be an API call
      // await fetch('/api/pending-operations/process-all', { method: 'POST' });
      
      // Simulate progress
      let processed = 0;
      const total = processingOperations.length;
      
      const progressInterval = setInterval(() => {
        processed += Math.ceil(total / 10);
        if (processed >= total) {
          clearInterval(progressInterval);
          setIsProcessing(false);
          
          // Update operations status
          const updatedOperations = mockPendingOperations.map(op => 
            op.status === 'PENDING' 
              ? { ...op, status: 'COMPLETED', lastAttempt: new Date().toISOString() }
              : op
          );
          
          // In a real app, this would update the state
          // setMockPendingOperations(updatedOperations);
          
          logger.info('All operations processed successfully', { total });
          alert(`Successfully processed ${total} operations`);
        }
      }, 300);
      
    } catch (error) {
      logger.error('Error processing all operations', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to process operations. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClearCompleted = async () => {
    try {
      logger.debug('Clearing completed operations');
      
      const completedCount = mockPendingOperations.filter(op => op.status === 'COMPLETED').length;
      
      if (completedCount === 0) {
        alert('No completed operations to clear');
        return;
      }

      if (!confirm(`Are you sure you want to clear ${completedCount} completed operations?`)) {
        return;
      }

      // In a real app, this would be an API call
      // await fetch('/api/pending-operations/clear-completed', { method: 'DELETE' });
      
      // Remove completed operations from local state
      const updatedOperations = mockPendingOperations.filter(op => op.status !== 'COMPLETED');
      // setMockPendingOperations(updatedOperations);
      
      logger.info('Completed operations cleared successfully', { cleared: completedCount });
      alert(`Successfully cleared ${completedCount} completed operations`);
    } catch (error) {
      logger.error('Error clearing completed operations', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to clear completed operations. Please try again.');
    }
  };

  const handleViewOperation = (operationId: number) => {
    const operation = mockPendingOperations.find(op => op.id === operationId);
    if (!operation) {
      alert('Operation not found');
      return;
    }

    // Show operation details in a modal or navigate to detail page
    const details = `
Operation Details:
- ID: ${operation.id}
- Type: ${getOperationTypeDisplayName(operation.type)}
- Title: ${operation.title}
- Description: ${operation.description}
- Status: ${operation.status}
- Priority: ${operation.priority}
- Created: ${formatDateTime(operation.createdAt)}
- Last Attempt: ${formatDateTime(operation.lastAttempt)}
- Attempts: ${operation.attempts}/${operation.maxAttempts}
- User: ${operation.user}
- Department: ${operation.department}
- Data: ${JSON.stringify(operation.data, null, 2)}
    `;
    
    alert(details);
  };

  const handleDeleteOperation = async (operationId: number) => {
    try {
      const operation = mockPendingOperations.find(op => op.id === operationId);
      if (!operation) {
        alert('Operation not found');
        return;
      }

      if (!confirm(`Are you sure you want to delete operation "${operation.title}"? This action cannot be undone.`)) {
        return;
      }

      // In a real app, this would be an API call
      // await fetch(`/api/pending-operations/${operationId}`, { method: 'DELETE' });
      
      // Remove operation from local state
      const updatedOperations = mockPendingOperations.filter(op => op.id !== operationId);
      // setMockPendingOperations(updatedOperations);
      
      logger.info('Operation deleted successfully', { operationId, operation });
      alert('Operation deleted successfully');
    } catch (error) {
      logger.error('Error deleting operation', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to delete operation. Please try again.');
    }
  };

  const handleForceSync = async () => {
    try {
      if (!isOnline) {
        alert('Cannot force sync while offline');
        return;
      }

      logger.info('Force sync initiated');
      
      // Simulate force sync process
      const pendingCount = mockPendingOperations.filter(op => op.status === 'PENDING').length;
      
      if (pendingCount === 0) {
        alert('No pending operations to sync');
        return;
      }

      // In a real app, this would be an API call
      // await fetch('/api/pending-operations/force-sync', { method: 'POST' });
      
      alert(`Force sync initiated for ${pendingCount} pending operations`);
    } catch (error) {
      logger.error('Error during force sync', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to initiate force sync. Please try again.');
    }
  };

  const handleScheduleSync = () => {
    // Show sync scheduling interface
    const scheduleOptions = prompt(`
Enter sync schedule (e.g., "every 15 minutes", "daily at 2 AM", "weekly on Monday"):
    `);
    
    if (scheduleOptions) {
      logger.info('Sync schedule updated', { schedule: scheduleOptions });
      alert(`Sync scheduled: ${scheduleOptions}`);
    }
  };

  const handleViewLogs = () => {
    // Show operation logs
    const logs = mockPendingOperations.map(op => 
      `[${formatDateTime(op.createdAt)}] ${op.status.toUpperCase()}: ${op.title} (${op.user})`
    ).join('\n');
    
    alert(`Operation Logs:\n\n${logs}`);
  };

  const handleErrorReports = () => {
    const failedOperations = mockPendingOperations.filter(op => op.status === 'FAILED');
    
    if (failedOperations.length === 0) {
      alert('No failed operations to report');
      return;
    }

    const errorReport = failedOperations.map(op => 
      `FAILED: ${op.title}\n  - Type: ${getOperationTypeDisplayName(op.type)}\n  - User: ${op.user}\n  - Attempts: ${op.attempts}/${op.maxAttempts}\n  - Last Attempt: ${formatDateTime(op.lastAttempt)}\n`
    ).join('\n');
    
    alert(`Error Report:\n\n${errorReport}`);
  };

  const handleExportQueue = () => {
    try {
      // Create CSV export
      const csvData = [
        ['ID', 'Type', 'Title', 'Status', 'Priority', 'User', 'Department', 'Created', 'Attempts'],
        ...mockPendingOperations.map(op => [
          op.id,
          getOperationTypeDisplayName(op.type),
          op.title,
          op.status,
          op.priority,
          op.user,
          op.department,
          formatDateTime(op.createdAt),
          `${op.attempts}/${op.maxAttempts}`
        ])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pending-operations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      logger.info('Queue exported successfully');
      alert('Queue exported successfully');
    } catch (error) {
      logger.error('Error exporting queue', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to export queue. Please try again.');
    }
  };

  // Check authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending operations...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect via middleware
  }

  return (
    <AppLayout user={session?.user}>
      <div className="p-6 space-y-6">
        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="pending-operations"
            dataCount={pendingOperations.length}
            isLoading={isLoading}
            error={error ? new Error(error) : null}
            additionalInfo={{
              totalOperations: pendingOperations.length,
              pendingOperations: pendingOperations.filter(op => op.status === 'PENDING').length,
              failedOperations: pendingOperations.filter(op => op.status === 'FAILED').length,
              completedOperations: pendingOperations.filter(op => op.status === 'COMPLETED').length
            }}
          />
        </div>

        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Operations Queue</h1>
          <p className="text-gray-600 mt-2">Manage operations waiting to be synced with the server</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <Button 
            onClick={handleProcessAll} 
            disabled={isProcessing || !isOnline}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Processing...' : 'Process All'}
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Pending Operations Queue</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage operations waiting to be synced with the server and monitor system health.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> View pending operations (contracts, invoices, work orders), retry failed operations, force sync, and monitor online/offline status. Includes priority management, retry limits, and comprehensive logging for system operations.
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
                        <strong>Pending Operations Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">pending_operations</code> table contains operations waiting to be synced with the server, including contract creation, invoice updates, and work order management. 
                        Each operation has a unique ID, type, status, and retry tracking information.
                      </p>
                      <p>
                        <strong>Retry and Failure Management:</strong> The system implements retry logic with configurable attempt limits and exponential backoff. 
                        Failed operations are tracked with attempt counts, last attempt timestamps, and maximum retry limits to prevent infinite retry loops.
                      </p>
                      <p>
                        <strong>Priority and Status Tracking:</strong> Operations are assigned priority levels (LOW, MEDIUM, HIGH, URGENT) and status tracking (PENDING, PROCESSING, COMPLETED, FAILED). 
                        The system uses these fields for queue management and processing order determination.
                      </p>
                      <p>
                        <strong>Key Tables for Pending Operations:</strong> <code className="bg-green-100 px-1 rounded">pending_operations</code> (4 total), <code className="bg-green-100 px-1 rounded">users</code> (for user tracking), 
                        <code className="bg-green-100 px-1 rounded">audit_events</code> (for operation logging), <code className="bg-green-100 px-1 rounded">marinas</code> (for location context). 
                        The system uses foreign key relationships to maintain data integrity and track operation dependencies.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPendingOperations.filter(op => op.status === 'PENDING').length}
            </div>
            <div className="text-xs text-muted-foreground">Waiting to sync</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Operations</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPendingOperations.filter(op => op.status === 'FAILED').length}
            </div>
            <div className="text-xs text-muted-foreground">Need attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPendingOperations.filter(op => op.priority === 'HIGH').length}
            </div>
            <div className="text-xs text-muted-foreground">Urgent operations</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPendingOperations.reduce((sum, op) => sum + op.attempts, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Sync attempts made</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search operations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="CONTRACT_CREATION">Contract Creation</SelectItem>
                <SelectItem value="INVOICE_UPDATE">Invoice Update</SelectItem>
                <SelectItem value="WORK_ORDER_CREATION">Work Order Creation</SelectItem>
                <SelectItem value="BOOKING_UPDATE">Booking Update</SelectItem>
                <SelectItem value="PAYMENT_PROCESSING">Payment Processing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Operations ({filteredOperations.length})</CardTitle>
              <CardDescription>Operations waiting to be synchronized with the server</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleClearCompleted}>
                Clear Completed
              </Button>
                      <Button variant="outline" size="sm" onClick={handleViewLogs}>
          <Eye className="h-4 w-4 mr-2" />
          View Logs
        </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Operation</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Attempts</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.map((operation) => {
                  const TypeIcon = operationTypeIcons[operation.type as keyof typeof operationTypeIcons] || FileText;
                  return (
                    <tr key={operation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <TypeIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{operation.title}</div>
                            <div className="text-sm text-gray-500">{operation.description}</div>
                            <div className="text-xs text-gray-400">
                              {operation.user} • {operation.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={operationTypeColors[operation.type as keyof typeof operationTypeColors]}>
                          {getOperationTypeDisplayName(operation.type)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(operation.status)}
                          <Badge className={statusColors[operation.status as keyof typeof statusColors]}>
                            {operation.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={priorityColors[operation.priority as keyof typeof priorityColors]}>
                          {operation.priority}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {operation.attempts}/{operation.maxAttempts}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last: {formatDateTime(operation.lastAttempt)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(operation.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {operation.status === 'FAILED' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRetryOperation(operation.id)}
                              disabled={!isOnline}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Retry
                            </Button>
                          )}
                                            <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewOperation(operation.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteOperation(operation.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" size="lg" onClick={handleForceSync}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Force Sync
        </Button>
        <Button variant="outline" size="lg" onClick={handleScheduleSync}>
          <Clock className="h-4 w-4 mr-2" />
          Schedule Sync
        </Button>
        <Button variant="outline" size="lg" onClick={handleErrorReports}>
          <AlertCircle className="h-4 w-4 mr-2" />
          Error Reports
        </Button>
        <Button variant="outline" size="lg" onClick={handleExportQueue}>
          <FileText className="h-4 w-4 mr-2" />
          Export Queue
        </Button>
      </div>
      </div>
    </AppLayout>
  );
}

