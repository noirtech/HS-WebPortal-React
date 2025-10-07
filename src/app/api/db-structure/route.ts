import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  console.log('🔍 DATABASE STRUCTURE: Checking actual table and column structure...');
  
  try {
    const prismaClient = await getPrisma();
    
    if (!prismaClient) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      });
    }

    // Check contracts table structure
    const contractsStructure = await prismaClient.$queryRawUnsafe(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'contracts'
      ORDER BY ORDINAL_POSITION
    `);

    // Check bookings table structure
    const bookingsStructure = await prismaClient.$queryRawUnsafe(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'bookings'
      ORDER BY ORDINAL_POSITION
    `);

    // Check owners table structure
    const ownersStructure = await prismaClient.$queryRawUnsafe(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'owners'
      ORDER BY ORDINAL_POSITION
    `);

    // Check work_orders table structure
    const workOrdersStructure = await prismaClient.$queryRawUnsafe(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'work_orders'
      ORDER BY ORDINAL_POSITION
    `);

    // Get all table names
    const allTables = await prismaClient.$queryRawUnsafe(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    console.log('✅ DATABASE STRUCTURE: Successfully retrieved database structure');

    return NextResponse.json({
      success: true,
      tables: allTables,
      contracts: contractsStructure,
      bookings: bookingsStructure,
      owners: ownersStructure,
      workOrders: workOrdersStructure,
      message: 'Database structure retrieved successfully'
    });

  } catch (error) {
    console.error('❌ DATABASE STRUCTURE: Error checking database structure:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
