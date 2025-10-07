import { prisma, createNotification } from './db'
import { logAuditEvent } from './db'

// ============================================================================
// NOTIFICATION SERVICE INTERFACES
// ============================================================================

export interface NotificationData {
  type: 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH'
  title: string
  message: string
  userId: string
  marinaId?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  scheduledAt?: Date
  metadata?: Record<string, any>
}

export interface EmailNotificationData extends NotificationData {
  type: 'EMAIL'
  to: string
  subject: string
  template?: string
  templateData?: Record<string, any>
}

export interface SMSNotificationData extends NotificationData {
  type: 'SMS'
  to: string
  message: string
}

export interface InAppNotificationData extends NotificationData {
  type: 'IN_APP'
  userId: string
  actionUrl?: string
  actionText?: string
}

export interface NotificationResult {
  success: boolean
  notificationId?: string
  externalId?: string
  error?: string
}

// ============================================================================
// EMAIL NOTIFICATION SERVICE
// ============================================================================

export class EmailNotificationService {
  private postmarkApiKey?: string
  private resendApiKey?: string

  constructor() {
    this.postmarkApiKey = process.env.POSTMARK_API_KEY
    this.resendApiKey = process.env.RESEND_API_KEY
  }

  async sendEmail(data: EmailNotificationData): Promise<NotificationResult> {
    try {
      // Try Postmark first, then Resend as fallback
      if (this.postmarkApiKey) {
        return await this.sendViaPostmark(data)
      } else if (this.resendApiKey) {
        return await this.sendViaResend(data)
      } else {
        throw new Error('No email service configured')
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async sendViaPostmark(data: EmailNotificationData): Promise<NotificationResult> {
    // In a real implementation, you would use the Postmark API
    // For now, simulating the API call
    
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': this.postmarkApiKey!,
      },
      body: JSON.stringify({
        From: 'noreply@marinaportal.com',
        To: data.to,
        Subject: data.subject,
        TextBody: data.message,
        HtmlBody: this.generateHtmlEmail(data),
        MessageStream: 'outbound',
      }),
    })

    if (!response.ok) {
      throw new Error(`Postmark API error: ${response.status}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      externalId: result.MessageID,
    }
  }

  private async sendViaResend(data: EmailNotificationData): Promise<NotificationResult> {
    // In a real implementation, you would use the Resend API
    // For now, simulating the API call
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@marinaportal.com',
        to: [data.to],
        subject: data.subject,
        text: data.message,
        html: this.generateHtmlEmail(data),
      }),
    })

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      externalId: result.id,
    }
  }

  private generateHtmlEmail(data: EmailNotificationData): string {
    const template = data.template || 'default'
    
    switch (template) {
      case 'invoice':
        return this.generateInvoiceEmail(data)
      case 'contract':
        return this.generateContractEmail(data)
      case 'booking':
        return this.generateBookingEmail(data)
      case 'workOrder':
        return this.generateWorkOrderEmail(data)
      default:
        return this.generateDefaultEmail(data)
    }
  }

  private generateDefaultEmail(data: EmailNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">${data.title}</h2>
            <p>${data.message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message from Marina Management Portal.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateInvoiceEmail(data: EmailNotificationData): string {
    const invoice = data.metadata?.invoice
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice?.invoiceNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Invoice ${invoice?.invoiceNumber}</h2>
            <p>Dear ${data.metadata?.ownerName},</p>
            <p>Your invoice for ${invoice?.description || 'marina services'} is ready.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Amount Due:</strong> $${invoice?.total}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice?.dueDate).toLocaleDateString()}</p>
            </div>
            <p>Please log in to your portal to view and pay this invoice.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message from Marina Management Portal.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateContractEmail(data: EmailNotificationData): string {
    const contract = data.metadata?.contract
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contract ${contract?.contractNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Contract ${contract?.contractNumber}</h2>
            <p>Dear ${data.metadata?.ownerName},</p>
            <p>Your marina contract has been updated.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Start Date:</strong> ${new Date(contract?.startDate).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> ${new Date(contract?.endDate).toLocaleDateString()}</p>
              <p><strong>Monthly Rate:</strong> $${contract?.monthlyRate}</p>
            </div>
            <p>Please log in to your portal to view the full contract details.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message from Marina Management Portal.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateBookingEmail(data: EmailNotificationData): string {
    const booking = data.metadata?.booking
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Booking Confirmation</h2>
            <p>Dear ${data.metadata?.ownerName},</p>
            <p>Your marina booking has been confirmed.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Start Date:</strong> ${new Date(booking?.startDate).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> ${new Date(booking?.endDate).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> $${booking?.totalAmount}</p>
            </div>
            <p>Please log in to your portal to view the full booking details.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message from Marina Management Portal.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateWorkOrderEmail(data: EmailNotificationData): string {
    const workOrder = data.metadata?.workOrder
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Work Order ${workOrder?.id}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Work Order ${workOrder?.id}</h2>
            <p>Dear ${data.metadata?.ownerName},</p>
            <p>Your work order has been updated.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Title:</strong> ${workOrder?.title}</p>
              <p><strong>Status:</strong> ${workOrder?.status}</p>
              <p><strong>Priority:</strong> ${workOrder?.priority}</p>
              <p><strong>Requested Date:</strong> ${new Date(workOrder?.requestedDate).toLocaleDateString()}</p>
            </div>
            <p>Please log in to your portal to view the full work order details.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message from Marina Management Portal.
            </p>
          </div>
        </body>
      </html>
    `
  }
}

// ============================================================================
// SMS NOTIFICATION SERVICE
// ============================================================================

export class SMSNotificationService {
  private twilioAccountSid?: string
  private twilioAuthToken?: string
  private twilioPhoneNumber?: string

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
  }

  async sendSMS(data: SMSNotificationData): Promise<NotificationResult> {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
        throw new Error('Twilio credentials not configured')
      }

      // In a real implementation, you would use the Twilio API
      // For now, simulating the API call
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${this.twilioAccountSid}:${this.twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.twilioPhoneNumber,
            To: data.to,
            Body: data.message,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        externalId: result.sid,
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// ============================================================================
// IN-APP NOTIFICATION SERVICE
// ============================================================================

export class InAppNotificationService {
  async createNotification(data: InAppNotificationData): Promise<NotificationResult> {
    try {
      const notification = await createNotification({
        type: 'IN_APP',
        title: data.title,
        message: data.message,
        userId: data.userId,
        marinaId: data.marinaId,
        priority: data.priority || 'MEDIUM',
        metadata: JSON.stringify({
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          ...data.metadata,
        }),
      })

      return {
        success: true,
        notificationId: notification.id,
      }
    } catch (error) {
      console.error('In-app notification creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// ============================================================================
// MAIN NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  private static instance: NotificationService
  private emailService: EmailNotificationService
  private smsService: SMSNotificationService
  private inAppService: InAppNotificationService

  private constructor() {
    this.emailService = new EmailNotificationService()
    this.smsService = new SMSNotificationService()
    this.inAppService = new InAppNotificationService()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async sendNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      let result: NotificationResult

      switch (data.type) {
        case 'EMAIL':
          result = await this.emailService.sendEmail(data as EmailNotificationData)
          break
        case 'SMS':
          result = await this.smsService.sendSMS(data as SMSNotificationData)
          break
        case 'IN_APP':
          result = await this.inAppService.createNotification(data as InAppNotificationData)
          break
        case 'PUSH':
          // Push notifications would be implemented here
          result = { success: false, error: 'Push notifications not implemented yet' }
          break
        default:
          result = { success: false, error: `Unknown notification type: ${data.type}` }
      }

      // Create notification record in database
      if (result.success) {
        await createNotification({
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          marinaId: data.marinaId,
          priority: data.priority || 'MEDIUM',

          metadata: JSON.stringify({
            externalId: result.externalId,
            ...data.metadata,
          }),
        })
      }

      // Log audit event
      await logAuditEvent({
        eventType: 'NOTIFICATION_SENT',
        entityType: 'NOTIFICATION',
        entityId: result.notificationId || 'unknown',
        action: 'SEND_NOTIFICATION',
        marinaId: data.marinaId || 'system',
        userId: data.userId,
        metadata: JSON.stringify({
          type: data.type,
          success: result.success,
          error: result.error,
        }),
      })

      return result
    } catch (error) {
      console.error('Notification sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendBulkNotifications(notifications: NotificationData[]): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []
    
    for (const notification of notifications) {
      const result = await this.sendNotification(notification)
      results.push(result)
      
      // Add small delay between notifications to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  async sendScheduledNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await prisma.notification.findMany({
        where: {
          scheduledAt: {
            lte: new Date(),
          },
          sentAt: null,
          type: {
            in: ['EMAIL', 'SMS'],
          },
        },
        include: {
          user: true,
        },
      })

      for (const notification of scheduledNotifications) {
        const notificationData: NotificationData = {
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          userId: notification.userId,
          marinaId: notification.marinaId || undefined,
          priority: notification.priority as any,
          metadata: notification.metadata as any,
        }

        const result = await this.sendNotification(notificationData)

        if (result.success) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { sentAt: new Date() },
          })
        }
      }
    } catch (error) {
      console.error('Scheduled notification processing failed:', error)
    }
  }
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export const notificationTemplates = {
  invoiceOverdue: (invoice: any, owner: any) => ({
    title: 'Invoice Overdue',
    message: `Your invoice ${invoice.invoiceNumber} for $${invoice.total} is overdue. Please pay immediately to avoid late fees.`,
    metadata: { invoice, ownerName: `${owner.firstName} ${owner.lastName}` },
  }),

  contractExpiring: (contract: any, owner: any) => ({
    title: 'Contract Expiring Soon',
    message: `Your contract ${contract.contractNumber} expires on ${new Date(contract.endDate).toLocaleDateString()}. Please renew to maintain your berth.`,
    metadata: { contract, ownerName: `${owner.firstName} ${owner.lastName}` },
  }),

  bookingConfirmed: (booking: any, owner: any) => ({
    title: 'Booking Confirmed',
    message: `Your booking from ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()} has been confirmed.`,
    metadata: { booking, ownerName: `${owner.firstName} ${owner.lastName}` },
  }),

  workOrderUpdate: (workOrder: any, owner: any) => ({
    title: 'Work Order Update',
    message: `Your work order "${workOrder.title}" has been updated to status: ${workOrder.status}.`,
    metadata: { workOrder, ownerName: `${owner.firstName} ${owner.lastName}` },
  }),

  pendingOperationAlert: (operation: any, marina: any) => ({
    title: 'Pending Operation Alert',
    message: `There are ${operation.count} pending operations for marina ${marina.name} that require attention.`,
    metadata: { operation, marina },
  }),
}

// ============================================================================
// EXPORTS
// ============================================================================

export const notificationService = NotificationService.getInstance()

