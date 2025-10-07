import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

interface LocalePageProps {
  params: { locale: string }
}

export default function LocalePage({ params: { locale } }: LocalePageProps) {
  // DEBUG LOGGING
  logger.debug('LocalePage redirect called', {
    locale,
    type: typeof locale,
    params: { locale },
    redirectTarget: `dashboard`
  })
  
  // Redirect to dashboard for the current locale using relative path
  redirect(`dashboard`)
}

// Alternative: If you want to show a welcome page instead of redirecting
/*
export default function LocalePage({ params: { locale } }: LocalePageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Marina Management Portal
          </h1>
          <p className="text-gray-600 mb-6">
            Your locale is set to: <span className="font-semibold">{locale}</span>
          </p>
          <div className="space-y-3">
            <a
              href={`/${locale}/dashboard`}
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
            <a
              href={`/${locale}/test`}
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Test Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
*/
