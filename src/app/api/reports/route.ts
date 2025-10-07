import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getDemoUser } from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  const prismaClient = await getPrisma();
  
  // In demo mode, use mock data
  if (!prismaClient) {
    console.log('🔍 REPORTS API: Using mock data for demo mode');
    
    // Generate mock reports data
    const mockReports = [
      {
        id: '1',
        reportType: 'financial_summary',
        title: 'Financial Summary Report',
        description: 'Monthly financial summary with revenue and expenses',
        status: 'completed',
        createdAt: new Date().toISOString(),
        fileUrl: '/reports/financial-summary-2024-01.pdf',
        fileSize: 256000,
        recordCount: 150,
        parameters: {
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          },
          includeCharts: true,
          includeBreakdowns: true
        },
        isCompleted: true,
        isPending: false,
        isFailed: false,
        hasFile: true,
        fileSizeInMB: 0.25,
        generatedBy: 'System',
        marinaName: 'Portsmouth Marina'
      },
      {
        id: '2',
        reportType: 'operational_summary',
        title: 'Operational Summary Report',
        description: 'Monthly operational metrics and KPIs',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        fileUrl: '/reports/operational-summary-2024-01.pdf',
        fileSize: 192000,
        recordCount: 120,
        parameters: {
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          },
          includeKPIs: true,
          includeTrends: true
        },
        isCompleted: true,
        isPending: false,
        isFailed: false,
        hasFile: true,
        fileSizeInMB: 0.19,
        generatedBy: 'System',
        marinaName: 'Portsmouth Marina'
      }
    ];
    
    console.log('✅ REPORTS API: Successfully returned mock reports', { count: mockReports.length });
    return NextResponse.json({
      data: mockReports
    });
  }

  try {
    const mockUser = getDemoUser();

    const reports = await prismaClient.report.findMany({
      include: {
        marina: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const reportsWithCalculations = reports.map((report: any) => ({
      ...report,
      // Status indicators
      isCompleted: report.status === 'completed',
      isPending: report.status === 'pending',
      isFailed: report.status === 'failed',
      
      // File metrics
      hasFile: !!report.fileUrl,
      fileSizeInMB: report.fileSize ? Math.round(report.fileSize / 1024 / 1024 * 100) / 100 : 0,
      
      // Summary
      generatedBy: report.user ? `${report.user.firstName} ${report.user.lastName}` : 'System',
      marinaName: report.marina ? report.marina.name : 'Unknown Marina',
    }));

    return NextResponse.json({
      data: reportsWithCalculations
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

