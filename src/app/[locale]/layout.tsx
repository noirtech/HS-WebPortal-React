import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  try {
    // Validate that the incoming `locale` parameter is valid
    if (!locale || !locales.includes(locale as any)) {
      throw new Error(`Invalid locale: ${locale}`)
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages({ locale })

    return (
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    )
  } catch (error) {
    // Re-throw to surface in dev overlay and avoid root layout notFound crash
    throw error
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
