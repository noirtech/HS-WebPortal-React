import { prisma, updateMarinaStatus, getMarinaStatus, updatePendingOperationStatus } from './db'
import { pendingQueue } from './pending-queue'
import { notificationService } from './notifications'
import { logAuditEvent } from './db'

// ============================================================================
// EDGE AGENT SERVICE INTERFACES
// ============================================================================

export interface EdgeAgentConfig {
  marinaId: string
  heartbeatInterval: number
  syncInterval: number
  maxRetries: number
  retryDelay: number
  conflictResolutionStrategy: 'auto' | 'manual' | 'hybrid'
}

export interface EdgeAgentStatus {
  marinaId: string
  isOnline: boolean
  lastHeartbeat: Date
  lastSync: Date
  pendingOperationsCount: number
  syncStatus: 'idle' | 'syncing' | 'error'
  errorMessage?: string
  version: string
  uptime: number
}

export interface SyncOperation {
  id: string
  marinaId: string
  operationType: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  data: Record<string, any>
  timestamp: Date
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  maxRetries: number
  errorMessage?: string
}

export interface SyncResult {
  success: boolean
  operationsProcessed: number
  operationsSucceeded: number
  operationsFailed: number
  conflicts: number
  requiresManualReview: number
  error?: string
}

export interface ConflictResolutionRule {
  entityType: string
  field: string
  strategy: 'next_available' | 'manual_review' | 'skip' | 'override' | 'merge'
  fallbackValue?: any
  conditions?: Record<string, any>
  mergeStrategy?: 'latest' | 'merge_fields' | 'custom'
}

// ============================================================================
// EDGE AGENT SERVICE
// ============================================================================

export class EdgeAgentService {
  private static instance: EdgeAgentService
  private agents: Map<string, EdgeAgentInstance> = new Map()
  private configs: Map<string, EdgeAgentConfig> = new Map()

  private constructor() {
    this.initializeDefaultConfigs()
  }

  static getInstance(): EdgeAgentService {
    if (!EdgeAgentService.instance) {
      EdgeAgentService.instance = new EdgeAgentService()
    }
    return EdgeAgentService.instance
  }

  private initializeDefaultConfigs() {
    const defaultConfig: EdgeAgentConfig = {
      marinaId: 'default',
      heartbeatInterval: parseInt(process.env.EDGE_AGENT_HEARTBEAT_INTERVAL || '30000'),
      syncInterval: parseInt(process.env.EDGE_AGENT_SYNC_INTERVAL || '60000'),
      maxRetries: 3,
      retryDelay: 5000,
      conflictResolutionStrategy: 'hybrid',
    }

    this.configs.set('default', defaultConfig)
  }

  // ============================================================================
  // AGENT MANAGEMENT
  // ============================================================================

  async registerAgent(marinaId: string, config?: Partial<EdgeAgentConfig>): Promise<void> {
    try {
      const baseConfig = this.configs.get('default')!
      const agentConfig: EdgeAgentConfig = {
        ...baseConfig,
        marinaId,
        ...config,
      }

      this.configs.set(marinaId, agentConfig)

      const agent = new EdgeAgentInstance(marinaId, agentConfig)
      this.agents.set(marinaId, agent)

      // Start the agent
      await agent.start()

      // Log agent registration
      await logAuditEvent({
        eventType: 'EDGE_AGENT_REGISTERED',
        entityType: 'EDGE_AGENT',
        entityId: marinaId,
        action: 'REGISTER_AGENT',
        marinaId,
        userId: 'system',
        metadata: JSON.stringify({
          config: agentConfig,
        }),
      })

      console.log(`✅ Edge agent registered for marina: ${marinaId}`)
    } catch (error) {
      console.error(`❌ Failed to register edge agent for marina ${marinaId}:`, error)
      throw error
    }
  }

  async unregisterAgent(marinaId: string): Promise<void> {
    try {
      const agent = this.agents.get(marinaId)
      if (agent) {
        await agent.stop()
        this.agents.delete(marinaId)
      }

      this.configs.delete(marinaId)

      // Log agent unregistration
      await logAuditEvent({
        eventType: 'EDGE_AGENT_UNREGISTERED',
        entityType: 'EDGE_AGENT',
        entityId: marinaId,
        action: 'UNREGISTER_AGENT',
        marinaId,
        userId: 'system',
      })

      console.log(`✅ Edge agent unregistered for marina: ${marinaId}`)
    } catch (error) {
      console.error(`❌ Failed to unregister edge agent for marina ${marinaId}:`, error)
      throw error
    }
  }

