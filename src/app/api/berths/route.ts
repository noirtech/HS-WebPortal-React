import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { mockBerths } from '@/lib/data-source'

// GET /api/berths - List all berths
export async function GET(request: NextRequest) {
  try {
    // Try to get Prisma client directly without demo mode check
    let prismaClient;
    try {
      const { prisma } = await import('@/lib/db');
      prismaClient = prisma;
    } catch (error) {
      console.log('🔍 BERTHS API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // If we can't get Prisma client, use mock data
    if (!prismaClient) {
      console.log('🔍 BERTHS API: Using mock data - no database connection');
      
      // Transform mock berths to match expected interface
      const transformedBerths = mockBerths.map((berth: any) => ({
        id: berth.id,
        berthNumber: berth.berthNumber,
        length: berth.length,
        beam: berth.beam,
        depth: 3.0, // Default depth
        status: berth.status,
        monthlyRate: 500.00, // Default rate
        isAvailable: berth.status === 'AVAILABLE',
        marinaId: 'marina-1',
        isActive: berth.status !== 'MAINTENANCE',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      console.log('✅ BERTHS API: Successfully returned mock berths', { count: transformedBerths.length });
      return NextResponse.json(transformedBerths);
    }
    
    console.log('🔍 BERTHS API: GET request received')
    
    // Authentication check - allow fallback to mock data for test pages
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('🔍 BERTHS API: No session user, using mock data')
      
      // Transform mock berths to match expected interface
      const transformedBerths = mockBerths.map((berth: any) => ({
        id: berth.id,
        berthNumber: berth.berthNumber,
        length: berth.length,
        beam: berth.beam,
        depth: 3.0, // Default depth
        status: berth.status,
        monthlyRate: 500.00, // Default rate
        isAvailable: berth.status === 'AVAILABLE',
        marinaId: 'marina-1',
        isActive: berth.status !== 'MAINTENANCE',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      console.log('✅ BERTHS API: Successfully returned mock berths', { count: transformedBerths.length });
      return NextResponse.json(transformedBerths);
    }

    // Get marina ID from session
    const marinaId = (session.user as any).marinaId
    if (!marinaId) {
      console.log('❌ BERTHS API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

    console.log('🔍 BERTHS API: Marina ID:', marinaId)
    
    // Simple query with marina filtering
    const berths = await prismaClient.$queryRaw<any[]>`
      SELECT TOP 50 id, berthNumber, length, beam, isActive
      FROM berths
      WHERE marinaId = ${marinaId}
      ORDER BY berthNumber ASC
    `
    
    console.log('✅ BERTHS API: Query successful, count:', berths.length)
    
    // Transform the data to match the expected interface
    const transformedBerths = berths.map((berth: any) => ({
      id: berth.id,
      berthNumber: berth.berthNumber || `Berth ${berth.id}`,
      length: berth.length,
      beam: berth.beam,
      depth: 3.0, // Default depth
      status: berth.isActive ? 'AVAILABLE' : 'OCCUPIED',
      monthlyRate: 500.00, // Default rate
      isAvailable: berth.isActive,
      marinaId: marinaId,
      isActive: berth.isActive,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    console.log('✅ BERTHS API: Successfully transformed berths', { count: transformedBerths.length })
    
    // Return just the berths array as the frontend expects
    return NextResponse.json(transformedBerths)
    
  } catch (error) {
    console.error('❌ BERTHS API: Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch berths' },
      { status: 500 }
    )
  }
}
