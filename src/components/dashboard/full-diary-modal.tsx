'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Wrench, 
  Clock, 
  User, 
  Anchor,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  X,
  Search,
  Filter,
  BookOpen,
  Download,
  Printer,
  Play,
  Pause,
  Square,
  Edit,
  Plus,
  Users,
  FileText,
  Camera,
  MessageSquare,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ChevronRight
} from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { useJobs } from '@/hooks/use-data-source-fetch'

interface FullDiaryModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
  marinaId?: string
}

interface Job {
  id: string
  title: string
  status: string
  priority: string
  requestedDate: Date
  estimatedHours?: number
  actualHours?: number
  jobCategory?: string
  jobNotes?: string
  isUrgent?: boolean
  // Staff assignment (marina technician/engineer)
  assignedToStaffId?: string
  assignedToStaffName?: string
  assignedToStaffRole?: string
  // Customer/boat information
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  boatName?: string
  boatRegistration?: string
  boatType?: string
  // Job details
  cost?: number
  timeStarted?: Date
  timeStopped?: Date
  isTimerRunning?: boolean
  progress?: number
  photos?: string[]
  comments?: Comment[]
  // Work order reference
  workOrderId?: string
  workOrderNumber?: string
}

interface Comment {
  id: string
  text: string
  authorId: string
  authorName: string
  authorRole: string
  timestamp: Date
}

