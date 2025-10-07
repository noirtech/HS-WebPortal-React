import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/test-same-query - Starting request');
    
    // Use the exact same query as the working test endpoint
    const bookingCount = await db.booking.count();
    const marinaBookings = await db.booking.count({
      where: { marinaId: 'marina-1' }
    });
    
    return NextResponse.json({
      success: true,
      bookingCount,
      marinaBookings,
      message: 'Same query test completed'
    });
    
  } catch (error) {
    console.error('Error in test-same-query:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed in same query test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
