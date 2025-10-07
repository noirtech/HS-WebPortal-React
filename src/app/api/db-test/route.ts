import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    const results: any = {
      success: true,
      message: 'Database test completed',
      timestamp: new Date().toISOString(),
      steps: []
    };

    // Step 1: Test basic connection
    try {
      await prismaClient.$connect();
      results.steps.push({ step: 'connection', status: 'success', message: 'Database connection successful' });
    } catch (error) {
      results.steps.push({ step: 'connection', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }

    // Step 2: Test table counts
    try {
      const marinaCount = await prismaClient.marina.count();
      results.steps.push({ step: 'marina_count', status: 'success', count: marinaCount });
    } catch (error) {
      results.steps.push({ step: 'marina_count', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
    }

    try {
      const customerCount = await prismaClient.owner.count();
      results.steps.push({ step: 'customer_count', status: 'success', count: customerCount });
    } catch (error) {
      results.steps.push({ step: 'customer_count', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
    }

    try {
      const workOrderCount = await prismaClient.workOrder.count();
      results.steps.push({ step: 'work_order_count', status: 'success', count: workOrderCount });
    } catch (error) {
      results.steps.push({ step: 'work_order_count', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Step 3: Test schema structure
    try {
      const workOrderSample = await prismaClient.workOrder.findMany({
        // Remove take for older SQL Server compatibility
        // take: 1,
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
          ownerId: true, // This should now work with updated schema
          boatId: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (workOrderSample.length > 0) {
        results.steps.push({ 
          step: 'work_order_schema', 
          status: 'success', 
          message: 'Work order schema query successful',
          sample: workOrderSample[0]
        });
      } else {
        results.steps.push({ 
          step: 'work_order_schema', 
          status: 'warning', 
          message: 'No work orders found to test schema'
        });
      }
    } catch (error) {
      results.steps.push({ 
        step: 'work_order_schema', 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      });
    }

    // Step 4: Test relationships
    try {
      const workOrderWithRelations = await prismaClient.workOrder.findMany({
        // Remove take for older SQL Server compatibility
        // take: 1,
        include: {
          marina: {
            select: {
              id: true,
              name: true,
              isOnline: true,
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
          boat: {
            select: {
              id: true,
              name: true,
              registration: true,
            }
          },
        }
      });
      
      if (workOrderWithRelations.length > 0) {
        results.steps.push({ 
          step: 'work_order_relations', 
          status: 'success', 
          message: 'Work order relationships query successful',
          hasMarina: !!workOrderWithRelations[0].marina,
          hasOwner: !!workOrderWithRelations[0].owner,
          hasBoat: !!workOrderWithRelations[0].boat
        });
      } else {
        results.steps.push({ 
          step: 'work_order_relations', 
          status: 'warning', 
          message: 'No work orders found to test relationships'
        });
      }
    } catch (error) {
      results.steps.push({ 
        step: 'work_order_relations', 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      });
    }

    // Disconnect
    await prismaClient.$disconnect();
    results.steps.push({ step: 'disconnect', status: 'success', message: 'Database disconnected' });

    return NextResponse.json(results);

  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
