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

    const pendingOperation = await prismaClient.pendingOperation.findUnique({
      where: { id },
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
      }
    });

    if (!pendingOperation) {
      return NextResponse.json({ error: 'Pending operation not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: pendingOperation
    });

  } catch (error) {
    console.error('Error fetching pending operation:', error);
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

    const currentOperation = await prismaClient.pendingOperation.findUnique({
      where: { id }
    });

    if (!currentOperation) {
      return NextResponse.json({ error: 'Pending operation not found' }, { status: 404 });
    }

    const updatedOperation = await prismaClient.pendingOperation.update({
      where: { id },
      data: {
        status: body.status,
        errorMessage: body.errorMessage,
        priority: body.priority,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Operation updated successfully',
      data: updatedOperation
    });

  } catch (error) {
    console.error('Error updating pending operation:', error);
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

    const currentOperation = await prismaClient.pendingOperation.findUnique({
      where: { id }
    });

    if (!currentOperation) {
      return NextResponse.json({ error: 'Pending operation not found' }, { status: 404 });
    }

    await prismaClient.pendingOperation.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Operation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pending operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

