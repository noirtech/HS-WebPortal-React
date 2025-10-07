'use client'

import React, { useState } from 'react'
import { useLocale } from '@/lib/locale-context'
import { locales, localeConfigs } from '@/i18n/config'
import { ChevronDown, Globe } from 'lucide-react'
import { logger } from '@/lib/logger'

export function LocaleSwitcher() {
  const { currentLocale, switchLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = async (newLocale: string) => {
    logger.debug('Switching locale', { from: currentLocale, to: newLocale })
    setIsOpen(false)
    
    try {
      await switchLocale(newLocale as any)
      logger.info('Locale switched successfully', { to: newLocale })
    } catch (error) {
      logger.error('Error switching locale', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  const currentConfig = localeConfigs[currentLocale]

  return (
    <div className="relative">
              <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Select language"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
        <Globe className="w-4 h-4" />
        <span>{currentConfig.flag}</span>
        <span>{currentConfig.displayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="py-1">
            {locales.map((locale) => {
              const config = localeConfigs[locale]
              const isActive = locale === currentLocale
              
              return (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{config.flag}</span>
                    <div>
                      <div className="font-medium">{config.displayName}</div>
                      <div className="text-xs text-gray-500">
                        {config.currency} • {config.dateFormat}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function CompactLocaleSwitcher() {
  const { currentLocale, switchLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = async (newLocale: string) => {
    logger.debug('CompactLocaleSwitcher switching locale', { from: currentLocale, to: newLocale })
    setIsOpen(false)
    
    try {
      await switchLocale(newLocale as any)
      logger.info('CompactLocaleSwitcher locale switched successfully', { to: newLocale })
    } catch (error) {
      logger.error('CompactLocaleSwitcher error switching locale', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  const currentConfig = localeConfigs[currentLocale]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        <span>{currentConfig.flag}</span>
        <span className="hidden sm:inline">{currentConfig.currency}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="py-1">
            {locales.map((locale) => {
              const config = localeConfigs[locale]
              const isActive = locale === currentLocale
              
              return (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{config.flag}</span>
                    <span className="font-medium">{config.currency}</span>
                    <span className="text-xs text-gray-500">{config.dateFormat}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
