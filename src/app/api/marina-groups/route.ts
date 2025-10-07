import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 MARINA GROUPS API: Using mock data for demo mode');
    
    // Generate mock marina groups data
    const mockMarinaGroups = [
      {
        id: 'group-1',
        name: 'South Coast Group',
        description: 'Marinas along the South Coast of England',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalMarinas: 3,
        activeMarinas: 3,
        onlineMarinas: 2,
        maintenanceMarinas: 0,
        totalBerths: 150,
        totalBoats: 120,
        totalCustomers: 95,
        totalUsers: 15,
        activeContracts: 85,
        activeBookings: 12,
        pendingWorkOrders: 8,
        outstandingInvoices: 15,
        recentPayments: 25,
        healthScore: 85,
        isFullyOperational: false,
        needsAttention: true,
        totalMonthlyRevenue: 85000,
        averageMarinaSize: 50,
        marinas: [
          {
            id: 'marina-1',
            name: 'Portsmouth Marina',
            code: 'PM',
            isActive: true,
            isOnline: true,
            _count: {
              berths: 50,
              boats: 40,
              owners: 35,
              users: 5,
              contracts: 35,
              bookings: 5,
              workOrders: 3,
              invoices: 8,
              payments: 12
            }
          },
          {
            id: 'marina-2',
            name: 'Southampton Marina',
            code: 'SM',
            isActive: true,
            isOnline: false,
            _count: {
              berths: 60,
              boats: 50,
              owners: 40,
              users: 6,
              contracts: 40,
              bookings: 4,
              workOrders: 3,
              invoices: 5,
              payments: 8
            }
          },
          {
            id: 'marina-3',
            name: 'Brighton Marina',
            code: 'BM',
            isActive: true,
            isOnline: true,
            _count: {
              berths: 40,
              boats: 30,
              owners: 20,
              users: 4,
              contracts: 10,
              bookings: 3,
              workOrders: 2,
              invoices: 2,
              payments: 5
            }
          }
        ]
      }
    ];
    
    console.log('✅ MARINA GROUPS API: Successfully returned mock marina groups', { count: mockMarinaGroups.length });
    return NextResponse.json({
      data: mockMarinaGroups
    });
  }

  try {
    const mockUser = getDemoUser();

    const marinaGroups = await prismaClient.marinaGroup.findMany({
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
      },
      orderBy: { name: 'asc' }
    });

    const marinaGroupsWithCalculations = marinaGroups.map((group: any) => ({
      ...group,
      totalMarinas: group._count.marinas,
      activeMarinas: group.marinas.filter((m: any) => m.isActive).length,
      onlineMarinas: group.marinas.filter((m: any) => m.isOnline).length,
      maintenanceMarinas: 0,
      
      // Aggregated metrics
      totalBerths: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.berths, 0),
      totalBoats: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.boats, 0),
      totalCustomers: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.owners, 0),
      totalUsers: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.users, 0),
      activeContracts: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.contracts, 0),
      activeBookings: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.bookings, 0),
      pendingWorkOrders: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.workOrders, 0),
      outstandingInvoices: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.invoices, 0),
      recentPayments: group.marinas.reduce((sum: number, marina: any) => sum + marina._count.payments, 0),
      
      // Health and status
      healthScore: 85,
      isFullyOperational: group.marinas.every((m: any) => m.isActive && m.isOnline),
      needsAttention: group.marinas.some((m: any) => !m.isActive || !m.isOnline),
      
      // Summary
      totalMonthlyRevenue: group.marinas.reduce((sum: number, marina: any) => sum + (marina._count.contracts * 1000), 0), // Estimated
      averageMarinaSize: group.marinas.length > 0 ? 
        group.marinas.reduce((sum: number, marina: any) => sum + marina._count.berths, 0) / group.marinas.length : 0,
    }));

    return NextResponse.json({
      data: marinaGroupsWithCalculations
    });

  } catch (error) {
    console.error('Error fetching marina groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