  async getAgentStatus(marinaId: string): Promise<EdgeAgentStatus | null> {
    const agent = this.agents.get(marinaId)
    if (!agent) {
      return null
    }

    return await agent.getStatus()
  }

  async getAllAgentStatuses(): Promise<EdgeAgentStatus[]> {
    const statuses: EdgeAgentStatus[] = []
    
    for (const [marinaId] of this.agents) {
      const status = await this.getAgentStatus(marinaId)
      if (status) {
        statuses.push(status)
      }
    }
    
    return statuses
  }

  // ============================================================================
  // HEARTBEAT MANAGEMENT
  // ============================================================================

  async handleHeartbeat(marinaId: string, heartbeatData: any): Promise<void> {
    try {
      const agent = this.agents.get(marinaId)
      if (!agent) {
        // Auto-register agent if not exists
        await this.registerAgent(marinaId)
      }

      // Update marina status
      await updateMarinaStatus(marinaId, true)

      // Process heartbeat data
      if (heartbeatData.pendingOperationsCount !== undefined) {
        await this.updatePendingOperationsCount(marinaId, heartbeatData.pendingOperationsCount)
      }

      if (heartbeatData.syncStatus) {
        await this.updateSyncStatus(marinaId, heartbeatData.syncStatus)
      }

      // Log heartbeat
      await logAuditEvent({
        eventType: 'EDGE_AGENT_HEARTBEAT',
        entityType: 'EDGE_AGENT',
        entityId: marinaId,
        action: 'HEARTBEAT',
        marinaId,
        userId: 'system',
        metadata: JSON.stringify({
          heartbeatData,
          timestamp: new Date(),
        }),
      })
    } catch (error) {
      console.error(`❌ Failed to handle heartbeat for marina ${marinaId}:`, error)
      
      // Mark marina as offline on heartbeat failure
      await updateMarinaStatus(marinaId, false)
    }
  }

  private async updatePendingOperationsCount(marinaId: string, count: number): Promise<void> {
    // This would update a local cache or database field
    // For now, just log it
    console.log(`Marina ${marinaId} has ${count} pending operations`)
  }

