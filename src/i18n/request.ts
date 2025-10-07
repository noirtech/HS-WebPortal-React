import { getRequestConfig } from 'next-intl/server'
import { locales, defaultLocale } from './config'

export default getRequestConfig(async ({ locale }) => {
  // If no locale is provided, use the default locale
  const effectiveLocale = locale || defaultLocale
  
  // Validate that the effective locale is valid
  if (!effectiveLocale || !locales.includes(effectiveLocale as any)) {
    // Use default locale as fallback
    const fallbackLocale = defaultLocale
    
    try {
      const messages = (await import(`./locales/${fallbackLocale}.json`)).default
      return {
        locale: fallbackLocale,
        messages
      }
    } catch (error) {
      throw new Error(`Failed to load messages for locale: ${fallbackLocale}`)
    }
  }

  try {
    const messages = (await import(`./locales/${effectiveLocale}.json`)).default
    return {
      locale: effectiveLocale,
      messages
    }
  } catch (error) {
    throw error
  }
})
