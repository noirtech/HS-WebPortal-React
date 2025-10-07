import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { mockBoats } from '@/lib/data-source'

// GET /api/boats/[id] - Get a specific boat
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 BOAT API: Using mock data for demo mode');
    
    // Find the boat in mock data
    const boat = mockBoats.find(b => b.id === params.id);
    
    if (!boat) {
      console.log('❌ BOAT API: Boat not found in mock data');
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }
    
    // Transform to match expected interface
    const boatData = {
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
      } : null
    };
    
    console.log('✅ BOAT API: Successfully fetched boat from mock data');
    return NextResponse.json(boatData);
  }
  try {
    console.log('🔍 BOAT API: GET request for boat ID:', params.id)
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ BOAT API: No session user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marinaId = (session.user as any).marinaId
    
    if (!marinaId) {
      console.log('❌ BOAT API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

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
      WHERE b.id = ${params.id} AND b.marinaId = ${marinaId}
    `
    
    const boatData = Array.isArray(boats) && boats.length > 0 ? boats[0] : null
    
    if (!boatData) {
      console.log('❌ BOAT API: Boat not found')
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
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
      ownerId: boatData.customerId, // Add this field for the edit form
      owner: {
        id: boatData.customerId,
        firstName: boatData.customerFirstName,
        lastName: boatData.customerLastName,
        email: boatData.customerEmail
      }
    }
    
    console.log('🔍 BOAT API: Raw boat data:', boatData)
    console.log('🔍 BOAT API: Transformed boat:', boat)
    console.log('✅ BOAT API: Successfully fetched boat')
    return NextResponse.json(boat)
  } catch (error) {
    console.error('Error fetching boat:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boat' },
      { status: 500 }
    )
  }
}

// PUT /api/boats/[id] - Update a boat
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    console.log('🔍 BOAT API: PUT request for boat ID:', params.id)
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ BOAT API: No session user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marinaId = (session.user as any).marinaId
    
    if (!marinaId) {
      console.log('❌ BOAT API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

    // Check if boat exists and belongs to user's marina
    const existingBoats = await prismaClient.$queryRaw`
      SELECT id FROM boats WHERE id = ${params.id} AND marinaId = ${marinaId}
    `
    
    if (Array.isArray(existingBoats) && existingBoats.length === 0) {
      console.log('❌ BOAT API: Boat not found')
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Validate required fields
    const { name, length, ownerId } = body
    
    if (!name || !length || !ownerId) {
      console.log('❌ BOAT API: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update the boat using raw SQL
    await prismaClient.$executeRaw`
      UPDATE boats 
      SET name = ${name}, 
          registration = ${body.registration || null}, 
          length = ${parseFloat(length)}, 
          beam = ${body.beam ? parseFloat(body.beam) : null}, 
          draft = ${body.draft ? parseFloat(body.draft) : null}, 
          ownerId = ${ownerId}, 
          updatedAt = GETDATE()
      WHERE id = ${params.id}
    `

    // Fetch the updated boat with related data
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
      WHERE b.id = ${params.id}
    `
    
    const boatData = Array.isArray(boats) && boats.length > 0 ? boats[0] : null
    
    if (!boatData) {
      throw new Error('Failed to fetch updated boat')
    }
    
    // Transform to match expected interface
    const updatedBoat = {
      id: boatData.id,
      name: boatData.name,
      registration: boatData.registration,
      length: boatData.length,
      beam: boatData.beam,
      draft: boatData.draft,
      isActive: boatData.isActive,
      ownerId: boatData.customerId, // Add this field for the edit form
      owner: {
        id: boatData.customerId,
        firstName: boatData.customerFirstName,
        lastName: boatData.customerLastName,
        email: boatData.customerEmail
      }
    }

    console.log('✅ BOAT API: Successfully updated boat')
    return NextResponse.json(updatedBoat)
  } catch (error) {
    console.error('Error updating boat:', error)
    return NextResponse.json(
      { error: 'Failed to update boat' },
      { status: 500 }
    )
  }
}

// DELETE /api/boats/[id] - Soft delete a boat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    console.log('🔍 BOAT API: DELETE request for boat ID:', params.id)
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ BOAT API: No session user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marinaId = (session.user as any).marinaId
    
    if (!marinaId) {
      console.log('❌ BOAT API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

    // Check if boat exists and belongs to user's marina
    const existingBoats = await prismaClient.$queryRaw`
      SELECT id FROM boats WHERE id = ${params.id} AND marinaId = ${marinaId}
    `
    
    if (Array.isArray(existingBoats) && existingBoats.length === 0) {
      console.log('❌ BOAT API: Boat not found')
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
    }

    // Soft delete by updating isActive to false
    await prismaClient.$executeRaw`
      UPDATE boats 
      SET isActive = 0, updatedAt = GETDATE()
      WHERE id = ${params.id}
    `

    console.log('✅ BOAT API: Successfully deleted boat')
    return NextResponse.json({ message: 'Boat deleted successfully' })
  } catch (error) {
    console.error('Error deleting boat:', error)
    return NextResponse.json(
      { error: 'Failed to delete boat' },
      { status: 500 }
    )
  }
}
