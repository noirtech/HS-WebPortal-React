'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Download, RefreshCw, TrendingUp, TrendingDown, Anchor, Users, PoundSterling, Ship } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { ReportsNavigation } from '@/components/reports/reports-navigation';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function EnhancedReportsPage() {
  const { data: session, status } = useSession();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');



  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/reports/marina-overview');
      if (response.ok) {
        const data = await response.json();
        // Handle both direct data and wrapped data structures
        const reportData = data.data ? data : data;
        setReportData(reportData);
        logger.info('Enhanced Reports: Marina overview data fetched successfully', { data: reportData });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report data');
      }
    } catch (error) {
      logger.error('Enhanced Reports: Error fetching report data', { error: error instanceof Error ? error.message : String(error) });
      setError(error instanceof Error ? error.message : 'Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReportData();
    }
  }, [status]);





  // Prepare chart data using useMemo to ensure it updates when reportData changes
  const chartData = useMemo(() => {
    if (!reportData) return {};
    
    // Use the correct data paths based on our debugging
    const boats = reportData.boats || {};
    const berths = reportData.berths || {};
    const summary = reportData.summary || {};
    const workOrders = reportData.workOrders || {};

    // Debug the data structure


               const preparedData = {
             revenue: [
               { month: 'Jan', revenue: Math.round((summary.totalRevenue || 0) * 0.8) },
               { month: 'Feb', revenue: Math.round((summary.totalRevenue || 0) * 0.9) },
               { month: 'Mar', revenue: Math.round(summary.totalRevenue || 0) },
             ],
      berthStatus: [
        { 
          name: 'Occupied', 
          value: Number(summary.totalBerths - (berths.available || 0)) || 0, 
          color: '#ef4444' 
        },
        { 
          name: 'Available', 
          value: Number(berths.available || 0), 
          color: '#22c55e' 
        },
      ],
      fleetDistribution: [
        { 
          name: 'Total Boats', 
          value: Number(summary.totalBoats || 0), 
          color: '#3b82f6' 
        },
        { 
          name: 'Average Length', 
          value: Number(boats.avgLength || 0), 
          color: '#8b5cf6' 
        },
      ],
      workOrders: [
        { 
          name: 'Completed', 
          value: Number(workOrders.completedWorkOrders) || 0, 
          color: '#22c55e' 
        },
        { 
          name: 'In Progress', 
          value: Number(workOrders.inProgressWorkOrders) || 0, 
          color: '#f59e0b' 
        },
        { 
          name: 'Pending', 
          value: Number(workOrders.pendingWorkOrders) || 0, 
          color: '#ef4444' 
        },
      ]
    };


    return preparedData;
  }, [reportData]);



  // Check authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enhanced reports...</p>
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
            <p className="mt-4 text-gray-600">Generating enhanced marina report...</p>
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
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchReportData} className="flex items-center gap-2">
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
            <p className="text-gray-600">No report data available.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={session.user}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Marina Reports</h1>
            <p className="text-gray-600 mt-2">
              Advanced analytics and insights for marina operations
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Generated: {new Date(reportData.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={fetchReportData} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ReportsNavigation />

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue KPI */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <PoundSterling className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                £{reportData.summary?.totalRevenue?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+12.5%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Boats KPI */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Total Boats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.summary?.totalBoats || reportData.boats?.totalBoats || 0}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600">+5.2%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Berths KPI */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Anchor className="w-4 h-4" />
                Berth Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {reportData.berths?.occupancyRate || 0}%
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">-2.1%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Customers KPI */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {reportData.summary?.totalCustomers || reportData.customers?.totalCustomers || 0}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600">+8.7%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50 p-0.5 rounded-lg shadow-sm border border-gray-200 h-10">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border-blue-200 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 data-[state=inactive]:border-transparent hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 font-medium border rounded-md py-1.5 h-9"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border-green-200 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 data-[state=inactive]:border-transparent hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 font-medium border rounded-md py-1.5 h-9"
            >
              Revenue
            </TabsTrigger>
            <TabsTrigger 
              value="occupancy" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border-purple-200 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 data-[state=inactive]:border-transparent hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 font-medium border rounded-md py-1.5 h-9"
            >
              Occupancy
            </TabsTrigger>
            <TabsTrigger 
              value="fleet" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border-orange-200 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 data-[state=inactive]:border-transparent hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 font-medium border rounded-md py-1.5 h-9"
            >
              Fleet
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {(chartData as any).revenue && (chartData as any).revenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={(chartData as any).revenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Berth Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Berth Status</CardTitle>
                  <CardDescription>Current berth occupancy</CardDescription>
                </CardHeader>
                <CardContent>
                  {(chartData as any).berthStatus && (chartData as any).berthStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(chartData as any).berthStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(chartData as any).berthStatus.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No berth data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Detailed revenue breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      £{reportData.summary?.totalRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      £{reportData.summary?.monthlyRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">
                      £{reportData.summary?.outstandingAmount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                
                {(chartData as any).revenue && (chartData as any).revenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={(chartData as any).revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gray-500">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Occupancy Tab */}
          <TabsContent value="occupancy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Berth Occupancy Analysis</CardTitle>
                <CardDescription>Detailed berth utilization and availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Status</h3>
                    {(chartData as any).berthStatus && (chartData as any).berthStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(chartData as any).berthStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }: any) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(chartData as any).berthStatus.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No berth data available
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Total Berths</h4>
                      <p className="text-2xl font-bold text-blue-600">{reportData.summary?.totalBerths || 0}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-900">Occupied</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {(reportData.summary?.totalBerths || 0) - (reportData.berths?.available || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">Available</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {reportData.berths?.available || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Management</CardTitle>
                <CardDescription>Boat fleet status and distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Fleet Overview</h3>

                    {(chartData as any).fleetDistribution && (chartData as any).fleetDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={(chartData as any).fleetDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No fleet data available
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Total Boats</h4>
                      <p className="text-2xl font-bold text-blue-600">{reportData.summary?.totalBoats || 0}</p>
                      <p className="text-sm text-blue-600">Fleet total</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900">Average Length</h4>
                      <p className="text-2xl font-bold text-gray-600">{reportData.boats?.avgLength?.toFixed(1) || 0}m</p>
                      <p className="text-sm text-gray-600">Fleet average</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">Fleet Value</h4>
                      <p className="text-2xl font-bold text-purple-600">£{reportData.boats?.totalValue?.toLocaleString() || 0}</p>
                      <p className="text-sm text-purple-600">Total fleet value</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
