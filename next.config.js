const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Disable static generation for pages that require database access
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  // Configure for Vercel deployment
  output: 'standalone',
  // Disable static generation for dynamic pages
  trailingSlash: false,
}

module.exports = withNextIntl(nextConfig)

