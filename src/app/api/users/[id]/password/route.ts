import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getPrisma, getDemoUser } from '@/lib/prisma-client'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Zod schema for password change validation
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// PUT /api/users/[id]/password - Change user password
export async function PUT(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    logger.info('Password change request received', { userId: params.id })
    
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      logger.warn('Unauthorized password change attempt', { userId: params.id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is changing their own password or has admin rights
    const requestingUserId = (session.user as any).id
    const targetUserId = params.id
    
    if (requestingUserId !== targetUserId) {
      // Check if user has admin role for this marina
      const userRoles = await prismaClient.$queryRaw`
        SELECT role FROM user_roles 
        WHERE userId = ${requestingUserId} 
        AND (role = 'SUPER_ADMIN' OR role = 'MARINA_ADMIN')
      `
      
      if (!Array.isArray(userRoles) || userRoles.length === 0) {
        logger.warn('Insufficient permissions for password change', { 
          requestingUserId, 
          targetUserId 
        })
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = passwordChangeSchema.parse(body)
    
    logger.debug('Password change validation successful', { userId: targetUserId })

    // Get user details
    const users = await prismaClient.$queryRaw`
      SELECT id, email, firstName, lastName, password, marinaId, isActive 
      FROM users 
      WHERE id = ${targetUserId}
    `
    
    if (!Array.isArray(users) || users.length === 0) {
      logger.warn('User not found for password change', { userId: targetUserId })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const user = users[0]
    
    if (!user.isActive) {
      logger.warn('Inactive user password change attempt', { userId: targetUserId })
      return NextResponse.json({ error: 'User account is inactive' }, { status: 400 })
    }

    // Verify current password if user has one set
    if (user.password) {
      const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        logger.warn('Invalid current password provided', { 
          userId: targetUserId,
          email: user.email 
        })
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
    } else {
      // User has no password set (demo mode) - accept any current password
      logger.debug('User has no password set, accepting any current password', { 
        userId: targetUserId,
        email: user.email 
      })
    }

    // Hash new password with bcryptjs (Project Rule 4)
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds)
    
    // Update user password
    await prismaClient.$queryRaw`
      UPDATE users 
      SET password = ${hashedNewPassword}, updatedAt = GETDATE() 
      WHERE id = ${targetUserId}
    `
    
    // Log successful password change (Project Rule 3)
    logger.info('Password changed successfully', { 
      userId: targetUserId,
      email: user.email,
      marinaId: user.marinaId,
      changedBy: requestingUserId
    })
    
    return NextResponse.json({ 
      message: 'Password updated successfully',
      userId: targetUserId 
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Password change validation failed', { 
        userId: params.id,
        errors: error.errors 
      })
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    logger.error('Password change error', { 
      error: error instanceof Error ? error.message : String(error),
      userId: params.id 
    })
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/users/[id]/password/reset - Reset user password (admin only)
export async function POST(request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prismaClient = await getPrisma();
  if (!prismaClient) {
    return NextResponse.json({ error: 'Database not available in demo mode' }, { status: 503 });
  }
  try {
    logger.info('Password reset request received', { userId: params.id })
    
    // Verify authentication and admin rights
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      logger.warn('Unauthorized password reset attempt', { userId: params.id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestingUserId = (session.user as any).id
    
    // Check admin permissions
    const userRoles = await prismaClient.$queryRaw`
      SELECT role FROM user_roles 
      WHERE userId = ${requestingUserId} 
      AND (role = 'SUPER_ADMIN' OR role = 'MARINA_ADMIN')
    `
    
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      logger.warn('Insufficient permissions for password reset', { 
        requestingUserId, 
        targetUserId: params.id 
      })
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { newPassword } = z.object({
      newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    }).parse(body)

    // Get user details
    const users = await prismaClient.$queryRaw`
      SELECT id, email, firstName, lastName, marinaId, isActive 
      FROM users 
      WHERE id = ${params.id}
    `
    
    if (!Array.isArray(users) || users.length === 0) {
      logger.warn('User not found for password reset', { userId: params.id })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const user = users[0]
    
    if (!user.isActive) {
      logger.warn('Inactive user password reset attempt', { userId: params.id })
      return NextResponse.json({ error: 'User account is inactive' }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)
    
    // Update user password
    await prismaClient.$queryRaw`
      UPDATE users 
      SET password = ${hashedNewPassword}, updatedAt = GETDATE() 
      WHERE id = ${params.id}
    `
    
    // Log successful password reset
    logger.info('Password reset successfully', { 
      userId: params.id,
      email: user.email,
      marinaId: user.marinaId,
      resetBy: requestingUserId
    })
    
    return NextResponse.json({ 
      message: 'Password reset successfully',
      userId: params.id 
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Password reset validation failed', { 
        userId: params.id,
        errors: error.errors 
      })
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    logger.error('Password reset error', { 
      error: error instanceof Error ? error.message : String(error),
      userId: params.id 
    })
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

