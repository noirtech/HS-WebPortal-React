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

    const berth = await prismaClient.berth.findUnique({
      where: { id },
      include: {
        marina: {
          select: {
            id: true,
            name: true,
            code: true,
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
            }
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
            }
          }
        }
      }
    });

    if (!berth) {
      return NextResponse.json({ error: 'Berth not found' }, { status: 404 });
    }

    // Calculate additional metrics
    const berthWithCalculations = {
      ...berth,
      activeContractsCount: berth.contracts.filter((c: any) => c.status === 'active').length,
      pendingContractsCount: berth.contracts.filter((c: any) => c.status === 'pending').length,
      totalContractsCount: berth.contracts.length,
      activeBookingsCount: berth.bookings.filter((b: any) => b.status === 'active').length,
      confirmedBookingsCount: berth.bookings.filter((b: any) => b.status === 'confirmed').length,
      totalBookingsCount: berth.bookings.length,
      pendingWorkOrdersCount: berth.workOrders.filter((w: any) => w.status === 'pending').length,
      inProgressWorkOrdersCount: berth.workOrders.filter((w: any) => w.status === 'in_progress').length,
      totalWorkOrdersCount: berth.workOrders.length,
      isOccupied: berth.contracts.some((c: any) => c.status === 'active') || 
                  berth.bookings.some((b: any) => b.status === 'active'),
      hasActiveContract: berth.contracts.some((c: any) => c.status === 'active'),
      hasActiveBooking: berth.bookings.some((b: any) => b.status === 'active'),
      hasPendingWorkOrders: berth.workOrders.some((w: any) => w.status === 'pending'),
      monthlyRevenue: berth.contracts
        .filter((c: any) => c.status === 'active')
        .reduce((sum: number, contract: any) => sum + (contract.monthlyRate || 0), 0),
      utilizationRate: berth.isAvailable ? 0 : 100,
      healthScore: 85,
      needsAttention: !berth.isAvailable || berth.workOrders.length > 0,
    };

    return NextResponse.json({
      data: berthWithCalculations
    });

  } catch (error) {
    console.error('Error fetching berth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

