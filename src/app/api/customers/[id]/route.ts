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

    const customer = await prismaClient.owner.findUnique({
      where: { id },
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
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate additional metrics
    const customerWithCalculations = {
      ...customer,
      fullName: `${customer.firstName} ${customer.lastName}`,
      activeContractsCount: customer.contracts.filter((c: any) => c.status === 'active').length,
      pendingContractsCount: customer.contracts.filter((c: any) => c.status === 'pending').length,
      totalContractsCount: customer.contracts.length,
      outstandingInvoicesCount: customer.invoices.filter((i: any) => i.status === 'pending' || i.status === 'overdue').length,
      overdueInvoicesCount: customer.invoices.filter((i: any) => i.status === 'overdue').length,
      totalInvoicesCount: customer.invoices.length,
      totalPaymentsCount: customer.payments.length,
      pendingWorkOrdersCount: customer.workOrders.filter((w: any) => w.status === 'pending').length,
      inProgressWorkOrdersCount: customer.workOrders.filter((w: any) => w.status === 'in_progress').length,
      totalWorkOrdersCount: customer.workOrders.length,
      activeBookingsCount: customer.bookings.filter((b: any) => b.status === 'active').length,
      confirmedBookingsCount: customer.bookings.filter((b: any) => b.status === 'confirmed').length,
      totalBookingsCount: customer.bookings.length,
      activeBoatsCount: customer.boats.filter((b: any) => b.isActive).length,
      totalBoatsCount: customer.boats.length,
      
      // Financial metrics
      totalOutstandingAmount: customer.invoices
        .filter((i: any) => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum: number, invoice: any) => sum + invoice.total, 0),
      totalPaidAmount: customer.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0),
      totalMonthlyObligations: customer.contracts
        .filter((c: any) => c.status === 'active')
        .reduce((sum: number, contract: any) => sum + (contract.monthlyRate || 0), 0),
      
      // Status indicators
      hasOutstandingInvoices: customer.invoices.some((i: any) => i.status === 'pending' || i.status === 'overdue'),
      hasOverdueInvoices: customer.invoices.some((i: any) => i.status === 'overdue'),
      hasPendingWorkOrders: customer.workOrders.some((w: any) => w.status === 'pending'),
      isActiveCustomer: customer.isActive && customer.contracts.some((c: any) => c.status === 'active'),
      
      // Summary
      totalMonthlyRevenue: customer.contracts
        .filter((c: any) => c.status === 'active')
        .reduce((sum: number, contract: any) => sum + (contract.monthlyRate || 0), 0),
      averageMonthlyRate: customer.contracts.length > 0 ? 
        customer.contracts.reduce((sum: number, contract: any) => sum + (contract.monthlyRate || 0), 0) / customer.contracts.length : 0,
    };

    return NextResponse.json({
      data: customerWithCalculations
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
