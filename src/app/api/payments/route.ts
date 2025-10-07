import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { mockPayments } from '@/lib/data-source'

// GET /api/payments - List all payments
export async function GET(request: NextRequest) {
  try {
    // Try to get Prisma client directly without demo mode check
    let prismaClient;
    try {
      const { prisma: prismaClientImport } = await import('@/lib/db');
      prismaClient = prismaClientImport;
    } catch (error) {
      console.log('🔍 PAYMENTS API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // If we can't get Prisma client, use mock data
    if (!prismaClient) {
      console.log('🔍 PAYMENTS API: Using mock data - no database connection');
      
      // Transform mock payments to match expected interface
      const transformedPayments = mockPayments.map((payment: any) => ({
        id: payment.id,
        paymentNumber: payment.paymentNumber || payment.id,
        customerName: payment.customerName || 'Unknown Customer',
        customerEmail: payment.customerEmail || '',
        invoiceNumber: payment.invoiceNumber || '',
        paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
        status: payment.status || 'completed',
        method: payment.method || 'credit_card',
        amount: payment.amount || 0,
        reference: payment.reference || '',
        description: payment.description || `Payment ${payment.paymentNumber || payment.id}`
      }));
      
      console.log('✅ PAYMENTS API: Successfully returned mock payments', { count: transformedPayments.length });
      return NextResponse.json(transformedPayments);
    }
    
    try {
      console.log('🔍 PAYMENTS API: GET request received')
      
      // Authentication check
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        console.log('❌ PAYMENTS API: No session user')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get marina ID from session
      const marinaId = (session.user as any).marinaId
      if (!marinaId) {
        console.log('❌ PAYMENTS API: No marina ID in session')
        return NextResponse.json({ error: 'User not associated with a marina' }, { status: 400 })
      }

      console.log('🔍 PAYMENTS API: Marina ID:', marinaId)
      
      // Simple query with marina filtering
      const payments = await prismaClient.$queryRaw<any[]>`
        SELECT TOP 50 id, externalId, paymentDate, status, gateway, amount, gatewayTransactionId, ownerId, invoiceId
        FROM payments
        WHERE marinaId = ${marinaId}
        ORDER BY paymentDate DESC
      `
      
      console.log('✅ PAYMENTS API: Query successful, count:', payments.length)
      
      // Transform the data to match the expected interface
      const transformedPayments = payments.map((payment: any) => ({
        id: payment.id,
        paymentNumber: payment.externalId || payment.id,
        customerName: 'Unknown Customer',
        customerEmail: '',
        invoiceNumber: '',
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
        status: payment.status,
        method: payment.gateway || 'Unknown',
        amount: payment.amount,
        reference: payment.gatewayTransactionId || '',
        description: `Payment ${payment.externalId || payment.id}`
      }))

      console.log('✅ PAYMENTS API: Successfully transformed payments', { count: transformedPayments.length })
      
      // Return just the payments array as the frontend expects
      return NextResponse.json(transformedPayments)
      
    } catch (error) {
      console.error('❌ PAYMENTS API: Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ PAYMENTS API: Outer error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
