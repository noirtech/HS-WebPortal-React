import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

// Create the base internationalization middleware
const intlMiddleware = createIntlMiddleware({
  // A list of all locales that your application supports
  locales: ['en-GB', 'en-US'],
  
  // Used when no locale matches
  defaultLocale: 'en-GB',
  
  // Always include the locale in the URL
  localePrefix: 'always'
})

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle en-UK -> en-GB redirect
  if (pathname.startsWith('/en-UK') || pathname.startsWith('/en-uk')) {
    const newPathname = pathname.replace(/^\/en-[Uu][Kk]/, '/en-GB')
    return NextResponse.redirect(new URL(newPathname, request.url))
  }
  
  // Use the internationalization middleware for all other requests
  return intlMiddleware(request)
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\\\..*).*)']
}
