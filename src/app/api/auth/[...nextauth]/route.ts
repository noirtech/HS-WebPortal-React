import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config'

// Create the handler with error handling
const handler = NextAuth(authOptions)

// Export with proper error handling
export const GET = handler
export const POST = handler
