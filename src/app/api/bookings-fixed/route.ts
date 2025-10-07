import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings-fixed - Starting request');
    
    // Use the same approach as the working test endpoint
    const bookingCount = await db.booking.count();
    const marinaBookings = await db.booking.count({
      where: { marinaId: 'marina-1' }
    });
    
    // Fetch actual booking data
    const bookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 20,
      orderBy: { startDate: 'asc' },
    });
    
    console.log('Bookings fetched:', bookings.length);
    
    // Transform the data to match the expected format
    const transformedBookings = bookings.map((booking: any) => {
      const now = new Date();
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      
      let calculatedStatus = booking.status;
      if (booking.status === 'CONFIRMED' && now >= startDate && now <= endDate) {
        calculatedStatus = 'ACTIVE';
      } else if (booking.status === 'ACTIVE' && now > endDate) {
        calculatedStatus = 'COMPLETED';
      }
      
      const isOverdue = booking.status === 'ACTIVE' && now > endDate;
      const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...booking,
        calculatedStatus,
        isOverdue,
        daysUntilStart: daysUntilStart > 0 ? daysUntilStart : 0,
        daysUntilEnd: daysUntilEnd > 0 ? daysUntilEnd : 0,
        isActive: calculatedStatus === 'ACTIVE',
        isUpcoming: calculatedStatus === 'CONFIRMED' && daysUntilStart > 0,
        isCompleted: calculatedStatus === 'COMPLETED',
        // Add placeholder related data (can be enhanced later)
        owner: { id: booking.ownerId, firstName: 'Owner', lastName: 'Name', email: 'owner@example.com', phone: null },
        boat: { id: booking.boatId, name: 'Boat Name', registration: null, length: 0, beam: null },
        berth: booking.berthId ? { id: booking.berthId, berthNumber: 'A1' } : null,
        marina: { id: booking.marinaId, name: 'Harbor View Marina' },
      };
    });
    
    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        page: 1,
        limit: 20,
        total: marinaBookings,
        pages: Math.ceil(marinaBookings / 20),
      },
    });
    
  } catch (error) {
    console.error('Error in bookings-fixed:', error);
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
