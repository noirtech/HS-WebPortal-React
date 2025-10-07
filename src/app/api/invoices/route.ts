import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { mockInvoices } from '@/lib/data-source'

// Simple logging for now
const log = (...args: any[]) => console.log('[API/invoices]', ...args)

// Simple Zod schema for invoice creation
const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email format'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  subtotal: z.string().min(1, 'Subtotal is required'),
  tax: z.string().min(1, 'Tax is required'),
  total: z.string().min(1, 'Total is required'),
  description: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number()
  })).optional()
})

// GET - Fetch all invoices from database
export async function GET() {
  try {
    // Try to get Prisma client directly without demo mode check
    let prismaClient;
    try {
      const { prisma: prismaClientImport } = await import('@/lib/db');
      prismaClient = prismaClientImport;
    } catch (error) {
      console.log('🔍 INVOICES API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // If we can't get Prisma client, use mock data
    if (!prismaClient) {
      console.log('🔍 INVOICES API: Using mock data - no database connection');
      
      // Transform mock invoices to match expected interface
      const transformedInvoices = mockInvoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber || 'N/A',
        customerName: invoice.customerName || 'Unknown Customer',
        customerEmail: invoice.customerEmail || '',
        issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
        status: invoice.status || 'DRAFT',
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0,
        description: invoice.description || 'Invoice for marina services',
        notes: invoice.notes || '',
        createdAt: invoice.createdAt || new Date().toISOString(),
        updatedAt: invoice.updatedAt || new Date().toISOString()
      }));
      
      console.log('✅ INVOICES API: Successfully returned mock invoices', { count: transformedInvoices.length });
      return NextResponse.json(transformedInvoices);
    }
  } catch (error) {
    console.log('🔍 INVOICES API: Error in outer try-catch, using mock data');
    // Return mock data as fallback
    const transformedInvoices = mockInvoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      customerName: invoice.customerName || 'Unknown Customer',
      customerEmail: invoice.customerEmail || '',
      issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
      status: invoice.status || 'DRAFT',
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      total: invoice.total || 0,
      description: invoice.description || 'Invoice for marina services',
      notes: invoice.notes || '',
      createdAt: invoice.createdAt || new Date().toISOString(),
      updatedAt: invoice.updatedAt || new Date().toISOString()
    }));
    return NextResponse.json(transformedInvoices);
  }

  try {
    log('GET start - fetching from database')
    
    // Get Prisma client for database operations
    let prismaClient;
    try {
      const { prisma } = await import('@/lib/db');
      prismaClient = prisma;
    } catch (error) {
      console.log('🔍 INVOICES API: Prisma import failed, using mock data');
      prismaClient = null;
    }
    
    // Check if prismaClient is available
    if (!prismaClient) {
      console.log('🔍 INVOICES API: No Prisma client, using mock data');
      const transformedInvoices = mockInvoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber || 'N/A',
        customerName: invoice.customerName || 'Unknown Customer',
        customerEmail: invoice.customerEmail || '',
        issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
        status: invoice.status || 'DRAFT',
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0,
        description: invoice.description || 'Invoice for marina services',
        notes: invoice.notes || '',
        createdAt: invoice.createdAt || new Date().toISOString(),
        updatedAt: invoice.updatedAt || new Date().toISOString()
      }));
      return NextResponse.json(transformedInvoices);
    }
    
    try {
      // Get marina ID from session for filtering
      const session = await getServerSession(authOptions)
      const marinaId = session?.user ? (session.user as any).marinaId : 'marina-1'
      
      // Fetch invoices from the database with marina filtering
      const invoices = await prismaClient.$queryRaw<Array<{
        id: string
        invoiceNumber: string
        status: string
        total: number
        createdAt: string
        ownerId?: string
      }>>`
        SELECT TOP 50
          id,
          invoiceNumber,
          status,
          total,
          createdAt,
          ownerId
        FROM invoices
        WHERE marinaId = ${marinaId}
        ORDER BY createdAt DESC
      `
      
      log('GET successful - fetched', invoices.length, 'invoices')
      
      // Transform the data to match the expected format
      const transformedInvoices = await Promise.all(invoices.map(async (invoice) => {
        // Try to get customer information if possible
        let customerName = 'Unknown Customer'
        let customerEmail = ''
        
        if (invoice.ownerId) {
          try {
            const customerResult = await prismaClient.$queryRaw`
              SELECT TOP 1 firstName, lastName, email
              FROM owners
              WHERE id = ${invoice.ownerId}
            ` as any[]
            
            if (Array.isArray(customerResult) && customerResult.length > 0) {
              const customer = customerResult[0]
              customerName = `${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}`.trim() || 'Unknown Customer'
              customerEmail = customer.email || ''
            }
          } catch (customerError) {
            log('Error fetching customer for invoice', invoice.id, ':', customerError)
          }
        }
        
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber || 'N/A',
          customerName,
          customerEmail,
          issueDate: new Date(invoice.createdAt).toISOString().split('T')[0], // Use createdAt as fallback
          dueDate: new Date(invoice.createdAt).toISOString().split('T')[0], // Use createdAt as fallback
          status: invoice.status || 'DRAFT',
          subtotal: invoice.total * 0.8, // Estimate subtotal as 80% of total
          tax: invoice.total * 0.2, // Estimate tax as 20% of total
          total: invoice.total,
          description: 'Invoice for marina services',
          notes: '',
          createdAt: invoice.createdAt,
          updatedAt: invoice.createdAt
        }
      }))
      
      return NextResponse.json(transformedInvoices)
      
    } catch (error) {
      log('Error fetching invoices from database:', error)
      
      // Return empty array instead of mock data
      return NextResponse.json([])
    }
  } catch (error) {
    log('Error fetching invoices from database:', error)
    
    // Return empty array instead of mock data
    return NextResponse.json([])
  }
}

// POST - Create new invoice (mock for now)
export async function POST(request: NextRequest) {
  try {
    log('POST start')
    
    const body = await request.json()
    log('POST body:', body)
    
    // Validate the request body
    const validatedData = InvoiceSchema.parse(body)
    log('POST validation successful')
    
    // Create mock invoice response
    const mockInvoice = {
      id: `inv-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    log('POST mock invoice created:', mockInvoice.id)
    return NextResponse.json(mockInvoice, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      log('POST validation failed:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    log('POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// PUT - Update existing invoice (mock for now)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    log('PUT start for invoice:', params.id)
    
    const body = await request.json()
    log('PUT body:', body)
    
    // Validate the request body
    const validatedData = InvoiceSchema.parse(body)
    log('PUT validation successful')
    
    // Create mock updated invoice response
    const updatedInvoice = {
      id: params.id,
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    log('PUT mock invoice updated:', params.id)
    return NextResponse.json(updatedInvoice, { status: 200 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      log('PUT validation failed:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    log('PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}
