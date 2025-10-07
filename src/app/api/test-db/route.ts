import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    // Test basic database connectivity
    const marinaCount = await prismaClient.marina.count();
    const customerCount = await prismaClient.owner.count();
    const workOrderCount = await prismaClient.workOrder.count();
    
    // Test a simple work order query
    const workOrders = await prismaClient.workOrder.findMany({
      take: 1,
      select: {
        id: true,
        externalId: true,
        title: true,
        status: true,
        priority: true,
        requestedDate: true,
        completedDate: true,
        totalCost: true,
        marinaId: true,
        ownerId: true, // This should now work
        boatId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        marinas: marinaCount,
        customers: customerCount,
        workOrders: workOrderCount
      },
      sampleWorkOrder: workOrders[0] || null,
      schema: {
        workOrderFields: [
          'id', 'externalId', 'title', 'status', 'priority', 
          'requestedDate', 'completedDate', 'totalCost', 
          'marinaId', 'ownerId', 'boatId', 'createdAt', 'updatedAt'
        ]
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name || 'Unknown'
    }, { status: 500 });
  }
}
