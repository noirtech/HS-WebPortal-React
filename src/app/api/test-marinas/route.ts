import { NextRequest, NextResponse } from 'next/server'

// Mock marina data for testing
const mockMarinas = [
  {
    id: 1,
    name: "Portsmouth Marina",
    location: "Portsmouth, Hampshire",
    country: "United Kingdom",
    coordinates: { lat: 50.8198, lng: -1.1139 },
    contact: {
      phone: "+44 23 9282 0000",
      email: "info@portsmouthmarina.co.uk",
      website: "https://portsmouthmarina.co.uk"
    },
    facilities: ["Fuel Dock", "Shower Facilities", "Restaurant", "WiFi", "Security"],
    berthCount: 150,
    maxBoatLength: 25,
    depth: 3.5,
    status: "active",
    rating: 4.5,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    name: "Southampton Water Marina",
    location: "Southampton, Hampshire",
    country: "United Kingdom",
    coordinates: { lat: 50.8967, lng: -1.3976 },
    contact: {
      phone: "+44 23 8033 0000",
      email: "enquiries@southamptonmarina.com",
      website: "https://southamptonmarina.com"
    },
    facilities: ["Fuel Dock", "Shower Facilities", "Laundry", "Chandlery", "Boatyard"],
    berthCount: 200,
    maxBoatLength: 30,
    depth: 4.2,
    status: "active",
    rating: 4.8,
    lastUpdated: "2024-01-14T14:20:00Z"
  },
  {
    id: 3,
    name: "Cowes Yacht Haven",
    location: "Cowes, Isle of Wight",
    country: "United Kingdom",
    coordinates: { lat: 50.7639, lng: -1.2971 },
    contact: {
      phone: "+44 19 8329 0000",
      email: "info@cowesyachthaven.com",
      website: "https://cowesyachthaven.com"
    },
    facilities: ["Fuel Dock", "Shower Facilities", "Restaurant", "Bar", "WiFi", "Security"],
    berthCount: 180,
    maxBoatLength: 35,
    depth: 4.8,
    status: "active",
    rating: 4.7,
    lastUpdated: "2024-01-13T09:15:00Z"
  }
]

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check for authentication (optional for testing)
    const authHeader = request.headers.get('authorization')
    const apiKey = request.headers.get('x-api-key')
    
    // For testing purposes, accept any auth or no auth
    // In production, you would validate these properly
    
    // Return the mock data
    return NextResponse.json({
      success: true,
      marinas: mockMarinas,
      total: mockMarinas.length,
      page: 1,
      limit: 50,
      hasMore: false,
      message: "Test marina data retrieved successfully"
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch marina data",
        message: "Internal server error"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return test response
    return NextResponse.json({
      success: true,
      message: "Test endpoint working correctly",
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid request",
        message: "Bad request format"
      },
      { status: 400 }
    )
  }
}
