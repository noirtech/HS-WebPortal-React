import MobileDockwalk2View from '@/components/marina-walk/mobile-dockwalk-2-view'
import { getMarinaWalkData } from '@/lib/api/marina-walk'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dockwalk Mobile - Marina Management Portal',
  description: 'Advanced mobile-first PWA for marina staff with comprehensive dock walk features',
}

export default async function DockwalkMobilePage() {
  const marinaData = await getMarinaWalkData()

  return <MobileDockwalk2View berths={marinaData.berths} boats={marinaData.boats} />
}
