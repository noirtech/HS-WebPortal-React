import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';
import { mockContracts } from '@/lib/data-source';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 CONTRACTS API: Using mock data for demo mode');
    
    // Transform mock contracts to match expected interface
    const transformedContracts = mockContracts.map((contract: any) => ({
      ...contract,
      // Financial metrics
      totalOutstandingAmount: contract.invoices
        ?.filter((i: any) => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum: number, invoice: any) => sum + invoice.total, 0) || 0,
      totalPaidAmount: contract.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0,
      
      // Status indicators
      hasOutstandingInvoices: contract.invoices?.some((i: any) => i.status === 'pending' || i.status === 'overdue') || false,
      isOverdue: contract.invoices?.some((i: any) => i.status === 'overdue') || false,
      isActive: contract.status === 'active',
      isPending: contract.status === 'pending',
      
      // Date calculations
      daysRemaining: contract.endDate ? 
        Math.max(0, Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
      daysOverdue: contract.invoices
        ?.filter((i: any) => i.status === 'overdue')
        .reduce((max: number, invoice: any) => {
          const days = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return Math.max(max, days);
        }, 0) || 0,
      
      // Summary
      totalInvoices: contract.invoices?.length || 0,
      outstandingInvoices: contract.invoices?.filter((i: any) => i.status === 'pending' || i.status === 'overdue').length || 0,
      totalPayments: contract.payments?.length || 0,
      paymentRate: contract.invoices?.length > 0 ? 
        ((contract.payments?.length || 0) / contract.invoices.length) * 100 : 0,
    }));
    
    console.log('✅ CONTRACTS API: Successfully returned mock contracts', { count: transformedContracts.length });
    return NextResponse.json({
      data: transformedContracts
    });
  }

  try {
    const mockUser = getDemoUser();

    const contracts = await prismaClient.$queryRawUnsafe(`
      SELECT TOP 50
        c.id,
        c.externalId,
        c.contractNumber,
        c.startDate,
        c.endDate,
        c.status,
        c.monthlyRate,
        c.createdAt,
        c.updatedAt,
        c.marinaId,
        c.ownerId,
        c.boatId,
        c.berthId,
        m.name as marinaName,
        m.code as marinaCode,
        b.berthNumber,
        bt.name as boatName,
        bt.registration as boatRegistration,
        cust.firstName as customerFirstName,
        cust.lastName as customerLastName,
        cust.email as customerEmail
      FROM contracts c
      LEFT JOIN marinas m ON c.marinaId = m.id
      LEFT JOIN berths b ON c.berthId = b.id
      LEFT JOIN boats bt ON c.boatId = bt.id
      LEFT JOIN owners cust ON c.ownerId = cust.id
      ORDER BY c.createdAt DESC
    `);

    const contractsWithCalculations = contracts.map((contract: any) => ({
      id: contract.id,
      externalId: contract.externalId,
      contractNumber: contract.contractNumber,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      monthlyRate: contract.monthlyRate,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      marinaId: contract.marinaId,
      customerId: contract.ownerId,
      boatId: contract.boatId,
      berthId: contract.berthId,
      marina: {
        id: contract.marinaId,
        name: contract.marinaName,
        code: contract.marinaCode,
      },
      berth: contract.berthId ? {
        id: contract.berthId,
        berthNumber: contract.berthNumber,
      } : null,
      boat: {
        id: contract.boatId,
        name: contract.boatName,
        registration: contract.boatRegistration,
      },
      customer: {
        id: contract.ownerId,
        firstName: contract.customerFirstName,
        lastName: contract.customerLastName,
        email: contract.customerEmail,
      },
      invoices: [], // We'll need to fetch invoices separately if needed
      // Financial metrics (placeholder for now)
      totalOutstandingAmount: 0,
      totalPaidAmount: 0,
      hasOutstandingInvoices: false,
      isOverdue: false,
      isActive: contract.status === 'active',
      isPending: contract.status === 'pending',
      daysRemaining: contract.endDate ? 
        Math.max(0, Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
      daysOverdue: 0,
      totalInvoices: 0,
      outstandingInvoices: 0,
      totalPayments: 0,
      paymentRate: 0,
    }));

    return NextResponse.json({
      data: contractsWithCalculations
    });

  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
