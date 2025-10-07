import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const marinaCount = await db.marina.count();
    console.log('Marina count:', marinaCount);
    
    // Test bookings query
    const bookingCount = await db.booking.count();
    console.log('Booking count:', bookingCount);
    
    // Test a simple query with where clause
    const marinaBookings = await db.booking.count({
      where: { marinaId: 'marina-1' }
    });
    console.log('Marina-1 bookings count:', marinaBookings);
    
    return NextResponse.json({
      success: true,
      marinaCount,
      bookingCount,
      marinaBookings,
      message: 'Database connection successful'
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
