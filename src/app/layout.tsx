import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/session-provider'
import { LocaleProvider } from '@/lib/locale-context'
import { MapProvider } from '@/components/marina-map'
import { DataSourceProvider } from '@/lib/data-source-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Marina Management Portal',
  description: 'Customer and Staff Portal with Offline Support',
  keywords: ['marina', 'management', 'portal', 'boating', 'berths'],
  authors: [{ name: 'Marina Portal Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <LocaleProvider>
          <Providers>
            <MapProvider>
              <DataSourceProvider>
                {children}
              </DataSourceProvider>
            </MapProvider>
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  )
}
