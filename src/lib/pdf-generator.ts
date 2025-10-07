import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: { finalY: number }
    saveGraphicsState: () => jsPDF
    restoreGraphicsState: () => jsPDF
  }
}



export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface InvoiceData {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  issueDate: string
  dueDate: string
  status: string
  subtotal: number
  tax: number
  total: number
  description: string
  notes: string
  createdAt?: string
  updatedAt?: string
  lineItems?: InvoiceLineItem[]
}

export interface ContractData {
  id: string
  contractNumber: string
  startDate: string
  endDate: string
  status: string
  monthlyRate: number
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  boat: {
    id: string
    name: string
    registration: string
  }
  berthId?: string | null
  berth?: {
    id: string
    berthNumber: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface BoatData {
  id: string
  name: string
  registration: string
  length: number
  beam: number
  draft: number
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  marinaId: string
  createdAt?: string
  updatedAt?: string
}

export interface WorkOrderData {
  id: string
  workOrderNumber: string
  title: string
  description: string
  status: string
  priority: string
  assignedTo?: string
  estimatedCost: number
  actualCost: number
  startDate: string
  completionDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface BerthData {
  id: string
  berthNumber: string
  length: number
  beam: number
  depth: number
  status: string
  monthlyRate: number
  marinaId: string
  createdAt?: string
  updatedAt?: string
}

export class InvoicePDFGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20
  private lineHeight: number = 12

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
  }

  generateInvoicePDF(invoice: InvoiceData): jsPDF {
    try {
      this.currentY = 20
      
      // Add company header
      this.addCompanyHeader()
      
      // Add invoice details
      this.addInvoiceDetails(invoice)
      
      // Add customer information
      this.addCustomerInfo(invoice)
      
      // Add line items table
      this.addLineItemsTable(invoice)
      
      // Add totals
      this.addTotals(invoice)
      
      // Add footer
      this.addFooter(invoice)
      
      // Note: Status is DRAFT (watermark removed for compatibility)
      
      return this.doc
    } catch (error) {
      console.error('Error generating PDF:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to generate PDF: ${error.message}`)
      } else {
        throw new Error(`Failed to generate PDF: ${String(error)}`)
      }
    }
  }

  private addCompanyHeader(): void {
    // Company logo placeholder (you can replace with actual logo)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Marina Management Portal', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Professional Marina Services', this.margin, this.currentY)
    
    this.currentY += 6
    this.doc.text('123 Marina Way, Coastal City, UK', this.margin, this.currentY)
    this.currentY += 6
    this.doc.text('Phone: +44 123 456 7890', this.margin, this.currentY)
    this.currentY += 6
    this.doc.text('Email: info@marinaportal.co.uk', this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addInvoiceDetails(invoice: InvoiceData): void {
    const rightX = this.pageWidth - this.margin
    
    // Invoice title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('INVOICE', rightX - 30, this.currentY, { align: 'right' })
    
    this.currentY += 10
    
    // Invoice details
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Invoice Number: ${invoice.invoiceNumber}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`Issue Date: ${this.formatDate(invoice.issueDate)}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`Due Date: ${this.formatDate(invoice.dueDate)}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`Status: ${invoice.status}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`Invoice ID: ${invoice.id}`, rightX, this.currentY, { align: 'right' })
    
    this.currentY += 15
  }

  private addCustomerInfo(invoice: InvoiceData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Bill To:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(invoice.customerName, this.margin, this.currentY)
    this.currentY += 6
    this.doc.text(invoice.customerEmail, this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addLineItemsTable(invoice: InvoiceData): void {
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'italic')
      this.doc.text('No line items available', this.margin, this.currentY)
      this.currentY += 10
      return
    }

    // Table headers
    const headers = ['Description', 'Qty', 'Unit Price', 'Amount']
    const data = invoice.lineItems.map(item => [
      item.description,
      item.quantity.toString(),
      this.formatCurrency(item.unitPrice),
      this.formatCurrency(item.amount)
    ])

    // Add description if available
    if (invoice.description) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Description: ${invoice.description}`, this.margin, this.currentY)
      this.currentY += 8
    }

    // Check if autoTable method exists
    if (typeof (this.doc as any).autoTable !== 'function') {
      // Fallback: Create a simple text-based table
      this.addSimpleTable(headers, data)
      return
    }

    // Create table using jsPDF-AutoTable
    try {
      this.doc.autoTable({
        startY: this.currentY,
        head: [headers],
        body: data,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 80 }, // Description
          1: { cellWidth: 20, halign: 'center' }, // Qty
          2: { cellWidth: 30, halign: 'right' }, // Unit Price
          3: { cellWidth: 30, halign: 'right' }  // Amount
        }
      })

      // Update current Y position after table
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10
         } catch (error) {
       // Fallback: Create a simple text-based table
       this.addSimpleTable(headers, data)
     }
  }

  private addSimpleTable(headers: string[], data: string[][]): void {
    // Add headers
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    let x = this.margin
    headers.forEach((header, index) => {
      this.doc.text(header, x, this.currentY)
      x += 40 // Simple column spacing
    })
    this.currentY += 8

    // Add data rows
    this.doc.setFont('helvetica', 'normal')
    data.forEach(row => {
      x = this.margin
      row.forEach((cell, index) => {
        this.doc.text(cell, x, this.currentY)
        x += 40 // Simple column spacing
      })
      this.currentY += 6
    })
    
    this.currentY += 10
  }

  private addTotals(invoice: InvoiceData): void {
    const rightX = this.pageWidth - this.margin
    const labelX = rightX - 60
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    // Subtotal
    this.doc.text('Subtotal:', labelX, this.currentY, { align: 'right' })
    this.doc.text(this.formatCurrency(invoice.subtotal), rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    // Tax
    this.doc.text('Tax:', labelX, this.currentY, { align: 'right' })
    this.doc.text(this.formatCurrency(invoice.tax), rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    // Total
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Total:', labelX, this.currentY, { align: 'right' })
    this.doc.text(this.formatCurrency(invoice.total), rightX, this.currentY, { align: 'right' })
    
    this.currentY += 15
  }

  private addFooter(invoice: InvoiceData): void {
    // Add notes if available
    if (invoice.notes) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'italic')
      this.doc.text('Notes:', this.margin, this.currentY)
      this.currentY += 5
      this.doc.text(invoice.notes, this.margin, this.currentY)
      this.currentY += 10
    }
    
    // Add payment terms
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Payment Terms: Net 30 days', this.margin, this.currentY)
    this.currentY += 5
    this.doc.text('Please include invoice number with payment', this.margin, this.currentY)
    
    // Add generated timestamp
    const generatedAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    this.doc.text(`Generated: ${generatedAt}`, this.margin, this.currentY + 10)
    
    // Add invoice creation date if available
    if (invoice.createdAt) {
      this.doc.text(`Created: ${this.formatDate(invoice.createdAt)}`, this.margin, this.currentY + 20)
    }
  }



  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  private formatCurrency(amount: number): string {
    try {
      if (isNaN(amount) || !isFinite(amount)) {
        return '£0.00'
      }
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      console.error('Error formatting currency:', error)
      return '£0.00'
    }
  }
}

