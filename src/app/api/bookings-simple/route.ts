import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings-simple - Starting request');
    
    // Test 1: Basic count
    console.log('Testing basic count...');
    const count = await db.booking.count();
    console.log('Count result:', count);
    
    // Test 2: Simple findMany without any conditions
    console.log('Testing simple findMany...');
    const bookings = await db.booking.findMany({
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
    
    // Test 3: With where clause
    console.log('Testing with where clause...');
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
    console.log('Where clause result:', marinaBookings.length, 'bookings');
    
    return NextResponse.json({
      success: true,
      count,
      bookings: bookings.length,
      marinaBookings: marinaBookings.length,
      message: 'All tests passed'
    });
    
  } catch (error) {
    console.error('Error in bookings-simple:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch bookings',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
