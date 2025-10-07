import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import { logger } from '@/lib/logger'
import { validateEmail } from '@/lib/error-handler'
import { z } from 'zod'

// Import prisma only when needed (not during build)
let prisma: any = null

// Function to get prisma client
async function getPrisma() {
  if (!prisma) {
    try {
      const { prisma: prismaClient } = await import('@/lib/db')
      prisma = prismaClient
    } catch (error) {
      logger.debug('Prisma import failed, using demo mode')
      return null
    }
  }
  return prisma
}

// Zod schema for credential validation
const credentialsSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn('Missing credentials during authentication')
          return null
        }

        try {
          // Validate credentials with Zod schema
          const validatedCredentials = credentialsSchema.parse(credentials)
          
          logger.info('Attempting to authenticate user', { email: validatedCredentials.email })
          
          // Get prisma client
          const prismaClient = await getPrisma()
          if (!prismaClient) {
            logger.debug('No database connection available, using demo mode')
            // Demo mode authentication
            if (validatedCredentials.email === 'demo@marina.com' && validatedCredentials.password === 'demo123') {
              return {
                id: 'demo-user-id',
                email: 'demo@marina.com',
                firstName: 'Demo',
                lastName: 'User',
                marinaId: 'demo-marina-id',
                marinaGroupId: 'demo-group-id'
              } as any
            }
            return null
          }
          
          // Test database connection first
          try {
            await prismaClient.$queryRaw`SELECT 1 as test`
            logger.debug('Database connection test successful')
          } catch (dbError) {
            logger.error('Database connection failed during authentication, falling back to demo mode', { 
              error: dbError instanceof Error ? dbError.message : String(dbError),
              email: validatedCredentials.email 
            })
            // Fall back to demo mode when database connection fails
            if (validatedCredentials.email === 'demo@marina.com' && validatedCredentials.password === 'demo123') {
              logger.info('Demo mode authentication successful')
              return {
                id: 'demo-user-id',
                email: 'demo@marina.com',
                firstName: 'Demo',
                lastName: 'User',
                marinaId: 'demo-marina-id',
                marinaGroupId: 'demo-group-id'
              } as any
            }
            return null
          }
          
          // Check if user table exists and has data
          try {
            const userCount = await prismaClient.$queryRaw`SELECT COUNT(*) as count FROM users`
            logger.debug('User count query successful', { count: userCount })
          } catch (countError) {
            logger.error('User count query failed, falling back to demo mode', { 
              error: countError instanceof Error ? countError.message : String(countError),
              email: validatedCredentials.email 
            })
            // Fall back to demo mode when user table doesn't exist or query fails
            if (validatedCredentials.email === 'demo@marina.com' && validatedCredentials.password === 'demo123') {
              logger.info('Demo mode authentication successful (user table not available)')
              return {
                id: 'demo-user-id',
                email: 'demo@marina.com',
                firstName: 'Demo',
                lastName: 'User',
                marinaId: 'demo-marina-id',
                marinaGroupId: 'demo-group-id'
              } as any
            }
            return null
          }
          
          // Execute user query with raw SQL - include password field
          const users = await prismaClient.$queryRaw`SELECT id, email, firstName, lastName, marinaId, marinaGroupId, isActive, password FROM users WHERE email = ${validatedCredentials.email}`
          
          const user = Array.isArray(users) && users.length > 0 ? users[0] : null

          if (user) {
            logger.debug('User found during authentication', { 
              userId: user.id, 
              marinaId: user.marinaId, 
              isActive: user.isActive 
            })
          } else {
            logger.warn('No user found with provided email, checking demo mode', { email: validatedCredentials.email })
            // Fall back to demo mode when no user is found
            if (validatedCredentials.email === 'demo@marina.com' && validatedCredentials.password === 'demo123') {
              logger.info('Demo mode authentication successful (no user in database)')
              return {
                id: 'demo-user-id',
                email: 'demo@marina.com',
                firstName: 'Demo',
                lastName: 'User',
                marinaId: 'demo-marina-id',
                marinaGroupId: 'demo-group-id'
              } as any
            }
            return null
          }

          if (!user.isActive) {
            logger.warn('Inactive user attempted authentication', { email: validatedCredentials.email })
            return null
          }

          // Password verification with bcryptjs (Project Rule 4)
          if (user.password) {
            // Check if this is a demo login attempt first
            if (validatedCredentials.email === 'demo@marina.com' && validatedCredentials.password === 'demo123') {
              logger.info('Demo mode authentication successful (overriding database user)')
              return {
                id: 'demo-user-id',
                email: 'demo@marina.com',
                firstName: 'Demo',
                lastName: 'User',
                marinaId: 'demo-marina-id',
                marinaGroupId: 'demo-group-id'
              } as any
            }
            
            // User has a password set - verify it
            const isValidPassword = await bcrypt.compare(validatedCredentials.password, user.password)
            if (!isValidPassword) {
              logger.warn('Invalid password attempt', { 
                email: user.email,
                userId: user.id,
                marinaId: user.marinaId 
              })
              return null
            }
            logger.debug('Password verification successful', { userId: user.id })
          } else {
            // User has no password set - accept any password (demo mode fallback)
            logger.debug('No password set for user, accepting any password (demo mode)', { 
              userId: user.id,
              email: user.email 
            })
          }

          // Log successful authentication (Project Rule 3)
          logger.info('Authentication successful', { 
            email: user.email, 
            userId: user.id,
            marinaId: user.marinaId,
            marinaGroupId: user.marinaGroupId
          })
          
          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            marinaId: user.marinaId,
            marinaGroupId: user.marinaGroupId
          } as any // Type assertion to avoid NextAuth type conflicts
        } catch (error) {
          logger.error('Authentication error', { 
            error: error instanceof Error ? error.message : String(error),
            email: credentials.email 
          })
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        logger.debug('Setting JWT token data', { email: user.email, userId: user.id })
        token.id = user.id
        token.email = user.email
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
        token.marinaId = (user as any).marinaId
        token.marinaGroupId = (user as any).marinaGroupId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        logger.debug('Setting session data', { userId: token.id })
        ;(session.user as any).id = token.id as string
        ;(session.user as any).firstName = token.firstName as string
        ;(session.user as any).lastName = token.lastName as string
        ;(session.user as any).marinaId = token.marinaId as string
        ;(session.user as any).marinaGroupId = token.marinaGroupId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}
