import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 PENDING OPERATIONS API: Using mock data for demo mode');
    
    // Generate mock pending operations data
    const mockPendingOperations = [
      {
        id: '1',
        operationType: 'contract_renewal',
        status: 'pending',
        data: {
          contractId: 'contract-1',
          renewalDate: '2024-02-01',
          newTerms: 'Extended for 12 months'
        },
        marinaId: 'marina-1',
        userId: 'demo-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        marina: {
          id: 'marina-1',
          name: 'Portsmouth Marina',
          code: 'PM'
        },
        user: {
          id: 'demo-user-id',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@marina.com'
        }
      },
      {
        id: '2',
        operationType: 'berth_maintenance',
        status: 'pending',
        data: {
          berthId: 'berth-5',
          maintenanceType: 'repair',
          estimatedDuration: '3 days'
        },
        marinaId: 'marina-1',
        userId: 'demo-user-id',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        marina: {
          id: 'marina-1',
          name: 'Portsmouth Marina',
          code: 'PM'
        },
        user: {
          id: 'demo-user-id',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@marina.com'
        }
      }
    ];
    
    console.log('✅ PENDING OPERATIONS API: Successfully returned mock pending operations', { count: mockPendingOperations.length });
    return NextResponse.json({
      data: mockPendingOperations
    });
  }

  try {
    const mockUser = getDemoUser();

    const pendingOperations = await prismaClient.pendingOperation.findMany({
      include: {
        marina: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      data: pendingOperations
    });

  } catch (error) {
    console.error('Error fetching pending operations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, return mock response
  if (!prismaClient) {
    console.log('🔍 PENDING OPERATIONS API: Using mock data for demo mode (POST)');
    
    const body = await request.json();
    
    // Create mock pending operation response
    const mockPendingOperation = {
      id: `pending-${Date.now()}`,
      operationType: body.operationType,
      status: 'pending',
      data: body.data,
      marinaId: body.marinaId,
      userId: 'demo-user-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('✅ PENDING OPERATIONS API: Successfully created mock pending operation', { id: mockPendingOperation.id });
    return NextResponse.json({
      message: 'Pending operation created successfully',
      data: mockPendingOperation
    }, { status: 201 });
  }

  try {
    const body = await request.json();
    const mockUser = getDemoUser();

    const pendingOperation = await prismaClient.pendingOperation.create({
      data: {
        operationType: body.operationType,
        status: 'pending',
        data: body.data,
        marinaId: body.marinaId,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Pending operation created successfully',
      data: pendingOperation
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating pending operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

