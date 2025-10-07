import { getPrisma } from './prisma-client';

// Pending Queue Manager for handling offline marina operations
export class PendingQueueManager {
  private queue: any[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    this.loadQueueFromStorage();
  }

  // Add operation to queue
  async addOperation(operation: any): Promise<void> {
    const queueItem = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      status: 'pending',
      retries: 0,
      createdAt: new Date().toISOString(),
      lastAttempt: null,
      error: null,
    };

    this.queue.push(queueItem);
    this.saveQueueToStorage();
    
    console.log(`[PendingQueue] Added operation to queue: ${operation.type}`);
  }

  // Process all pending operations
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('[PendingQueue] Already processing queue');
      return;
    }

    this.isProcessing = true;
    console.log(`[PendingQueue] Processing ${this.queue.length} operations`);

    try {
      const pendingOperations = this.queue.filter(item => item.status === 'pending');
      
      for (const item of pendingOperations) {
        try {
          await this.processOperation(item);
          item.status = 'completed';
          item.lastAttempt = new Date().toISOString();
        } catch (error) {
          console.error(`[PendingQueue] Error processing operation ${item.id}:`, error);
          
          item.retries++;
          item.lastAttempt = new Date().toISOString();
          item.error = error instanceof Error ? error.message : 'Unknown error';

          if (item.retries >= this.maxRetries) {
            item.status = 'failed';
            console.error(`[PendingQueue] Operation ${item.id} failed after ${this.maxRetries} retries`);
          } else {
            // Schedule retry
            setTimeout(() => {
              this.processOperation(item);
            }, this.retryDelay * item.retries);
          }
        }
      }

      this.saveQueueToStorage();
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual operation
  private async processOperation(item: any): Promise<void> {
    const { operation } = item;
    
    switch (operation.type) {
      case 'contract_create':
        await this.processContractCreate(operation);
        break;
      case 'contract_update':
        await this.processContractUpdate(operation);
        break;
      case 'invoice_create':
        await this.processInvoiceCreate(operation);
        break;
      case 'payment_process':
        await this.processPaymentProcess(operation);
        break;
      case 'work_order_create':
        await this.processWorkOrderCreate(operation);
        break;
      case 'work_order_update':
        await this.processWorkOrderUpdate(operation);
        break;
      case 'booking_create':
        await this.processBookingCreate(operation);
        break;
      case 'booking_update':
        await this.processBookingUpdate(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Process contract creation
  private async processContractCreate(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { data } = operation;
    
    // Validate berth availability
    if (data.berthId) {
      const conflict = await this.checkBerthConflict(operation, data.berthId);
      if (conflict) {
        throw new Error(`Berth conflict: ${conflict}`);
      }
    }

    // Create contract
    const contract = await prismaClient.contract.create({
      data: {
        ...data,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`[PendingQueue] Created contract: ${contract.id}`);
  }

  // Process contract update
  private async processContractUpdate(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { id, data } = operation;
    
    // Update contract
    const contract = await prismaClient.contract.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });

    console.log(`[PendingQueue] Updated contract: ${contract.id}`);
  }

  // Process invoice creation
  private async processInvoiceCreate(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { data } = operation;
    
    // Create invoice
    const invoice = await prismaClient.invoice.create({
      data: {
        ...data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`[PendingQueue] Created invoice: ${invoice.id}`);
  }

  // Process payment processing
  private async processPaymentProcess(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { data } = operation;
    
    // Create payment record
    const payment = await prismaClient.payment.create({
      data: {
        ...data,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Update invoice status
    if (data.invoiceId) {
      await prismaClient.invoice.update({
        where: { id: data.invoiceId },
        data: {
          status: 'paid',
          updatedAt: new Date(),
        }
      });
    }

    console.log(`[PendingQueue] Processed payment: ${payment.id}`);
  }

  // Process work order creation
  private async processWorkOrderCreate(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { data } = operation;
    
    // Create work order
    const workOrder = await prismaClient.workOrder.create({
      data: {
        ...data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`[PendingQueue] Created work order: ${workOrder.id}`);
  }

  // Process work order update
  private async processWorkOrderUpdate(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { id, data } = operation;
    
    // Update work order
    const workOrder = await prismaClient.workOrder.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });

    console.log(`[PendingQueue] Updated work order: ${workOrder.id}`);
  }

  // Process booking creation
  private async processBookingCreate(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { data } = operation;
    
    // Validate berth availability
    if (data.berthId) {
      const conflict = await this.checkBerthConflict(operation, data.berthId);
      if (conflict) {
        throw new Error(`Berth conflict: ${conflict}`);
      }
    }

    // Create booking
    const booking = await prismaClient.booking.create({
      data: {
        ...data,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`[PendingQueue] Created booking: ${booking.id}`);
  }

  // Process booking update
  private async processBookingUpdate(operation: any): Promise<void> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    const { id, data } = operation;
    
    // Update booking
    const booking = await prismaClient.booking.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });

    console.log(`[PendingQueue] Updated booking: ${booking.id}`);
  }

  // Check for berth conflicts
  private async checkBerthConflict(operation: any, berthId: string): Promise<string | null> {
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      throw new Error('Database not available');
    }

    try {
      const berth = await prismaClient.berth.findUnique({
        where: { id: berthId },
        include: {
          contracts: {
            where: { status: 'active' }
          },
          bookings: {
            where: { 
              status: { in: ['confirmed', 'active'] },
              startDate: { lte: new Date() },
              endDate: { gte: new Date() }
            }
          }
        }
      });

      if (!berth) {
        return 'Berth not found';
      }

      if (!berth.isAvailable) {
        return 'Berth is not available';
      }

      if (berth.contracts.length > 0) {
        return 'Berth has active contract';
      }

      if (berth.bookings.length > 0) {
        return 'Berth has active booking';
      }

      return null;
    } catch (error) {
      console.error('[PendingQueue] Error checking berth conflict:', error);
      return 'Error checking berth availability';
    }
  }

  // Get queue status
  getQueueStatus(): any {
    const pending = this.queue.filter(item => item.status === 'pending').length;
    const completed = this.queue.filter(item => item.status === 'completed').length;
    const failed = this.queue.filter(item => item.status === 'failed').length;

    return {
      total: this.queue.length,
      pending,
      completed,
      failed,
      isProcessing: this.isProcessing,
    };
  }

  // Clear completed operations
  clearCompleted(): void {
    this.queue = this.queue.filter(item => item.status !== 'completed');
    this.saveQueueToStorage();
    console.log('[PendingQueue] Cleared completed operations');
  }

  // Clear failed operations
  clearFailed(): void {
    this.queue = this.queue.filter(item => item.status !== 'failed');
    this.saveQueueToStorage();
    console.log('[PendingQueue] Cleared failed operations');
  }

  // Clear all operations
  clearAll(): void {
    this.queue = [];
    this.saveQueueToStorage();
    console.log('[PendingQueue] Cleared all operations');
  }

  // Load queue from storage
  private loadQueueFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('pendingQueue');
        if (stored) {
          this.queue = JSON.parse(stored);
          console.log(`[PendingQueue] Loaded ${this.queue.length} operations from storage`);
        }
      }
    } catch (error) {
      console.error('[PendingQueue] Error loading queue from storage:', error);
    }
  }

  // Save queue to storage
  private saveQueueToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingQueue', JSON.stringify(this.queue));
      }
    } catch (error) {
      console.error('[PendingQueue] Error saving queue to storage:', error);
    }
  }
}

// Export singleton instance
export const pendingQueue = new PendingQueueManager();

