import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ isOnline: false, error: 'Database not available in demo mode' }, { status: 503 });
  }

  try {
    // Test basic database connection
    await prismaClient.$connect();
    
    // Test a simple query to ensure database is responsive
    await prismaClient.$queryRaw`SELECT 1 as test`;
    
    // If we get here, database is online
    return NextResponse.json({ 
      isOnline: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({ 
      isOnline: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    try {
      await prismaClient.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}
