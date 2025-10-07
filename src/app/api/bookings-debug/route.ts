import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings-debug - Starting request');
    
    // Use the exact same query as the working test endpoint
    console.log('Testing booking count...');
    const bookingCount = await db.booking.count();
    console.log('Booking count:', bookingCount);
    
    console.log('Testing marina bookings count...');
    const marinaBookings = await db.booking.count({
      where: { marinaId: 'marina-1' }
    });
    console.log('Marina-1 bookings count:', marinaBookings);
    
    // Now try the exact same query that works in the test endpoint
    console.log('Testing findMany with where clause...');
    const bookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 1,
      select: {
        id: true,
        externalId: true,
        startDate: true,
        endDate: true,
        status: true,
      }
    });
    console.log('FindMany result:', bookings.length, 'bookings');
    
    return NextResponse.json({
      success: true,
      bookingCount,
      marinaBookings,
      bookings: bookings.length,
      message: 'Debug test completed successfully'
    });
    
  } catch (error) {
    console.error('Error in bookings-debug:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed in bookings debug',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
