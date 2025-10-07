import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to get Prisma client directly without demo mode check
    let prismaClient;
    try {
      const { prisma: prismaClientImport } = await import('@/lib/db');
      prismaClient = prismaClientImport;
    } catch (error) {
      console.log('🔍 MARINAS API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // If we can't get Prisma client, use mock data
    if (!prismaClient) {
      console.log('🔍 MARINAS API: Using mock data - no database connection');
      
      // Generate mock marinas data with 3 marinas
      const mockMarinas = [
        {
          id: 'marina-1',
          name: 'Portsmouth Marina',
          code: 'PM',
          description: 'Premier marina in Portsmouth Harbour',
          isActive: true,
          isOnline: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activeBerths: 50,
          totalBerths: 50,
          totalBoats: 40,
          totalCustomers: 35,
          totalUsers: 5,
          activeContracts: 35,
          activeBookings: 5,
          pendingWorkOrders: 3,
          outstandingInvoices: 8,
          recentPayments: 12,
          healthScore: 85,
          isFullyOperational: true,
          needsAttention: false,
          totalMonthlyRevenue: 35000,
          averageBerthUtilization: 70,
          marinaGroup: {
            id: 'group-1',
            name: 'South Coast Group',
            description: 'Marinas along the South Coast of England'
          },
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
          description: 'Historic marina in Southampton Water',
          isActive: true,
          isOnline: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activeBerths: 60,
          totalBerths: 60,
          totalBoats: 50,
          totalCustomers: 40,
          totalUsers: 6,
          activeContracts: 40,
          activeBookings: 4,
          pendingWorkOrders: 3,
          outstandingInvoices: 5,
          recentPayments: 8,
          healthScore: 75,
          isFullyOperational: false,
          needsAttention: true,
          totalMonthlyRevenue: 40000,
          averageBerthUtilization: 67,
          marinaGroup: {
            id: 'group-1',
            name: 'South Coast Group',
            description: 'Marinas along the South Coast of England'
          },
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
          description: 'Modern marina on the Sussex coast',
          isActive: true,
          isOnline: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activeBerths: 45,
          totalBerths: 45,
          totalBoats: 38,
          totalCustomers: 32,
          totalUsers: 4,
          activeContracts: 30,
          activeBookings: 6,
          pendingWorkOrders: 2,
          outstandingInvoices: 6,
          recentPayments: 10,
          healthScore: 90,
          isFullyOperational: true,
          needsAttention: false,
          totalMonthlyRevenue: 32000,
          averageBerthUtilization: 75,
          marinaGroup: {
            id: 'group-1',
            name: 'South Coast Group',
            description: 'Marinas along the South Coast of England'
          },
          _count: {
            berths: 45,
            boats: 38,
            owners: 32,
            users: 4,
            contracts: 30,
            bookings: 6,
            workOrders: 2,
            invoices: 6,
            payments: 10
          }
        }
      ];
      
      console.log('✅ MARINAS API: Successfully returned mock marinas', { count: mockMarinas.length });
      return NextResponse.json({
        data: mockMarinas
      });
    }
    
    try {
      console.log('🔍 MARINAS API: GET request received')
      
      const marinas = await prismaClient.marina.findMany({
        include: {
          marinaGroup: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          },
          _count: {
            select: {
              berths: true,
              boats: true,
              customers: true,
              users: true,
              contracts: true,
              bookings: true,
              workOrders: true,
              invoices: true,
              payments: true,
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      const marinasWithCalculations = marinas.map((marina: any) => ({
        ...marina,
        activeBerths: marina._count.berths,
        totalBerths: marina._count.berths,
        totalBoats: marina._count.boats,
        totalCustomers: marina._count.owners,
        totalUsers: marina._count.users,
        activeContracts: marina._count.contracts,
        activeBookings: marina._count.bookings,
        pendingWorkOrders: marina._count.workOrders,
        outstandingInvoices: marina._count.invoices,
        recentPayments: marina._count.payments,
        
        // Health and status
        healthScore: 85,
        isFullyOperational: marina.isActive && marina.isOnline,
        needsAttention: !marina.isActive || !marina.isOnline,
        
        // Summary
        totalMonthlyRevenue: marina._count.contracts * 1000, // Estimated
        averageBerthUtilization: marina._count.berths > 0 ? 
          (marina._count.contracts / marina._count.berths) * 100 : 0,
      }));

      console.log('✅ MARINAS API: Successfully fetched marinas from database', { count: marinasWithCalculations.length });
      return NextResponse.json({
        data: marinasWithCalculations
      });

    } catch (error) {
      console.error('❌ MARINAS API: Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ MARINAS API: Outer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

