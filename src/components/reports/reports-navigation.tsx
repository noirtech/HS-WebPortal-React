'use client';

import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, FileText, Wrench } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export function ReportsNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.includes(path);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
      <Button
        variant={isActive('reports') && !isActive('enhanced') ? 'default' : 'outline'}
        onClick={() => router.push('/en-US/reports')}
        className="flex items-center gap-2 whitespace-nowrap"
      >
        <BarChart3 className="w-4 h-4" />
        Overview Report
      </Button>
      <Button
        variant={isActive('enhanced') ? 'default' : 'outline'}
        onClick={() => router.push('/en-US/reports/enhanced-page')}
        className="flex items-center gap-2 whitespace-nowrap"
      >
        <TrendingUp className="w-4 h-4" />
        Enhanced Reports
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap"
        disabled
      >
        <FileText className="w-4 h-4" />
        Custom Reports
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap"
        disabled
      >
        <Wrench className="w-4 h-4" />
        AI Insights
      </Button>
    </div>
  );
}



