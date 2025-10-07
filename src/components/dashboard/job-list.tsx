'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Play,
  Square,
  Edit,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'
import { logger } from '@/lib/logger'
import { useJobs } from '@/hooks/use-data-source-fetch'

interface JobListProps {
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
  boatName?: string
  // Job details
  cost?: number
  timeStarted?: Date
  timeStopped?: Date
  isTimerRunning?: boolean
  progress?: number
  // Work order reference
  workOrderId?: string
  workOrderNumber?: string
}

const JobList: React.FC<JobListProps> = ({ userId, marinaId }) => {
  const router = useRouter()
  const { formatDate } = useLocaleFormatting()
  const [showAllJobs, setShowAllJobs] = useState(false)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

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
      boatName: job.boatName || job.boat?.name || 'Unknown',
      cost: job.cost || 0,
      timeStarted: job.timeStarted ? new Date(job.timeStarted) : undefined,
      timeStopped: job.timeStopped ? new Date(job.timeStopped) : undefined,
      isTimerRunning: job.isTimerRunning || false,
      progress: job.progress || 0,
      workOrderId: job.workOrderId || job.id,
      workOrderNumber: job.workOrderNumber || job.workOrderId || `WO-${job.id}`
    }))
  }, [jobsData])

  // Handler functions
  const handleViewJob = (job: Job) => {
    logger.info(`Viewing job: ${job.title}`)
  }

  const handleStartJob = (job: Job) => {
    logger.info(`Started job: ${job.title}`)
  }

  const handleUpdateJob = (job: Job) => {
    logger.info(`Updating job: ${job.title}`)
  }

  const handleTimerToggle = (job: Job) => {
    logger.info(`Timer toggle for job: ${job.title}`)
  }

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId)
  }

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-gray-100 text-gray-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ENGINE': return <Wrench className="w-4 h-4 text-blue-600" />
      case 'ELECTRICAL': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'HULL': return <Anchor className="w-4 h-4 text-purple-600" />
      case 'SAFETY': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Wrench className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'ASSIGNED': return <User className="w-4 h-4" />
      case 'IN_PROGRESS': return <TrendingUp className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'ON_HOLD': return <AlertTriangle className="w-4 h-4" />
      case 'URGENT': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Get jobs to display (show first 3 by default, or all if expanded)
  const displayJobs = showAllJobs ? jobs : jobs.slice(0, 3)
  const hasMoreJobs = jobs.length > 3

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="w-5 h-5 text-blue-600" />
              Daily Boatyard Joblist
              {isDemoMode && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  Demo Mode
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              Quick overview of today's assigned tasks
              {isLoading && <span className="ml-2 text-blue-600">Loading...</span>}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Navigate to work orders diary view
              router.push('/en-GB/work-orders?view=diary')
            }}
            className="flex items-center gap-2 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors bg-white shadow-sm"
            title="View detailed work orders diary"
          >
            <Calendar className="w-3 h-3" />
            View Diary
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading jobs...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-red-600 text-sm">
            <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
            Error loading jobs: {error.message}
          </div>
        )}

        {/* Table Header */}
        {!isLoading && !error && (
          <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b rounded-t-lg text-xs font-medium text-gray-600 uppercase tracking-wide">
            <div className="col-span-3">Job Details</div>
            <div className="col-span-2">Staff</div>
            <div className="col-span-2">Boat</div>
            <div className="col-span-1">Hours</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
        )}

        <div className="space-y-0">
          {!isLoading && !error && displayJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No jobs assigned for today
            </div>
          ) : (
            displayJobs.map((job, index) => (
              <div key={job.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                {/* Main Job Row */}
                <div className="grid md:grid-cols-12 gap-2 px-3 py-3 items-center">
                  {/* Job Details Column */}
                  <div className="col-span-12 md:col-span-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleJobExpansion(job.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {expandedJob === job.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      {getCategoryIcon(job.jobCategory || '')}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{job.title}</h4>
                        <div className="text-xs text-gray-500 truncate">
                          {job.workOrderNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Column */}
                  <div className="col-span-6 md:col-span-2">
                    <div className="text-sm text-gray-900">{job.assignedToStaffName || 'Unassigned'}</div>
                    <div className="text-xs text-gray-500">{job.assignedToStaffRole || 'N/A'}</div>
                  </div>

                  {/* Boat Column */}
                  <div className="col-span-6 md:col-span-2">
                    <div className="text-sm text-gray-900">{job.boatName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{job.customerName || 'N/A'}</div>
                  </div>

                  {/* Hours Column */}
                  <div className="col-span-6 md:col-span-1">
                    <div className="text-sm text-gray-900">
                      {job.estimatedHours}h
                    </div>
                    {job.actualHours && (
                      <div className="text-xs text-gray-500">
                        {job.actualHours.toFixed(1)}h
                      </div>
                    )}
                  </div>

                  {/* Status Column */}
                  <div className="col-span-6 md:col-span-2">
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{job.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </Badge>
                      {job.isUrgent && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">URGENT</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-12 md:col-span-2">
                    <div className="flex flex-wrap gap-1">
                      {job.status === 'PENDING' && (
                        <Button 
                          size="sm" 
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6"
                          onClick={() => handleStartJob(job)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {job.status === 'IN_PROGRESS' && (
                        <Button 
                          size="sm" 
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 h-6"
                          onClick={() => handleUpdateJob(job)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                      )}

                      {/* Timer Controls */}
                      {job.timeStarted && (
                        <Button 
                          size="sm" 
                          className={`text-xs px-2 py-1 h-6 ${
                            job.isTimerRunning 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          onClick={() => handleTimerToggle(job)}
                        >
                          {job.isTimerRunning ? (
                            <Square className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Row */}
                {expandedJob === job.id && (
                  <div className="px-3 pb-3 bg-gray-25 border-t border-gray-100">
                    <div className="grid md:grid-cols-2 gap-4 pt-3">
                      {/* Left Column */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Job Information</div>
                        <div className="text-sm text-gray-900">{job.jobNotes || 'No notes available'}</div>
                        
                        {job.progress !== undefined && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Timing & Cost</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Requested:</span>
                            <span className="ml-2 text-gray-900">{formatDate(job.requestedDate.toISOString())}</span>
                          </div>
                          {job.timeStarted && (
                            <div>
                              <span className="text-gray-500">Started:</span>
                              <span className="ml-2 text-gray-900">{formatDate(job.timeStarted.toISOString())}</span>
                            </div>
                          )}
                          {job.cost && (
                            <div>
                              <span className="text-gray-500">Cost:</span>
                              <span className="ml-2 text-gray-900">£{job.cost.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Show More/Less Toggle */}
        {!isLoading && !error && hasMoreJobs && (
          <div className="mt-3 pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllJobs(!showAllJobs)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showAllJobs ? 'Show Less' : `Show ${jobs.length - 3} More Jobs`}
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && !error && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{jobs.filter(j => j.status === 'PENDING').length}</div>
                <div>Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{jobs.filter(j => j.status === 'IN_PROGRESS').length}</div>
                <div>In Progress</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{jobs.filter(j => j.status === 'COMPLETED').length}</div>
                <div>Completed</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { JobList }
