import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser, isDemoMode } from '@/lib/prisma-client';
import { mockWorkOrders } from '@/lib/data-source';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  
  // Handle demo mode
  if (!prismaClient || isDemoMode()) {
    const { id } = params;
    
    // Find the mock work order
    const mockWorkOrder = mockWorkOrders.find(wo => wo.id === id);
    
    if (!mockWorkOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    
    // Transform mock data to match the expected format
    const transformedWorkOrder = {
      ...mockWorkOrder,
      title: mockWorkOrder.description,
      requestedDate: mockWorkOrder.startDate,
      completedDate: mockWorkOrder.completionDate,
      totalCost: mockWorkOrder.estimatedCost,
      marina: {
        id: 'marina-1',
        name: 'Harbor View Marina',
        code: 'HVM'
      },
      owner: {
        id: `owner-${mockWorkOrder.id}`,
        firstName: mockWorkOrder.customerName.split(' ')[0],
        lastName: mockWorkOrder.customerName.split(' ')[1] || 'Doe',
        email: `${mockWorkOrder.customerName.toLowerCase().replace(' ', '.')}@example.com`
      },
      boat: {
        id: `boat-${mockWorkOrder.id}`,
        name: mockWorkOrder.boatName,
        registration: `GB${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`
      },
      berth: {
        id: `berth-${mockWorkOrder.id}`,
        berthNumber: `A${Math.floor(Math.random() * 20) + 1}`
      }
    };
    
    return NextResponse.json({
      data: transformedWorkOrder
    });
  }

  try {
    const { id } = params;
    const mockUser = getDemoUser();

    const workOrder = await prismaClient.workOrder.findUnique({
      where: { id },
      include: {
        marina: {
          select: {
            id: true,
            name: true,
            code: true,
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
        berth: {
          select: {
            id: true,
            berthNumber: true,
          }
        }
      }
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: workOrder
    });

  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const mockUser = getDemoUser();

    const existingWorkOrder = await prismaClient.workOrder.findUnique({
      where: { id }
    });

    if (!existingWorkOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const updatedWorkOrder = await prismaClient.workOrder.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        requestedDate: body.requestedDate ? new Date(body.requestedDate) : undefined,
        completedDate: body.completedDate ? new Date(body.completedDate) : undefined,
        totalCost: body.totalCost,
        updatedAt: new Date(),
      },
      include: {
        marina: {
          select: {
            id: true,
            name: true,
            code: true,
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
        berth: {
          select: {
            id: true,
            berthNumber: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Work order updated successfully',
      data: updatedWorkOrder
    });

  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const workOrder = await prismaClient.workOrder.findUnique({
      where: { id }
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    await prismaClient.workOrder.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Work order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

