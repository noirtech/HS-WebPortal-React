import { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'
import { logger } from '@/lib/logger'

// Base intl middleware
const intlMiddleware = createMiddleware({
	// A list of all locales that are supported
	locales,

	// Used when no locale matches - always default to UK
	defaultLocale: 'en-GB',

	// Always show the locale in the URL
	localePrefix: 'always',
})

export default function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	logger.debug('Root middleware invoked', { pathname })
	
	// Force redirect to UK locale for root path
	if (pathname === '/') {
		logger.debug('Forcing redirect to UK locale', { pathname })
		const url = request.nextUrl.clone()
		url.pathname = '/en-GB/dashboard'
		return Response.redirect(url)
	}
	
	return intlMiddleware(request)
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en-GB|en-US)/:path*']
}
