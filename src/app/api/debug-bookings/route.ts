import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/debug-bookings - Starting request');
    
    // Test the exact same queries that work in the test endpoint
    const bookingCount = await db.booking.count();
    const marinaBookings = await db.booking.count({
      where: { marinaId: 'marina-1' }
    });
    
    return NextResponse.json({
      success: true,
      bookingCount,
      marinaBookings,
      message: 'Debug bookings test completed'
    });
    
  } catch (error) {
    console.error('Error in debug-bookings:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed in debug bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
