'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useLocaleFormatting } from '@/lib/locale-context';
import { AppLayout } from '@/components/layout/app-layout';
import { useSession } from 'next-auth/react'

import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Settings } from 'lucide-react';
import { useUsers } from '@/hooks/use-data-source-fetch'

// Admin User interface for the admin page
interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  department: string;
  permissions: string[];
  marinaAccess: string;
}

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@marina.com',
    phone: '+1 (555) 123-4567',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2023-06-15T09:00:00Z',
    department: 'Management',
    permissions: ['ALL'],
    marinaAccess: 'All Locations'
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike.chen@marina.com',
    phone: '+1 (555) 234-5678',
    role: 'STAFF_FRONT_DESK',
    status: 'ACTIVE',
    lastLogin: '2024-01-14T16:45:00Z',
    createdAt: '2023-08-20T14:30:00Z',
    department: 'Customer Service',
    permissions: ['VIEW_CONTRACTS', 'EDIT_BOOKINGS', 'VIEW_INVOICES'],
    marinaAccess: 'Main Dock'
  },
  {
    id: 3,
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@marina.com',
    phone: '+1 (555) 345-6789',
    role: 'STAFF_FINANCE',
    status: 'ACTIVE',
    lastLogin: '2024-01-15T08:15:00Z',
    createdAt: '2023-09-10T11:00:00Z',
    department: 'Finance',
    permissions: ['VIEW_INVOICES', 'EDIT_PAYMENTS', 'VIEW_REPORTS'],
    marinaAccess: 'All Locations'
  },
  {
    id: 4,
    name: 'David Thompson',
    email: 'david.thompson@marina.com',
    phone: '+1 (555) 456-7890',
    role: 'STAFF_MAINTENANCE',
    status: 'ACTIVE',
    lastLogin: '2024-01-13T12:20:00Z',
    createdAt: '2023-07-05T15:45:00Z',
    department: 'Maintenance',
    permissions: ['VIEW_WORK_ORDERS', 'EDIT_WORK_ORDERS', 'VIEW_BOATS'],
    marinaAccess: 'Main Dock, North Pier'
  },
  {
    id: 5,
    name: 'Emma Wilson',
    email: 'emma.wilson@marina.com',
    phone: '+1 (555) 567-8901',
    role: 'STAFF_FRONT_DESK',
    status: 'INACTIVE',
    lastLogin: '2024-01-05T14:10:00Z',
    createdAt: '2023-10-15T10:20:00Z',
    department: 'Customer Service',
    permissions: ['VIEW_CONTRACTS', 'VIEW_BOOKINGS'],
    marinaAccess: 'South Dock'
  },
  {
    id: 6,
    name: 'James Brown',
    email: 'james.brown@marina.com',
    phone: '+1 (555) 678-9012',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    lastLogin: '2024-01-14T19:30:00Z',
    createdAt: '2023-11-20T16:00:00Z',
    department: 'N/A',
    permissions: ['VIEW_OWN_CONTRACTS', 'VIEW_OWN_INVOICES'],
    marinaAccess: 'N/A'
  }
];

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800',
  STAFF_FRONT_DESK: 'bg-blue-100 text-blue-800',
  STAFF_FINANCE: 'bg-green-100 text-green-800',
  STAFF_MAINTENANCE: 'bg-orange-100 text-orange-800',
  CUSTOMER: 'bg-gray-100 text-gray-800'
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800'
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const { formatDate, formatDateTime, formatCurrency, localeConfig } = useLocaleFormatting();
  const { data: users, isLoading, error } = useUsers()
  
  // Use fetched users data or fallback to mock data
  const displayUsers = users || mockUsers
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showActivityLogsModal, setShowActivityLogsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF_FRONT_DESK',
    department: '',
    marinaAccess: '',
    permissions: [] as string[]
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF_FRONT_DESK',
    department: '',
    marinaAccess: '',
    permissions: [] as string[]
  });

  const filteredUsers = displayUsers.filter((user: AdminUser) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });



  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      ADMIN: 'Administrator',
      STAFF_FRONT_DESK: 'Front Desk Staff',
      STAFF_FINANCE: 'Finance Staff',
      STAFF_MAINTENANCE: 'Maintenance Staff',
      CUSTOMER: 'Customer'
    };
    return roleNames[role] || role;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'SUSPENDED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  // User management handlers
  const handleNewUserChange = (field: string, value: string | string[]) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateUser = () => {
    // Validate required fields
    if (!newUser.name || !newUser.email || !newUser.role) {
      alert('Please fill in all required fields')
      return
    }

    // Create new user
    const newUserData = {
      id: mockUsers.length + 1,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: 'ACTIVE',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      department: newUser.department,
      permissions: newUser.permissions,
      marinaAccess: newUser.marinaAccess
    }

    // Add to users list (in a real app, this would be an API call)
    mockUsers.push(newUserData)

    // Reset form and close modal
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'STAFF_FRONT_DESK',
      department: '',
      marinaAccess: '',
      permissions: []
    })
    setShowCreateModal(false)

    // Show success message
    alert('User created successfully!')
  }

  const handleCancelNewUser = () => {
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'STAFF_FRONT_DESK',
      department: '',
      marinaAccess: '',
      permissions: []
    })
    setShowCreateModal(false)
  }

  // Edit user handlers
  const handleEditUser = (user: AdminUser) => {
    setEditUser({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      marinaAccess: user.marinaAccess || '',
      permissions: user.permissions || []
    })
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleUpdateUser = () => {
    if (!selectedUser) return

    // Validate required fields
    if (!editUser.name || !editUser.email || !editUser.role) {
      alert('Please fill in all required fields')
      return
    }

    // Update user
    const userIndex = mockUsers.findIndex(u => u.id === selectedUser.id)
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
        department: editUser.department,
        marinaAccess: editUser.marinaAccess,
        permissions: editUser.permissions
      }
    }

    setShowEditModal(false)
    setSelectedUser(null)
    alert('User updated successfully!')
  }

  const handleCancelEditUser = () => {
    setShowEditModal(false)
    setSelectedUser(null)
  }

  // Delete user handlers
  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedUser) return

    // Delete user (in a real app, this would be an API call)
    const userIndex = mockUsers.findIndex(u => u.id === selectedUser.id)
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1)
    }

    setShowDeleteModal(false)
    setSelectedUser(null)
    alert('User deleted successfully!')
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setSelectedUser(null)
  }

  // Permission toggle handler
  const togglePermission = (permission: string, permissions: string[], setPermissions: (permissions: string[]) => void) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter(p => p !== permission))
    } else {
      setPermissions([...permissions, permission])
    }
  }

  // Check authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
              dataType="users"
              dataCount={displayUsers.length}
              isLoading={isLoading}
              error={error}
              additionalInfo={{
                totalUsers: displayUsers.length,
                        activeUsers: displayUsers.filter((u: AdminUser) => u.status === 'ACTIVE').length,
        inactiveUsers: displayUsers.filter((u: AdminUser) => u.status === 'INACTIVE').length,
        adminUsers: displayUsers.filter((u: AdminUser) => u.role === 'ADMIN').length
              }}
            />
          </div>

          {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage staff accounts, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
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
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - User Management</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Purpose:</strong> Manage staff accounts, roles, permissions, and access control for marina operations.
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>How it works:</strong> Create and manage user accounts with role-based access control (RBAC), assign specific permissions for different marina functions, monitor user activity and login attempts, and control access to marina locations and features based on user roles.
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
                      <strong>User Management Data Structure:</strong> The user management system operates through the <code className="bg-green-100 px-1 rounded">users</code> table, which stores account information, contact details, and status. 
                      Each user is linked to specific roles through the <code className="bg-green-100 px-1 rounded">user_roles</code> table for permission management.
                    </p>
                    <p>
                      <strong>Role-Based Access Control (RBAC):</strong> The system implements RBAC through the <code className="bg-green-100 px-1 rounded">user_roles</code> table, which maps users to roles like ADMIN, STAFF_FRONT_DESK, STAFF_FINANCE, and STAFF_MAINTENANCE. 
                      Each role has specific permissions and marina access levels defined in the database.
                    </p>
                    <p>
                      <strong>Permission Management:</strong> User permissions are stored as JSON arrays in the <code className="bg-green-100 px-1 rounded">permissions</code> field, allowing granular control over features like user creation, financial access, and maintenance operations. 
                      Permissions are validated at both frontend and API levels.
                    </p>
                    <p>
                      <strong>Key Tables for User Management:</strong> <code className="bg-green-100 px-1 rounded">users</code> (user accounts), <code className="bg-green-100 px-1 rounded">user_roles</code> (role assignments), 
                      <code className="bg-green-100 px-1 rounded">audit_events</code> (user activity tracking), <code className="bg-green-100 px-1 rounded">marinas</code> (access control). The system uses NextAuth for authentication and custom middleware for role validation.
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <div className="text-xs text-muted-foreground">
              {mockUsers.filter(u => u.status === 'ACTIVE').length} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUsers.filter(u => u.role !== 'CUSTOMER').length}
            </div>
            <div className="text-xs text-muted-foreground">Administrative users</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUsers.filter(u => u.role === 'CUSTOMER').length}
            </div>
                            <div className="text-xs text-muted-foreground">Boat customers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUsers.filter(u => {
                const lastLogin = new Date(u.lastLogin);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return lastLogin > oneWeekAgo;
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">Active this week</div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="STAFF_FRONT_DESK">Front Desk</SelectItem>
                <SelectItem value="STAFF_FINANCE">Finance</SelectItem>
                <SelectItem value="STAFF_MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: AdminUser) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user.status)}
                        <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                          {user.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{user.department}</div>
                      <div className="text-xs text-gray-500">{user.marinaAccess}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(user.lastLogin)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" size="lg" onClick={() => setShowPermissionsModal(true)}>
          <Shield className="h-4 w-4 mr-2" />
          Manage Permissions
        </Button>
        <Button variant="outline" size="lg" onClick={() => setShowBulkImportModal(true)}>
          <Users className="h-4 w-4 mr-2" />
          Bulk User Import
        </Button>
        <Button variant="outline" size="lg" onClick={() => setShowNotificationsModal(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Send Notifications
        </Button>
        <Button variant="outline" size="lg" onClick={() => setShowActivityLogsModal(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          Activity Logs
        </Button>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New User</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelNewUser}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  value={newUser.name}
                  onChange={(e) => handleNewUserChange('name', e.target.value)}
                  placeholder="Enter full name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => handleNewUserChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => handleNewUserChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <Select value={newUser.role} onValueChange={(value) => handleNewUserChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="STAFF_FRONT_DESK">Front Desk Staff</SelectItem>
                    <SelectItem value="STAFF_FINANCE">Finance Staff</SelectItem>
                    <SelectItem value="STAFF_MAINTENANCE">Maintenance Staff</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <Input
                  value={newUser.department}
                  onChange={(e) => handleNewUserChange('department', e.target.value)}
                  placeholder="Enter department"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marina Access
                </label>
                <Input
                  value={newUser.marinaAccess}
                  onChange={(e) => handleNewUserChange('marinaAccess', e.target.value)}
                  placeholder="e.g., Main Dock, All Locations"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions
                </label>
                <div className="space-y-2">
                  {['VIEW_CONTRACTS', 'EDIT_CONTRACTS', 'VIEW_BOOKINGS', 'EDIT_BOOKINGS', 'VIEW_INVOICES', 'EDIT_PAYMENTS', 'VIEW_REPORTS', 'VIEW_WORK_ORDERS', 'EDIT_WORK_ORDERS'].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUser.permissions.includes(permission)}
                        onChange={() => togglePermission(permission, newUser.permissions, (permissions) => handleNewUserChange('permissions', permissions))}
                        className="mr-2"
                      />
                      {permission.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreateUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create User
              </Button>
              <Button
                onClick={handleCancelNewUser}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEditUser}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  value={editUser.name}
                  onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  value={editUser.phone}
                  onChange={(e) => setEditUser(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <Select value={editUser.role} onValueChange={(value) => setEditUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="STAFF_FRONT_DESK">Front Desk Staff</SelectItem>
                    <SelectItem value="STAFF_FINANCE">Finance Staff</SelectItem>
                    <SelectItem value="STAFF_MAINTENANCE">Maintenance Staff</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <Input
                  value={editUser.department}
                  onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marina Access
                </label>
                <Input
                  value={editUser.marinaAccess}
                  onChange={(e) => setEditUser(prev => ({ ...prev, marinaAccess: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions
                </label>
                <div className="space-y-2">
                  {['VIEW_CONTRACTS', 'EDIT_CONTRACTS', 'VIEW_BOOKINGS', 'EDIT_BOOKINGS', 'VIEW_INVOICES', 'EDIT_PAYMENTS', 'VIEW_REPORTS', 'VIEW_WORK_ORDERS', 'EDIT_WORK_ORDERS'].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editUser.permissions.includes(permission)}
                        onChange={() => togglePermission(permission, editUser.permissions, (permissions) => setEditUser(prev => ({ ...prev, permissions })))}
                        className="mr-2"
                      />
                      {permission.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpdateUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Update User
              </Button>
              <Button
                onClick={handleCancelEditUser}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Delete User</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelDelete}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Confirm User Deletion
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Are you sure you want to delete user <strong>{selectedUser.name}</strong>?</p>
                      <p className="mt-1">This action cannot be undone.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete User
              </Button>
              <Button
                onClick={handleCancelDelete}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Manage Permissions</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPermissionsModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Role-Based Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(roleColors).map(([role, colors]) => (
                        <div key={role} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={colors}>
                              {getRoleDisplayName(role)}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600">
                            {mockUsers.filter(u => u.role === role).length} users
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Permission Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Contracts', 'Bookings', 'Invoices', 'Payments', 'Reports', 'Work Orders', 'Users', 'System'].map((category) => (
                        <div key={category} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{category}</span>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPermissionsModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk User Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Bulk User Import</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkImportModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop your CSV file here</p>
                  <p className="text-xs text-gray-500">or click to browse</p>
                  <Button variant="outline" className="mt-2">
                    Choose File
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Role
                </label>
                <Select defaultValue="STAFF_FRONT_DESK">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF_FRONT_DESK">Front Desk Staff</SelectItem>
                    <SelectItem value="STAFF_FINANCE">Finance Staff</SelectItem>
                    <SelectItem value="STAFF_MAINTENANCE">Maintenance Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium">CSV Format:</p>
                  <p>Name, Email, Phone, Department</p>
                  <p className="text-xs mt-1">Download template: <Button variant="link" className="p-0 h-auto">template.csv</Button></p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowBulkImportModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Import Users
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Send Notifications</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotificationsModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients
                </label>
                <Select defaultValue="ALL_STAFF">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_STAFF">All Staff</SelectItem>
                    <SelectItem value="ADMIN_ONLY">Administrators Only</SelectItem>
                    <SelectItem value="FRONT_DESK">Front Desk Staff</SelectItem>
                    <SelectItem value="FINANCE">Finance Staff</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance Staff</SelectItem>
                    <SelectItem value="CUSTOMERS">All Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Input
                  placeholder="Enter notification subject"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter notification message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Method
                </label>
                <div className="space-y-2">
                  {['Email', 'SMS', 'In-App'].map((method) => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={method === 'Email'}
                        className="mr-2"
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowNotificationsModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Send Notifications
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {showActivityLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">User Activity Logs</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActivityLogsModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Total Logins Today</p>
                      <p className="text-2xl font-bold text-blue-600">24</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Failed Login Attempts</p>
                      <p className="text-2xl font-bold text-red-600">3</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                      <p className="text-2xl font-bold text-green-600">8</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { user: 'Sarah Johnson', action: 'Logged in', time: '2 minutes ago', ip: '192.168.1.100' },
                      { user: 'Mike Chen', action: 'Updated booking', time: '5 minutes ago', ip: '192.168.1.101' },
                      { user: 'Lisa Rodriguez', action: 'Processed payment', time: '12 minutes ago', ip: '192.168.1.102' },
                      { user: 'David Thompson', action: 'Created work order', time: '18 minutes ago', ip: '192.168.1.103' },
                      { user: 'Emma Wilson', action: 'Failed login attempt', time: '25 minutes ago', ip: '192.168.1.104' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            activity.action.includes('Failed') ? 'bg-red-500' :
                            activity.action.includes('Logged in') ? 'bg-green-500' :
                            'bg-blue-500'
                          }`} />
                          <span className="text-sm font-medium">{activity.user}</span>
                          <span className="text-sm text-gray-600">{activity.action}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">{activity.time}</p>
                          <p className="text-xs text-gray-500">IP: {activity.ip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowActivityLogsModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Export Logs
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}


