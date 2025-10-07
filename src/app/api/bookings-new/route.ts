import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings-new - Starting request');
    
    const bookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 10,
    });
    
    console.log('Query completed. Bookings found:', bookings.length);
    
    return NextResponse.json({
      success: true,
      bookings: bookings,
      count: bookings.length,
      message: 'Bookings fetched successfully'
    });
    
  } catch (error) {
    console.error('Error in bookings-new:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
