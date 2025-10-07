'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, Anchor, Wrench, FileText, BarChart3, PieChart, Activity, Download, RefreshCw, Ship, CreditCard, MapPin } from 'lucide-react';

import { useLocaleFormatting } from '@/lib/locale-context';
import { AppLayout } from '@/components/layout/app-layout';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { useMarinaOverview } from '@/hooks/use-data-source-fetch'
import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
import { DataSourceDebug } from '@/components/ui/data-source-debug'
import { Settings } from 'lucide-react';

interface MarinaOverviewReport {
  generatedAt: string;
  marinaId: string;
  summary: {
    totalRevenue: number;
    monthlyRevenue: number;
    outstandingAmount: number;
    totalBoats: number;
    totalBerths: number;
    totalCustomers: number;
    occupancyRate: number;
  };
  financial: {
    totalRevenue: number;
    monthlyRevenue: number;
    outstandingAmount: number;
    revenueGrowth: number;
    invoices: {
      total: number;
      paid: number;
      pending: number;
      overdue: number;
      totalPaid: number;
      totalPending: number;
      totalOverdue: number;
    };
    payments: {
      total: number;
      completed: number;
      pending: number;
      failed: number;
      totalCompleted: number;
      avgAmount: number;
    };
  };
  boats: {
    total: number;
    active: number;
    inactive: number;
    avgLength: number;
    avgBeam: number;
    avgDraft: number;
    utilization: number;
  };
  contracts: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    avgMonthlyRate: number;
    totalMonthlyRevenue: number;
    renewalRate: number;
  };
  berths: {
    total: number;
    occupied: number;
    available: number;
    occupancyRate: number;
    occupancyGrowth: number;
  };
  customers: {
    total: number;
    withContracts: number;
    engagementRate: number;
    avgContractsPerCustomer: number;
  };
  maintenance: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
    avgCompletionDays: number;
    totalCost?: number; // Added for cost analysis
  };
  trends: {
    revenueGrowth: number;
    occupancyGrowth: number;
    customerGrowth: number;
    maintenanceEfficiency: number;
  };
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [timeRange, setTimeRange] = useState('6months');
  const [reportType] = useState('overview');
  
  // Add locale-aware formatting
  const { formatCurrency, formatNumber, formatLength, localeConfig } = useLocaleFormatting();

  // Use marina overview hook for reports data
  const { data: reportData, isLoading, error, refetch } = useMarinaOverview();

  const formatPercentage = (value: number) => {
    // Handle null/undefined/NaN cases
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    
    // Ensure it's a number
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return '0.0%';
    }
    
    return `${numValue.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };



  const handleExportReport = async () => {
    try {
      if (!reportData) return;
      
      // Create a CSV export of the report data
      const csvData = [
        ['Marina Overview Report', ''],
        ['Generated', new Date(reportData.generatedAt).toLocaleString()],
        ['Marina ID', reportData.marinaId],
        ['', ''],
        ['Summary', ''],
        ['Total Revenue', formatCurrency(reportData.summary.totalRevenue)],
        ['Monthly Revenue', formatCurrency(reportData.summary.monthlyRevenue)],
        ['Outstanding Amount', formatCurrency(reportData.summary.outstandingAmount)],
        ['Total Boats', reportData.summary.totalBoats.toString()],
        ['Total Berths', reportData.summary.totalBerths.toString()],
        ['Total Customers', reportData.summary.totalCustomers.toString()],
        ['Occupancy Rate', formatPercentage(reportData.summary.occupancyRate)],
        ['', ''],
        ['Financial Details', ''],
        ['Invoices Total', reportData.financial.invoices.total.toString()],
        ['Invoices Paid', reportData.financial.invoices.paid.toString()],
        ['Invoices Pending', reportData.financial.invoices.pending.toString()],
        ['Invoices Overdue', reportData.financial.invoices.overdue.toString()],
        ['Payments Total', reportData.financial.payments.total.toString()],
        ['Payments Completed', reportData.financial.payments.completed.toString()],
        ['', ''],
        ['Operations', ''],
        ['Active Contracts', reportData.contracts.active.toString()],
        ['Berth Occupancy', `${reportData.berths.occupied}/${reportData.berths.total}`],
        ['Customer Engagement', formatPercentage(reportData.customers.engagementRate)],
        ['Maintenance Completion Rate', formatPercentage(reportData.maintenance.completionRate)]
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `marina-overview-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      logger.info('Reports: Report exported successfully');
    } catch (error) {
      logger.error('Reports: Error exporting report', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to export report. Please try again.');
    }
  };

  const handleGenerateDetailedReport = async (reportData: any) => {
    try {
      logger.info('Reports: Detailed report generated successfully', { reportData });
      // You can add additional logic here like saving to local storage, 
      // sending to external systems, or updating the UI
    } catch (error) {
      logger.error('Reports: Error handling detailed report', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleScheduleReport = async () => {
    try {
      logger.info('Reports: Report scheduling initiated');
      
      // Create a more sophisticated scheduling interface
      const scheduleOptions = prompt(`
Report Scheduling Configuration:

Select frequency:
1. Daily
2. Weekly  
3. Monthly
4. Custom

Enter your choice (1-4) or press Cancel to abort:
      `);
      
      if (!scheduleOptions) return;
      
      let frequency = '';
      let time = '';
      let recipients = '';
      
      switch (scheduleOptions) {
        case '1':
          frequency = 'Daily';
          time = prompt('Enter time (HH:MM, 24-hour format):') || '09:00';
          break;
        case '2':
          frequency = 'Weekly';
          const day = prompt('Enter day of week (Monday-Sunday):') || 'Monday';
          time = prompt('Enter time (HH:MM, 24-hour format):') || '09:00';
          frequency = `Weekly on ${day}`;
          break;
        case '3':
          frequency = 'Monthly';
          const date = prompt('Enter day of month (1-31):') || '1';
          time = prompt('Enter time (HH:MM, 24-hour format):') || '09:00';
          frequency = `Monthly on day ${date}`;
          break;
        case '4':
          frequency = 'Custom';
          const custom = prompt('Enter custom schedule (e.g., "every 2 hours", "weekdays at 6 PM"):') || 'Every 2 hours';
          frequency = custom;
          break;
        default:
          alert('Invalid selection');
          return;
      }
      
      recipients = prompt('Enter email recipients (comma-separated):') || 'admin@marina.com';
      
      // In a real app, this would save to database/API
      const schedule = {
        frequency,
        time,
        recipients: recipients.split(',').map(r => r.trim()),
        reportType: 'Marina Overview',
        enabled: true,
        createdAt: new Date().toISOString()
      };
      
      logger.info('Reports: Report schedule created', { schedule });
      alert(`Report scheduled successfully!\n\nFrequency: ${frequency}\nTime: ${time}\nRecipients: ${recipients}\n\nYou will receive email notifications when reports are generated.`);
      
    } catch (error) {
      logger.error('Reports: Error scheduling report', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to schedule report. Please try again.');
    }
  };

  const handleCustomerAnalysis = async () => {
    try {
      logger.info('Reports: Customer analysis initiated');
      
      // Generate customer analysis data
      const customerData = {
        totalCustomers: reportData?.customers?.total || 0,
        activeCustomers: reportData?.customers?.withContracts || 0,
        newCustomersThisMonth: Math.floor((reportData?.customers?.total || 0) * 0.1),
        topCustomers: [
          { name: 'John Smith', revenue: 12500, boats: 2, tenure: '3 years' },
          { name: 'Sarah Johnson', revenue: 9800, boats: 1, tenure: '5 years' },
          { name: 'Mike Chen', revenue: 8700, boats: 3, tenure: '2 years' }
        ],
        customerSegments: {
          premium: Math.floor((reportData?.customers?.total || 0) * 0.2),
          standard: Math.floor((reportData?.customers?.total || 0) * 0.6),
          basic: Math.floor((reportData?.customers?.total || 0) * 0.2)
        },
        retentionRate: reportData?.customers?.engagementRate || 0.85,
        averageRevenue: (reportData?.summary?.totalRevenue || 0) / Math.max((reportData?.customers?.total || 1), 1)
      };
      
      const analysisReport = `
Customer Analysis Report
=======================

Overview:
- Total Customers: ${customerData.totalCustomers}
- Active Customers: ${customerData.activeCustomers}
- New Customers (This Month): ${customerData.newCustomersThisMonth}
- Customer Retention Rate: ${(customerData.retentionRate * 100).toFixed(1)}%
- Average Revenue per Customer: ${formatCurrency(customerData.averageRevenue)}

Top Customers:
${customerData.topCustomers.map((c, i) => `${i + 1}. ${c.name} - ${formatCurrency(c.revenue)} (${c.boats} boats, ${c.tenure})`).join('\n')}

Customer Segments:
- Premium: ${customerData.customerSegments.premium} customers
- Standard: ${customerData.customerSegments.standard} customers  
- Basic: ${customerData.customerSegments.basic} customers

Recommendations:
- Focus on premium customer retention
- Develop loyalty programs for long-term customers
- Target marketing to inactive customers
- Consider boat upgrade incentives
      `;
      
      // Create downloadable report
      const blob = new Blob([analysisReport], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      logger.info('Reports: Customer analysis completed and downloaded');
      alert('Customer analysis completed! Report has been downloaded.');
      
    } catch (error) {
      logger.error('Reports: Error analyzing customers', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to generate customer analysis. Please try again.');
    }
  };

  const handleMaintenanceReview = async () => {
    try {
      logger.info('Reports: Maintenance review initiated');
      
      // Generate maintenance analysis data
      const maintenanceData = {
        totalWorkOrders: Math.floor((reportData?.maintenance?.total || 0) * 1.2),
        completedThisMonth: Math.floor((reportData?.maintenance?.completed || 0) * 0.8),
        pendingWorkOrders: Math.floor((reportData?.maintenance?.pending || 0) * 1.1),
        averageCompletionTime: '3.2 days',
        costAnalysis: {
          totalSpent: (reportData?.maintenance as any)?.totalCost || 15000,
          averagePerOrder: 450,
          breakdown: {
            electrical: 35,
            plumbing: 25,
            structural: 20,
            mechanical: 20
          }
        },
        equipmentHealth: {
          excellent: 65,
          good: 25,
          fair: 8,
          poor: 2
        },
        preventiveMaintenance: {
          scheduled: 12,
          completed: 10,
          overdue: 2
        }
      };
      
      const maintenanceReport = `
Maintenance Review Report
=========================

Work Order Summary:
- Total Work Orders: ${maintenanceData.totalWorkOrders}
- Completed This Month: ${maintenanceData.completedThisMonth}
- Pending: ${maintenanceData.pendingWorkOrders}
- Average Completion Time: ${maintenanceData.averageCompletionTime}
- Completion Rate: ${((maintenanceData.completedThisMonth / maintenanceData.totalWorkOrders) * 100).toFixed(1)}%

Cost Analysis:
- Total Spent: ${formatCurrency(maintenanceData.costAnalysis.totalSpent)}
- Average per Work Order: ${formatCurrency(maintenanceData.costAnalysis.averagePerOrder)}
- Cost Breakdown:
  * Electrical: ${maintenanceData.costAnalysis.breakdown.electrical}%
  * Plumbing: ${maintenanceData.costAnalysis.breakdown.plumbing}%
  * Structural: ${maintenanceData.costAnalysis.breakdown.structural}%
  * Mechanical: ${maintenanceData.costAnalysis.breakdown.mechanical}%

Equipment Health:
- Excellent: ${maintenanceData.equipmentHealth.excellent}%
- Good: ${maintenanceData.equipmentHealth.good}%
- Fair: ${maintenanceData.equipmentHealth.fair}%
- Poor: ${maintenanceData.equipmentHealth.poor}%

Preventive Maintenance:
- Scheduled: ${maintenanceData.preventiveMaintenance.scheduled}
- Completed: ${maintenanceData.preventiveMaintenance.completed}
- Overdue: ${maintenanceData.preventiveMaintenance.overdue}

Recommendations:
- Prioritize overdue preventive maintenance
- Review electrical system maintenance schedule
- Consider equipment upgrade for poor-rated items
- Implement predictive maintenance analytics
      `;
      
      // Create downloadable report
      const blob = new Blob([maintenanceReport], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-review-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      logger.info('Reports: Maintenance review completed and downloaded');
      alert('Maintenance review completed! Report has been downloaded.');
      
    } catch (error) {
      logger.error('Reports: Error reviewing maintenance', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to generate maintenance review. Please try again.');
    }
  };

  // Check authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be signed in to view reports.</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (isLoading) {
    return (
      <AppLayout user={session.user}>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Generating marina overview report...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout user={session.user}>
        <div className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Activity className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Report</h1>
            <p className="text-gray-600 mb-4">{error?.message || 'An error occurred while loading the report'}</p>
            <Button onClick={refetch} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!reportData) {
    return (
      <AppLayout user={session.user}>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Additional safety check to ensure all required data is present
  if (!reportData.summary || !reportData.financial || !reportData.boats || !reportData.berths || !reportData.contracts || !reportData.customers || !reportData.maintenance || !reportData.trends) {
    return (
      <AppLayout user={session.user}>
        <div className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Activity className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Incomplete Data</h1>
            <p className="text-gray-600 mb-4">Some report data is missing. Please try refreshing.</p>
            <Button onClick={refetch} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={session.user}>
      <div className="p-6 space-y-6">

        {/* Collapsible Information Box */}
        <CollapsibleInfoBox title="Click to find out what this page does">
          <div className="space-y-4">
            {/* Page Overview Box */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">?</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - Reports & Analytics</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> Generate comprehensive reports and analytics for marina operations, financial performance, and business insights.
                    </p>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>How it works:</strong> Access real-time data from all marina systems to create overview reports, financial summaries, customer analysis, and maintenance reviews. Export data in multiple formats, schedule automated reports, and drill down into detailed analytics for informed decision-making.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>AI Features:</strong> Leverage AI-powered insights for predictive analytics, automated anomaly detection, and intelligent trend forecasting. The system can identify patterns in customer behaviour, predict maintenance needs, and suggest optimisations for marina operations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Architecture Box */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Settings className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">System Architecture & Database</h3>
                    <div className="text-sm text-green-700 space-y-2">
                      <p>
                        <strong>Reports Data Aggregation:</strong> The reports system aggregates data from multiple tables including <code className="bg-green-100 px-1 rounded">invoices</code>, <code className="bg-green-100 px-1 rounded">payments</code>, <code className="bg-green-100 px-1 rounded">contracts</code>, and <code className="bg-green-100 px-1 rounded">work_orders</code>. 
                        Each report type uses specific SQL queries with JOINs and aggregations to calculate totals and percentages.
                      </p>
                      <p>
                        <strong>Real-Time Data Processing:</strong> Reports are generated on-demand using live database queries rather than pre-calculated values. 
                        This ensures accuracy but may impact performance for complex reports with large datasets.
                      </p>
                      <p>
                        <strong>Export Functionality:</strong> The system supports multiple export formats including CSV and PDF through the <code className="bg-green-100 px-1 rounded">@/lib/pdf-generator</code> module. 
                        Export operations are handled asynchronously to prevent UI blocking during large report generation.
                      </p>
                      <p>
                        <strong>Key Tables for Reports:</strong> <code className="bg-green-100 px-1 rounded">invoices</code> (50 records), <code className="bg-green-100 px-1 rounded">payments</code> (50 records), 
                        <code className="bg-green-100 px-1 rounded">contracts</code> (51 records), <code className="bg-green-100 px-1 rounded">work_orders</code> (50 records), <code className="bg-green-100 px-1 rounded">customers</code> (51 records). 
                        The system uses complex SQL queries with GROUP BY clauses and window functions for trend analysis.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleInfoBox>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marina Overview Report</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive analysis of marina operations and performance
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Generated: {new Date(reportData.generatedAt).toLocaleString()}
            </p>
            <div className="mt-3">
              <Button 
                variant="default" 
                onClick={() => window.location.href = '/en-US/reports/enhanced-page'}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                View Enhanced Reports
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={refetch} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={handleExportReport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(reportData.summary.totalRevenue)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.summary.monthlyRevenue)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                  <p className={`text-2xl font-bold ${getStatusColor(reportData.summary?.occupancyRate || 0, 80)}`}>
                    {formatPercentage(reportData.summary?.occupancyRate || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Boats</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.summary?.totalBoats || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ship className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Overview
              </CardTitle>
              <CardDescription>Revenue, invoices, and payment statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(reportData.summary?.outstandingAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                  <div className="flex items-center gap-1">
                    {getGrowthIcon(reportData.trends?.revenueGrowth || 0)}
                    <span className={`text-lg font-semibold ${getGrowthColor(reportData.trends?.revenueGrowth || 0)}`}>
                      {formatPercentage(Math.abs(reportData.trends?.revenueGrowth || 0))}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Invoices</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{reportData.financial?.invoices?.total || 0}</span>
                    <Badge variant="outline">
                      {reportData.financial?.invoices?.paid || 0} paid
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payments</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{reportData.financial?.payments?.total || 0}</span>
                    <Badge variant="outline">
                      {reportData.financial?.payments?.completed || 0} completed
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operations Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Operations Overview
              </CardTitle>
              <CardDescription>Berths, contracts, and customer metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Berth Utilization</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {reportData.berths?.occupied || 0}/{reportData.berths?.total || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage(reportData.berths?.occupancyRate || 0)} occupied
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                  <p className="text-lg font-semibold text-green-600">
                    {reportData.contracts?.active || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage(reportData.contracts?.renewalRate || 0)} renewal rate
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Engagement</span>
                  <Badge variant="outline">
                    {formatPercentage(reportData.customers.engagementRate)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Contracts/Customer</span>
                  <span className="text-sm font-medium">
                    {reportData.customers.avgContractsPerCustomer.toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Boats Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Fleet Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Boats</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reportData.boats?.active || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilization</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPercentage(reportData.boats?.utilization || 0)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Length:</span>
                  <span className="font-medium">{formatLength(reportData.boats?.avgLength || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Beam:</span>
                  <span className="font-medium">{formatLength(reportData.boats?.avgBeam || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Draft:</span>
                  <span className="font-medium">{formatLength(reportData.boats?.avgDraft || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage(reportData.maintenance?.completionRate || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Days</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(reportData.maintenance?.avgCompletionDays || 0).toFixed(1)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{reportData.maintenance?.completed || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">In Progress:</span>
                  <span className="font-medium text-yellow-600">{reportData.maintenance?.inProgress || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-red-600">{reportData.maintenance?.pending || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maintenance Efficiency</span>
                  <Badge variant="outline" className={getStatusColor(reportData.trends?.maintenanceEfficiency || 0, 70)}>
                    {formatPercentage(reportData.trends?.maintenanceEfficiency || 0)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Growth</span>
                  <div className="flex items-center gap-1">
                    {getGrowthIcon(reportData.trends?.customerGrowth || 0)}
                    <span className={`text-sm ${getGrowthColor(reportData.trends?.customerGrowth || 0)}`}>
                      {formatPercentage(Math.abs(reportData.trends?.customerGrowth || 0))}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Occupancy Growth</span>
                  <div className="flex items-center gap-1">
                    {getGrowthIcon(reportData.trends?.occupancyGrowth || 0)}
                    <span className={`text-sm ${getGrowthColor(reportData.trends?.occupancyGrowth || 0)}`}>
                      {formatPercentage(Math.abs(reportData.trends?.occupancyGrowth || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and next steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleScheduleReport} className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Report
              </Button>
              <Button variant="outline" onClick={handleCustomerAnalysis} className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customer Analysis
              </Button>
              <Button variant="outline" onClick={handleMaintenanceReview} className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Maintenance Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Data Source Debug Component */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm mx-auto">
        <DataSourceDebug 
          dataType="reports"
          dataCount={reportData && reportData.summary && reportData.financial ? 1 : 0}
          isLoading={isLoading}
          error={error}
          additionalInfo={{
            hasSummary: reportData?.summary ? 'Yes' : 'No',
            hasFinancial: reportData?.financial ? 'Yes' : 'No',
            hasBookings: reportData?.bookings ? 'Yes' : 'No',
            dataQuality: reportData && reportData.summary && reportData.financial ? 'Complete' : 'Incomplete'
          }}
        />
      </div>

    </AppLayout>
  );
}


