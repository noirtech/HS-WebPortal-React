import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings - Starting request');
    
    // Simple query without any complex logic
    const bookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 10,
      select: {
        id: true,
        externalId: true,
        startDate: true,
        endDate: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
        marinaId: true,
        customerId: true,
        boatId: true,
        berthId: true,
      }
    });
    
    console.log('Query completed. Bookings found:', bookings.length);
    
    return NextResponse.json({
      bookings: bookings,
      pagination: {
        page: 1,
        limit: 10,
        total: bookings.length,
        pages: 1,
      },
    });
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/bookings - Starting request');
    
    return NextResponse.json({
      message: 'POST endpoint working',
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in POST bookings:', error);
    
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