export class ContractPDFGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20
  private lineHeight: number = 12

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
  }

  generateContractPDF(contract: ContractData): jsPDF {
    try {
      this.currentY = 20
      
      // Add company header
      this.addCompanyHeader()
      
      // Add contract details
      this.addContractDetails(contract)
      
      // Add parties information
      this.addPartiesInfo(contract)
      
      // Add terms and conditions
      this.addTermsAndConditions(contract)
      
      // Add footer
      this.addFooter(contract)
      
      // Note: Status is PENDING (watermark removed for compatibility)
      
      return this.doc
    } catch (error) {
      console.error('Error generating contract PDF:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to generate contract PDF: ${error.message}`)
      } else {
        throw new Error(`Failed to generate contract PDF: ${String(error)}`)
      }
    }
  }

  private addCompanyHeader(): void {
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Marina Management Portal', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Professional Marina Services', this.margin, this.currentY)
    
    this.currentY += 6
    this.doc.text('123 Marina Way, Coastal City, UK', this.margin, this.currentY)
    this.currentY += 6
    this.doc.text('Phone: +44 123 456 7890', this.margin, this.currentY)
    this.currentY += 6
    this.doc.text('Email: info@marinaportal.co.uk', this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addContractDetails(contract: ContractData): void {
    const rightX = this.pageWidth - this.margin
    
    // Contract title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('MARINA BERTH CONTRACT', rightX - 60, this.currentY, { align: 'right' })
    
    this.currentY += 10
    
    // Contract details
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Contract Number: ${contract.contractNumber}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`Start Date: ${this.formatDate(contract.startDate)}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`End Date: ${this.formatDate(contract.endDate)}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`Status: ${contract.status}`, rightX, this.currentY, { align: 'right' })
    this.currentY += 6
    
    this.doc.text(`Monthly Rate: ${this.formatCurrency(contract.monthlyRate)}`, rightX, this.currentY, { align: 'right' })
    
    this.currentY += 15
  }

  private addPartiesInfo(contract: ContractData): void {
    // Customer information
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Contractor (Customer):', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`${contract.customer.firstName} ${contract.customer.lastName}`, this.margin, this.currentY)
    this.currentY += 6
    this.doc.text(contract.customer.email, this.margin, this.currentY)
    
    this.currentY += 15
    
    // Boat information
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Vessel Details:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Name: ${contract.boat.name}`, this.margin, this.currentY)
    this.currentY += 6
    this.doc.text(`Registration: ${contract.boat.registration}`, this.margin, this.currentY)
    
    if (contract.berth) {
      this.currentY += 6
      this.doc.text(`Assigned Berth: ${contract.berth.berthNumber}`, this.margin, this.currentY)
    }
    
    this.currentY += 15
  }

  private addTermsAndConditions(contract: ContractData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Terms and Conditions:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const terms = [
      '1. Monthly payment of £' + contract.monthlyRate + ' is due on the 1st of each month',
      '2. Contract runs from ' + this.formatDate(contract.startDate) + ' to ' + this.formatDate(contract.endDate),
      '3. Customer is responsible for vessel insurance and maintenance',
      '4. Marina reserves the right to terminate for non-payment',
      '5. All marina rules and regulations must be followed'
    ]
    
    terms.forEach(term => {
      this.doc.text(term, this.margin, this.currentY)
      this.currentY += 5
    })
    
    this.currentY += 10
  }

  private addFooter(contract: ContractData): void {
    // Add generated timestamp
    const generatedAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    this.doc.text(`Generated: ${generatedAt}`, this.margin, this.currentY + 10)
    
    // Add contract creation date if available
    if (contract.createdAt) {
      this.doc.text(`Created: ${this.formatDate(contract.createdAt)}`, this.margin, this.currentY + 20)
    }
  }



  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  private formatCurrency(amount: number): string {
    try {
      if (isNaN(amount) || !isFinite(amount)) {
        return '£0.00'
      }
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      console.error('Error formatting currency:', error)
      return '£0.00'
    }
  }
}

export class BoatPDFGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20
  private lineHeight: number = 12

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
  }

  generateBoatPDF(boat: BoatData): jsPDF {
    try {
      this.currentY = 20
      
      this.addCompanyHeader()
      this.addBoatDetails(boat)
      this.addCustomerInfo(boat)
      this.addSpecifications(boat)
      this.addFooter(boat)
      
      return this.doc
    } catch (error) {
      console.error('Error generating boat PDF:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to generate boat PDF: ${error.message}`)
      } else {
        throw new Error(`Failed to generate boat PDF: ${String(error)}`)
      }
    }
  }

  private addCompanyHeader(): void {
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Marina Management Portal', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Vessel Registration Certificate', this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addBoatDetails(boat: BoatData): void {
    const rightX = this.pageWidth - this.margin
    
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('VESSEL DETAILS', rightX - 40, this.currentY, { align: 'right' })
    
    this.currentY += 15
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Vessel Name: ${boat.name}`, this.margin, this.currentY)
    this.currentY += 8
    
    this.doc.text(`Registration: ${boat.registration}`, this.margin, this.currentY)
    this.currentY += 8
    
    this.doc.text(`Vessel ID: ${boat.id}`, this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addCustomerInfo(boat: BoatData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Customer Information:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Name: ${boat.owner.firstName} ${boat.owner.lastName}`, this.margin, this.currentY)
    this.currentY += 6
    this.doc.text(`Email: ${boat.owner.email}`, this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addSpecifications(boat: BoatData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Vessel Specifications:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    const specs = [
      `Length: ${boat.length} meters`,
      `Beam: ${boat.beam} meters`,
      `Draft: ${boat.draft} meters`
    ]
    
    specs.forEach(spec => {
      this.doc.text(spec, this.margin, this.currentY)
      this.currentY += 6
    })
    
    this.currentY += 10
  }

  private addFooter(boat: BoatData): void {
    const generatedAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    this.doc.text(`Generated: ${generatedAt}`, this.margin, this.currentY + 10)
    
    if (boat.createdAt) {
      this.doc.text(`Registered: ${this.formatDate(boat.createdAt)}`, this.margin, this.currentY + 20)
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }
}

export class WorkOrderPDFGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20
  private lineHeight: number = 12

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
  }

  generateWorkOrderPDF(workOrder: WorkOrderData): jsPDF {
    try {
      this.currentY = 20
      
      this.addCompanyHeader()
      this.addWorkOrderDetails(workOrder)
      this.addWorkOrderDescription(workOrder)
      this.addCostsAndTimeline(workOrder)
      this.addFooter(workOrder)
      
      // Note: Status is PENDING (watermark removed for compatibility)
      
      return this.doc
    } catch (error) {
      console.error('Error generating work order PDF:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to generate work order PDF: ${error.message}`)
      } else {
        throw new Error(`Failed to generate work order PDF: ${String(error)}`)
      }
    }
  }

  private addCompanyHeader(): void {
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Marina Management Portal', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Work Order', this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addWorkOrderDetails(workOrder: WorkOrderData): void {
    const rightX = this.pageWidth - this.margin
    
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('WORK ORDER', rightX - 40, this.currentY, { align: 'right' })
    
    this.currentY += 15
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Work Order #: ${workOrder.workOrderNumber}`, this.margin, this.currentY)
    this.currentY += 8
    
    this.doc.text(`Title: ${workOrder.title}`, this.margin, this.currentY)
    this.currentY += 8
    
    this.doc.text(`Status: ${workOrder.status}`, this.margin, this.currentY)
    this.currentY += 8
    
    this.doc.text(`Priority: ${workOrder.priority}`, this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addWorkOrderDescription(workOrder: WorkOrderData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Description:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    // Split description into lines if it's too long
    const maxWidth = this.pageWidth - (2 * this.margin)
    const words = workOrder.description.split(' ')
    let line = ''
    let lines: string[] = []
    
    words.forEach(word => {
      const testLine = line + word + ' '
      if (this.doc.getTextWidth(testLine) > maxWidth) {
        lines.push(line.trim())
        line = word + ' '
      } else {
        line = testLine
      }
    })
    lines.push(line.trim())
    
    lines.forEach(line => {
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += 6
    })
    
    this.currentY += 10
  }

  private addCostsAndTimeline(workOrder: WorkOrderData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Costs and Timeline:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Estimated Cost: ${this.formatCurrency(workOrder.estimatedCost)}`, this.margin, this.currentY)
    this.currentY += 6
    
    if (workOrder.actualCost > 0) {
      this.doc.text(`Actual Cost: ${this.formatCurrency(workOrder.actualCost)}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    this.doc.text(`Start Date: ${this.formatDate(workOrder.startDate)}`, this.margin, this.currentY)
    this.currentY += 6
    
    if (workOrder.completionDate) {
      this.doc.text(`Completion Date: ${this.formatDate(workOrder.completionDate)}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    if (workOrder.assignedTo) {
      this.doc.text(`Assigned To: ${workOrder.assignedTo}`, this.margin, this.currentY)
    }
    
    this.currentY += 10
  }

  private addFooter(workOrder: WorkOrderData): void {
    const generatedAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    this.doc.text(`Generated: ${generatedAt}`, this.margin, this.currentY + 10)
    
    if (workOrder.createdAt) {
      this.doc.text(`Created: ${this.formatDate(workOrder.createdAt)}`, this.margin, this.currentY + 20)
    }
  }

  // Watermark method removed due to jsPDF compatibility issues

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  private formatCurrency(amount: number): string {
    try {
      if (isNaN(amount) || !isFinite(amount)) {
        return '£0.00'
      }
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      console.error('Error formatting currency:', error)
      return '£0.00'
    }
  }
}

export class CustomerPDFGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20
  private lineHeight: number = 12

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
  }

  generateCustomerPDF(customer: CustomerData): jsPDF {
    try {
      this.currentY = 20
      
      this.addCompanyHeader()
      this.addCustomerDetails(customer)
      this.addContactInfo(customer)
      this.addStatusInfo(customer)
      this.addFooter(customer)
      
      return this.doc
        } catch (error) {
      console.error('Error generating customer PDF:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to generate customer PDF: ${error.message}`)
      } else {
        throw new Error(`Failed to generate customer PDF: ${String(error)}`)
      }
    }
  }

  private addCompanyHeader(): void {
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Marina Management Portal', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Customer Information', this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addCustomerDetails(customer: CustomerData): void {
    const rightX = this.pageWidth - this.margin
    
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('CUSTOMER DETAILS', rightX - 50, this.currentY, { align: 'right' })
    
    this.currentY += 15
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Name: ${customer.firstName} ${customer.lastName}`, this.margin, this.currentY)
    this.currentY += 8
    
    this.doc.text(`Customer ID: ${customer.id}`, this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addContactInfo(customer: CustomerData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Contact Information:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Email: ${customer.email}`, this.margin, this.currentY)
    this.currentY += 6
    
    if (customer.phone) {
      this.doc.text(`Phone: ${customer.phone}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    if (customer.address) {
      this.doc.text(`Address: ${customer.address}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    this.currentY += 10
  }

  private addStatusInfo(customer: CustomerData): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Status Information:', this.margin, this.currentY)
    
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Active Status: ${customer.isActive ? 'Active' : 'Inactive'}`, this.margin, this.currentY)
    
    this.currentY += 10
  }

  private addFooter(customer: CustomerData): void {
    const generatedAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    this.doc.text(`Generated: ${generatedAt}`, this.margin, this.currentY + 10)
    
    if (customer.createdAt) {
      this.doc.text(`Registered: ${this.formatDate(customer.createdAt)}`, this.margin, this.currentY + 20)
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }
}

export function generateInvoicePDF(invoice: InvoiceData): jsPDF {
  const generator = new InvoicePDFGenerator()
  return generator.generateInvoicePDF(invoice)
}

export function downloadInvoicePDF(invoice: InvoiceData, filename?: string): void {
  try {
    const pdf = generateInvoicePDF(invoice)
    const defaultFilename = `invoice-${invoice.invoiceNumber}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw new Error('Failed to download PDF')
  }
}

// Utility function to generate PDF as blob for bulk operations
export function generateInvoicePDFBlob(invoice: InvoiceData): Blob {
  try {
    const pdf = generateInvoicePDF(invoice)
    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating PDF blob:', error)
    throw new Error('Failed to generate PDF blob')
  }
}

// New export functions for different document types
export function generateContractPDF(contract: ContractData): jsPDF {
  const generator = new ContractPDFGenerator()
  return generator.generateContractPDF(contract)
}

export function downloadContractPDF(contract: ContractData, filename?: string): void {
  try {
    const pdf = generateContractPDF(contract)
    const defaultFilename = `contract-${contract.contractNumber}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading contract PDF:', error)
    throw new Error('Failed to download contract PDF')
  }
}

export function generateBoatPDF(boat: BoatData): jsPDF {
  const generator = new BoatPDFGenerator()
  return generator.generateBoatPDF(boat)
}

export function downloadBoatPDF(boat: BoatData, filename?: string): void {
  try {
    const pdf = generateBoatPDF(boat)
    const defaultFilename = `boat-${boat.registration}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading boat PDF:', error)
    throw new Error('Failed to download boat PDF')
  }
}

export function generateWorkOrderPDF(workOrder: WorkOrderData): jsPDF {
  const generator = new WorkOrderPDFGenerator()
  return generator.generateWorkOrderPDF(workOrder)
}

export function downloadWorkOrderPDF(workOrder: WorkOrderData, filename?: string): void {
  try {
    const pdf = generateWorkOrderPDF(workOrder)
    const defaultFilename = `workorder-${workOrder.workOrderNumber}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading work order PDF:', error)
    throw new Error('Failed to download work order PDF')
  }
}

export function generateCustomerPDF(customer: CustomerData): jsPDF {
  const generator = new CustomerPDFGenerator()
  return generator.generateCustomerPDF(customer)
}

export function downloadCustomerPDF(customer: CustomerData, filename?: string): void {
  try {
    const pdf = generateCustomerPDF(customer)
    const defaultFilename = `customer-${customer.lastName}-${customer.firstName}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading customer PDF:', error)
    throw new Error('Failed to download customer PDF')
  }
}

// Utility function to generate PDF as blob for bulk operations
export function generateContractPDFBlob(contract: ContractData): Blob {
  try {
    const pdf = generateContractPDF(contract)
    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating contract PDF blob:', error)
    throw new Error('Failed to generate contract PDF blob')
  }
}

export function generateBoatPDFBlob(boat: BoatData): Blob {
  try {
    const pdf = generateBoatPDF(boat)
    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating boat PDF blob:', error)
    throw new Error('Failed to generate boat PDF blob')
  }
}

export function generateWorkOrderPDFBlob(workOrder: WorkOrderData): Blob {
  try {
    const pdf = generateWorkOrderPDF(workOrder)
    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating work order PDF blob:', error)
    throw new Error('Failed to generate work order PDF blob')
  }
}

export function generateCustomerPDFBlob(customer: CustomerData): Blob {
  try {
    const pdf = generateCustomerPDF(customer)
    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating customer PDF blob:', error)
    throw new Error('Failed to generate customer PDF blob')
  }
}
