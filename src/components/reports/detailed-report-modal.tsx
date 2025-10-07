'use client';

import { useState, useRef } from 'react';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Lightbulb, Loader2, BarChart3, Users, Wrench, DollarSign, Eye, X, CheckCircle, Clock, TrendingDown, ChevronDown, ChevronRight, Printer, FileDown, Maximize2, Minimize2 } from 'lucide-react';
import { useLocaleFormatting } from '@/lib/locale-context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import html2pdf from 'html2pdf.js';
import { logger } from '@/lib/logger';

interface DetailedReportModalProps {
  onGenerate: (reportData: any) => void;
}

interface ReportConfig {
  reportType: string;
  dateRange: string;
  customStartDate?: string;
  customEndDate?: string;
  features: string[];
}

interface GeneratedReport {
  id: string;
  generatedAt: string;
  config: ReportConfig;
  data: any;
  insights?: string[];
  recommendations?: string[];
  summary?: any;
}

export function DetailedReportModal({ onGenerate }: DetailedReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'config' | 'report'>('config');
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [config, setConfig] = useState<ReportConfig>({
    reportType: 'comprehensive',
    dateRange: '6months',
    features: ['insights', 'recommendations', 'trends']
  });

  const { formatCurrency, formatDate, formatNumber } = useLocaleFormatting();

  // Helper function to format percentages
  const formatPercentage = (value: number): string => {
    return `${formatNumber(value)}%`;
  };

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Analysis', icon: BarChart3, description: 'Complete overview across all areas' },
    { value: 'financial', label: 'Financial Performance', icon: DollarSign, description: 'Revenue, payments, and financial metrics' },
    { value: 'operational', label: 'Operational Efficiency', icon: TrendingUp, description: 'Boats, berths, and operational data' },
    { value: 'customer', label: 'Customer Analysis', icon: Users, description: 'Customer insights and contract metrics' },
    { value: 'maintenance', label: 'Maintenance Overview', icon: Wrench, description: 'Work orders and maintenance performance' }
  ];

  const dateRanges = [
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const features = [
    { value: 'insights', label: 'AI Insights', description: 'Intelligent analysis and patterns' },
    { value: 'recommendations', label: 'Recommendations', description: 'Actionable business advice' },
    { value: 'trends', label: 'Trend Analysis', description: 'Historical data trends' },
    { value: 'comparisons', label: 'Period Comparisons', description: 'Compare different time periods' },
    { value: 'forecasting', label: 'Forecasting', description: 'Predictive analytics' }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/detailed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const reportData = await response.json();
        const report: GeneratedReport = {
          id: `report-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          config,
          data: reportData,
          insights: reportData.insights || [],
          recommendations: reportData.recommendations || [],
          summary: reportData.summary || {}
        };
        
        setGeneratedReport(report);
        onGenerate(report);
        setCurrentView('report');
      } else {
        console.error('Failed to generate detailed report');
      }
    } catch (error) {
      console.error('Error generating detailed report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleExportReport = () => {
    if (!generatedReport) return;

    try {
      const csvData = [
        ['Detailed Marina Report', ''],
        ['Generated', new Date(generatedReport.generatedAt).toLocaleString()],
        ['Report Type', generatedReport.config.reportType],
        ['Date Range', generatedReport.config.dateRange],
        ['Features', generatedReport.config.features.join(', ')],
        ['', ''],
        ['Summary', ''],
        ['Total Revenue', formatCurrency(generatedReport.summary?.totalRevenue || 0)],
        ['Total Boats', generatedReport.summary?.totalBoats || 0],
        ['Total Berths', generatedReport.summary?.totalBerths || 0],
        ['Total Customers', generatedReport.summary?.totalCustomers || 0],
        ['Occupancy Rate', formatPercentage(generatedReport.summary?.occupancyRate || 0)],
        ['', ''],
        ['Insights', ''],
        ...(generatedReport.insights?.map(insight => [insight, '']) || []),
        ['', ''],
        ['Recommendations', ''],
        ...(generatedReport.recommendations?.map(rec => [rec, '']) || [])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `detailed-marina-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

              logger.info('Detailed Report: Report exported successfully');
    } catch (error) {
              logger.error('Detailed Report: Error exporting report', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to export detailed report. Please try again.');
    }
  };

  const handlePrintReport = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const handlePDFExport = async () => {
    if (!reportRef.current) return;

    try {
      const element = reportRef.current;
      const opt = {
        margin: 1,
        filename: `marina-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
              logger.info('Detailed Report: PDF exported successfully');
    } catch (error) {
              logger.error('Detailed Report: Error exporting PDF', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleNewReport = () => {
    setCurrentView('config');
    setGeneratedReport(null);
    setConfig({
      reportType: 'comprehensive',
      dateRange: '6months',
      features: ['insights', 'recommendations', 'trends']
    });
    setExpandedSections(new Set(['summary']));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Chart data preparation
  const prepareChartData = () => {
    if (!generatedReport?.data) return {};

    const { boats, contracts, berths, customers, financial } = generatedReport.data;

    return {
      boats: [
        { name: 'Active', value: boats?.active || 0, color: '#10B981' },
        { name: 'Inactive', value: boats?.inactive || 0, color: '#EF4444' }
      ],
      berths: [
        { name: 'Occupied', value: berths?.occupied || 0, color: '#3B82F6' },
        { name: 'Available', value: berths?.available || 0, color: '#10B981' }
      ],
      revenue: [
        { month: 'Jan', revenue: financial?.revenue?.jan || 0 },
        { month: 'Feb', revenue: financial?.revenue?.feb || 0 },
        { month: 'Mar', revenue: financial?.revenue?.mar || 0 },
        { month: 'Apr', revenue: financial?.revenue?.apr || 0 },
        { month: 'May', revenue: financial?.revenue?.may || 0 },
        { month: 'Jun', revenue: financial?.revenue?.jun || 0 }
      ]
    };
  };

  const renderConfigView = () => (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Report Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.reportType === type.value
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, reportType: type.value }))}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-sm">{type.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs text-gray-600">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Date Range Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Date Range</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={config.dateRange}
            onValueChange={(value: string) => setConfig(prev => ({ ...prev, dateRange: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {config.dateRange === 'custom' && (
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={config.customStartDate || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={config.customEndDate || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Features Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Report Features</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((feature) => (
            <div key={feature.value} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={feature.value}
                checked={config.features.includes(feature.value)}
                onChange={() => toggleFeature(feature.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor={feature.value} className="text-sm cursor-pointer">
                <div className="font-medium">{feature.label}</div>
                <div className="text-xs text-gray-500">{feature.description}</div>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Report Preview</Label>
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{config.reportType}</Badge>
                <Badge variant="outline">{config.dateRange}</Badge>
              </div>
              <div className="text-sm text-gray-600">
                This report will include: {config.features.join(', ')}
              </div>
              {config.dateRange === 'custom' && config.customStartDate && config.customEndDate && (
                <div className="text-sm text-gray-600">
                  Date range: {formatDate(config.customStartDate)} - {formatDate(config.customEndDate)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          disabled={isGenerating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderReportView = () => {
    if (!generatedReport) return null;

    const chartData = prepareChartData();

    return (
      <div 
        ref={reportRef}
        className={`space-y-6 ${isPrintMode ? 'print:block' : ''} ${isFullscreen ? 'max-w-none' : ''}`}
      >
        {/* Report Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generated Report</h3>
            <p className="text-sm text-gray-600">
              Generated on {new Date(generatedReport.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{generatedReport.config.reportType}</Badge>
            <Badge variant="outline">{generatedReport.config.dateRange}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-500 hover:text-gray-700"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewReport}
              className="text-gray-500 hover:text-gray-700"
              title="Generate New Report"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {generatedReport.summary && (
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('summary')}
            >
              <h4 className="font-medium">Summary</h4>
              {expandedSections.has('summary') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            {expandedSections.has('summary') && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(generatedReport.summary.totalRevenue || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {generatedReport.summary.totalBoats || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Boats</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPercentage(generatedReport.summary.occupancyRate || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Occupancy Rate</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {generatedReport.summary.totalCustomers || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Customers</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Charts Section */}
        {chartData.boats && (
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('charts')}
            >
              <h4 className="font-medium">Visual Analytics</h4>
              {expandedSections.has('charts') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            {expandedSections.has('charts') && (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Boats Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Boats Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={chartData.boats}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.boats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Berths Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Berths Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData.berths}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Insights */}
        {generatedReport.insights && generatedReport.insights.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('insights')}
            >
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Key Insights
              </h4>
              {expandedSections.has('insights') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            {expandedSections.has('insights') && (
              <div className="mt-3 space-y-2">
                {generatedReport.insights.map((insight, index) => (
                  <Card key={index} className="bg-amber-50 border-amber-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-amber-800">{insight}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {generatedReport.recommendations && generatedReport.recommendations.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('recommendations')}
            >
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                Recommendations
              </h4>
              {expandedSections.has('recommendations') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            {expandedSections.has('recommendations') && (
              <div className="mt-3 space-y-2">
                {generatedReport.recommendations.map((recommendation, index) => (
                  <Card key={index} className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{recommendation}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleNewReport}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generate New Report
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrintReport}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handlePDFExport}
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleExportReport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-2"
      >
        <FileText className="w-4 h-4" />
        Generate Detailed Report
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Generate Detailed Report"
        size={isFullscreen ? "full" : "xl"}
      >
        {currentView === 'config' ? renderConfigView() : renderReportView()}
      </Modal>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
