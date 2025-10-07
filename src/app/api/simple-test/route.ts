import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Simple API test successful',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.substring(0, 30) + '...' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Simple test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name || 'Unknown'
    }, { status: 500 });
  }
}
