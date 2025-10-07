'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLocale, useLocaleFormatting } from '@/lib/locale-context'
import { useDataSource } from '@/lib/data-source-context'
import { createDataProvider } from '@/lib/data-source'
import { logger } from '@/lib/logger'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  Globe,
  Save,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
// import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Settings } from 'lucide-react'

// Mock user for demo purposes
const mockUser = {
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

export default function ProfilePage() {
  const { localeConfig } = useLocaleFormatting()
  const { currentLocale } = useLocale()
  const { currentSource } = useDataSource()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userData, setUserData] = useState(mockUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    email: mockUser.email,
    phone: mockUser.phone,
    address: mockUser.address,
    city: mockUser.city,
    county: mockUser.county,
    postcode: mockUser.postcode,
    country: mockUser.county
  })

  // Fetch user profile data based on current data source
  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dataProvider = createDataProvider(currentSource)
      const profileData = await dataProvider.getUserProfile()
      
      if (profileData) {
        setUserData(profileData)
        setFormData({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          county: profileData.county,
          postcode: profileData.postcode,
          country: profileData.county
        })
      }
      
      logger.debug('Profile data fetched', { source: currentSource, data: profileData })
    } catch (err) {
      logger.error('Failed to fetch profile data', { error: err, source: currentSource })
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when data source changes
  useEffect(() => {
    fetchUserProfile()
  }, [currentSource])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const dataProvider = createDataProvider(currentSource)
      await dataProvider.updateUserProfile(formData)
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        ...formData
      }))
      
      setIsEditing(false)
      logger.debug('Profile saved successfully', { source: currentSource, formData })
    } catch (err) {
      logger.error('Failed to save profile', { error: err, source: currentSource })
      setError('Failed to save profile changes')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      county: userData.county,
      postcode: userData.postcode,
      country: userData.county
    })
    setIsEditing(false)
    setError(null)
  }

  // Show loading state
  if (loading && !userData) {
    return (
      <AppLayout user={mockUser}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile data...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show error state
  if (error && !userData) {
    return (
      <AppLayout user={mockUser}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchUserProfile} variant="outline">
                Retry
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={userData}>
      <div className="p-6">


        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
          {currentSource === 'mock' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                📋 <strong>Demo Mode:</strong> Showing mock profile data. Switch to Production mode to see real user data.
              </p>
            </div>
          )}
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
                      <span className="text-blue-600 text-sm font-bold">ℹ️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - User Profile & Settings</h3>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>
                        This page allows users to view and edit their personal profile information, manage account settings, and configure preferences. 
                        Users can update contact details, change passwords, and set locale preferences for the application.
                      </p>
                      <p>
                        The profile system includes personal information management, role-based access control display, notification preferences, 
                        and locale settings for UK/US formatting. All changes are tracked and can be reverted if needed.
                      </p>
                    </div>
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
                        <strong>User Profile Data Structure:</strong> The profile system manages user data through the <code className="bg-green-100 px-1 rounded">users</code> table, which stores personal information, contact details, and preferences. 
                        Each user has a unique ID and links to role assignments through the <code className="bg-green-100 px-1 rounded">user_roles</code> table.
                      </p>
                      <p>
                        <strong>Locale Management:</strong> User locale preferences are managed through the <code className="bg-green-100 px-1 rounded">locale-context.tsx</code> component and stored in browser local storage. 
                        The system supports UK (en-GB) and US (en-US) locales with automatic formatting for dates, currency, and measurements.
                      </p>
                      <p>
                        <strong>Role-Based Access Control:</strong> User permissions are managed through the <code className="bg-green-100 px-1 rounded">user_roles</code> table, which links users to specific roles (ADMIN, STAFF_FRONT_DESK, etc.). 
                        This enables fine-grained access control across different marina management functions.
                      </p>
                      <p>
                        <strong>Key Tables for Profile Management:</strong> <code className="bg-green-100 px-1 rounded">users</code> (user accounts), <code className="bg-green-100 px-1 rounded">user_roles</code> (role assignments), 
                        <code className="bg-green-100 px-1 rounded">audit_events</code> (profile change tracking). The system uses React state management for form handling and local storage for persistence.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" disabled={loading}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" disabled={loading}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing || loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing || loading}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing || loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing || loading}
                    className="mt-1"
                    placeholder="+44 20 7946 0958"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing || loading}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing || loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      value={formData.county}
                      onChange={(e) => handleInputChange('county', e.target.value)}
                      disabled={!isEditing || loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      disabled={!isEditing || loading}
                      className="mt-1"
                      placeholder="PO1 1AA"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className="pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    className="mt-1"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="mt-1"
                    disabled={loading}
                  />
                </div>

                <Button className="bg-green-600 hover:bg-green-700" disabled={loading}>
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User ID</span>
                  <span className="text-sm font-medium">{userData.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium">January 2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Roles & Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {userData.roles.map((role, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{role.role}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Locale Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-purple-600" />
                  Locale Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Locale</span>
                  <span className="text-sm font-medium">UK (en-GB)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currency</span>
                  <span className="text-sm font-medium">{localeConfig.currencySymbol} {localeConfig.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date Format</span>
                  <span className="text-sm font-medium">{localeConfig.dateFormat}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Format</span>
                  <span className="text-sm font-medium">{localeConfig.timeFormat}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-orange-600" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Notifications</span>
                  <input
                    type="checkbox"
                    checked={userData.preferences.notifications.email}
                    onChange={() => {}} // Empty handler to satisfy React
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                    readOnly
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMS Notifications</span>
                  <input
                    type="checkbox"
                    checked={userData.preferences.notifications.sms}
                    onChange={() => {}} // Empty handler to satisfy React
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                    readOnly
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Push Notifications</span>
                  <input
                    type="checkbox"
                    checked={userData.preferences.notifications.push}
                    onChange={() => {}} // Empty handler to satisfy React
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
