import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings-no-validation - Starting request');
    
    // Skip validation and use default values
    const page = 1;
    const limit = 20;
    const where = { marinaId: 'marina-1' };
    const skip = (page - 1) * limit;
    
    console.log('Executing query without validation...');
    
    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
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
      }),
      db.booking.count({ where }),
    ]);
    
    console.log('Query completed. Bookings found:', bookings.length, 'Total:', total);
    
    return NextResponse.json({
      bookings: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error in bookings-no-validation:', error);
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
