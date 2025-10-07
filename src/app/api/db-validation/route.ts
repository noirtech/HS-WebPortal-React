import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  console.log('🔍 DATABASE VALIDATION: Starting systematic validation...');
  
  try {
    const prismaClient = await getPrisma();
    
    if (!prismaClient) {
      console.log('❌ DATABASE VALIDATION: No Prisma client available');
      return NextResponse.json({
        success: false,
        error: 'Database connection not available',
        step: 'connection'
      });
    }

    // Step 1: Test basic connection
    console.log('✅ DATABASE VALIDATION: Step 1 - Testing connection...');
    await prismaClient.$queryRaw`SELECT 1 as test`;
    console.log('✅ DATABASE VALIDATION: Connection successful');

    // Step 2: Check table counts as baseline
    console.log('✅ DATABASE VALIDATION: Step 2 - Checking table counts...');
    const counts = await Promise.all([
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM contracts`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM invoices`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM bookings`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM payments`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM customers`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM boats`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM berths`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM work_orders`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM marinas`,
      prismaClient.$queryRaw`SELECT COUNT(*) as count FROM users`
    ]);

    const tableCounts = {
      contracts: Number(counts[0][0]?.count || 0),
      invoices: Number(counts[1][0]?.count || 0),
      bookings: Number(counts[2][0]?.count || 0),
      payments: Number(counts[3][0]?.count || 0),
      customers: Number(counts[4][0]?.count || 0),
      boats: Number(counts[5][0]?.count || 0),
      berths: Number(counts[6][0]?.count || 0),
      workOrders: Number(counts[7][0]?.count || 0),
      marinas: Number(counts[8][0]?.count || 0),
      users: Number(counts[9][0]?.count || 0)
    };

    console.log('✅ DATABASE VALIDATION: Table counts:', tableCounts);

    // Step 3: Test basic queries without pagination
    console.log('✅ DATABASE VALIDATION: Step 3 - Testing basic queries...');
    
    const basicQueries = await Promise.all([
      prismaClient.contract.findMany({ take: 5 }),
      prismaClient.invoice.findMany({ take: 5 }),
      prismaClient.booking.findMany({ take: 5 }),
      prismaClient.customer.findMany({ take: 5 }),
      prismaClient.boat.findMany({ take: 5 })
    ]);

    const basicQueryResults = {
      contracts: basicQueries[0].length,
      invoices: basicQueries[1].length,
      bookings: basicQueries[2].length,
      customers: basicQueries[3].length,
      boats: basicQueries[4].length
    };

    console.log('✅ DATABASE VALIDATION: Basic queries successful:', basicQueryResults);

    // Step 4: Test relationships
    console.log('✅ DATABASE VALIDATION: Step 4 - Testing relationships...');
    
    try {
      const contractWithRelations = await prismaClient.contract.findMany({
        take: 1,
        include: {
          customer: true,
          boat: true,
          marina: true
        }
      });
      console.log('✅ DATABASE VALIDATION: Contract relationships work');
    } catch (error) {
      console.log('❌ DATABASE VALIDATION: Contract relationships failed:', error);
    }

    // Step 5: Check for table name issues
    console.log('✅ DATABASE VALIDATION: Step 5 - Checking table names...');
    
    let tableNameIssues = [];
    
    try {
      await prismaClient.$queryRaw`SELECT TOP 1 * FROM owners`;
      tableNameIssues.push('owners table still exists (should be customers)');
    } catch (error) {
      console.log('✅ DATABASE VALIDATION: owners table does not exist (good)');
    }

    try {
      await prismaClient.$queryRaw`SELECT TOP 1 * FROM customers`;
      console.log('✅ DATABASE VALIDATION: customers table exists');
    } catch (error) {
      tableNameIssues.push('customers table does not exist');
    }

    // Step 6: Test SQL Server specific pagination
    console.log('✅ DATABASE VALIDATION: Step 6 - Testing SQL Server pagination...');
    
    try {
      const paginatedResults = await prismaClient.$queryRaw`
        SELECT TOP 10 * FROM contracts 
        ORDER BY createdAt DESC
      `;
      console.log('✅ DATABASE VALIDATION: SQL Server pagination works');
    } catch (error) {
      console.log('❌ DATABASE VALIDATION: SQL Server pagination failed:', error);
    }

    const validationResult = {
      success: true,
      connection: '✅ Connected',
      tableCounts,
      basicQueries: basicQueryResults,
      tableNameIssues,
      recommendations: [] as string[]
    };

    // Generate recommendations
    if (tableCounts.contracts === 0) {
      validationResult.recommendations.push('No contracts found - consider seeding data');
    }
    if (tableNameIssues.length > 0) {
      validationResult.recommendations.push('Table name issues detected - run migration script');
    }

    console.log('✅ DATABASE VALIDATION: Validation complete');
    return NextResponse.json(validationResult);

  } catch (error) {
    console.error('❌ DATABASE VALIDATION: Error during validation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'validation'
    }, { status: 500 });
  }
}
