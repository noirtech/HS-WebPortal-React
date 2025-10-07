import { redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n/config'

export default function RootPage() {
  // Always redirect to UK locale for demo user
  redirect(`/en-GB/dashboard`)
}
