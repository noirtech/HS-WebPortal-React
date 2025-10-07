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

    const marinaGroup = await prismaClient.marinaGroup.findUnique({
      where: { id },
      include: {
        marinas: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
            isOnline: true,
            _count: {
              select: {
                berths: true,
                boats: true,
                owners: true,
                users: true,
                contracts: true,
                bookings: true,
                workOrders: true,
                invoices: true,
                payments: true,
              }
            }
          }
        },
        _count: {
          select: {
            marinas: true,
          }
        }
      }
    });

    if (!marinaGroup) {
      return NextResponse.json({ error: 'Marina group not found' }, { status: 404 });
    }

    // Calculate additional metrics
    const marinaGroupWithCalculations = {
      ...marinaGroup,
      // Marina metrics
      activeMarinas: marinaGroup.marinas.filter((m: any) => m.isActive).length,
      onlineMarinas: marinaGroup.marinas.filter((m: any) => m.isOnline).length,
      maintenanceMarinas: 0,
      totalMarinas: marinaGroup._count.marinas,
      
      // Aggregated metrics
      totalBerths: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.berths, 0),
      totalBoats: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.boats, 0),
      totalCustomers: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.owners, 0),
      totalUsers: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.users, 0),
      activeContracts: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.contracts, 0),
      activeBookings: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.bookings, 0),
      pendingWorkOrders: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.workOrders, 0),
      outstandingInvoices: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.invoices, 0),
      recentPayments: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.payments, 0),
      
      // Health and status
      healthScore: 85,
      isFullyOperational: marinaGroup.marinas.every((m: any) => m.isActive && m.isOnline),
      needsAttention: marinaGroup.marinas.some((m: any) => !m.isActive || !m.isOnline),
      
      // Summary
      totalMonthlyRevenue: marinaGroup.marinas.reduce((sum: number, marina: any) => sum + (marina._count.contracts * 1000), 0), // Estimated
      averageMarinaSize: marinaGroup.marinas.length > 0 ? 
        marinaGroup.marinas.reduce((sum: number, marina: any) => sum + marina._count.berths, 0) / marinaGroup.marinas.length : 0,
    };

    return NextResponse.json({
      data: marinaGroupWithCalculations
    });

  } catch (error) {
    console.error('Error fetching marina group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

