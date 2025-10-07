import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/test-minimal - Starting request');
    
    return NextResponse.json({
      success: true,
      message: 'Minimal test endpoint working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in test-minimal:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed in minimal test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
