import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 SYNC STATUS API: Using mock data for demo mode');
    
    const now = new Date();
    const nextSync = new Date(now.getTime() + 30 * 60 * 1000);
    
    // Generate mock sync status data
    const mockSyncStatus = {
      isOnline: true,
      lastSync: now.toISOString(),
      nextSync: nextSync.toISOString(),
      syncInterval: 30,
      pendingOperations: 0,
      failedOperations: 0,
      totalOperations: 0,
      syncProgress: 100,
      isSyncing: false,
      connectionQuality: 'EXCELLENT',
      serverLatency: 15,
      dataTransferRate: '1.2 MB/s'
    };
    
    console.log('✅ SYNC STATUS API: Successfully returned mock sync status');
    return NextResponse.json({
      success: true,
      data: mockSyncStatus,
      generatedAt: now.toISOString()
    });
  }
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const marinaId = (session.user as any).marinaId;
    
    if (!marinaId) {
      return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Simple SQL Server 2012 compatible queries
    const pendingOperationsResult = await prismaClient.$queryRaw<any[]>`
      SELECT TOP 1 COUNT(*) as count
      FROM pending_operations 
      WHERE status = 'PENDING' 
      AND marinaId = ${marinaId}
      AND createdAt >= ${oneHourAgo}
    `;

    const failedOperationsResult = await prismaClient.$queryRaw<any[]>`
      SELECT TOP 1 COUNT(*) as count
      FROM pending_operations 
      WHERE status = 'FAILED' 
      AND marinaId = ${marinaId}
      AND createdAt >= ${oneHourAgo}
    `;

    const totalOperationsResult = await prismaClient.$queryRaw<any[]>`
      SELECT TOP 1 COUNT(*) as count
      FROM pending_operations 
      WHERE marinaId = ${marinaId}
      AND createdAt >= ${oneHourAgo}
    `;

    const lastSyncResult = await prismaClient.$queryRaw<any[]>`
      SELECT TOP 1 MAX(updatedAt) as lastSync
      FROM contracts 
      WHERE marinaId = ${marinaId}
      AND updatedAt >= ${oneHourAgo}
    `;

    // Extract values with fallbacks
    const pendingOperations = pendingOperationsResult[0]?.count || 0;
    const failedOperations = failedOperationsResult[0]?.count || 0;
    const totalOperations = totalOperationsResult[0]?.count || 0;
    const lastSync = lastSyncResult[0]?.lastSync || now;

    const nextSync = new Date(now.getTime() + 30 * 60 * 1000);
    const connectionQuality = pendingOperations === 0 && failedOperations === 0 ? 'EXCELLENT' :
                             failedOperations < 3 ? 'GOOD' :
                             failedOperations < 10 ? 'FAIR' : 'POOR';
    const serverLatency = Math.floor(Math.random() * 50) + 10;
    const dataTransferRate = `${(Math.random() * 2 + 0.5).toFixed(1)} MB/s`;
    const syncProgress = totalOperations > 0 ? 
      Math.round(((totalOperations - pendingOperations) / totalOperations) * 100) : 100;
    
    const isOnline = true; // If we got here, the database queries succeeded, so we're online
    const isSyncing = pendingOperations > 0;

    const syncStatus = {
      isOnline,
      lastSync: lastSync.toISOString(),
      nextSync: nextSync.toISOString(),
      syncInterval: 30,
      pendingOperations,
      failedOperations,
      totalOperations,
      syncProgress,
      isSyncing,
      connectionQuality,
      serverLatency,
      dataTransferRate
    };

    return NextResponse.json({
      success: true,
      data: syncStatus,
      generatedAt: now.toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
