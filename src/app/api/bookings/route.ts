import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { mockBookings } from '@/lib/data-source'

// GET /api/bookings - List all bookings
export async function GET(request: NextRequest) {
  try {
    // Try to get Prisma client directly without demo mode check
    let prismaClient;
    try {
      const { prisma: prismaClientImport } = await import('@/lib/db');
      prismaClient = prismaClientImport;
    } catch (error) {
      console.log('🔍 BOOKINGS API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // If we can't get Prisma client, use mock data
    if (!prismaClient) {
      console.log('🔍 BOOKINGS API: Using mock data - no database connection');
      
      // Transform mock bookings to match expected interface
      const transformedBookings = mockBookings.map((booking: any) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber || booking.id,
        startDate: booking.startDate || new Date().toISOString().split('T')[0],
        endDate: booking.endDate || new Date().toISOString().split('T')[0],
        status: booking.status || 'PENDING',
        totalAmount: booking.totalAmount || booking.dailyRate || 0,
        customer: {
          id: booking.customerId || 'unknown',
          firstName: booking.customerName?.split(' ')[0] || 'Unknown',
          lastName: booking.customerName?.split(' ')[1] || 'Customer',
          email: booking.customerEmail || ''
        },
        boat: {
          id: booking.boatId || 'unknown',
          name: booking.boatName || 'Unknown Boat',
          registration: booking.boatRegistration || ''
        },
        berthId: booking.berthId || '',
        berth: booking.berthId ? {
          id: booking.berthId,
          berthNumber: booking.berthNumber || 'Unknown'
        } : null
      }));
      
      console.log('✅ BOOKINGS API: Successfully returned mock bookings', { count: transformedBookings.length });
      return NextResponse.json(transformedBookings);
    }
    
    try {
      console.log('🔍 BOOKINGS API: GET request received')
      
      // Authentication check
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        console.log('❌ BOOKINGS API: No session user')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get marina ID from session
      const marinaId = (session.user as any).marinaId
      if (!marinaId) {
        console.log('❌ BOOKINGS API: No marina ID in session')
        return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
      }

      console.log('🔍 BOOKINGS API: Marina ID:', marinaId)
      
      // Simple query with marina filtering
      const bookings = await prismaClient.$queryRaw<any[]>`
        SELECT TOP 50 id, externalId, startDate, endDate, status, totalAmount, ownerId, boatId, berthId
        FROM bookings
        WHERE marinaId = ${marinaId}
        ORDER BY startDate DESC
      `
      
      console.log('✅ BOOKINGS API: Query successful, count:', bookings.length)
      
      // Transform the data to match the expected interface
      const transformedBookings = bookings.map((booking: any) => ({
        id: booking.id,
        bookingNumber: booking.externalId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalAmount: booking.totalAmount,
        customer: {
          id: booking.ownerId || 'unknown',
          firstName: 'Unknown',
          lastName: 'Customer',
          email: ''
        },
        boat: {
          id: booking.boatId || 'unknown',
          name: 'Unknown Boat',
          registration: ''
        },
        berthId: booking.berthId || '',
        berth: booking.berthId ? {
          id: booking.berthId,
          berthNumber: 'Unknown'
        } : null
      }))

      console.log('✅ BOOKINGS API: Successfully transformed bookings', { count: transformedBookings.length })
      
      // Return just the bookings array as the frontend expects
      return NextResponse.json(transformedBookings)
      
    } catch (error) {
      console.error('❌ BOOKINGS API: Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ BOOKINGS API: Outer error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
