import { NextRequest, NextResponse } from 'next/server'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { mockInvoices } from '@/lib/data-source'

// Enhanced debug helper with more context
const log = (...args: any[]) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [API/invoices/:id]`, ...args)
}

// GET - Fetch specific invoice by ID
export async function GET(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 INVOICE API: Using mock data for demo mode');
    
    // Find the invoice in mock data
    const invoice = mockInvoices.find(i => i.id === params.id);
    
    if (!invoice) {
      console.log('❌ INVOICE API: Invoice not found in mock data');
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    console.log('✅ INVOICE API: Successfully fetched invoice from mock data');
    return NextResponse.json(invoice);
  }

  try {
    log('GET start id:', params.id)
    
    // Debug: Log Prisma client info
    log('Prisma client created')
    
    // Debug: Check if we can connect to the database
    try {
      await prismaClient.$connect()
      log('Database connection successful')
    } catch (connError) {
      log('Database connection failed:', connError)
      throw connError
    }
    
    // Debug: Log environment info
    log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...')
    
    // First, let's check what tables exist in the database
    log('Checking database schema...')
    const tablesResult = await prismaClient.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `
    log('Available tables:', tablesResult)
    
    // Check if the invoices table exists and what its structure is
    if (Array.isArray(tablesResult) && tablesResult.some((t: any) => t.TABLE_NAME === 'invoices')) {
      log('Invoices table exists, checking structure...')
      const columnsResult = await prismaClient.$queryRaw`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'invoices'
        ORDER BY ORDINAL_POSITION
      `
      log('Invoices table columns:', columnsResult)
      
      // Check if customers table exists
      if (Array.isArray(tablesResult) && tablesResult.some((t: any) => t.TABLE_NAME === 'customers')) {
        log('Customers table exists, checking structure...')
        const customerColumnsResult = await prismaClient.$queryRaw`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'customers'
          ORDER BY ORDINAL_POSITION
        `
        log('Customers table columns:', customerColumnsResult)
      }
      
      // Let's see what invoices actually exist in the database
      log('Checking what invoices exist in the database...')
      const existingInvoicesResult = await prismaClient.$queryRaw`
        SELECT TOP 5 id, invoiceNumber, status, total, createdAt
        FROM invoices
        ORDER BY createdAt DESC
      ` as any[]
      log('Existing invoices in database:', existingInvoicesResult)
      
      // Now try to find the specific invoice
      log('Searching for invoice with ID:', params.id)
      const invoiceResult = await prismaClient.$queryRaw`
        SELECT TOP 1 *
        FROM invoices
        WHERE id = ${params.id}
      `
      log('Invoice search result:', invoiceResult)
      
      if (Array.isArray(invoiceResult) && invoiceResult.length > 0) {
        const invoice = invoiceResult[0] as any
        log('Found invoice:', invoice)
        
        // Try to get customer information if possible
        let customerInfo = null
        if (invoice.ownerId) {
          try {
            const customerResult = await prismaClient.$queryRaw`
              SELECT TOP 1 *
              FROM owners
              WHERE id = ${invoice.ownerId}
            `
            if (Array.isArray(customerResult) && customerResult.length > 0) {
              customerInfo = customerResult[0]
              log('Found customer info:', customerInfo)
            }
          } catch (customerError) {
            log('Error fetching customer info:', customerError)
          }
        }
        
        // Transform the invoice data to match expected interface
        const transformedInvoice = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Unknown Customer',
          customerEmail: customerInfo?.email || 'unknown@example.com',
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status,
          subtotal: invoice.subtotal || 0,
          tax: invoice.tax || 0,
          total: invoice.total || 0,
          description: invoice.description || 'No description',
          notes: invoice.notes || '',
          lineItems: invoice.lineItems || []
        }
        
        log('Transformed invoice:', transformedInvoice)
        return NextResponse.json(transformedInvoice)
      } else {
        log('Invoice not found')
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
    } else {
      log('Invoices table does not exist')
      return NextResponse.json({ error: 'Invoices table not found' }, { status: 500 })
    }
  } catch (error) {
    log('Error in GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT - Update specific invoice
export async function PUT(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  
  // In demo mode, update mock data
  if (!prismaClient) {
    console.log('🔍 INVOICE API: Using mock data for demo mode');
    
    try {
      const body = await request.json()
      console.log('🔍 INVOICE API: PUT body:', body)
      
      // Find the invoice in mock data
      const invoiceIndex = mockInvoices.findIndex(i => i.id === params.id)
      
      if (invoiceIndex === -1) {
        console.log('❌ INVOICE API: Invoice not found in mock data');
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      
      // Update the mock invoice
      const updatedInvoice = {
        ...mockInvoices[invoiceIndex],
        ...body,
        updatedAt: new Date().toISOString()
      }
      
      mockInvoices[invoiceIndex] = updatedInvoice
      
      console.log('✅ INVOICE API: Successfully updated invoice in mock data');
      return NextResponse.json(updatedInvoice);
    } catch (error) {
      console.error('❌ INVOICE API: Error updating mock invoice:', error);
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
  }
  try {
    log('PUT start id:', params.id)
    const body = await request.json()
    log('PUT body:', body)
    const {
      invoiceNumber,
      customerName,
      customerEmail,
      issueDate,
      dueDate,
      status,
      subtotal,
      tax,
      total,
      description,
      notes
    } = body

    // Validate required fields
    if (!invoiceNumber || !customerName || !customerEmail || !issueDate || !dueDate) {
      log('PUT validation failed: missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    log('PUT updating via raw SQL for SQL Server compatibility')
    
    // Check if invoice exists first using raw SQL
    const existingInvoiceResult = await prismaClient.$queryRaw`
      SELECT TOP 1 id FROM invoices WHERE id = ${params.id}
    ` as any[]
    
    if (!existingInvoiceResult || existingInvoiceResult.length === 0) {
      log('PUT invoice not found')
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update invoice using raw SQL
    const updateResult = await prismaClient.$executeRaw`
      UPDATE invoices 
      SET 
        invoiceNumber = ${invoiceNumber},
        issueDate = ${new Date(issueDate)},
        dueDate = ${new Date(dueDate)},
        status = ${status || 'DRAFT'},
        subtotal = ${subtotal || 0},
        tax = ${tax || 0},
        total = ${total || 0},
        description = ${description || ''},
        updatedAt = GETDATE()
      WHERE id = ${params.id}
    `
    
    log('PUT update result:', updateResult)
    
    // Fetch the updated invoice to return
    const updatedInvoiceResult = await prismaClient.$queryRaw`
      SELECT TOP 1 
        id, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, 
        description, createdAt, updatedAt
      FROM invoices 
      WHERE id = ${params.id}
    ` as any[]
    
    if (!updatedInvoiceResult || updatedInvoiceResult.length === 0) {
      throw new Error('Failed to fetch updated invoice')
    }
    
    const updatedInvoice = updatedInvoiceResult[0]
    
    return NextResponse.json({
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      customerName: customerName, // Use the provided customer name
      customerEmail: customerEmail, // Use the provided customer email
      issueDate: updatedInvoice.issueDate.toISOString().split('T')[0],
      dueDate: updatedInvoice.dueDate.toISOString().split('T')[0],
      status: updatedInvoice.status,
      subtotal: updatedInvoice.subtotal,
      tax: updatedInvoice.tax,
      total: updatedInvoice.total,
      description: updatedInvoice.description || '',
      notes: notes || '',
      createdAt: updatedInvoice.createdAt.toISOString(),
      updatedAt: updatedInvoice.updatedAt.toISOString()
    })

  } catch (error) {
    console.error('[API/invoices/:id] Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Delete specific invoice by ID
export async function DELETE(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    log('DELETE start id:', params.id)
    
    // Check if we can connect to the database
    try {
      await prismaClient.$connect()
      log('Database connection successful')
    } catch (connError) {
      log('Database connection failed:', connError)
      throw connError
    }
    
    // Check if invoice exists first using raw SQL
    const existingInvoiceResult = await prismaClient.$queryRaw`
      SELECT TOP 1 id FROM invoices WHERE id = ${params.id}
    ` as any[]
    
    if (!existingInvoiceResult || existingInvoiceResult.length === 0) {
      log('DELETE invoice not found')
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    
    // Delete invoice using raw SQL
    const deleteResult = await prismaClient.$executeRaw`
      DELETE FROM invoices WHERE id = ${params.id}
    `
    
    log('DELETE result:', deleteResult)
    
    if (deleteResult === 1) {
      log('DELETE success')
      return NextResponse.json(
        { success: true, message: 'Invoice deleted successfully' },
        { status: 200 }
      )
    } else {
      log('DELETE failed - no rows affected')
      return NextResponse.json(
        { error: 'Failed to delete invoice' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    log('DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prismaClient.$disconnect()
    log('Database connection closed')
  }
}
