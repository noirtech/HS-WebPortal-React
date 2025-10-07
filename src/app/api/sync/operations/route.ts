import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 SYNC OPERATIONS API: Using mock data for demo mode');
    
    // Generate mock sync operations data
    const mockSyncOperations = [
      {
        id: 'sync_marina_1',
        type: 'marina_sync',
        title: 'Marina Sync Required',
        description: 'Sync data for Portsmouth Marina (PM)',
        status: 'pending',
        priority: 'high',
        marinaId: 'marina-1',
        marinaName: 'Portsmouth Marina',
        marinaCode: 'PM',
        createdAt: new Date().toISOString(),
        estimatedDuration: '5-10 minutes',
        metadata: {
          operation: 'full_sync',
          reason: 'marina_offline',
          lastSync: new Date(Date.now() - 3600000).toISOString(),
        }
      },
      {
        id: 'workorder_sync_1',
        type: 'work_order_sync',
        title: 'Work Order Sync',
        description: 'Sync work order "Engine Maintenance - Port Engine"',
        status: 'pending',
        priority: 'medium',
        marinaId: 'marina-1',
        marinaName: 'Portsmouth Marina',
        marinaCode: 'PM',
        createdAt: new Date().toISOString(),
        estimatedDuration: '1-2 minutes',
        metadata: {
          operation: 'work_order_update',
          workOrderId: 'work-order-1',
          workOrderStatus: 'in_progress',
          workOrderPriority: 'high',
        }
      },
      {
        id: 'invoice_sync_1',
        type: 'invoice_sync',
        title: 'Invoice Sync',
        description: 'Sync invoice "INV-2024-001"',
        status: 'completed',
        priority: 'low',
        marinaId: 'marina-1',
        marinaName: 'Portsmouth Marina',
        marinaCode: 'PM',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        estimatedDuration: '30 seconds',
        metadata: {
          operation: 'invoice_update',
          invoiceId: 'invoice-1',
          invoiceStatus: 'sent',
        }
      }
    ];
    
    console.log('✅ SYNC OPERATIONS API: Successfully returned mock sync operations', { count: mockSyncOperations.length });
    return NextResponse.json({
      data: mockSyncOperations
    });
  }

  try {
    const mockUser = getDemoUser();

    // Create basic sync operations without relying on pending_operations table
    const syncOperations: any[] = [];

    try {
      // Get prisma client
      const prisma = await getPrisma();
      if (prisma) {
        // Get offline marinas
        const offlineMarinas = await prisma.marina.findMany({
          where: { isOnline: false },
          select: {
            id: true,
            name: true,
            code: true,
            lastSyncAt: true,
          }
        });

        // Add offline marina sync operations
        offlineMarinas.forEach((marina: any) => {
          syncOperations.push({
            id: `sync_${marina.id}`,
            type: 'marina_sync',
            title: 'Marina Sync Required',
            description: `Sync data for ${marina.name} (${marina.code})`,
            status: 'pending',
            priority: 'high',
            marinaId: marina.id,
            marinaName: marina.name,
            marinaCode: marina.code,
            createdAt: marina.lastSyncAt || new Date().toISOString(),
            estimatedDuration: '5-10 minutes',
            metadata: {
              operation: 'full_sync',
              reason: 'marina_offline',
              lastSync: marina.lastSyncAt,
            }
          });
        });

        // Get recent work orders that might need syncing
        const recentWorkOrders = await prisma.workOrder.findMany({
          where: {
            status: { in: ['pending', 'in_progress'] },
            updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            marina: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          },
          take: 5 // Limit to 5 most recent
        });

        // Add work order sync operations
        recentWorkOrders.forEach((workOrder: any) => {
          syncOperations.push({
            id: `workorder_sync_${workOrder.id}`,
            type: 'work_order_sync',
            title: 'Work Order Sync',
            description: `Sync work order "${workOrder.title}"`,
            status: 'pending',
            priority: workOrder.priority === 'urgent' ? 'high' : 'medium',
            marinaId: workOrder.marina.id,
            marinaName: workOrder.marina.name,
            marinaCode: workOrder.marina.code,
            createdAt: new Date().toISOString(),
            estimatedDuration: '1-2 minutes',
            metadata: {
              operation: 'work_order_update',
              workOrderId: workOrder.id,
              workOrderStatus: workOrder.status,
              workOrderPriority: workOrder.priority,
            }
          });
        });

        // Get recent invoices that might need syncing
        const recentInvoices = await prisma.invoice.findMany({
          where: {
            status: { in: ['pending', 'overdue'] },
            updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
          },
          select: {
            id: true,
            total: true,
            status: true,
            contract: {
              select: {
                berth: {
                  select: {
                    marina: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
                      }
                    }
                  }
                }
              }
            }
          },
          take: 5 // Limit to 5 most recent
        });

        // Add invoice sync operations
        recentInvoices.forEach((invoice: any) => {
          syncOperations.push({
            id: `invoice_sync_${invoice.id}`,
            type: 'invoice_sync',
            title: 'Invoice Sync',
            description: `Sync invoice #${invoice.id} - £${invoice.total}`,
            status: 'pending',
            priority: invoice.status === 'overdue' ? 'high' : 'medium',
            marinaId: invoice.contract.berth.marina.id,
            marinaName: invoice.contract.berth.marina.name,
            marinaCode: invoice.contract.berth.marina.code,
            createdAt: new Date().toISOString(),
            estimatedDuration: '1-2 minutes',
            metadata: {
              operation: 'invoice_update',
              invoiceId: invoice.id,
              invoiceAmount: invoice.total,
              invoiceStatus: invoice.status,
            }
          });
        });
      }
    } catch (dbError) {
      console.error('Error fetching sync operations from database:', dbError);
      
      // Add fallback operations if database fails
      syncOperations.push({
        id: 'fallback_sync',
        type: 'system_sync',
        title: 'System Sync',
        description: 'General system synchronization',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        estimatedDuration: '5-10 minutes',
        metadata: {
          operation: 'fallback_sync',
          error: 'Database connection failed'
        }
      });
    }

    // Add some demo sync operations
    syncOperations.push(
      {
        id: 'demo_sync_1',
        type: 'data_backup',
        title: 'Data Backup',
        description: 'Scheduled daily backup of marina data',
        status: 'completed',
        priority: 'low',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: '10-15 minutes',
        metadata: {
          operation: 'daily_backup',
          backupSize: '2.5 GB',
          recordsBackedUp: 15420
        }
      },
      {
        id: 'demo_sync_2',
        type: 'report_generation',
        title: 'Report Generation',
        description: 'Generate monthly financial reports',
        status: 'in_progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        estimatedDuration: '15-20 minutes',
        metadata: {
          operation: 'monthly_reports',
          reportTypes: ['financial', 'occupancy', 'maintenance']
        }
      }
    );

    // Sort operations by creation time (newest first)
    syncOperations.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      data: syncOperations,
      count: syncOperations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching sync operations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
