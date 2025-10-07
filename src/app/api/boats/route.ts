import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { mockBoats } from '@/lib/data-source'

// GET /api/boats - List all boats
export async function GET(request: NextRequest) {
  try {
    // Try to get Prisma client directly without demo mode check
    let prismaClient;
    try {
      const { prisma } = await import('@/lib/db');
      prismaClient = prisma;
    } catch (error) {
      console.log('🔍 BOATS API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // If we can't get Prisma client, use mock data
    if (!prismaClient) {
      console.log('🔍 BOATS API: Using mock data - no database connection');
      
      // Transform mock boats to match expected interface
      const transformedBoats = mockBoats.map((boat: any) => ({
        id: boat.id,
        name: boat.name,
        registration: boat.registration || '',
        length: boat.length,
        beam: boat.beam,
        draft: boat.draft,
        isActive: boat.isActive,
        ownerId: boat.ownerId || 'unknown',
        owner: boat.owner ? {
          id: boat.owner.id,
          firstName: boat.owner.firstName || 'Unknown',
          lastName: boat.owner.lastName || 'Owner',
          email: boat.owner.email || 'No email'
        } : null,
        status: boat.isActive ? 'ACTIVE' : 'INACTIVE'
      }));
      
      console.log('✅ BOATS API: Successfully returned mock boats', { count: transformedBoats.length });
      return NextResponse.json(transformedBoats);
    }
  } catch (error) {
    console.log('🔍 BOATS API: Error in Prisma setup, using mock data');
    // Transform mock boats to match expected interface
    const transformedBoats = mockBoats.map((boat: any) => ({
      id: boat.id,
      name: boat.name,
      registration: boat.registration || '',
      length: boat.length,
      beam: boat.beam,
      draft: boat.draft,
      isActive: boat.isActive,
      ownerId: boat.ownerId || 'unknown',
      owner: boat.owner ? {
        id: boat.customer.id,
        firstName: boat.customer.firstName || 'Unknown',
        lastName: boat.customer.lastName || 'Owner',
        email: boat.customer.email || 'No email'
      } : null,
      status: boat.isActive ? 'ACTIVE' : 'INACTIVE'
    }));
    
    console.log('✅ BOATS API: Successfully returned mock boats', { count: transformedBoats.length });
    return NextResponse.json(transformedBoats);
  }

  try {
    console.log('🔍 BOATS API: GET request received')
    
    // Get Prisma client for database operations
    let prismaClient;
    try {
      const { prisma } = await import('@/lib/db');
      prismaClient = prisma;
    } catch (error) {
      console.log('🔍 BOATS API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // Authentication check - allow fallback to mock data for test pages
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('🔍 BOATS API: No session user, using mock data')
      
      // Transform mock boats to match expected interface
      const transformedBoats = mockBoats.map((boat: any) => ({
        id: boat.id,
        name: boat.name,
        registration: boat.registration || '',
        length: boat.length,
        beam: boat.beam,
        draft: boat.draft,
        isActive: boat.isActive,
        ownerId: boat.ownerId || 'unknown',
        owner: boat.owner ? {
          id: boat.owner.id,
          firstName: boat.owner.firstName || 'Unknown',
          lastName: boat.owner.lastName || 'Owner',
          email: boat.owner.email || 'No email'
        } : null,
        status: boat.isActive ? 'ACTIVE' : 'INACTIVE'
      }));
      
      console.log('✅ BOATS API: Successfully returned mock boats', { count: transformedBoats.length });
      return NextResponse.json(transformedBoats);
    }

    // Get marina ID from session
    const marinaId = (session.user as any).marinaId
    if (!marinaId) {
      console.log('❌ BOATS API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

    console.log('🔍 BOATS API: Marina ID:', marinaId)
    
    // Check if prismaClient is available
    if (!prismaClient) {
      console.log('🔍 BOATS API: No Prisma client, using mock data');
      const transformedBoats = mockBoats.map((boat: any) => ({
        id: boat.id,
        name: boat.name,
        registration: boat.registration || '',
        length: boat.length,
        beam: boat.beam,
        draft: boat.draft,
        isActive: boat.isActive,
        ownerId: boat.ownerId || 'unknown',
        owner: boat.owner ? {
          id: boat.owner.id,
          firstName: boat.owner.firstName || 'Unknown',
          lastName: boat.owner.lastName || 'Owner',
          email: boat.owner.email || 'No email'
        } : null,
        status: boat.isActive ? 'ACTIVE' : 'INACTIVE'
      }));
      return NextResponse.json(transformedBoats);
    }

    // Query boats with owner information
    const boats = await prismaClient.$queryRaw<any[]>`
      SELECT TOP 50 
        b.id,
        b.name,
        b.registration,
        b.length,
        b.beam,
        b.draft,
        b.isActive,
        b.ownerId,
        o.firstName as ownerFirstName,
        o.lastName as ownerLastName,
        o.email as ownerEmail
      FROM boats b
      LEFT JOIN owners o ON b.ownerId = o.id
      WHERE b.marinaId = ${marinaId}
      ORDER BY b.name ASC
    `
    
    console.log('✅ BOATS API: Query successful, count:', boats.length)
    
    // Transform the data to match the expected interface
    const transformedBoats = boats.map((boat: any) => ({
      id: boat.id,
      name: boat.name,
      registration: boat.registration || '',
      length: boat.length,
      beam: boat.beam,
      draft: boat.draft,
      isActive: boat.isActive,
      ownerId: boat.ownerId || 'unknown',
      owner: boat.ownerId ? {
        id: boat.ownerId,
        firstName: boat.ownerFirstName || 'Unknown',
        lastName: boat.ownerLastName || 'Owner',
        email: boat.ownerEmail || 'No email'
      } : null,
      status: boat.isActive ? 'ACTIVE' : 'INACTIVE'
    }))

    console.log('✅ BOATS API: Successfully transformed boats', { count: transformedBoats.length })
    
    // Return just the boats array as the frontend expects
    return NextResponse.json(transformedBoats)
    
  } catch (error) {
    console.error('❌ BOATS API: Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boats' },
      { status: 500 }
    )
  }
}

// POST /api/boats - Create new boat
export async function POST(request: NextRequest) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    console.log('🔍 BOATS API: POST request received')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ BOATS API: No session user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marinaId = (session.user as any).marinaId
    console.log('🔍 BOATS API: Full session user object:', JSON.stringify(session.user, null, 2))
    
    if (!marinaId) {
      console.log('❌ BOATS API: No marina ID in session')
      // For demo purposes, use a default marina ID if none is found
      const defaultMarinaId = 'marina-1'
      console.log('🔍 BOATS API: Using default marina ID for POST:', defaultMarinaId)
      // Continue with the default marina ID
    }
    
    const effectiveMarinaId = marinaId || 'marina-1'

    const body = await request.json()
    
    // Validate required fields
    const { name, length, ownerId } = body
    
    if (!name || !length || !ownerId) {
      console.log('❌ BOATS API: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: name, length, and ownerId are required' },
        { status: 400 }
      )
    }

    // Check if owner exists and belongs to user's marina
    const owners = await prismaClient.$queryRaw`
      SELECT id, firstName, lastName, email
      FROM owners
      WHERE id = ${ownerId} AND marinaId = ${effectiveMarinaId}
    `
    const owner = Array.isArray(owners) && owners.length > 0 ? owners[0] : null

    if (!owner) {
      console.log('❌ BOATS API: Owner not found or not in marina')
      return NextResponse.json(
        { error: 'Owner not found or not associated with this marina' },
        { status: 400 }
      )
    }

    // Create the boat using raw SQL
    const boatId = `boat-${Date.now()}`
    const externalId = `ext-${Date.now()}`
    
    await prismaClient.$executeRaw`
      INSERT INTO boats (id, externalId, name, registration, length, beam, draft, isActive, marinaId, ownerId, createdAt, updatedAt)
      VALUES (${boatId}, ${externalId}, ${name}, ${body.registration || null}, ${parseFloat(length)}, ${body.beam ? parseFloat(body.beam) : null}, ${body.draft ? parseFloat(body.draft) : null}, 1, ${effectiveMarinaId}, ${ownerId}, GETDATE(), GETDATE())
    `

    // Fetch the created boat with customer details
    const boats = await prismaClient.$queryRaw`
      SELECT 
        b.id,
        b.name,
        b.registration,
        b.length,
        b.beam,
        b.draft,
        b.isActive,
        c.id as customerId,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        c.email as customerEmail
      FROM boats b
      LEFT JOIN owners c ON b.ownerId = c.id
      WHERE b.id = ${boatId}
    `
    
    const boatData = Array.isArray(boats) && boats.length > 0 ? boats[0] : null
    
    if (!boatData) {
      throw new Error('Failed to fetch created boat')
    }
    
    // Transform to match expected interface
    const boat = {
      id: boatData.id,
      name: boatData.name,
      registration: boatData.registration,
      length: boatData.length,
      beam: boatData.beam,
      draft: boatData.draft,
      isActive: boatData.isActive,
      customer: {
        id: boatData.customerId,
        firstName: boatData.customerFirstName,
        lastName: boatData.customerLastName,
        email: boatData.customerEmail
      }
    }

    console.log('✅ BOATS API: Successfully created boat:', boat.id)
    return NextResponse.json(boat, { status: 201 })
  } catch (error) {
    console.error('Error creating boat:', error)
    return NextResponse.json(
      { error: 'Failed to create boat' },
      { status: 500 }
    )
  }
}
