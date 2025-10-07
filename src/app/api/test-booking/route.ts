import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/test-booking - Starting request');
    
    // Test 1: Basic booking count
    console.log('Testing booking count...');
    const bookingCount = await db.booking.count();
    console.log('Booking count:', bookingCount);
    
    // Test 2: Try to find one booking
    console.log('Testing findFirst booking...');
    const firstBooking = await db.booking.findFirst({
      select: {
        id: true,
        externalId: true,
        startDate: true,
        endDate: true,
        status: true,
      }
    });
    console.log('First booking:', firstBooking);
    
    // Test 3: Try to find bookings with where clause
    console.log('Testing findMany with where clause...');
    const marinaBookings = await db.booking.findMany({
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
    console.log('Marina bookings:', marinaBookings.length);
    
    return NextResponse.json({
      success: true,
      bookingCount,
      firstBooking: firstBooking ? 'Found' : 'Not found',
      marinaBookings: marinaBookings.length,
      message: 'Booking model tests completed'
    });
    
  } catch (error) {
    console.error('Error in test-booking:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test booking model',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
