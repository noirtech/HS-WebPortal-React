import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { mockContracts } from '@/lib/data-source'

// GET /api/contracts/[id] - Get a specific contract
export async function GET(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 CONTRACT API: Using mock data for demo mode');
    
    // Find the contract in mock data
    const contract = mockContracts.find(c => c.id === params.id);
    
    if (!contract) {
      console.log('❌ CONTRACT API: Contract not found in mock data');
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    // Transform to match expected interface
    const contractData = {
      id: contract.id,
      contractNumber: contract.contractNumber,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      monthlyRate: contract.monthlyRate,
      customer: {
        id: contract.customer.id,
        firstName: contract.customer.firstName,
        lastName: contract.customer.lastName,
        email: contract.customer.email
      },
      boat: {
        id: contract.boat.id,
        name: contract.boat.name,
        registration: contract.boat.registration
      },
      berthId: contract.berthId,
      berth: contract.berth ? {
        id: contract.berth.id,
        berthNumber: contract.berth.berthNumber
      } : null
    };
    
    console.log('✅ CONTRACT API: Successfully fetched contract from mock data');
    return NextResponse.json(contractData);
  }

  try {
    console.log('🔍 CONTRACT API: GET request for contract ID:', params.id)
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ CONTRACT API: No session user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marinaId = (session.user as any).marinaId
    
    if (!marinaId) {
      console.log('❌ CONTRACT API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

    const contracts = await prismaClient.$queryRaw`
      SELECT 
        c.id,
        c.contractNumber,
        c.startDate,
        c.endDate,
        c.status,
        c.monthlyRate,
        cust.id as customerId,
        cust.firstName as customerFirstName,
        cust.lastName as customerLastName,
        cust.email as customerEmail,
        b.id as boatId,
        b.name as boatName,
        b.registration as boatRegistration,
        ber.id as berthId,
        ber.berthNumber as berthNumber
      FROM contracts c
      LEFT JOIN owners cust ON c.ownerId = cust.id
      LEFT JOIN boats b ON c.boatId = b.id
      LEFT JOIN berths ber ON c.berthId = ber.id
      WHERE c.id = ${params.id} AND c.marinaId = ${marinaId}
    `
    
    const contractData = Array.isArray(contracts) && contracts.length > 0 ? contracts[0] : null
    
    if (!contractData) {
      console.log('❌ CONTRACT API: Contract not found')
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    
    // Transform to match expected interface
    const contract = {
      id: contractData.id,
      contractNumber: contractData.contractNumber,
      startDate: contractData.startDate,
      endDate: contractData.endDate,
      status: contractData.status,
      monthlyRate: contractData.monthlyRate,
      customer: {
        id: contractData.customerId,
        firstName: contractData.customerFirstName,
        lastName: contractData.customerLastName,
        email: contractData.customerEmail
      },
      boat: {
        id: contractData.boatId,
        name: contractData.boatName,
        registration: contractData.boatRegistration
      },
      berthId: contractData.berthId, // Add this field for the edit form
      berth: contractData.berthId ? {
        id: contractData.berthId,
        berthNumber: contractData.berthNumber
      } : null
    }
    
    console.log('🔍 CONTRACT API: Raw contract data:', contractData)
    console.log('🔍 CONTRACT API: Transformed contract:', contract)
    console.log('🔍 CONTRACT API: Berth data:', contract.berth)
    console.log('🔍 CONTRACT API: Berth ID:', contractData.berthId)
    console.log('✅ CONTRACT API: Successfully fetched contract')
    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

// PUT /api/contracts/[id] - Update a contract
export async function PUT(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    console.log('🔍 CONTRACT API: PUT request for contract ID:', params.id)
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ CONTRACT API: No session user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marinaId = (session.user as any).marinaId
    
    if (!marinaId) {
      console.log('❌ CONTRACT API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

    // Check if contract exists and belongs to user's marina
    const existingContracts = await prismaClient.$queryRaw`
      SELECT id FROM contracts WHERE id = ${params.id} AND marinaId = ${marinaId}
    `
    
    if (Array.isArray(existingContracts) && existingContracts.length === 0) {
      console.log('❌ CONTRACT API: Contract not found')
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Validate required fields
    const { startDate, endDate, monthlyRate, berthId } = body
    
    if (!startDate || !endDate || !monthlyRate) {
      console.log('❌ CONTRACT API: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update the contract using raw SQL
    await prismaClient.$executeRaw`
      UPDATE contracts 
      SET startDate = ${new Date(startDate)}, 
          endDate = ${new Date(endDate)}, 
          monthlyRate = ${parseFloat(monthlyRate)}, 
          berthId = ${berthId === 'none' ? null : berthId}, 
          updatedAt = GETDATE()
      WHERE id = ${params.id}
    `

    // Fetch the updated contract with related data
    const contracts = await prismaClient.$queryRaw`
      SELECT 
        c.id,
        c.contractNumber,
        c.startDate,
        c.endDate,
        c.status,
        c.monthlyRate,
        cust.id as customerId,
        cust.firstName as customerFirstName,
        cust.lastName as customerLastName,
        cust.email as customerEmail,
        b.id as boatId,
        b.name as boatName,
        b.registration as boatRegistration,
        ber.id as berthId,
        ber.berthNumber as berthNumber
      FROM contracts c
      LEFT JOIN owners cust ON c.ownerId = cust.id
      LEFT JOIN boats b ON c.boatId = b.id
      LEFT JOIN berths ber ON c.berthId = ber.id
      WHERE c.id = ${params.id}
    `
    
    const contractData = Array.isArray(contracts) && contracts.length > 0 ? contracts[0] : null
    
    if (!contractData) {
      throw new Error('Failed to fetch updated contract')
    }
    
    // Transform to match expected interface
    const updatedContract = {
      id: contractData.id,
      contractNumber: contractData.contractNumber,
      startDate: contractData.startDate,
      endDate: contractData.endDate,
      status: contractData.status,
      monthlyRate: contractData.monthlyRate,
      customer: {
        id: contractData.customerId,
        firstName: contractData.customerFirstName,
        lastName: contractData.customerLastName,
        email: contractData.customerEmail
      },
      boat: {
        id: contractData.boatId,
        name: contractData.boatName,
        registration: contractData.boatRegistration
      },
      berthId: contractData.berthId, // Add this field for the edit form
      berth: contractData.berthId ? {
        id: contractData.berthId,
        berthNumber: contractData.berthNumber
      } : null
    }

    console.log('✅ CONTRACT API: Successfully updated contract')
    return NextResponse.json(updatedContract)
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}

// DELETE /api/contracts/[id] - Soft delete a contract
export async function DELETE(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    console.log('🔍 CONTRACT API: DELETE request for contract ID:', params.id)
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ CONTRACT API: No session user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marinaId = (session.user as any).marinaId
    
    if (!marinaId) {
      console.log('❌ CONTRACT API: No marina ID in session')
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
    }

    // Check if contract exists and belongs to user's marina
    const existingContracts = await prismaClient.$queryRaw`
      SELECT id FROM contracts WHERE id = ${params.id} AND marinaId = ${marinaId}
    `
    
    if (Array.isArray(existingContracts) && existingContracts.length === 0) {
      console.log('❌ CONTRACT API: Contract not found')
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Soft delete by updating status to CANCELLED using raw SQL
    await prismaClient.$executeRaw`
      UPDATE contracts 
      SET status = 'CANCELLED', updatedAt = GETDATE()
      WHERE id = ${params.id}
    `

    // Fetch the updated contract with related data
    const contracts = await prismaClient.$queryRaw`
      SELECT 
        c.id,
        c.contractNumber,
        c.startDate,
        c.endDate,
        c.status,
        c.monthlyRate,
        cust.id as customerId,
        cust.firstName as customerFirstName,
        cust.lastName as customerLastName,
        cust.email as customerEmail,
        b.id as boatId,
        b.name as boatName,
        b.registration as boatRegistration,
        ber.id as berthId,
        ber.berthNumber as berthNumber
      FROM contracts c
      LEFT JOIN owners cust ON c.ownerId = cust.id
      LEFT JOIN boats b ON c.boatId = b.id
      LEFT JOIN berths ber ON c.berthId = ber.id
      WHERE c.id = ${params.id}
    `
    
    const contractData = Array.isArray(contracts) && contracts.length > 0 ? contracts[0] : null
    
    if (!contractData) {
      throw new Error('Failed to fetch cancelled contract')
    }
    
    // Transform to match expected interface
    const deletedContract = {
      id: contractData.id,
      contractNumber: contractData.contractNumber,
      startDate: contractData.startDate,
      endDate: contractData.endDate,
      status: contractData.status,
      monthlyRate: contractData.monthlyRate,
      customer: {
        id: contractData.customerId,
        firstName: contractData.customerFirstName,
        lastName: contractData.customerLastName,
        email: contractData.customerEmail
      },
      boat: {
        id: contractData.boatId,
        name: contractData.boatName,
        registration: contractData.boatRegistration
      },
      berthId: contractData.berthId, // Add this field for the edit form
      berth: contractData.berthId ? {
        id: contractData.berthId,
        berthNumber: contractData.berthNumber
      } : null
    }

    console.log('✅ CONTRACT API: Successfully cancelled contract')
    return NextResponse.json(deletedContract)
  } catch (error) {
    console.error('Error cancelling contract:', error)
    return NextResponse.json(
      { error: 'Failed to cancel contract' },
      { status: 500 }
    )
  }
}
