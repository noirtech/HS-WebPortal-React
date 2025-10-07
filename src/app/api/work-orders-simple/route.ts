import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }

  try {
    const mockUser = getDemoUser();

    const workOrders = await prismaClient.workOrder.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      data: workOrders
    });

  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
