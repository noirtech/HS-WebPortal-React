import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';
import { mockWorkOrders } from '@/lib/data-source';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 WORK ORDERS API: Using mock data for demo mode');
    
    console.log('✅ WORK ORDERS API: Successfully returned mock work orders', { count: mockWorkOrders.length });
    return NextResponse.json({
      data: mockWorkOrders
    });
  }

  try {
    // Get marina ID from session for filtering
    const session = await getServerSession(authOptions)
    const marinaId = session?.user ? (session.user as any).marinaId : 'marina-1'

    const workOrders = await prismaClient.$queryRawUnsafe(`
      SELECT TOP 50
        wo.id,
        wo.externalId,
        wo.title,
        wo.description,
        wo.status,
        wo.priority,
        wo.requestedDate,
        wo.completedDate,
        wo.totalCost,
        wo.createdAt,
        wo.updatedAt,
        wo.marinaId,
        wo.ownerId,
        wo.boatId,
        m.name as marinaName,
        m.code as marinaCode,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        b.name as boatName,
        b.registration as boatRegistration
      FROM work_orders wo
      LEFT JOIN marinas m ON wo.marinaId = m.id
      LEFT JOIN owners c ON wo.ownerId = c.id
      LEFT JOIN boats b ON wo.boatId = b.id
      WHERE wo.marinaId = ${marinaId}
      ORDER BY wo.createdAt DESC
    `);

    const transformedWorkOrders = workOrders.map((wo: any) => ({
      id: wo.id,
      externalId: wo.externalId,
      title: wo.title,
      description: wo.description,
      status: wo.status,
      priority: wo.priority,
      requestedDate: wo.requestedDate,
      completedDate: wo.completedDate,
      totalCost: wo.totalCost,
      createdAt: wo.createdAt,
      updatedAt: wo.updatedAt,
      marinaId: wo.marinaId,
      ownerId: wo.ownerId,
      boatId: wo.boatId,
      marina: {
        id: wo.marinaId,
        name: wo.marinaName,
        code: wo.marinaCode,
      },
      owner: {
        id: wo.ownerId,
        firstName: wo.ownerFirstName,
        lastName: wo.ownerLastName,
        email: wo.ownerEmail,
      },
      boat: wo.boatId ? {
        id: wo.boatId,
        name: wo.boatName,
        registration: wo.boatRegistration,
      } : null,
    }));

    return NextResponse.json({
      data: transformedWorkOrders
    });

  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

