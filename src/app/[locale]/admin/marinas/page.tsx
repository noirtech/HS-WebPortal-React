'use client'

import React, { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Anchor, Plus, Wifi, WifiOff, MapPin, Phone, Mail, Edit, Settings, X } from 'lucide-react'
import { logger } from '@/lib/logger'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { useMarinas } from '@/hooks/use-data-source-fetch'

const timezoneOptions = [
  'America/New_York',
  'America/Los_Angeles', 
  'America/Chicago',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
]

const marinaGroups = [
  'East Coast Group',
  'West Coast Group', 
  'Central Group',
  'Northern Group',
  'Southern Group'
]

export default function AdminMarinasPage() {
  // Use data source hook instead of hardcoded mock data
  const { data: marinasData, isLoading, error } = useMarinas()
  const [localMarinas, setLocalMarinas] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingMarina, setEditingMarina] = useState<any>(null)
  const [configuringMarina, setConfiguringMarina] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'America/New_York',
    marinaGroup: 'East Coast Group'
  })

  const handleAddMarina = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      timezone: 'America/New_York',
      marinaGroup: 'East Coast Group'
    })
    setShowAddModal(true)
  }

  const handleEditMarina = (marina: any) => {
    setEditingMarina(marina)
    setFormData({
      name: marina.name,
      code: marina.code,
      address: marina.address,
      phone: marina.phone,
      email: marina.email,
      timezone: marina.timezone,
      marinaGroup: marina.marinaGroup.name
    })
    setShowEditModal(true)
  }

  const handleConfigureMarina = (marina: any) => {
    setConfiguringMarina(marina)
    setShowConfigModal(true)
  }

  const handleSubmitAdd = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.code || !formData.address || !formData.phone || !formData.email) {
        alert('Please fill in all required fields')
        return
      }

      // Create new marina
      const newMarina = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
        isOnline: false,
        lastSyncAt: new Date(),
        marinaGroup: { name: formData.marinaGroup }
      }

      // In a real app, this would be an API call
      setLocalMarinas(prev => [...prev, newMarina])
      
      logger.info('AdminMarinasPage: Marina added successfully', { marina: newMarina })
      setShowAddModal(false)
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        timezone: 'America/New_York',
        marinaGroup: 'East Coast Group'
      })
    } catch (error) {
      logger.error('AdminMarinasPage: Error adding marina', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to add marina. Please try again.')
    }
  }

  const handleSubmitEdit = async () => {
    try {
      if (!editingMarina) return

      // Validate form data
      if (!formData.name || !formData.code || !formData.address || !formData.phone || !formData.email) {
        alert('Please fill in all required fields')
        return
      }

      // Update marina
      const updatedMarina = {
        ...editingMarina,
        ...formData,
        marinaGroup: { name: formData.marinaGroup }
      }

      // In a real app, this would be an API call
      setLocalMarinas(prev => prev.map(m => m.id === editingMarina.id ? updatedMarina : m))
      
      logger.info('AdminMarinasPage: Marina updated successfully', { marina: updatedMarina })
      setShowEditModal(false)
      setEditingMarina(null)
    } catch (error) {
      logger.error('AdminMarinasPage: Error updating marina', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to update marina. Please try again.')
    }
  }

  const handleToggleMarinaStatus = async (marinaId: string) => {
    try {
      setLocalMarinas(prev => prev.map(m => 
        m.id === marinaId 
          ? { ...m, isActive: !m.isActive }
          : m
      ))
      
      logger.info('AdminMarinasPage: Marina status toggled', { marinaId })
    } catch (error) {
      logger.error('AdminMarinasPage: Error toggling marina status', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to toggle marina status. Please try again.')
    }
  }

  const handleDeleteMarina = async (marinaId: string) => {
    if (!confirm('Are you sure you want to delete this marina? This action cannot be undone.')) {
      return
    }

    try {
      setLocalMarinas(prev => prev.filter(m => m.id !== marinaId))
      logger.info('AdminMarinasPage: Marina deleted successfully', { marinaId })
    } catch (error) {
      logger.error('AdminMarinasPage: Error deleting marina', { error: error instanceof Error ? error.message : String(error) })
      alert('Failed to delete marina. Please try again.')
    }
  }

  // Mock user for demo purposes
  const mockUser = {
    id: 'demo-user',
    email: 'demo@marina.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: [
      { role: 'ADMIN' },
      { role: 'STAFF_FRONT_DESK' }
    ]
  }

  // Combine data from hook with local state
  const marinas = [...(marinasData || []), ...localMarinas]

  return (
    <AppLayout user={mockUser}>
      <div className="p-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marina Management</h1>
              <p className="text-gray-600">Manage marina locations and configurations</p>
            </div>
            <Button className="flex items-center gap-2" onClick={handleAddMarina}>
              <Plus className="h-4 w-4" />
              Add Marina
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
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Marina Management</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Manage marina locations, configurations, and multi-location operations for marina groups.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> Add, edit, and configure marina locations with contact details, timezone settings, and marina group assignments. Monitor online/offline status, sync status, and manage active/inactive marina locations across different regions.
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
                        <strong>Marina Data Structure:</strong> The <code className="bg-green-100 px-1 rounded">marinas</code> table contains location information, contact details, timezone settings, and operational status. 
                        Each marina has a unique ID, code, and links to marina groups through foreign key relationships.
                      </p>
                      <p>
                        <strong>Multi-Location Management:</strong> The system supports marina groups through the <code className="bg-green-100 px-1 rounded">marina_groups</code> table, allowing centralized management of multiple marina locations. 
                        Each marina can be assigned to a specific group for organizational purposes.
                      </p>
                      <p>
                        <strong>Status Monitoring:</strong> The system tracks marina operational status (active/inactive) and online connectivity through boolean flags. 
                        Sync status is monitored with timestamps to track data synchronization between marina locations and the central system.
                      </p>
                      <p>
                        <strong>Key Tables for Marina Management:</strong> <code className="bg-green-100 px-1 rounded">marinas</code> (3 total), <code className="bg-green-100 px-1 rounded">marina_groups</code> (5 groups), 
                        <code className="bg-green-100 px-1 rounded">users</code> (for access control), <code className="bg-green-100 px-1 rounded">audit_events</code> (for activity tracking). 
                        The system uses foreign key relationships to maintain data integrity across marina locations.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* Marina Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading && (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="text-gray-500">Loading marinas...</div>
            </div>
          )}
          
          {error && (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="text-red-500">Error loading marinas: {error.message}</div>
            </div>
          )}
          
          {!isLoading && !error && (!marinas || marinas.length === 0) && (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="text-gray-500">No marinas found</div>
            </div>
          )}
          
          {!isLoading && !error && marinas && marinas.length > 0 && marinas.map((marina) => (
            <Card key={marina.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Anchor className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{marina.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Code: {marina.code}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={marina.isActive ? "default" : "secondary"}
                      className={marina.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {marina.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {marina.isOnline ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs text-gray-500">
                        {marina.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{marina.address}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{marina.phone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{marina.email}</span>
                </div>
                
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Group:</span>
                    <span className="font-medium">{marina.marinaGroup.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Timezone:</span>
                    <span className="font-medium">{marina.timezone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Sync:</span>
                    <span className="font-medium">
                      {marina.lastSyncAt.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditMarina(marina)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleConfigureMarina(marina)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleToggleMarinaStatus(marina.id)}
                  >
                    {marina.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteMarina(marina.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {marinas.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Anchor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No marinas found</h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first marina location.
              </p>
              <Button onClick={handleAddMarina}>
                <Plus className="h-4 w-4 mr-2" />
                Add Marina
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Marina Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Marina"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Marina Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter marina name"
              />
            </div>
            
            <div>
              <Label htmlFor="code">Marina Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Enter marina code (e.g., HPM)"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter full address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="marinaGroup">Marina Group</Label>
                <Select value={formData.marinaGroup} onValueChange={(value) => setFormData(prev => ({ ...prev, marinaGroup: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {marinaGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmitAdd} className="flex-1">
                Add Marina
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Marina Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Marina"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Marina Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter marina name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-code">Marina Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Enter marina code (e.g., HPM)"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-address">Address *</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter full address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-marinaGroup">Marina Group</Label>
                <Select value={formData.marinaGroup} onValueChange={(value) => setFormData(prev => ({ ...prev, marinaGroup: value }))}>
                  <SelectTrigger>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                  </SelectTrigger>
                  <SelectContent>
                    {marinaGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmitEdit} className="flex-1">
                Update Marina
              </Button>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Configure Marina Modal */}
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title={`Configure ${configuringMarina?.name || 'Marina'}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Configuration Options</h4>
              <p className="text-sm text-blue-700">
                Configure marina-specific settings, preferences, and operational parameters.
              </p>
            </div>
            
            <div>
              <Label>Sync Settings</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Auto-sync interval</span>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Enable notifications</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </div>
            
            <div>
              <Label>Operational Settings</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Maintenance mode</span>
                  <input type="checkbox" className="rounded" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Emergency contact</span>
                  <Input placeholder="Enter emergency contact" className="w-32" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowConfigModal(false)} className="flex-1">
                Save Configuration
              </Button>
              <Button variant="outline" onClick={() => setShowConfigModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Data Source Debug Component */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
          <DataSourceDebug 
            dataType="marinas"
            dataCount={marinas?.length || 0}
            isLoading={isLoading}
            error={error}
            additionalInfo={{
              totalMarinas: marinas?.length || 0,
              activeMarinas: marinas?.filter((m: any) => m.status === 'ACTIVE').length || 0,
              inactiveMarinas: marinas?.filter((m: any) => m.status === 'INACTIVE').length || 0,
              totalBerths: marinas?.reduce((sum: number, m: any) => sum + (m.totalBerths || 0), 0) || 0
            }}
          />
        </div>
      </div>
    </AppLayout>
  )
}
