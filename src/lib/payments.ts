import Stripe from 'stripe'
import { prisma } from './db'
import { logAuditEvent } from './db'

// ============================================================================
// PAYMENT GATEWAY INTERFACES
// ============================================================================

export interface PaymentGateway {
  name: string
  createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentIntentResult>
  processPayment(paymentData: ProcessPaymentData): Promise<PaymentResult>
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult>
}

export interface CreatePaymentIntentData {
  amount: number
  currency: string
  invoiceId: string
  marinaId: string
  ownerId: string
  metadata?: Record<string, any>
}

export interface PaymentIntentResult {
  success: boolean
  paymentIntentId: string
  clientSecret?: string
  redirectUrl?: string
  error?: string
}

export interface ProcessPaymentData {
  paymentIntentId: string
  paymentMethod: any
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  transactionId: string
  status: string
  error?: string
}

export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  error?: string
}

export interface PaymentStatusResult {
  success: boolean
  status: string
  amount: number
  currency: string
  error?: string
}

// ============================================================================
// STRIPE PAYMENT GATEWAY
// ============================================================================

class StripeGateway implements PaymentGateway {
  private stripe: Stripe
  public name = 'STRIPE'

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required')
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    })
  }

  async createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentIntentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          invoiceId: data.invoiceId,
          marinaId: data.marinaId,
          ownerId: data.ownerId,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      // Log audit event
      await logAuditEvent({
        eventType: 'PAYMENT_INTENT_CREATED',
        entityType: 'INVOICE',
        entityId: data.invoiceId,
        action: 'CREATE_PAYMENT_INTENT',
        marinaId: data.marinaId,
        userId: data.ownerId, // Using ownerId as userId for customer payments
        metadata: JSON.stringify({
          stripePaymentIntentId: paymentIntent.id,
          amount: data.amount,
          currency: data.currency,
        }),
      })

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
      }
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error)
      return {
        success: false,
        paymentIntentId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async processPayment(paymentData: ProcessPaymentData): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentData.paymentIntentId
      )

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id,
          status: 'completed',
        }
      }

      if (paymentIntent.status === 'requires_payment_method') {
        return {
          success: false,
          transactionId: paymentIntent.id,
          status: 'requires_payment_method',
          error: 'Payment method is required',
        }
      }

      return {
        success: false,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        error: 'Payment not completed',
      }
    } catch (error) {
      console.error('Stripe payment processing failed:', error)
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentId,
        ...(amount && { amount: Math.round(amount * 100) }),
      })

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
      }
    } catch (error) {
      console.error('Stripe refund failed:', error)
      return {
        success: false,
        refundId: '',
        amount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId)
      
      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
      }
    } catch (error) {
      console.error('Stripe payment status check failed:', error)
      return {
        success: false,
        status: 'unknown',
        amount: 0,
        currency: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// ============================================================================
// CARDSTREAM PAYMENT GATEWAY
// ============================================================================

class CardstreamGateway implements PaymentGateway {
  public name = 'CARDSTREAM'

  constructor() {
    const merchantId = process.env.CARDSTREAM_MERCHANT_ID
    const secretKey = process.env.CARDSTREAM_SECRET_KEY
    
    if (!merchantId || !secretKey) {
      throw new Error('CARDSTREAM_MERCHANT_ID and CARDSTREAM_SECRET_KEY are required')
    }
  }

  async createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentIntentResult> {
    try {
      // Cardstream requires redirect to their hosted payment page
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // In a real implementation, you would create an order with Cardstream API
      // and get a redirect URL to their payment page
      
      // For now, returning a mock redirect URL
      const redirectUrl = `${process.env.CARDSTREAM_API_URL}/payment/${orderId}`

      // Log audit event
      await logAuditEvent({
        eventType: 'PAYMENT_INTENT_CREATED',
        entityType: 'INVOICE',
        entityId: data.invoiceId,
        action: 'CREATE_PAYMENT_INTENT',
        marinaId: data.marinaId,
        userId: data.ownerId,
        metadata: JSON.stringify({
          cardstreamOrderId: orderId,
          amount: data.amount,
          currency: data.currency,
        }),
      })

      return {
        success: true,
        paymentIntentId: orderId,
        redirectUrl,
      }
    } catch (error) {
      console.error('Cardstream payment intent creation failed:', error)
      return {
        success: false,
        paymentIntentId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async processPayment(paymentData: ProcessPaymentData): Promise<PaymentResult> {
    try {
      // In a real implementation, you would check the payment status
      // with Cardstream API using the order ID
      
      // For now, returning a mock result
      return {
        success: true,
        transactionId: paymentData.paymentIntentId,
        status: 'completed',
      }
    } catch (error) {
      console.error('Cardstream payment processing failed:', error)
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      // In a real implementation, you would process refund with Cardstream API
      
      // For now, returning a mock result
      return {
        success: true,
        refundId: `refund_${Date.now()}`,
        amount: amount || 0,
      }
    } catch (error) {
      console.error('Cardstream refund failed:', error)
      return {
        success: false,
        refundId: '',
        amount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    try {
      // In a real implementation, you would check payment status with Cardstream API
      
      // For now, returning a mock result
      return {
        success: true,
        status: 'completed',
        amount: 0,
        currency: 'GBP',
      }
    } catch (error) {
      console.error('Cardstream payment status check failed:', error)
      return {
        success: false,
        status: 'unknown',
        amount: 0,
        currency: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// ============================================================================
// PAYMENT GATEWAY FACTORY
// ============================================================================

export class PaymentGatewayFactory {
  private static gateways: Map<string, PaymentGateway> = new Map()

  static registerGateway(name: string, gateway: PaymentGateway) {
    this.gateways.set(name.toUpperCase(), gateway)
  }

  static getGateway(name: string): PaymentGateway {
    const gateway = this.gateways.get(name.toUpperCase())
    if (!gateway) {
      throw new Error(`Payment gateway '${name}' not found`)
    }
    return gateway
  }

  static getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys())
  }
}

// ============================================================================
// PAYMENT PROCESSING SERVICE
// ============================================================================

export class PaymentService {
  private static instance: PaymentService
  private gateways: Map<string, PaymentGateway>

  private constructor() {
    this.gateways = new Map()
    this.initializeGateways()
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  private initializeGateways() {
    try {
      // Register Stripe gateway
      const stripeGateway = new StripeGateway()
      this.gateways.set('STRIPE', stripeGateway)
      PaymentGatewayFactory.registerGateway('STRIPE', stripeGateway)
    } catch (error) {
      console.warn('Stripe gateway not available:', error)
    }

    try {
      // Register Cardstream gateway
      const cardstreamGateway = new CardstreamGateway()
      this.gateways.set('CARDSTREAM', cardstreamGateway)
      PaymentGatewayFactory.registerGateway('CARDSTREAM', cardstreamGateway)
    } catch (error) {
      console.warn('Cardstream gateway not available:', error)
    }
  }

  async createPaymentIntent(
    gateway: string,
    data: CreatePaymentIntentData
  ): Promise<PaymentIntentResult> {
    const paymentGateway = this.gateways.get(gateway.toUpperCase())
    if (!paymentGateway) {
      return {
        success: false,
        paymentIntentId: '',
        error: `Payment gateway '${gateway}' not available`,
      }
    }

    return await paymentGateway.createPaymentIntent(data)
  }

  async processPayment(
    gateway: string,
    paymentData: ProcessPaymentData
  ): Promise<PaymentResult> {
    const paymentGateway = this.gateways.get(gateway.toUpperCase())
    if (!paymentGateway) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: `Payment gateway '${gateway}' not available`,
      }
    }

    return await paymentGateway.processPayment(paymentData)
  }

  async refundPayment(
    gateway: string,
    paymentId: string,
    amount?: number
  ): Promise<RefundResult> {
    const paymentGateway = this.gateways.get(gateway.toUpperCase())
    if (!paymentGateway) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        error: `Payment gateway '${gateway}' not available`,
      }
    }

    return await paymentGateway.refundPayment(paymentId, amount)
  }

  async getPaymentStatus(
    gateway: string,
    paymentId: string
  ): Promise<PaymentStatusResult> {
    const paymentGateway = this.gateways.get(gateway.toUpperCase())
    if (!paymentGateway) {
      return {
        success: false,
        status: 'unknown',
        amount: 0,
        currency: '',
        error: `Payment gateway '${gateway}' not available`,
      }
    }

    return await paymentGateway.getPaymentStatus(paymentId)
  }

  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys())
  }
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

export async function handleStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<void> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    const event = stripe.webhooks.constructEvent(payload, signature, secret)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handleStripePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Stripe webhook handling failed:', error)
    throw error
  }
}

async function handleStripePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { invoiceId, marinaId, customerId } = paymentIntent.metadata

  if (invoiceId && marinaId && customerId) {
    // Update payment record
    await prisma.payment.create({
      data: {
        externalId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        paymentDate: new Date(),
        status: 'COMPLETED',
        gateway: 'STRIPE',
        gatewayTransactionId: paymentIntent.id,
        marinaId,
        customerId,
        invoiceId,
      },
    })

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    })

    // Log audit event
    await logAuditEvent({
      eventType: 'PAYMENT_COMPLETED',
      entityType: 'INVOICE',
      entityId: invoiceId,
      action: 'PAYMENT_SUCCESS',
      marinaId,
      userId: customerId,
      metadata: JSON.stringify({
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
      }),
    })
  }
}

async function handleStripePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { invoiceId, marinaId, customerId } = paymentIntent.metadata

  if (invoiceId && marinaId && customerId) {
    // Log audit event
    await logAuditEvent({
      eventType: 'PAYMENT_FAILED',
      entityType: 'INVOICE',
      entityId: invoiceId,
      action: 'PAYMENT_FAILURE',
      marinaId,
      userId: customerId,
      metadata: JSON.stringify({
        stripePaymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      }),
    })
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const paymentService = PaymentService.getInstance()
export { StripeGateway, CardstreamGateway }

