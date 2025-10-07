import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/reservations - Starting request');
    
    // Simple query without any complex logic
    const bookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 10,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        boat: { select: { id: true, name: true, registration: true, length: true, beam: true } },
        berth: { select: { id: true, berthNumber: true } },
        marina: { select: { id: true, name: true } },
      },
    });
    
    console.log('Query completed. Bookings found:', bookings.length);
    
    // Calculate additional fields
    const bookingsWithCalculations = bookings.map(booking => {
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
      };
    });
    
    return NextResponse.json({
      bookings: bookingsWithCalculations,
      pagination: {
        page: 1,
        limit: 10,
        total: bookings.length,
        pages: 1,
      },
    });
    
  } catch (error) {
    console.error('Error fetching reservations:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch reservations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
