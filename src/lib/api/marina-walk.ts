// Dockwalk API client functions
export interface Berth {
  id: string
  number: string
  name: string
  status: 'occupied' | 'available' | 'reserved' | 'maintenance'
  boatId?: string
  boatName?: string
  boatLength?: number
  boatBeam?: number
  coordinates: { x: number; y: number }
}

export interface Boat {
  id: string
  name: string
  length: number
  beam: number
  draft: number
  owner: string
  contact: string
  lastInspection: string
  nextInspection: string
  maintenanceStatus: 'good' | 'needs_attention' | 'maintenance_due'
  berthId: string
}

export interface MarinaWalkData {
  berths: Berth[]
  boats: Boat[]
  marina: {
    name: string
    totalBerths: number
    occupiedBerths: number
    availableBerths: number
    reservedBerths: number
    maintenanceBerths: number
  }
  generatedAt: string
}

export async function getMarinaWalkData(): Promise<MarinaWalkData> {
  try {
    console.log('🔍 [Dockwalk API Client] Using data source system for demo mode...')
    
    // Import the data source system
    const { mockBoats, mockBerths } = await import('@/lib/data-source')
    
    // Transform mock data to match expected interface
    const transformedBerths = mockBerths.map((berth: any) => ({
      id: berth.id,
      number: berth.berthNumber,
      name: `Dock ${berth.berthNumber.split('-')[0]}`,
      status: berth.status.toLowerCase(),
      boatId: berth.boatName ? `boat-${berth.berthNumber.split('-')[1]}` : undefined,
      boatName: berth.boatName,
      boatLength: berth.length,
      boatBeam: berth.beam,
      coordinates: { x: parseInt(berth.berthNumber.split('-')[1]) - 1, y: 0 }
    }))

    const transformedBoats = mockBoats.map((boat: any) => ({
      id: boat.id,
      name: boat.name,
      length: boat.length,
      beam: boat.beam,
      draft: boat.draft,
      owner: `${boat.owner.firstName} ${boat.owner.lastName}`,
      contact: boat.owner.email,
      lastInspection: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextInspection: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maintenanceStatus: 'good' as const,
      berthId: `berth-${boat.id.split('-')[1]}`
    }))

    const marinaData = {
      berths: transformedBerths,
      boats: transformedBoats,
      marina: {
        name: 'Portsmouth Marina',
        totalBerths: mockBerths.length,
        occupiedBerths: mockBerths.filter((b: any) => b.status === 'OCCUPIED').length,
        availableBerths: mockBerths.filter((b: any) => b.status === 'AVAILABLE').length,
        reservedBerths: mockBerths.filter((b: any) => b.status === 'RESERVED').length,
        maintenanceBerths: mockBerths.filter((b: any) => b.status === 'MAINTENANCE').length,
      },
      generatedAt: new Date().toISOString()
    }

    console.log('✅ [Dockwalk API Client] Successfully generated data from data source:', {
      berthCount: marinaData.berths.length,
      boatCount: marinaData.boats.length
    })
    
    return marinaData
  } catch (error) {
    console.error('❌ [Dockwalk API Client] Error generating dockwalk data:', error)
    
    // Return mock data as fallback
    return {
      berths: [
        { id: 'berth-1', number: 'A1', name: 'Main Dock A', status: 'occupied', boatId: 'boat-1', boatName: 'Sea Spirit', boatLength: 32, boatBeam: 12, coordinates: { x: 0, y: 0 } },
        { id: 'berth-2', number: 'A2', name: 'Main Dock A', status: 'occupied', boatId: 'boat-2', boatName: 'Ocean Explorer', boatLength: 28, boatBeam: 10, coordinates: { x: 1, y: 0 } },
        { id: 'berth-3', number: 'A3', name: 'Main Dock A', status: 'available', coordinates: { x: 2, y: 0 } },
        { id: 'berth-4', number: 'A4', name: 'Main Dock A', status: 'reserved', coordinates: { x: 3, y: 0 } },
      ],
      boats: [
        { id: 'boat-1', name: 'Sea Spirit', length: 32, beam: 12, draft: 4.5, owner: 'John Smith', contact: 'john.smith@email.com', lastInspection: '2024-01-15', nextInspection: '2024-07-15', maintenanceStatus: 'good' as const, berthId: 'berth-1' },
        { id: 'boat-2', name: 'Ocean Explorer', length: 28, beam: 10, draft: 3.8, owner: 'Sarah Johnson', contact: 'sarah.johnson@email.com', lastInspection: '2024-02-20', nextInspection: '2024-08-20', maintenanceStatus: 'good' as const, berthId: 'berth-2' },
      ],
      marina: {
        name: 'Portsmouth Marina',
        totalBerths: 4,
        occupiedBerths: 2,
        availableBerths: 1,
        reservedBerths: 1,
        maintenanceBerths: 0,
      },
      generatedAt: new Date().toISOString()
    }
  }
}
