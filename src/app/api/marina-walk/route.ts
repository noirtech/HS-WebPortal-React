import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';
import { mockBoats, mockBerths } from '@/lib/data-source';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 [Marina Walk API] Using mock data for demo mode');
    
    // Transform mock data to match expected interface
    const mockMarinaWalkData = {
      berths: mockBerths.map((berth: any) => ({
        id: berth.id,
        number: berth.berthNumber,
        name: `Dock ${berth.berthNumber.split('-')[0]}`,
        status: berth.status.toLowerCase(),
        boatId: berth.boatName ? `boat-${berth.berthNumber.split('-')[1]}` : undefined,
        boatName: berth.boatName,
        boatLength: berth.length,
        boatBeam: berth.beam,
        coordinates: { x: parseInt(berth.berthNumber.split('-')[1]) - 1, y: 0 }
      })),
      boats: mockBoats.map((boat: any) => ({
        id: boat.id,
        name: boat.name,
        length: boat.length,
        beam: boat.beam,
        draft: boat.draft,
        owner: `${boat.owner.firstName} ${boat.owner.lastName}`,
        contact: boat.owner.email,
        lastInspection: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextInspection: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenanceStatus: 'good' as const,
        berthId: `berth-${boat.id.split('-')[1]}`
      })),
      marina: {
        name: 'Portsmouth Marina',
        totalBerths: mockBerths.length,
        occupiedBerths: mockBerths.filter((b: any) => b.status === 'OCCUPIED').length,
        availableBerths: mockBerths.filter((b: any) => b.status === 'AVAILABLE').length,
        reservedBerths: mockBerths.filter((b: any) => b.status === 'RESERVED').length,
        maintenanceBerths: mockBerths.filter((b: any) => b.status === 'MAINTENANCE').length,
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(mockMarinaWalkData);
  }

  try {
    const mockUser = getDemoUser();

    // Get marina walk data
    const marinaWalkData = await prismaClient.marina.findMany({
      include: {
        berths: {
          include: {
            contracts: {
              where: { status: 'active' },
              include: {
                boat: {
                  select: {
                    id: true,
                    name: true,
                    registration: true,
                    length: true,
                    beam: true,
                    draft: true,
                    owner: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      }
                    }
                  }
                },
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            },
            bookings: {
              where: { status: 'active' },
              include: {
                boat: {
                  select: {
                    id: true,
                    name: true,
                    registration: true,
                    length: true,
                    beam: true,
                    draft: true,
                    owner: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      }
                    }
                  }
                },
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            },
            workOrders: {
              where: { status: { in: ['pending', 'in_progress'] } },
              include: {
                boat: {
                  select: {
                    id: true,
                    name: true,
                    registration: true,
                  }
                },
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transform the data for marina walk
    const marinaWalk = marinaWalkData.map((marina: any) => ({
      id: marina.id,
      name: marina.name,
      code: marina.code,
      berths: marina.berths.map((berth: any) => {
        const activeContract = berth.contracts.find((c: any) => c.status === 'active');
        const activeBooking = berth.bookings.find((b: any) => b.status === 'active');
        const pendingWorkOrders = berth.workOrders.filter((w: any) => w.status === 'pending');
        const inProgressWorkOrders = berth.workOrders.filter((w: any) => w.status === 'in_progress');

        return {
          id: berth.id,
          berthNumber: berth.berthNumber,
          length: berth.length,
          beam: berth.beam,
          depth: berth.depth,
          isAvailable: berth.isAvailable,
          isOccupied: !!(activeContract || activeBooking),
          hasActiveContract: !!activeContract,
          hasActiveBooking: !!activeBooking,
          hasPendingWorkOrders: pendingWorkOrders.length > 0,
          hasInProgressWorkOrders: inProgressWorkOrders.length > 0,
          totalWorkOrders: berth.workOrders.length,
          currentBoat: activeContract?.boat || activeBooking?.boat || null,
          currentOwner: activeContract?.owner || activeBooking?.owner || null,
          currentContract: activeContract || null,
          currentBooking: activeBooking || null,
          pendingWorkOrders,
          inProgressWorkOrders,
          healthScore: calculateBerthHealthScore(berth),
          needsAttention: pendingWorkOrders.length > 0 || inProgressWorkOrders.length > 0,
        };
      })
    }));

    return NextResponse.json({
      data: marinaWalk
    });

  } catch (error) {
    console.error('Error fetching marina walk data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate berth health score
function calculateBerthHealthScore(berth: any): number {
  let score = 100;
  
  // Deduct points for pending work orders
  if (berth.workOrders) {
    const pendingWorkOrders = berth.workOrders.filter((w: any) => w.status === 'pending');
    score -= pendingWorkOrders.length * 10;
  }
  
  // Deduct points for in-progress work orders
  if (berth.workOrders) {
    const inProgressWorkOrders = berth.workOrders.filter((w: any) => w.status === 'in_progress');
    score -= inProgressWorkOrders.length * 5;
  }
  
  return Math.max(0, score);
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  
  // Add CORS headers for preflight request
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}
