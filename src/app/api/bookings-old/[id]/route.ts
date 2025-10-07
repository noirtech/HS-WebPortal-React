import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, logAuditEvent } from '@/lib/db';
import { hasPermission } from '@/lib/utils';

// Validation schemas
const UpdateBookingSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  specialRequirements: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

const BookingActionSchema = z.object({
  action: z.enum(['confirm', 'activate', 'complete', 'cancel', 'extend']),
  reason: z.string().optional(),
  newEndDate: z.string().datetime().optional(), // for extend
  notes: z.string().optional(),
});

// GET /api/bookings/[id] - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get authenticated user from session
    const mockUser = { id: '1', email: 'staff@marina.com', role: 'STAFF', marinaId: '1', roles: [{ id: '1', role: 'STAFF' }] };
    
    const { id } = params;
    
    // Check permissions
    if (!hasPermission(mockUser, 'bookings', 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get booking with full details
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        customer: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            phone: true,
            address: true,
          } 
        },
        boat: { 
          select: { 
            id: true, 
            name: true, 
            registration: true, 
            length: true,
            beam: true,
            draft: true,
          } 
        },
        berth: { 
          select: { 
            id: true, 
                        berthNumber: true,
          } 
        },
        marina: { 
          select: { 
            id: true, 
                        name: true,
          } 
        },


      },
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check marina-level access control
    if (mockUser.role !== 'ADMIN' && mockUser.role !== 'GROUP_ADMIN' && booking.marinaId !== mockUser.marinaId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Calculate additional fields
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    
    let calculatedStatus = booking.status;
    if (booking.status === 'CONFIRMED' && now >= startDate && now <= endDate) {
      calculatedStatus = 'ACTIVE';
    } else if (booking.status === 'ACTIVE' && now > endDate) {
      calculatedStatus = 'COMPLETED';
    }
    
    const isOverdue = booking.status === 'ACTIVE' && now > endDate;
    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const bookingWithCalculations = {
      ...booking,
      calculatedStatus,
      isOverdue,
      daysUntilStart: daysUntilStart > 0 ? daysUntilStart : 0,
      daysUntilEnd: daysUntilEnd > 0 ? daysUntilEnd : 0,
      duration,
      isActive: calculatedStatus === 'ACTIVE',
      isUpcoming: calculatedStatus === 'CONFIRMED' && daysUntilStart > 0,
      isCompleted: calculatedStatus === 'COMPLETED',
      isPast: now > endDate,
    };
    
         // Log audit event
     await logAuditEvent({
       userId: mockUser.id,
       eventType: 'BOOKING_READ',
       entityType: 'BOOKING',
       entityId: id,
       action: 'read',
       metadata: JSON.stringify({ bookingId: id }),
       marinaId: mockUser.marinaId,
     });
    
    return NextResponse.json({ booking: bookingWithCalculations });
    
  } catch (error) {
    console.error('Error fetching booking:', error);
    
    // Log audit event
    try {
      await logAuditEvent({
        userId: 'system',
        eventType: 'BOOKING_READ_ERROR',
        entityType: 'BOOKING',
        entityId: params.id,
        action: 'read',
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        marinaId: 'system',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[id] - Update booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get authenticated user from session
    const mockUser = { id: '1', email: 'staff@marina.com', role: 'STAFF', marinaId: '1', roles: [{ id: '1', role: 'STAFF' }] };
    
    const { id } = params;
    
    // Check permissions
    if (!hasPermission(mockUser, 'bookings', 'update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();
    const validatedData = UpdateBookingSchema.parse(body);
    
    // Get existing booking
    const existingBooking = await db.booking.findUnique({
      where: { id },
      select: { 
        id: true, 
        marinaId: true, 
        berthId: true,
        startDate: true, 
        endDate: true,
        status: true,
      },
    });
    
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check marina-level access control
    if (mockUser.role !== 'ADMIN' && mockUser.role !== 'GROUP_ADMIN' && existingBooking.marinaId !== mockUser.marinaId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if booking can be modified
    if (existingBooking.status === 'COMPLETED' || existingBooking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot modify completed or cancelled booking' }, { status: 400 });
    }
    
    // Check for berth conflicts if dates are being updated
    if ((validatedData.startDate || validatedData.endDate) && existingBooking.berthId) {
      const newStartDate = validatedData.startDate ? new Date(validatedData.startDate) : existingBooking.startDate;
      const newEndDate = validatedData.endDate ? new Date(validatedData.endDate) : existingBooking.endDate;
      
      const conflictingBooking = await db.booking.findFirst({
        where: {
          berthId: existingBooking.berthId,
          id: { not: id },
          status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          OR: [
            {
              startDate: { lte: newEndDate },
              endDate: { gte: newStartDate },
            },
          ],
        },
      });
      
      if (conflictingBooking) {
        return NextResponse.json({ 
          error: 'Berth is not available for the specified dates',
          conflict: {
            existingBookingId: conflictingBooking.id,
            startDate: conflictingBooking.startDate,
            endDate: conflictingBooking.endDate,
          }
        }, { status: 409 });
      }
      
      // Check for contract conflicts if this is a berth rental
      // Note: purpose field removed as it doesn't exist in the current schema
    }
    
    // Check if marina is online
    const marina = await db.marina.findUnique({
      where: { id: existingBooking.marinaId },
      select: { id: true, name: true, isOnline: true, lastSyncAt: true },
    });
    
    if (!marina) {
      return NextResponse.json({ error: 'Marina not found' }, { status: 404 });
    }
    
    let updatedBooking;
    
    if (marina.isOnline) {
      // Marina is online - update booking directly
      updatedBooking = await db.booking.update({
        where: { id },
        data: {
          ...validatedData,
          ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
          ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          boat: { select: { id: true, name: true, registration: true } },
          berth: { select: { id: true, berthNumber: true } },
          marina: { select: { id: true, name: true } },
        },
      });
      
      // Log audit event
      await logAuditEvent({
        userId: mockUser.id,
        eventType: 'BOOKING_UPDATE',
        entityType: 'BOOKING',
        entityId: id,
        action: 'update',
        metadata: JSON.stringify({ 
          updateData: validatedData,
          previousData: existingBooking,
        }),
        marinaId: mockUser.marinaId,
      });
      
    } else {
      // Marina is offline - queue the operation
      const pendingOperation = await db.pendingOperation.create({
        data: {
          operationType: 'BOOKING_UPDATE',
          status: 'PENDING',
          priority: 1,
          marinaId: existingBooking.marinaId,
          userId: mockUser.id,
          data: JSON.stringify({ id, ...validatedData }),
        },
      });
      
      // Log audit event
      await logAuditEvent({
        userId: mockUser.id,
        eventType: 'BOOKING_UPDATE_QUEUED',
        entityType: 'BOOKING',
        entityId: id,
        action: 'update',
        metadata: JSON.stringify({ 
          updateData: validatedData,
          previousData: existingBooking,
          pendingOperationId: pendingOperation.id,
          reason: 'Marina offline - operation queued',
        }),
        marinaId: mockUser.marinaId,
      });
      
      return NextResponse.json({
        message: 'Booking update queued - marina is offline',
        pendingOperationId: pendingOperation.id,
        status: 'QUEUED',
      }, { status: 202 });
    }
    
    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    });
    
  } catch (error) {
    console.error('Error updating booking:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    // Log audit event
    try {
      await logAuditEvent({
        userId: 'system',
        eventType: 'BOOKING_UPDATE_ERROR',
        entityType: 'BOOKING',
        entityId: params.id,
        action: 'update',
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        marinaId: 'system',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }
    
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get authenticated user from session
    const mockUser = { id: '1', email: 'staff@marina.com', role: 'STAFF', marinaId: '1', roles: [{ id: '1', role: 'STAFF' }] };
    
    const { id } = params;
    
    // Check permissions
    if (!hasPermission(mockUser, 'bookings', 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get existing booking
    const existingBooking = await db.booking.findUnique({
      where: { id },
      select: { 
        id: true, 
        marinaId: true, 
        status: true,
        startDate: true,
        endDate: true,
        invoices: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
          select: { id: true, total: true, status: true },
        },
      },
    });
    
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check marina-level access control
    if (mockUser.role !== 'ADMIN' && mockUser.role !== 'GROUP_ADMIN' && existingBooking.marinaId !== mockUser.marinaId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if booking can be cancelled
    if (existingBooking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
    }
    
    if (existingBooking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot cancel completed booking' }, { status: 400 });
    }
    
    // Check if booking has started
    const now = new Date();
    const startDate = new Date(existingBooking.startDate);
    if (now >= startDate) {
      return NextResponse.json({ error: 'Cannot cancel booking that has already started' }, { status: 400 });
    }
    
    // Check for outstanding invoices
    if (existingBooking.invoices.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot cancel booking with outstanding invoices',
        outstandingInvoices: existingBooking.invoices,
      }, { status: 400 });
    }
    
    // Check if marina is online
    const marina = await db.marina.findUnique({
      where: { id: existingBooking.marinaId },
      select: { id: true, name: true, isOnline: true, lastSyncAt: true },
    });
    
    if (!marina) {
      return NextResponse.json({ error: 'Marina not found' }, { status: 404 });
    }
    
    if (marina.isOnline) {
      // Marina is online - cancel booking directly
      await db.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
      });
      
      // Log audit event
      await logAuditEvent({
        userId: mockUser.id,
        eventType: 'BOOKING_CANCEL',
        entityType: 'BOOKING',
        entityId: id,
        action: 'cancel',
        metadata: JSON.stringify({ 
          previousStatus: existingBooking.status,
          reason: 'Booking cancelled by staff',
        }),
        marinaId: mockUser.marinaId,
      });
      
    } else {
      // Marina is offline - queue the operation
      const pendingOperation = await db.pendingOperation.create({
        data: {
          operationType: 'BOOKING_CANCEL',
          status: 'PENDING',
          priority: 2,
          marinaId: existingBooking.marinaId,
          userId: mockUser.id,
          data: JSON.stringify({ id }),
        },
      });
      
      // Log audit event
      await logAuditEvent({
        userId: mockUser.id,
        eventType: 'BOOKING_CANCEL_QUEUED',
        entityType: 'BOOKING',
        entityId: id,
        action: 'cancel',
        metadata: JSON.stringify({ 
          previousStatus: existingBooking.status,
          pendingOperationId: pendingOperation.id,
          reason: 'Marina offline - operation queued',
        }),
        marinaId: mockUser.marinaId,
      });
      
      return NextResponse.json({
        message: 'Booking cancellation queued - marina is offline',
        pendingOperationId: pendingOperation.id,
        status: 'QUEUED',
      }, { status: 202 });
    }
    
    return NextResponse.json({
      message: 'Booking cancelled successfully',
    });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    
    // Log audit event
    try {
      await logAuditEvent({
        userId: 'system',
        eventType: 'BOOKING_CANCEL_ERROR',
        entityType: 'BOOKING',
        entityId: params.id,
        action: 'cancel',
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        marinaId: 'system',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}

// POST /api/bookings/[id] - Perform specific booking actions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get authenticated user from session
    const mockUser = { id: '1', email: 'staff@marina.com', role: 'STAFF', marinaId: '1', roles: [{ id: '1', role: 'STAFF' }] };
    
    const { id } = params;
    
    // Check permissions
    if (!hasPermission(mockUser, 'bookings', 'update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();
    const { action, reason, newEndDate, notes } = BookingActionSchema.parse(body);
    
    // Get existing booking
    const existingBooking = await db.booking.findUnique({
      where: { id },
      select: { 
        id: true, 
        marinaId: true, 
        status: true,
        startDate: true,
        endDate: true,
        berthId: true,
      },
    });
    
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check marina-level access control
    if (mockUser.role !== 'ADMIN' && mockUser.role !== 'GROUP_ADMIN' && existingBooking.marinaId !== mockUser.marinaId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if marina is online
    const marina = await db.marina.findUnique({
      where: { id: existingBooking.marinaId },
      select: { id: true, name: true, isOnline: true, lastSyncAt: true },
    });
    
    if (!marina) {
      return NextResponse.json({ error: 'Marina not found' }, { status: 404 });
    }
    
    let result;
    
    if (marina.isOnline) {
      // Marina is online - perform action directly
      switch (action) {
        case 'confirm':
          if (existingBooking.status !== 'PENDING') {
            return NextResponse.json({ error: 'Only pending bookings can be confirmed' }, { status: 400 });
          }
          
          result = await db.booking.update({
            where: { id },
            data: {
              status: 'CONFIRMED',
            },
          });
          break;
          
        case 'activate':
          if (existingBooking.status !== 'CONFIRMED') {
            return NextResponse.json({ error: 'Only confirmed bookings can be activated' }, { status: 400 });
          }
          
          const now = new Date();
          const startDate = new Date(existingBooking.startDate);
          if (now < startDate) {
            return NextResponse.json({ error: 'Cannot activate booking before start date' }, { status: 400 });
          }
          
          result = await db.booking.update({
            where: { id },
            data: {
              status: 'ACTIVE',
            },
          });
          break;
          
        case 'complete':
          if (existingBooking.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Only active bookings can be completed' }, { status: 400 });
          }
          
          result = await db.booking.update({
            where: { id },
            data: {
              status: 'COMPLETED',
            },
          });
          break;
          
        case 'cancel':
          if (existingBooking.status === 'COMPLETED' || existingBooking.status === 'CANCELLED') {
            return NextResponse.json({ error: 'Cannot cancel completed or cancelled booking' }, { status: 400 });
          }
          
          result = await db.booking.update({
            where: { id },
            data: {
              status: 'CANCELLED',
            },
          });
          break;
          
        case 'extend':
          if (!newEndDate) {
            return NextResponse.json({ error: 'New end date required for extend action' }, { status: 400 });
          }
          
          if (existingBooking.status !== 'ACTIVE' && existingBooking.status !== 'CONFIRMED') {
            return NextResponse.json({ error: 'Only active or confirmed bookings can be extended' }, { status: 400 });
          }
          
          const newEnd = new Date(newEndDate);
          if (newEnd <= new Date(existingBooking.endDate)) {
            return NextResponse.json({ error: 'New end date must be after current end date' }, { status: 400 });
          }
          
          // Check for conflicts with new end date
          const conflictingBooking = await db.booking.findFirst({
            where: {
              berthId: existingBooking.berthId,
              id: { not: id },
              status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
              OR: [
                {
                  startDate: { lte: newEnd },
                  endDate: { gte: new Date(existingBooking.endDate) },
                },
              ],
            },
          });
          
          if (conflictingBooking) {
            return NextResponse.json({ 
              error: 'Cannot extend booking - berth not available for extended period',
              conflict: {
                existingBookingId: conflictingBooking.id,
                startDate: conflictingBooking.startDate,
                endDate: conflictingBooking.endDate,
              }
            }, { status: 409 });
          }
          
          result = await db.booking.update({
            where: { id },
            data: {
              endDate: newEnd,
            },
          });
          break;
      }
      
      // Log audit event
      await logAuditEvent({
        userId: mockUser.id,
        eventType: `BOOKING_${action.toUpperCase()}`,
        entityType: 'BOOKING',
        entityId: id,
        action: action,
        metadata: JSON.stringify({ 
          action,
          reason,
          newEndDate,
          notes,
          previousStatus: existingBooking.status,
        }),
        marinaId: mockUser.marinaId,
      });
      
    } else {
      // Marina is offline - queue the operation
      const pendingOperation = await db.pendingOperation.create({
        data: {
          operationType: `BOOKING_${action.toUpperCase()}`,
          status: 'PENDING',
          priority: action === 'cancel' ? 2 : 1,
          marinaId: existingBooking.marinaId,
          userId: mockUser.id,
          data: JSON.stringify({ id, action, reason, newEndDate, notes }),
        },
      });
      
      // Log audit event
      await logAuditEvent({
        userId: mockUser.id,
        eventType: `BOOKING_${action.toUpperCase()}_QUEUED`,
        entityType: 'BOOKING',
        entityId: id,
        action: action,
        metadata: JSON.stringify({ 
          action,
          reason,
          newEndDate,
          notes,
          previousStatus: existingBooking.status,
          pendingOperationId: pendingOperation.id,
          queueReason: 'Marina offline - operation queued',
        }),
        marinaId: mockUser.marinaId,
      });
      
      return NextResponse.json({
        message: `Booking ${action} queued - marina is offline`,
        pendingOperationId: pendingOperation.id,
        status: 'QUEUED',
      }, { status: 202 });
    }
    
    return NextResponse.json({
      message: `Booking ${action} completed successfully`,
      booking: result,
    });
    
  } catch (error) {
    console.error('Error performing booking action:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    // Log audit event
    try {
      await logAuditEvent({
        userId: 'system',
        eventType: 'BOOKING_ACTION_ERROR',
        entityType: 'BOOKING',
        entityId: params.id,
        action: 'action',
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        marinaId: 'system',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }
    
    return NextResponse.json(
      { error: 'Failed to perform booking action' },
      { status: 500 }
    );
  }
}
