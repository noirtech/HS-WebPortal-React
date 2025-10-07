import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }

  try {
    const { id } = params;
    const mockUser = getDemoUser();

    const marina = await prismaClient.marina.findUnique({
      where: { id },
      include: {
        marinaGroup: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        berths: {
          select: {
            id: true,
            berthNumber: true,
            length: true,
            beam: true,
            isAvailable: true,
            isActive: true,
            contracts: {
              select: { id: true, startDate: true, endDate: true }
            }
          },
          orderBy: { berthNumber: 'asc' }
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roles: true,
            isActive: true,
            lastLoginAt: true,
          },
          orderBy: { firstName: 'asc' }
        },
        boats: {
          select: {
            id: true,
            name: true,
            registration: true,
            isActive: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        owners: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
          ]
        },
        contracts: {
          where: { status: { in: ['active', 'pending'] } },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            monthlyRate: true,
            berth: {
              select: {
                id: true,
                berthNumber: true,
              }
            },
            boat: {
              select: {
                id: true,
                name: true,
                registration: true,
              }
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          where: { status: { in: ['pending', 'overdue'] } },
          select: {
            id: true,
            status: true,
            total: true,
            dueDate: true,
            contract: {
              select: {
                id: true,
                berth: {
                  select: {
                    berthNumber: true,
                  }
                }
              }
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          where: { 
            status: 'completed',
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          },
          select: {
            id: true,
            amount: true,
            status: true,
            gateway: true,
            createdAt: true,
            invoice: {
              select: {
                id: true,
                total: true,
                dueDate: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        workOrders: {
          where: { status: { in: ['pending', 'in_progress'] } },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            requestedDate: true,
            completedDate: true,
            totalCost: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            boat: {
              select: {
                id: true,
                name: true,
                registration: true,
              }
            },
            berth: {
              select: {
                id: true,
                berthNumber: true,
              }
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          where: { status: { in: ['confirmed', 'active'] } },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalAmount: true,
            berth: {
              select: {
                id: true,
                berthNumber: true,
              }
            },
            boat: {
              select: {
                id: true,
                name: true,
                registration: true,
              }
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!marina) {
      return NextResponse.json({ error: 'Marina not found' }, { status: 404 });
    }

    // Calculate additional metrics
    const marinaWithCalculations = {
      ...marina,
      // Berth utilization
      availableBerths: marina.berths.filter((b: any) => b.isAvailable).length,
      occupiedBerths: marina.berths.filter((b: any) => !b.isAvailable).length,
      totalBerths: marina.berths.length,
      berthUtilizationRate: marina.berths.length > 0 ? 
        (marina.berths.filter((b: any) => !b.isAvailable).length / marina.berths.length) * 100 : 0,
      
      // User metrics
      totalUsers: marina.users.length,
      activeUsers: marina.users.filter((u: any) => u.isActive).length,
      staffCount: marina.users.filter((u: any) => u.roles.some((r: any) => r.role === 'staff')).length,
      adminCount: marina.users.filter((u: any) => u.roles.some((r: any) => r.role === 'admin')).length,
      
      // Boat metrics
      totalBoats: marina.boats.length,
      activeBoats: marina.boats.filter((b: any) => b.isActive).length,
      
      // Customer metrics
      totalCustomers: marina.owners.length,
      activeCustomers: marina.owners.filter((o: any) => o.isActive).length,
      
      // Contract metrics
      totalContracts: marina.contracts.length,
      activeContracts: marina.contracts.filter((c: any) => c.status === 'active').length,
      pendingContracts: marina.contracts.filter((c: any) => c.status === 'pending').length,
      
      // Invoice metrics
      totalInvoices: marina.invoices.length,
      outstandingInvoices: marina.invoices.filter((i: any) => i.status === 'pending' || i.status === 'overdue').length,
      totalOutstandingAmount: marina.invoices
        .filter((i: any) => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum: any, invoice: any) => sum + invoice.total, 0),
      
      // Payment metrics
      totalPayments: marina.payments.length,
      totalPaymentAmount: marina.payments.reduce((sum: any, payment: any) => sum + payment.amount, 0),
      
      // Work order metrics
      totalWorkOrders: marina.workOrders.length,
      pendingWorkOrders: marina.workOrders.filter((w: any) => w.status === 'pending').length,
      inProgressWorkOrders: marina.workOrders.filter((w: any) => w.status === 'in_progress').length,
      
      // Booking metrics
      totalBookings: marina.bookings.length,
      activeBookings: marina.bookings.filter((b: any) => b.status === 'active').length,
      confirmedBookings: marina.bookings.filter((b: any) => b.status === 'confirmed').length,
      
      // Health and status
      healthScore: 85,
      isFullyOperational: marina.isActive && marina.isOnline,
      needsAttention: !marina.isActive || !marina.isOnline || 
                     marina.workOrders.length > 0 || marina.invoices.length > 0,
      
      // Financial summary
      monthlyRevenue: marina.contracts
        .filter((c: any) => c.status === 'active')
        .reduce((sum: any, contract: any) => sum + (contract.monthlyRate || 0), 0),
      outstandingBalance: marina.invoices
        .filter((i: any) => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum: any, invoice: any) => sum + invoice.total, 0),
    };

    return NextResponse.json({
      data: marinaWithCalculations
    });

  } catch (error) {
    console.error('Error fetching marina:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

