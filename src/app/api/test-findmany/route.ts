import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/test-findmany - Starting request');
    
    // Test 1: Simple findMany without any conditions
    console.log('Testing simple findMany...');
    const bookings = await db.booking.findMany({
      take: 1,
    });
    console.log('Simple findMany result:', bookings.length);
    
    // Test 2: findMany with where clause
    console.log('Testing findMany with where...');
    const marinaBookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 1,
    });
    console.log('Where clause result:', marinaBookings.length);
    
    return NextResponse.json({
      success: true,
      simpleBookings: bookings.length,
      marinaBookings: marinaBookings.length,
      message: 'FindMany test completed'
    });
    
  } catch (error) {
    console.error('Error in test-findmany:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed in findMany test',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
