import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 OWNERS API: Using mock data for demo mode');
    
    // Generate mock owners data
    const mockOwners = [
      {
        id: 'owner-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+44 7700 900123',
        address: '123 Harbour View',
        city: 'Portsmouth',
        state: 'Hampshire',
        zipCode: 'PO1 1AA',
        country: 'UK',
        dateJoined: new Date('2023-01-15').toISOString(),
        status: 'ACTIVE',
        totalBoats: 1,
        activeContracts: 1,
        totalSpent: 5000.00,
        lastActivity: new Date().toISOString(),
        createdAt: new Date('2023-01-15').toISOString(),
        updatedAt: new Date().toISOString(),
        boats: [
          {
            id: 'boat-1',
            name: 'Sea Spirit',
            registration: 'SS123',
            isActive: true,
            marina: {
              id: 'marina-1',
              name: 'Portsmouth Marina',
              code: 'PM'
            },
            berth: {
              id: 'berth-1',
              berthNumber: 'A-12'
            },
            contracts: [
              {
                id: 'contract-1',
                status: 'active',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                monthlyRate: 500.00
              }
            ],
            _count: {
              contracts: 1,
              bookings: 0,
              workOrders: 2
            }
          }
        ],
        contracts: [
          {
            id: 'contract-1',
            status: 'active',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            monthlyRate: 500.00,
            berth: {
              id: 'berth-1',
              berthNumber: 'A-12',
              marina: {
                id: 'marina-1',
                name: 'Portsmouth Marina',
                code: 'PM'
              }
            },
            boat: {
              id: 'boat-1',
              name: 'Sea Spirit',
              registration: 'SS123'
            }
          }
        ],
        invoices: [
          {
            id: 'invoice-1',
            status: 'pending',
            total: 1250.00,
            dueDate: '2024-02-15',
            contract: {
              id: 'contract-1',
              berth: {
                berthNumber: 'A-12',
                marina: {
                  name: 'Portsmouth Marina',
                  code: 'PM'
                }
              }
            }
          }
        ]
      }
    ];
    
    console.log('✅ OWNERS API: Successfully returned mock owners', { count: mockOwners.length });
    return NextResponse.json({
      data: mockOwners
    });
  }

  try {
    const mockUser = getDemoUser();

    const owners = await prismaClient.owner.findMany({
      include: {
        boats: {
          select: {
            id: true,
            name: true,
            registration: true,
            isActive: true,
            marina: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            },
            berth: {
              select: {
                id: true,
                berthNumber: true,
              }
            },
            contracts: {
              where: { status: { in: ['active', 'pending'] } },
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                monthlyRate: true,
              }
            },
            _count: {
              select: {
                contracts: true,
                bookings: true,
                workOrders: true,
              }
            }
          }
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
                marina: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  }
                }
              }
            },
            boat: {
              select: {
                id: true,
                name: true,
                registration: true,
              }
            }
          }
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
                    marina: {
                      select: {
                        name: true,
                        code: true,
                      }
                    }
                  }
                }
              }
            }
          }
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
          }
        },
        workOrders: {
          where: { status: { in: ['pending', 'in_progress'] } },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            totalCost: true,
            requestedDate: true,
            completedDate: true,
            boat: {
              select: {
                id: true,
                name: true,
                registration: true,
              }
            },
            marina: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
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
                marina: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  }
                }
              }
            },
            boat: {
              select: {
                id: true,
                name: true,
                registration: true,
              }
            }
          }
        },
        _count: {
          select: {
            boats: true,
            contracts: true,
            invoices: true,
            payments: true,
            workOrders: true,
            bookings: true,
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    const ownersWithCalculations = owners.map((owner: any) => ({
      ...owner,
      // Boat metrics
      totalBoats: owner._count.boats,
      activeBoats: owner.boats.filter((b: any) => b.isActive).length,
      
      // Contract metrics
      totalContracts: owner._count.contracts,
      activeContracts: owner.contracts.filter((c: any) => c.status === 'active').length,
      pendingContracts: owner.contracts.filter((c: any) => c.status === 'pending').length,
      
      // Financial metrics
      totalOutstandingAmount: owner.invoices
        .filter((i: any) => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum: number, invoice: any) => sum + invoice.total, 0),
      totalPaidAmount: owner.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0),
      totalMonthlyObligations: owner.contracts
        .filter((c: any) => c.status === 'active')
        .reduce((sum: number, contract: any) => sum + (contract.monthlyRate || 0), 0),
      
      // Work order metrics
      totalWorkOrders: owner._count.workOrders,
      pendingWorkOrders: owner.workOrders.filter((w: any) => w.status === 'pending').length,
      inProgressWorkOrders: owner.workOrders.filter((w: any) => w.status === 'in_progress').length,
      
      // Booking metrics
      totalBookings: owner._count.bookings,
      activeBookings: owner.bookings.filter((b: any) => b.status === 'active').length,
      confirmedBookings: owner.bookings.filter((b: any) => b.status === 'confirmed').length,
      
      // Status indicators
      hasOutstandingInvoices: owner.invoices.some((i: any) => i.status === 'pending' || i.status === 'overdue'),
      hasOverdueInvoices: owner.invoices.some((i: any) => i.status === 'overdue'),
      hasPendingWorkOrders: owner.workOrders.some((w: any) => w.status === 'pending'),
      isActiveCustomer: owner.isActive && owner.contracts.some((c: any) => c.status === 'active'),
      
      // Summary
      fullName: `${owner.firstName} ${owner.lastName}`,
      totalMonthlyRevenue: owner.contracts
        .filter((c: any) => c.status === 'active')
        .reduce((sum: number, contract: any) => sum + (contract.monthlyRate || 0), 0),
      averageMonthlyRate: owner.contracts.length > 0 ? 
        owner.contracts.reduce((sum: number, contract: any) => sum + (contract.monthlyRate || 0), 0) / owner.contracts.length : 0,
    }));

    return NextResponse.json({
      data: ownersWithCalculations
    });

  } catch (error) {
    console.error('Error fetching owners:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