  private async updateSyncStatus(marinaId: string, status: string): Promise<void> {
    // This would update the agent's sync status
    const agent = this.agents.get(marinaId)
    if (agent) {
      agent.updateSyncStatus(status)
    }
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  async syncFromOnPrem(marinaId: string, syncData: any): Promise<SyncResult> {
    try {
      const agent = this.agents.get(marinaId)
      if (!agent) {
        throw new Error(`Edge agent not found for marina: ${marinaId}`)
      }

      return await agent.syncFromOnPrem(syncData)
    } catch (error) {
      console.error(`❌ Failed to sync from on-prem for marina ${marinaId}:`, error)
      
      return {
        success: false,
        operationsProcessed: 0,
        operationsSucceeded: 0,
        operationsFailed: 1,
        conflicts: 0,
        requiresManualReview: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async syncToOnPrem(marinaId: string): Promise<SyncResult> {
    try {
      const agent = this.agents.get(marinaId)
      if (!agent) {
        throw new Error(`Edge agent not found for marina: ${marinaId}`)
      }

      return await agent.syncToOnPrem()
    } catch (error) {
      console.error(`❌ Failed to sync to on-prem for marina ${marinaId}:`, error)
      
      return {
        success: false,
        operationsProcessed: 0,
        operationsSucceeded: 0,
        operationsFailed: 1,
        conflicts: 0,
        requiresManualReview: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  async resolveConflicts(marinaId: string, conflicts: any[]): Promise<any[]> {
    try {
      const agent = this.agents.get(marinaId)
      if (!agent) {
        throw new Error(`Edge agent not found for marina: ${marinaId}`)
      }

      return await agent.resolveConflicts(conflicts)
    } catch (error) {
      console.error(`❌ Failed to resolve conflicts for marina ${marinaId}:`, error)
      throw error
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async isMarinaOnline(marinaId: string): Promise<boolean> {
    const status = await getMarinaStatus(marinaId)
    return status?.isOnline || false
  }

  async getOfflineMarinas(): Promise<string[]> {
    const offlineMarinas: string[] = []
    
    for (const [marinaId] of this.agents) {
      const isOnline = await this.isMarinaOnline(marinaId)
      if (!isOnline) {
        offlineMarinas.push(marinaId)
      }
    }
    
    return offlineMarinas
  }

  async getOnlineMarinas(): Promise<string[]> {
    const onlineMarinas: string[] = []
    
    for (const [marinaId] of this.agents) {
      const isOnline = await this.isMarinaOnline(marinaId)
      if (isOnline) {
        onlineMarinas.push(marinaId)
      }
    }
    
    return onlineMarinas
  }
}

// ============================================================================
// EDGE AGENT INSTANCE
// ============================================================================

class EdgeAgentInstance {
  private marinaId: string
  private config: EdgeAgentConfig
  private isRunning: boolean = false
  private heartbeatTimer?: NodeJS.Timeout
  private syncTimer?: NodeJS.Timeout
  private lastHeartbeat: Date = new Date()
  private lastSync: Date = new Date()
  private syncStatus: 'idle' | 'syncing' | 'error' = 'idle'
  private errorMessage?: string
  private startTime: Date = new Date()
  private version: string = '1.0.0'

  constructor(marinaId: string, config: EdgeAgentConfig) {
    this.marinaId = marinaId
    this.config = config
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.startTime = new Date()

    // Start heartbeat timer
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, this.config.heartbeatInterval)

    // Start sync timer
    this.syncTimer = setInterval(() => {
      this.performSync()
    }, this.config.syncInterval)

    console.log(`🚀 Edge agent started for marina: ${this.marinaId}`)
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = undefined
    }

    console.log(`🛑 Edge agent stopped for marina: ${this.marinaId}`)
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      // In a real implementation, this would send a heartbeat to the on-prem system
      // For now, just update the local timestamp
      this.lastHeartbeat = new Date()

      // Check if we need to send any pending operations
      const queueStatus = pendingQueue.getQueueStatus()
      const pendingCount = queueStatus.pending
      
      if (pendingCount > 0) {
        console.log(`💓 Heartbeat for marina ${this.marinaId}: ${pendingCount} pending operations`)
      }
    } catch (error) {
      console.error(`❌ Heartbeat failed for marina ${this.marinaId}:`, error)
      this.syncStatus = 'error'
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  private async performSync(): Promise<void> {
    if (this.syncStatus === 'syncing') {
      console.log(`⏳ Sync already in progress for marina ${this.marinaId}`)
      return
    }

    try {
      this.syncStatus = 'syncing'
      console.log(`🔄 Starting sync for marina ${this.marinaId}`)

      // Sync pending operations to on-prem
      const syncResult = await this.syncToOnPrem()
      
      if (syncResult.success) {
        this.syncStatus = 'idle'
        this.lastSync = new Date()
        this.errorMessage = undefined
        
        console.log(`✅ Sync completed for marina ${this.marinaId}: ${syncResult.operationsSucceeded}/${syncResult.operationsProcessed} operations processed`)
      } else {
        this.syncStatus = 'error'
        this.errorMessage = syncResult.error
        
        console.error(`❌ Sync failed for marina ${this.marinaId}:`, syncResult.error)
      }
    } catch (error) {
      this.syncStatus = 'error'
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ Sync error for marina ${this.marinaId}:`, error)
    }
  }

  async syncFromOnPrem(syncData: any): Promise<SyncResult> {
    try {
      const operations = syncData.operations || []
      let operationsProcessed = 0
      let operationsSucceeded = 0
      let operationsFailed = 0
      let conflicts = 0
      let requiresManualReview = 0

      for (const operation of operations) {
        try {
          operationsProcessed++
          
          // Process the operation based on its type
          const result = await this.processOnPremOperation(operation)
          
          if (result.success) {
            operationsSucceeded++
          } else {
            operationsFailed++
            
            if (result.requiresManualReview) {
              requiresManualReview++
            }
            
            if (result.conflicts) {
              conflicts += result.conflicts.length
            }
          }
        } catch (error) {
          operationsFailed++
          console.error(`Failed to process on-prem operation:`, error)
        }
      }

      return {
        success: true,
        operationsProcessed,
        operationsSucceeded,
        operationsFailed,
        conflicts,
        requiresManualReview,
      }
    } catch (error) {
      console.error('Sync from on-prem failed:', error)
      
      return {
        success: false,
        operationsProcessed: 0,
        operationsSucceeded: 0,
        operationsFailed: 1,
        conflicts: 0,
        requiresManualReview: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async syncToOnPrem(): Promise<SyncResult> {
    try {
      // Get pending operations for this marina
      const queueStatus = pendingQueue.getQueueStatus()
      const pendingOperations: any[] = [] // Simplified - in real implementation would filter by marina
      
      let operationsProcessed = 0
      let operationsSucceeded = 0
      let operationsFailed = 0
      let conflicts = 0
      let requiresManualReview = 0

      for (const operation of pendingOperations) {
        try {
          operationsProcessed++
          
          // In a real implementation, this would send the operation to the on-prem system
          // For now, we'll simulate the process
          
          const result = await this.sendOperationToOnPrem(operation)
          
          if (result.success) {
            operationsSucceeded++
            
            // Mark operation as completed
            await updatePendingOperationStatus(operation.id, 'COMPLETED')
          } else {
            operationsFailed++
            
            if (result.requiresManualReview) {
              requiresManualReview++
            }
            
            if (result.conflicts) {
              conflicts += result.conflicts.length
            }
          }
        } catch (error) {
          operationsFailed++
          console.error(`Failed to sync operation to on-prem:`, error)
        }
      }

      return {
        success: true,
        operationsProcessed,
        operationsSucceeded,
        operationsFailed,
        conflicts,
        requiresManualReview,
      }
    } catch (error) {
      console.error('Sync to on-prem failed:', error)
      
      return {
        success: false,
        operationsProcessed: 0,
        operationsSucceeded: 0,
        operationsFailed: 1,
        conflicts: 0,
        requiresManualReview: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async processOnPremOperation(operation: any): Promise<{ success: boolean; requiresManualReview?: boolean; conflicts?: string[] }> {
    try {
      // This would process operations received from the on-prem system
      // For now, just return success
      return { success: true }
    } catch (error) {
      console.error('Failed to process on-prem operation:', error)
      return { success: false }
    }
  }

  private async sendOperationToOnPrem(operation: any): Promise<{ success: boolean; requiresManualReview?: boolean; conflicts?: string[] }> {
    try {
      // In a real implementation, this would send the operation to the on-prem system
      // For now, simulate a successful send
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Simulate occasional failures
      if (Math.random() < 0.1) {
        return { success: false, requiresManualReview: true }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Failed to send operation to on-prem:', error)
      return { success: false }
    }
  }

  async resolveConflicts(conflicts: any[]): Promise<any[]> {
    try {
      const resolvedConflicts: any[] = []
      
      for (const conflict of conflicts) {
        try {
          // Apply conflict resolution rules
          const resolved = await this.applyConflictResolutionRules(conflict)
          resolvedConflicts.push(resolved)
        } catch (error) {
          console.error('Failed to resolve conflict:', error)
          resolvedConflicts.push({ ...conflict, resolutionStatus: 'failed' })
        }
      }
      
      return resolvedConflicts
    } catch (error) {
      console.error('Failed to resolve conflicts:', error)
      throw error
    }
  }

  private async applyConflictResolutionRules(conflict: any): Promise<any> {
    try {
      // This would apply the configured conflict resolution rules
      // For now, just return the conflict with a resolution status
      return { ...conflict, resolutionStatus: 'resolved' }
    } catch (error) {
      console.error('Failed to apply conflict resolution rules:', error)
      throw error
    }
  }

  async getStatus(): Promise<EdgeAgentStatus> {
    const queueStatus = pendingQueue.getQueueStatus()
    const pendingCount = queueStatus.pending
    
    return {
      marinaId: this.marinaId,
      isOnline: this.isRunning,
      lastHeartbeat: this.lastHeartbeat,
      lastSync: this.lastSync,
      pendingOperationsCount: pendingCount,
      syncStatus: this.syncStatus,
      errorMessage: this.errorMessage,
      version: this.version,
      uptime: Date.now() - this.startTime.getTime(),
    }
  }

  updateSyncStatus(status: string): void {
    this.syncStatus = status as 'idle' | 'syncing' | 'error'
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const edgeAgentService = EdgeAgentService.getInstance()

