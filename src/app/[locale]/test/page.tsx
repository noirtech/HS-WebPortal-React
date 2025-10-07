'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { formatCurrency, formatDate, formatTime } from '@/i18n/config'
import { type Locale } from '@/i18n/config'

export default function TestPage() {
  const t = useTranslations()
  const locale = useLocale() as Locale
  
  // Test data
  const testAmount = 1234.56
  const testDate = new Date()
  const testTime = new Date()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with locale switcher */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            i18n Test Page - {t('common.info')}
          </h1>
          <LocaleSwitcher />
        </div>

        {/* Current locale info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Locale: {locale}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This page demonstrates the internationalization system working.
            </p>
          </CardContent>
        </Card>

        {/* Translation examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Common Translations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Loading:</strong> {t('common.loading')}</p>
              <p><strong>Save:</strong> {t('common.save')}</p>
              <p><strong>Cancel:</strong> {t('common.cancel')}</p>
              <p><strong>Delete:</strong> {t('common.delete')}</p>
              <p><strong>Edit:</strong> {t('common.edit')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation Translations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Dashboard:</strong> {t('navigation.dashboard')}</p>
              <p><strong>Bookings:</strong> {t('navigation.bookings')}</p>
              <p><strong>Contracts:</strong> {t('navigation.contracts')}</p>
              <p><strong>Payments:</strong> {t('navigation.payments')}</p>
              <p><strong>Berths:</strong> {t('navigation.berths')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Formatting examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Currency Formatting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(testAmount, locale)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Amount: {testAmount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date Formatting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDate(testDate, locale)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Raw: {testDate.toISOString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Formatting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatTime(testTime, locale)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Raw: {testTime.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Business info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Company Details</h4>
                <p><strong>Name:</strong> {t('business.companyName')}</p>
                <p><strong>Phone:</strong> {t('business.contact.phone')}</p>
                <p><strong>Email:</strong> {t('business.contact.email')}</p>
                <p><strong>Website:</strong> {t('business.contact.website')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Address</h4>
                <p>{t('business.address.line1')}</p>
                <p>{t('business.address.line2')}</p>
                <p>{t('business.address.city')}</p>
                <p>{t('business.address.postcode')}</p>
                <p>{t('business.address.county')}</p>
                <p>{t('business.address.country')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-center space-x-4">
          <Button asChild>
            <a href={`/${locale}/dashboard`}>Go to Dashboard</a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/${locale}/bookings`}>Go to Bookings</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
