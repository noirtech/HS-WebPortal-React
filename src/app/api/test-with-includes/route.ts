import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/test-with-includes - Starting request');
    
    // Test 1: Basic count (this works)
    const bookingCount = await db.booking.count();
    console.log('Booking count:', bookingCount);
    
    // Test 2: Simple findMany without includes (this should work)
    console.log('Testing findMany without includes...');
    const simpleBookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 1,
    });
    console.log('Simple bookings:', simpleBookings.length);
    
    // Test 3: FindMany with includes (this might fail)
    console.log('Testing findMany with includes...');
    const bookingsWithIncludes = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 1,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        boat: { select: { id: true, name: true, registration: true, length: true, beam: true } },
        berth: { select: { id: true, berthNumber: true } },
        marina: { select: { id: true, name: true } },
      },
    });
    console.log('Bookings with includes:', bookingsWithIncludes.length);
    
    return NextResponse.json({
      success: true,
      bookingCount,
      simpleBookings: simpleBookings.length,
      bookingsWithIncludes: bookingsWithIncludes.length,
      message: 'Include test completed'
    });
    
  } catch (error) {
    console.error('Error in test-with-includes:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed in include test',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
