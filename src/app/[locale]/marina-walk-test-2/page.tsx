import { MarinaWalkTest2View } from '@/components/marina-walk/marina-walk-test-2-view'
import { getMarinaWalkData } from '@/lib/api/marina-walk'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Dock Walk Test - Marina Management Portal',
  description: 'Mobile-optimized dock walk interface for marina staff',
}

export default async function MarinaWalkTest2Page() {
  const marinaData = await getMarinaWalkData()
  
  return <MarinaWalkTest2View {...marinaData} />
}
