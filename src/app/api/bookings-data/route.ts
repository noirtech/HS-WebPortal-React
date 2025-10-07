import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

// Validation schemas
const GetBookingsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  ownerId: z.string().uuid().optional(),
  boatId: z.string().uuid().optional(),
  berthId: z.string().uuid().optional(),
  marinaId: z.string().uuid().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  endDateFrom: z.string().datetime().optional(),
  endDateTo: z.string().datetime().optional(),
  purpose: z.enum(['BERTH_RENTAL', 'MAINTENANCE', 'STORAGE', 'EVENT', 'OTHER']).optional(),
});

// GET /api/bookings-data - List bookings with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings-data - Starting request');
    
    const prismaClient = await getPrisma();
    if (!prismaClient) {
      return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
    }

    const mockUser = getDemoUser();
    console.log('Mock user:', mockUser);
    
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = GetBookingsSchema.parse(query);
    const { 
      page, 
      limit, 
      status, 
      ownerId, 
      boatId, 
      berthId, 
      marinaId, 
      startDateFrom, 
      startDateTo, 
      endDateFrom, 
      endDateTo, 
      purpose 
    } = validatedQuery;
    
    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (boatId) where.boatId = boatId;
    if (berthId) where.berthId = berthId;
    if (marinaId) where.marinaId = marinaId;
    if (purpose) where.purpose = purpose;
    if (startDateFrom) where.startDate = { ...where.startDate, gte: new Date(startDateFrom) };
    if (startDateTo) where.startDate = { ...where.startDate, lte: new Date(startDateTo) };
    if (endDateFrom) where.endDate = { ...where.endDate, gte: new Date(endDateFrom) };
    if (endDateTo) where.endDate = { ...where.endDate, lte: new Date(endDateTo) };
    
    // Apply marina-level access control
    if (mockUser.roles[0]?.role !== 'ADMIN' && mockUser.roles[0]?.role !== 'GROUP_ADMIN') {
      // For demo purposes, use a default marina ID
      where.marinaId = 'marina-1';
    }
    
    console.log('Where clause:', where);
    console.log('Pagination:', { page, limit, skip: (page - 1) * limit });
    
    // Get bookings with pagination using SQL Server 2012 compatible syntax
    const skip = (page - 1) * limit;
    
    console.log('Executing database query...');
    
    // Use raw SQL for SQL Server 2012 compatibility
    const bookingsQuery = `
      WITH NumberedBookings AS (
        SELECT 
          b.*,
          c.firstName as customerFirstName,
          c.lastName as customerLastName,
          c.email as customerEmail,
          c.phone as customerPhone,
          bt.name as boatName,
          bt.registration as boatRegistration,
          bt.length as boatLength,
          bt.beam as boatBeam,
          br.berthNumber,
          m.name as marinaName,
          ROW_NUMBER() OVER (ORDER BY b.startDate ASC) as RowNum
        FROM bookings b
        LEFT JOIN owners c ON b.ownerId = c.id
        LEFT JOIN boats bt ON b.boatId = bt.id
        LEFT JOIN berths br ON b.berthId = br.id
        LEFT JOIN marinas m ON b.marinaId = m.id
        WHERE 1=1
          ${status ? `AND b.status = '${status}'` : ''}
          ${ownerId ? `AND b.ownerId = '${ownerId}'` : ''}
          ${boatId ? `AND b.boatId = '${boatId}'` : ''}
          ${berthId ? `AND b.berthId = '${berthId}'` : ''}
          ${marinaId ? `AND b.marinaId = '${marinaId}'` : ''}
          ${purpose ? `AND b.purpose = '${purpose}'` : ''}
          ${startDateFrom ? `AND b.startDate >= '${startDateFrom}'` : ''}
          ${startDateTo ? `AND b.startDate <= '${startDateTo}'` : ''}
          ${endDateFrom ? `AND b.endDate >= '${endDateFrom}'` : ''}
          ${endDateTo ? `AND b.endDate <= '${endDateTo}'` : ''}
      )
      SELECT * FROM NumberedBookings 
      WHERE RowNum > ${skip} AND RowNum <= ${skip + limit}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as count
      FROM bookings b
      WHERE 1=1
        ${status ? `AND b.status = '${status}'` : ''}
                 ${ownerId ? `AND b.ownerId = '${ownerId}'` : ''}
        ${boatId ? `AND b.boatId = '${boatId}'` : ''}
        ${berthId ? `AND b.berthId = '${berthId}'` : ''}
        ${marinaId ? `AND b.marinaId = '${marinaId}'` : ''}
        ${purpose ? `AND b.purpose = '${purpose}'` : ''}
        ${startDateFrom ? `AND b.startDate >= '${startDateFrom}'` : ''}
        ${startDateTo ? `AND b.startDate <= '${startDateTo}'` : ''}
        ${endDateFrom ? `AND b.endDate >= '${endDateFrom}'` : ''}
        ${endDateTo ? `AND b.endDate <= '${endDateTo}'` : ''}
    `;
    
    const [bookings, totalResult] = await Promise.all([
      prismaClient.$queryRawUnsafe(bookingsQuery),
      prismaClient.$queryRawUnsafe(countQuery)
    ]);
    
    const total = Number(totalResult[0]?.count || 0);
    
    console.log('Query completed. Bookings found:', bookings.length, 'Total:', total);
    
    // Calculate additional fields
    const bookingsWithCalculations = bookings.map((booking: any) => {
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
        id: booking.id,
        externalId: booking.externalId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalAmount: booking.totalAmount,
        purpose: booking.purpose,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        marinaId: booking.marinaId,
                 customerId: booking.ownerId,
        boatId: booking.boatId,
        berthId: booking.berthId,
        customer: {
                     id: booking.ownerId,
          firstName: booking.customerFirstName,
          lastName: booking.customerLastName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
        },
        boat: {
          id: booking.boatId,
          name: booking.boatName,
          registration: booking.boatRegistration,
          length: booking.boatLength,
          beam: booking.boatBeam,
        },
        berth: booking.berthId ? {
          id: booking.berthId,
          berthNumber: booking.berthNumber,
        } : null,
        marina: {
          id: booking.marinaId,
          name: booking.marinaName,
        },
        calculatedStatus,
        isOverdue,
        daysUntilStart: daysUntilStart > 0 ? daysUntilStart : 0,
        daysUntilEnd: daysUntilEnd > 0 ? daysUntilEnd : 0,
        isActive: calculatedStatus === 'ACTIVE',
        isUpcoming: calculatedStatus === 'CONFIRMED' && daysUntilStart > 0,
        isCompleted: calculatedStatus === 'COMPLETED',
      };
    });
    
    console.log('Returning booking data with calculations...');
    
    return NextResponse.json({
      bookings: bookingsWithCalculations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
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