export default function FullDiaryModal({ isOpen, onClose, userId, marinaId }: FullDiaryModalProps) {
  const { formatDate, formatTime, formatCurrency } = useLocaleFormatting()
  
  // Use the data source hook to fetch jobs
  const { data: jobsData, isLoading, error, isDemoMode } = useJobs()
  
  // Convert the data to the expected Job interface format
  const jobs: Job[] = React.useMemo(() => {
    if (!jobsData || !Array.isArray(jobsData)) {
      return []
    }
    
    return jobsData.map((job: any) => ({
      id: job.id || `job-${Math.random()}`,
      title: job.title || job.jobTitle || 'Untitled Job',
      status: job.status || 'PENDING',
      priority: job.priority || 'MEDIUM',
      requestedDate: job.requestedDate ? new Date(job.requestedDate) : new Date(),
      estimatedHours: job.estimatedHours || 0,
      actualHours: job.actualHours || 0,
      jobCategory: job.jobCategory || job.category || 'General',
      jobNotes: job.jobNotes || job.notes || '',
      isUrgent: job.isUrgent || false,
      assignedToStaffId: job.assignedToStaffId || job.staffId,
      assignedToStaffName: job.assignedToStaffName || job.staffName || 'Unassigned',
      assignedToStaffRole: job.assignedToStaffRole || job.staffRole || 'Technician',
      customerName: job.customerName || job.customer?.firstName + ' ' + job.customer?.lastName || 'Unknown',
      customerEmail: job.customerEmail || job.customer?.email || '',
      customerPhone: job.customerPhone || job.customer?.phone || '',
      boatName: job.boatName || job.boat?.name || 'Unknown',
      boatRegistration: job.boatRegistration || job.boat?.registration || '',
      boatType: job.boatType || job.boat?.type || '',
      cost: job.cost || 0,
      timeStarted: job.timeStarted ? new Date(job.timeStarted) : undefined,
      timeStopped: job.timeStopped ? new Date(job.timeStopped) : undefined,
      isTimerRunning: job.isTimerRunning || false,
      progress: job.progress || 0,
      photos: job.photos || [],
      comments: job.comments || [],
      workOrderId: job.workOrderId || job.id,
      workOrderNumber: job.workOrderNumber || job.workOrderId || `WO-${job.id}`
    }))
  }, [jobsData])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [staffFilter, setStaffFilter] = useState('ALL')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [isAddingJob, setIsAddingJob] = useState(false)
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    jobCategory: '',
    estimatedHours: 0,
    jobNotes: ''
  })

  // Initialize filtered jobs when jobs data changes
  useEffect(() => {
    setFilteredJobs(jobs)
  }, [jobs])

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.boatName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.assignedToStaffName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(job => job.priority === priorityFilter)
    }

    if (staffFilter !== 'ALL') {
      filtered = filtered.filter(job => job.assignedToStaffId === staffFilter)
    }

    setFilteredJobs(filtered)
  }, [jobs, searchTerm, statusFilter, priorityFilter, staffFilter])

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800'
      case 'ON_HOLD': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-orange-100 text-orange-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStartTimer = (jobId: string) => {
    // Since we're using read-only data from the hook, we'll just log the action
    logger.info('Job timer started', { jobId, userId })
  }

  const handleStopTimer = (jobId: string) => {
    // Since we're using read-only data from the hook, we'll just log the action
    logger.info('Job timer stopped', { jobId, userId })
  }

  const handleBulkAction = (action: string) => {
    if (selectedJobs.length === 0) return

    // Since we're using read-only data from the hook, we'll just log the action
    logger.info('Bulk action requested', { action, jobIds: selectedJobs, userId })
    setSelectedJobs([])
  }

  const handleAddJob = () => {
    if (!newJob.title || !newJob.jobCategory) return

    // Since we're using read-only data from the hook, we'll just log the action
    logger.info('New job creation requested', { newJob, userId })
    setNewJob({ title: '', priority: 'MEDIUM', status: 'PENDING', jobCategory: '', estimatedHours: 0, jobNotes: '' })
    setIsAddingJob(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Marina Diary</h2>
              <p className="text-gray-600">Daily job management and task tracking</p>
              {isDemoMode && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 mt-1">
                  Demo Mode
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddingJob(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Job
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs by title, customer, boat, or staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Staff</option>
                {/* Staff options removed - should use data source hook */}
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Category</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>All Categories</option>
                  <option>Engine Maintenance</option>
                  <option>Electrical</option>
                  <option>Hull Maintenance</option>
                  <option>Safety & Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Range</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Any Cost</option>
                  <option>Under £200</option>
                  <option>£200 - £500</option>
                  <option>Over £500</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedJobs.length} job(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('START')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start Selected
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('COMPLETE')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('ASSIGN')}
                >
                  Reassign Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Diary Entries */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Jobs</h3>
              <p className="text-gray-600 mb-4">{error.message}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Jobs List */}
          {!isLoading && !error && (
            <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Compact Overview - Always Visible */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedJobs.includes(job.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedJobs(prev => [...prev, job.id])
                              } else {
                                setSelectedJobs(prev => prev.filter(id => id !== job.id))
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                          {job.isUrgent && (
                            <Badge className="bg-red-100 text-red-800">URGENT</Badge>
                          )}
                          <Badge className={getPriorityColor(job.priority)}>
                            {job.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Wrench className="w-4 h-4" />
                          <span className="font-medium">{job.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{job.assignedToStaffName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Anchor className="w-4 h-4" />
                          <span>{job.boatName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(job.requestedDate)}</span>
                        </div>
                        {job.cost && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{formatCurrency(job.cost)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleJobExpansion(job.id)}
                        className="flex items-center gap-1"
                      >
                        {expandedJobs.has(job.id) ? 'Show Less' : 'Show Details'}
                        {expandedJobs.has(job.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details - Click to View */}
                  {expandedJobs.has(job.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Job Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium">{job.jobCategory}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Estimated Hours:</span>
                              <span className="font-medium">{job.estimatedHours}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Actual Hours:</span>
                              <span className="font-medium">{job.actualHours || 0}h</span>
                            </div>
                            {job.jobNotes && (
                              <div>
                                <span className="text-gray-600">Notes:</span>
                                <p className="text-gray-900 mt-1">{job.jobNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Customer & Boat</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Customer:</span>
                              <span className="font-medium">{job.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Boat:</span>
                              <span className="font-medium">{job.boatName} ({job.boatRegistration})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium">{job.boatType}</span>
                            </div>
                            {job.customerEmail && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{job.customerEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Time Tracking */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Time Tracking</h4>
                        <div className="flex items-center gap-4">
                          {job.isTimerRunning ? (
                            <Button
                              size="sm"
                              onClick={() => handleStopTimer(job.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Square className="w-4 h-4 mr-1" />
                              Stop Timer
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleStartTimer(job.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start Timer
                            </Button>
                          )}
                          
                          <div className="text-sm text-gray-600">
                            {job.timeStarted && (
                              <span>Started: {formatTime(job.timeStarted)}</span>
                            )}
                            {job.timeStopped && (
                              <span className="ml-4">Stopped: {formatTime(job.timeStopped)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      {job.progress !== undefined && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 mt-1">{job.progress}% complete</span>
                        </div>
                      )}

                      {/* Comments */}
                      {job.comments && job.comments.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
                          <div className="space-y-2">
                            {job.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{comment.authorName}</span>
                                  <span className="text-xs text-gray-500">{formatTime(comment.timestamp)}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Job
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Add Comment
                        </Button>
                        <Button size="sm" variant="outline">
                          <Camera className="w-4 h-4 mr-1" />
                          Add Photos
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>

        {/* Add Job Modal */}
        {isAddingJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Job</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <Input
                    value={newJob.title}
                    onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter job title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newJob.jobCategory}
                    onChange={(e) => setNewJob(prev => ({ ...prev, jobCategory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select category</option>
                    <option value="Engine Maintenance">Engine Maintenance</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Hull Maintenance">Hull Maintenance</option>
                    <option value="Safety & Compliance">Safety & Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newJob.priority}
                    onChange={(e) => setNewJob(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <Input
                    type="number"
                    value={newJob.estimatedHours}
                    onChange={(e) => setNewJob(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <Textarea
                    value={newJob.jobNotes}
                    onChange={(e) => setNewJob(prev => ({ ...prev, jobNotes: e.target.value }))}
                    placeholder="Enter job notes"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddJob} className="flex-1">
                  Add Job
                </Button>
                <Button variant="outline" onClick={() => setIsAddingJob(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { FullDiaryModal }
