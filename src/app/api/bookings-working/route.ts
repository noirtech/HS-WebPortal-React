import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings-working - Starting request');
    
    // Fetch bookings without includes
    const bookings = await db.booking.findMany({
      where: { marinaId: 'marina-1' },
      take: 20,
      orderBy: { startDate: 'asc' },
    });
    
    console.log('Bookings fetched:', bookings.length);
    
    // Fetch related data separately
    const customerIds = [...new Set(bookings.map((b: any) => b.customerId))];
    const boatIds = [...new Set(bookings.map((b: any) => b.boatId))];
    const berthIds = [...new Set(bookings.map((b: any) => b.berthId).filter((id: any): id is string => id !== null))];
    
    const [customers, boats, berths] = await Promise.all([
      db.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      }),
      db.boat.findMany({
        where: { id: { in: boatIds } },
        select: { id: true, name: true, registration: true, length: true, beam: true }
      }),
      db.berth.findMany({
        where: { id: { in: berthIds } },
        select: { id: true, berthNumber: true }
      })
    ]);
    
    // Create lookup maps
    const customerMap = new Map(customers.map((c: any) => [c.id, c]));
    const boatMap = new Map(boats.map((b: any) => [b.id, b]));
    const berthMap = new Map(berths.map((b: any) => [b.id, b]));
    
    // Combine the data
    const bookingsWithRelatedData = bookings.map((booking: any) => {
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
        // Add related data
        customer: customerMap.get(booking.customerId) || { id: booking.customerId, firstName: 'Unknown', lastName: 'Customer', email: 'unknown@example.com', phone: null },
        boat: boatMap.get(booking.boatId) || { id: booking.boatId, name: 'Unknown Boat', registration: null, length: 0, beam: null },
        berth: booking.berthId ? (berthMap.get(booking.berthId) || { id: booking.berthId, berthNumber: 'Unknown' }) : null,
        marina: { id: booking.marinaId, name: 'Harbor View Marina' },
      };
    });
    
    console.log('Data combined successfully');
    
    return NextResponse.json({
      bookings: bookingsWithRelatedData,
      pagination: {
        page: 1,
        limit: 20,
        total: bookings.length,
        pages: 1,
      },
    });
    
  } catch (error) {
    console.error('Error in bookings-working:', error);
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
