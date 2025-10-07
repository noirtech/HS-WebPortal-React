import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 SYNC NOTIFICATIONS API: Using mock data for demo mode');
    
    // Generate mock sync notifications data
    const mockSystemNotifications = [
      {
        id: 'offline_marina_1',
        type: 'marina_offline',
        title: 'Marina Offline',
        message: 'Portsmouth Marina (PM) is currently offline',
        severity: 'high',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        metadata: {
          marinaId: 'marina-1',
          marinaName: 'Portsmouth Marina',
          marinaCode: 'PM',
        }
      },
      {
        id: 'overdue_invoice_1',
        type: 'invoice_overdue',
        title: 'Overdue Invoice',
        message: 'Invoice #INV-2024-001 is 5 days overdue - £1,250.00',
        severity: 'high',
        timestamp: new Date(Date.now() - 432000000).toISOString(),
        metadata: {
          invoiceId: 'invoice-1',
          amount: 1250.00,
          daysOverdue: 5,
          customerName: 'John Smith',
          berthNumber: 'A-12'
        }
      },
      {
        id: 'sync_complete_1',
        type: 'sync_complete',
        title: 'Sync Complete',
        message: 'Data synchronization completed successfully',
        severity: 'low',
        timestamp: new Date().toISOString(),
        metadata: {
          syncType: 'full_sync',
          recordsProcessed: 150,
          duration: '2 minutes 30 seconds'
        }
      }
    ];
    
    console.log('✅ SYNC NOTIFICATIONS API: Successfully returned mock sync notifications', { count: mockSystemNotifications.length });
    return NextResponse.json({
      data: mockSystemNotifications
    });
  }

  try {
    const mockUser = getDemoUser();

    // Create basic system notifications without relying on pending_operations table
    const systemNotifications: any[] = [];

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

        // Add offline marina notifications
        offlineMarinas.forEach((marina: any) => {
          systemNotifications.push({
            id: `offline_${marina.id}`,
            type: 'marina_offline',
            title: 'Marina Offline',
            message: `${marina.name} (${marina.code}) is currently offline`,
            severity: 'high',
            timestamp: marina.lastSyncAt || new Date().toISOString(),
            metadata: {
              marinaId: marina.id,
              marinaName: marina.name,
              marinaCode: marina.code,
            }
          });
        });

        // Get overdue invoices
        const overdueInvoices = await prisma.invoice.findMany({
          where: {
            status: 'overdue',
            dueDate: { lt: new Date() }
          },
          select: {
            id: true,
            total: true,
            dueDate: true,
            contract: {
              select: {
                id: true,
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                },
                berth: {
                  select: {
                    berthNumber: true,
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
          take: 10 // Limit to 10 most recent
        });

        // Add overdue invoice notifications
        overdueInvoices.forEach((invoice: any) => {
          const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          
          systemNotifications.push({
            id: `overdue_${invoice.id}`,
            type: 'invoice_overdue',
            title: 'Overdue Invoice',
            message: `Invoice #${invoice.id} is ${daysOverdue} days overdue - £${invoice.total}`,
            severity: daysOverdue > 30 ? 'critical' : 'high',
            timestamp: invoice.dueDate,
            metadata: {
              invoiceId: invoice.id,
              amount: invoice.total,
              daysOverdue,
              customerName: `${invoice.contract.owner.firstName} ${invoice.contract.owner.lastName}`,
              customerEmail: invoice.contract.owner.email,
              berthNumber: invoice.contract.berth.berthNumber,
              marinaName: invoice.contract.berth.marina.name,
            }
          });
        });

        // Get pending work orders
        const pendingWorkOrders = await prisma.workOrder.findMany({
          where: { status: 'pending' },
          select: {
            id: true,
            title: true,
            priority: true,
            requestedDate: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            marina: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          },
          take: 10 // Limit to 10 most recent
        });

        // Add pending work order notifications
        pendingWorkOrders.forEach((workOrder: any) => {
          const daysPending = Math.ceil((new Date().getTime() - new Date(workOrder.requestedDate).getTime()) / (1000 * 60 * 60 * 24));
          
          systemNotifications.push({
            id: `workorder_${workOrder.id}`,
            type: 'work_order_pending',
            title: 'Pending Work Order',
            message: `Work order "${workOrder.title}" has been pending for ${daysPending} days`,
            severity: workOrder.priority === 'urgent' ? 'critical' : workOrder.priority === 'high' ? 'high' : 'medium',
            timestamp: workOrder.requestedDate,
            metadata: {
              workOrderId: workOrder.id,
              title: workOrder.title,
              priority: workOrder.priority,
              daysPending,
              customerName: `${workOrder.owner.firstName} ${workOrder.owner.lastName}`,
              customerEmail: workOrder.owner.email,
              marinaName: workOrder.marina.name,
            }
          });
        });
      }
    } catch (dbError) {
      console.error('Error fetching notifications from database:', dbError);
      
      // Add fallback notifications if database fails
      systemNotifications.push({
        id: 'system_error',
        type: 'system_error',
        title: 'System Error',
        message: 'Unable to fetch system notifications',
        severity: 'high',
        timestamp: new Date().toISOString(),
        metadata: {
          error: 'Database connection failed'
        }
      });
    }

    // Add some demo notifications
    systemNotifications.push(
      {
        id: 'demo_1',
        type: 'system_maintenance',
        title: 'System Maintenance',
        message: 'Scheduled maintenance window tonight at 2:00 AM',
        severity: 'medium',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        metadata: {
          maintenanceWindow: '2024-01-15T02:00:00Z',
          duration: '2 hours'
        }
      },
      {
        id: 'demo_2',
        type: 'new_feature',
        title: 'New Feature Available',
        message: 'Advanced reporting dashboard is now available',
        severity: 'low',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        metadata: {
          feature: 'advanced_reporting',
          version: '2.1.0'
        }
      }
    );

    // Sort notifications by timestamp (newest first)
    systemNotifications.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      data: systemNotifications,
      count: systemNotifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
