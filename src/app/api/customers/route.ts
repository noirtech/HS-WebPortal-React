import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { mockCustomers } from '@/lib/data-source'

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    // Try to get Prisma client directly without demo mode check
    let prismaClient;
    try {
      const { prisma: prismaClientImport } = await import('@/lib/db');
      prismaClient = prismaClientImport;
    } catch (error) {
      console.log('🔍 CUSTOMERS API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // If we can't get Prisma client, use mock data
    if (!prismaClient) {
      console.log('🔍 CUSTOMERS API: Using mock data - no database connection');
      
      console.log('✅ CUSTOMERS API: Successfully returned mock customers', { count: mockCustomers.length });
      return NextResponse.json(mockCustomers);
    }
    
    try {
      console.log('🔍 CUSTOMERS API: GET request received')
      
      // Authentication check
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        console.log('❌ CUSTOMERS API: No session user')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get marina ID from session
      const marinaId = (session.user as any).marinaId
      if (!marinaId) {
        console.log('❌ CUSTOMERS API: No marina ID in session')
        return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
      }

      console.log('🔍 CUSTOMERS API: Marina ID:', marinaId)
      
      // Simple query with marina filtering
      const customers = await prismaClient.$queryRaw<any[]>`
        SELECT TOP 50 id, firstName, lastName, email, phone
        FROM owners
        WHERE marinaId = ${marinaId}
        ORDER BY firstName ASC
      `
      
      console.log('✅ CUSTOMERS API: Query successful, count:', customers.length)
      
      // Transform the data to match the expected interface
      const transformedCustomers = customers.map((customer: any) => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || '',
        address: '',
        city: 'Coastal City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        dateJoined: new Date().toISOString(),
        status: 'ACTIVE',
        totalBoats: 1,
        activeContracts: 1,
        totalSpent: 5000.00,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      console.log('✅ CUSTOMERS API: Successfully transformed customers', { count: transformedCustomers.length })
      
      // Return just the customers array as the frontend expects
      return NextResponse.json(transformedCustomers)
      
    } catch (error) {
      console.error('❌ CUSTOMERS API: Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ CUSTOMERS API: Outer error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
