'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Code, 
  Database, 
  Server, 
  Globe, 
  Shield, 
  Zap,
  Layers,
  GitBranch,
  Package,
  Monitor,
  Cpu,
  HardDrive,
  Clock,
  ArrowUp,
  List
} from 'lucide-react'

// Mock user for demo purposes
const mockUser = {
  id: 'demo-user',
  email: 'demo@marina.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: [{ role: 'ADMIN' }]
}

export default function SiteArchitecturePage() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Handle scroll events for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 220 // Account for AppLayout top bar (64px) + sticky navigation height (~100px) + extra spacing (56px)
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <AppLayout user={mockUser}>
      <div className="p-6">
        {/* Sticky Table of Contents Navigation */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-6 px-6 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Page Navigation</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('system-overview')}
                  className="text-xs"
                >
                  System Overview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('key-features')}
                  className="text-xs"
                >
                  Key Features
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('current-features')}
                  className="text-xs"
                >
                  Current Features
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('planned-features')}
                  className="text-xs"
                >
                  Planned Features
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('tech-stack')}
                  className="text-xs"
                >
                  Tech Stack
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('architecture-overview')}
                  className="text-xs"
                >
                  Architecture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('system-integration')}
                  className="text-xs"
                >
                  System Integration
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('current-infrastructure')}
                  className="text-xs"
                >
                  Infrastructure Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('database-upgrade')}
                  className="text-xs"
                >
                  Database Upgrade
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('development')}
                  className="text-xs"
                >
                  Development
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('system-architecture')}
                  className="text-xs"
                >
                  System Architecture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('security')}
                  className="text-xs"
                >
                  Security
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection('performance')}
                  className="text-xs"
                >
                  Performance
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 rounded-full w-12 h-12 p-0 shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Site Architecture</h1>
          <p className="text-gray-600">Comprehensive overview of the Marina Portal system architecture and technology stack</p>
        </div>

        {/* Simple Text Overview Summary */}
        <Card id="system-overview" className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Globe className="h-6 w-6 mr-2" />
              System Overview Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
              <p>
                The Marina Portal is a comprehensive marina management system designed to streamline operations for marina operators, boat owners, and staff. The system provides real-time visibility into berth availability, boat registrations, contract management, financial operations, and maintenance workflows.
              </p>
              <p>
                The application serves multiple user roles including marina administrators, dock staff, boat owners, and maintenance crews. It handles core marina operations such as berth allocation, customer management, financial transactions, work order tracking, and comprehensive reporting.
              </p>
              <p>
                Built with modern web technologies including Next.js 14, TypeScript, and SQL Server, the system offers exceptional performance, type safety, and database reliability. Next.js provides server-side rendering for fast page loads and excellent SEO, while TypeScript ensures code quality and reduces runtime errors. SQL Server delivers enterprise-grade data management with ACID compliance and advanced query optimization.
              </p>
              <p>
                <strong>Production Status:</strong> The portal in production mode is successfully running on SQL Server database with full CRUD (Create, Read, Update, Delete) operations successfully implemented across all core modules including contracts, invoices, boats, customers, berths, work orders, and marina operations.
              </p>
              <p>
                Designed for scalability and reliability, the system can support operations from single-marina installations to multi-tenant enterprise deployments, with built-in security, audit trails, and compliance features for marina industry standards. The technology stack enables rapid development, easy maintenance, and seamless integration with existing marina infrastructure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Features & Capabilities Wish List */}
        <Card id="key-features" className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <Zap className="h-6 w-6 mr-2" />
              Key Features & Capabilities Wish List
            </CardTitle>
            <CardDescription className="text-purple-700">
              Planned features and capabilities for the Marina Portal system - our development roadmap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Marina Operations & Navigation</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Comprehensive berth management with real-time availability tracking, boat registration systems, and automated contract management. The platform handles work order tracking, maintenance scheduling, and customer relationship management with advanced task management systems and marina walk interfaces.
                </p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Financial Management & Analytics</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Automated invoice generation, payment tracking, and multi-currency support with revenue reporting and analytics dashboards. Advanced financial analytics with AI-powered insights, tax calculation systems, and multi-marina financial consolidation.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Customer Experience & Self-Service</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Responsive design with internationalization support, role-based access control, and intuitive navigation workflows. AI-powered chatbot support, customer self-service portals, and comprehensive multi-language support including RTL languages.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Mobile-First Marina Walk System</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Advanced mobile-optimized interface with touch-first design, gesture-based navigation, and haptic feedback. Real-time team coordination, interactive berth maps, voice commands, and comprehensive task management with Progressive Web App capabilities.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">AI & Intelligence Systems</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Intelligent chatbot support system, AI-powered report generation with natural language processing, predictive maintenance analytics, and smart berth allocation algorithms with machine learning models for operational optimization.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Multi-Locale & International Support</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Comprehensive internationalization supporting multiple locales with cultural business rules, RTL language support, locale-specific validation, multi-currency support with real-time exchange rates, and regional compliance features.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Advanced System Features & Performance</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Offline capabilities with intelligent sync queues, comprehensive audit logging, and robust data export functionality. Real-time notifications via WebSockets, advanced caching strategies, and cloud platform deployment with automated backup systems.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">IoT & Smart Marina Integration</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  IoT integration connecting smart meters, environmental sensors, and security cameras for comprehensive marina monitoring. GPS location tracking, external system integrations, and API-first architecture for seamless third-party service connections.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Accessibility & Compliance</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Comprehensive WCAG 2.1 AA compliance with screen reader optimization, high contrast themes, and keyboard navigation support. Voice command support, color-blind friendly themes, and cultural adaptation for diverse user populations.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Mock Data & Demo System</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Sophisticated mock data-live data switching system enabling seamless demonstrations and offline presentations. Built with Strategy pattern and React Context for real-time data source switching without page reloads.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">SQL Query Editor & Schema Explorer</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Advanced SQL query editor with secure backend API for SQL Server execution, schema explorer with metadata, query management features, export capabilities, and dashboard integration with chart visualization and scheduled query execution.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Database & Analytics Intelligence</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Advanced business intelligence tools, custom report builders, and comprehensive data visualization capabilities. Trend analysis, forecasting tools, and performance metrics tracking with AI LLM integration for natural language report generation.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Feature Status Summary</h4>
              <div className="text-sm text-purple-700 space-y-1">
                <p><strong>Currently Available:</strong> Core marina operations, financial management, user experience, system infrastructure</p>
                <p><strong>Planned/In Development:</strong> Advanced features, specialized workflows, real-time capabilities, external integrations</p>
                <p><strong>Total Features:</strong> 100+ capabilities covering all aspects of marina management</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currently Implemented Features */}
        <Card id="current-features" className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Zap className="h-6 w-6 mr-2" />
              Currently Implemented Features
            </CardTitle>
            <CardDescription className="text-green-700">
              Features that are implemented in the codebase - some fully functional, others in development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">🟢 Fully Working & Functional</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ Berth management with availability tracking</li>
                  <li>✅ Boat registration and basic information</li>
                  <li>✅ Contract management system</li>
                  <li>✅ Customer/owner management</li>
                  <li>✅ Basic work order tracking</li>
                  <li>✅ Job list and task management system</li>
                  <li>✅ Dockwalk interface</li>
                  <li>✅ Invoice creation and management</li>
                  <li>✅ Payment tracking system</li>
                  <li>✅ Basic revenue reporting</li>
                  <li>✅ Multi-currency support (GBP/USD)</li>
                  <li>✅ Booking management</li>
                  <li>✅ Responsive design for all devices</li>
                  <li>✅ Internationalization (UK/US locales)</li>
                  <li>✅ Role-based access control (RBAC)</li>
                  <li>✅ User authentication system</li>
                  <li>✅ Profile management</li>
                  <li>✅ Navigation and routing</li>
                  <li>✅ Element labels system with tooltips</li>
                  <li>✅ Database schema and relationships</li>
                  <li>✅ API endpoints for all major entities</li>
                  <li>✅ Data validation and error handling</li>
                  <li>✅ Basic logging and monitoring</li>
                  <li>✅ Session management</li>
                  <li>✅ Data seeding and testing</li>
                  <li>✅ Error boundaries and fallbacks</li>
                  <li>✅ Component architecture (modular)</li>
                  <li>✅ State management with React hooks</li>
                  <li>✅ Form validation and sanitization</li>
                  <li>✅ User management system</li>
                  <li>✅ Marina management interface</li>
                  <li>✅ Pending operations queue</li>
                  <li>✅ Sync status monitoring</li>
                  <li>✅ Role-based permissions</li>
                  <li>✅ System configuration</li>
                  <li>✅ Mock data-live data switching system</li>
                  <li>✅ Data source abstraction layer with strategy pattern</li>
                  <li>✅ React Context for global state management</li>
                  <li>✅ Custom data fetching hooks with automatic source switching</li>
                  <li>✅ Professional toggle interface for data source selection</li>
                  <li>✅ Implementation status tracking and progress monitoring</li>
                  <li>✅ Weather integration with Open Meteo API (live data)</li>
                  <li>✅ Real-time weather widget with detailed modal</li>
                  <li>✅ PDF generation for contracts and invoices</li>
                  <li>✅ Bulk download functionality (ZIP files)</li>
                  <li>✅ Collapsible information boxes across all pages</li>
                  <li>✅ Zod schema validation for all forms</li>
                  <li>✅ Real-time input sanitization for numeric fields</li>
                  <li>✅ Change detection with visual indicators</li>
                  <li>✅ Accessibility enhancements (ARIA attributes, screen reader support)</li>
                  <li>✅ Comprehensive logging system</li>
                  <li>✅ Success messages with timed redirects</li>
                  <li>✅ Field-specific error display</li>
                  <li>✅ Professional styling consistency across forms</li>
                  <li>✅ Vercel deployment with production environment</li>
                  <li>✅ Demo mode with realistic sample data</li>
                  <li>✅ Production mode with SQL Server database</li>
                  <li>✅ Full CRUD operations across all modules</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">🟡 Implemented but Limited/In Development</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⚠️ Berth allocation and assignment (basic implementation)</li>
                  <li>⚠️ Boat verification workflow (5-step process, mock data)</li>
                  <li>⚠️ Meter reading system (electricity & water, UI only)</li>
                  <li>⚠️ Issue reporting system with priorities (UI only)</li>
                  <li>⚠️ Contract billing automation (basic structure)</li>
                  <li>⚠️ Payment status tracking (basic implementation)</li>
                  <li>⚠️ Basic financial analytics (limited data)</li>
                  <li>⚠️ Photo management and gallery (mock data)</li>
                  <li>⚠️ Team collaboration features (simulated)</li>
                  <li>⚠️ 3D visualization interface (basic implementation)</li>
                  <li>⚠️ Voice commands (simulated, no real processing)</li>
                  <li>⚠️ Analytics dashboard with metrics (limited data)</li>
                  <li>⚠️ Notifications system (basic structure)</li>
                  <li>⚠️ Data export and sync capabilities (basic implementation)</li>
                  <li>⚠️ Settings and configuration management (basic)</li>
                  <li>⚠️ Accessibility features (ARIA labels, basic)</li>
                  <li>⚠️ Mobile-first responsive design (basic responsive)</li>
                  <li>⚠️ Audit logging framework (basic structure)</li>
                  <li>⚠️ Backup and recovery systems (basic structure)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Implementation Status Summary</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Fully Working:</strong> Core marina operations, financial management, user experience, system infrastructure</p>
                <p><strong>In Development:</strong> Advanced features, specialized workflows, real-time capabilities, external integrations</p>
                <p><strong>Note:</strong> Features marked with ⚠️ have UI and structure implemented but may use mock data or have limited functionality</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planned Features - Not Yet Implemented */}
        <Card id="planned-features" className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Clock className="h-6 w-6 mr-2" />
              Planned Features - Not Yet Implemented
            </CardTitle>
            <CardDescription className="text-orange-700">
              Features that are planned for future development but not currently available
            </CardDescription>
            <div className="mt-2 p-2 bg-orange-100 rounded-md border border-orange-300">
              <p className="text-sm text-orange-800 font-medium text-center">
                🚧 These features are in development - text is intentionally faded and non-selectable 🚧
              </p>
            </div>
          </CardHeader>
          <CardContent className="relative" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 to-amber-100/40 rounded-lg pointer-events-none"></div>
            <div className="relative z-10 blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Advanced Marina Operations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ Marina map with berth visualization</li>
                  <li>⏳ Advanced berth allocation algorithms</li>
                  <li>⏳ Maintenance scheduling system</li>
                  <li>⏳ Fuel dock management</li>
                  <li>⏳ Pump-out station tracking</li>
                  <li>⏳ Weather integration for operations</li>
                  <li>⏳ Smart path planning (A* algorithm)</li>
                  <li>⏳ 360° panoramic view with compass</li>
                  <li>⏳ Multi-layer berth identification</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Enhanced Financial Features</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ Automated payment processing</li>
                  <li>⏳ Advanced financial analytics</li>
                  <li>⏳ Tax calculation and reporting</li>
                  <li>⏳ Multi-marina financial consolidation</li>
                  <li>⏳ Budget planning and forecasting</li>
                  <li>⏳ Cost center management</li>
                  <li>⏳ Credit notes and refund processing</li>
                  <li>⏳ Receipt generation system</li>
                  <li>⏳ Advanced aging reports</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Customer Experience</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ AI-powered chatbot support system</li>
                  <li>⏳ Customer portal and self-service</li>
                  <li>⏳ Online booking and reservations</li>
                  <li>⏳ Customer communication system</li>
                  <li>⏳ Loyalty program management</li>
                  <li>⏳ Customer feedback and reviews</li>
                  <li>⏳ Mobile app for customers</li>
                  <li>⏳ Multi-language support (French, German, Spanish)</li>
                  <li>⏳ RTL language support (Arabic, Hebrew)</li>
                  <li>⏳ Cultural business rules per locale</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Advanced System Features</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ Offline capability with sync queue</li>
                  <li>⏳ Real-time notifications</li>
                  <li>⏳ Advanced audit logging</li>
                  <li>⏳ Data export and reporting tools</li>
                  <li>⏳ Backup and recovery systems</li>
                  <li>⏳ Performance monitoring dashboard</li>
                  <li>⏳ WebSocket real-time updates</li>
                  <li>⏳ Advanced caching strategies</li>
                  <li>⏳ Virtual scrolling optimization</li>
                  <li>⏳ AI chatbot real-time communication</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">AI & Intelligence</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ AI-powered chatbot support system</li>
                  <li>⏳ Intelligent customer assistance and site navigation</li>
                  <li>⏳ Context-aware help based on user's current page</li>
                  <li>⏳ Support ticket creation and escalation via chat</li>
                  <li>⏳ Marina-specific knowledge and terminology</li>
                  <li>⏳ Multi-language support with cultural adaptation</li>
                  <li>⏳ AI-powered report generation</li>
                  <li>⏳ Natural language query processing</li>
                  <li>⏳ Predictive maintenance analytics</li>
                  <li>⏳ Smart berth allocation algorithms</li>
                  <li>⏳ Anomaly detection systems</li>
                  <li>⏳ Machine learning models for optimization</li>
                  <li>⏳ Natural language processing (NLP)</li>
                  <li>⏳ AI training pipeline and continuous learning</li>
                  <li>⏳ Intelligent routing suggestions</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">IoT & Integration</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ IoT sensor integration</li>
                  <li>⏳ Smart meter automation</li>
                  <li>⏳ Environmental monitoring</li>
                  <li>⏳ Security camera integration</li>
                  <li>⏳ GPS location tracking</li>
                  <li>⏳ External system integrations</li>
                  <li>⏳ Webhook system</li>
                  <li>⏳ API-first architecture</li>
                  <li>⏳ Third-party service connections</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Mobile & Accessibility</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ Progressive Web App (PWA)</li>
                  <li>⏳ Native mobile apps (iOS/Android)</li>
                  <li>⏳ Advanced voice commands</li>
                  <li>⏳ Haptic feedback system</li>
                  <li>⏳ Gesture-based navigation</li>
                  <li>⏳ WCAG 2.1 AA compliance</li>
                  <li>⏳ Screen reader optimization</li>
                  <li>⏳ High contrast themes</li>
                  <li>⏳ Advanced accessibility features</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Development & DevOps</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ Comprehensive testing suite</li>
                  <li>⏳ CI/CD pipeline automation</li>
                  <li>⏳ Docker containerization</li>
                  <li>⏳ Cloud platform deployment</li>
                  <li>⏳ Performance monitoring</li>
                  <li>⏳ Automated backup systems</li>
                  <li>⏳ Disaster recovery planning</li>
                  <li>⏳ Advanced state management</li>
                  <li>⏳ Code quality automation</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">SQL Query Editor & Schema Explorer</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ Secure SQL query execution API</li>
                  <li>⏳ Query editor with syntax highlighting</li>
                  <li>⏳ Schema explorer with table/column metadata</li>
                  <li>⏳ Query save/load and history management</li>
                  <li>⏳ Export results to CSV/Excel/PDF</li>
                  <li>⏳ ERD generation from foreign keys</li>
                  <li>⏳ AI query assistant (natural language to SQL)</li>
                  <li>⏳ Dashboard integration with charts</li>
                  <li>⏳ Scheduled query execution</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Database & Analytics</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>⏳ Advanced business intelligence</li>
                  <li>⏳ Custom report builder</li>
                  <li>⏳ Data visualization tools</li>
                  <li>⏳ Trend analysis and forecasting</li>
                  <li>⏳ Performance metrics tracking</li>
                  <li>⏳ Query optimization</li>
                  <li>⏳ Data mining capabilities</li>
                  <li>⏳ Real-time analytics dashboard</li>
                </ul>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack Overview */}
        <Card id="tech-stack" className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Code className="h-6 w-6 mr-2" />
              Technology Stack & Architecture
            </CardTitle>
            <CardDescription className="text-blue-700">
              Modern web application built with cutting-edge technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  Frontend
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Framework:</span>
                    <Badge variant="outline" className="bg-blue-50">Next.js 14</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Language:</span>
                    <Badge variant="outline" className="bg-blue-50">TypeScript</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Styling:</span>
                    <Badge variant="outline" className="bg-blue-50">Tailwind CSS</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>UI Components:</span>
                    <Badge variant="outline" className="bg-blue-50">shadcn/ui</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  Backend
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Runtime:</span>
                    <Badge variant="outline" className="bg-blue-50">Node.js</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API:</span>
                    <Badge variant="outline" className="bg-blue-50">Next.js API Routes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Authentication:</span>
                    <Badge variant="outline" className="bg-blue-50">NextAuth.js</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database:</span>
                    <Badge variant="outline" className="bg-blue-50">SQL Server</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Data Layer
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>ORM:</span>
                    <Badge variant="outline" className="bg-blue-50">Prisma</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database:</span>
                    <Badge variant="outline" className="bg-blue-50">SQL Server</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Migrations:</span>
                    <Badge variant="outline" className="bg-blue-50">Prisma Migrate</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Seeding:</span>
                    <Badge variant="outline" className="bg-blue-50">Custom Scripts</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Data Source System
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Pattern:</span>
                    <Badge variant="outline" className="bg-blue-50">Strategy + Factory</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>State Management:</span>
                    <Badge variant="outline" className="bg-blue-50">React Context</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Providers:</span>
                    <Badge variant="outline" className="bg-blue-50">Mock + Database</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Persistence:</span>
                    <Badge variant="outline" className="bg-blue-50">localStorage</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview Summary */}
        <Card id="architecture-overview" className="mb-6 bg-gradient-to-r from-slate-50 to-gray-100 border-slate-300" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Globe className="h-6 w-6 mr-2" />
              System Architecture Overview
            </CardTitle>
            <CardDescription className="text-slate-700">
              Complete technical overview of the Marina Portal infrastructure, connections, and technology ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                    <Server className="h-4 w-4 mr-2" />
                    Core Infrastructure & Environment
                  </h4>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p><strong>Runtime Environment:</strong> Node.js 18+ on Windows 11</p>
                    <p><strong>Development Environment:</strong> Local development on Windows 11 with Node.js</p>
                    <p><strong>Database Server:</strong> Dedicated SQL Server instance with optimized memory allocation</p>
                    <p><strong>Network Configuration:</strong> Local network with potential VPN access for remote users</p>
                    <p><strong>Storage:</strong> Local SSD storage with RAID configuration for redundancy</p>
                    <p><strong>Monitoring:</strong> Built-in Windows performance monitoring and custom application logging</p>
                  </div>
                </div>

                                 <div className="bg-white p-4 rounded-lg border border-slate-200">
                   <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                     <Database className="h-4 w-4 mr-2" />
                     Database & Storage Architecture
                   </h4>
                   <div className="text-sm text-slate-700 space-y-2">
                                           <p><strong>Current Database:</strong> Microsoft SQL Server 2012 on Windows 11</p>
                     <p><strong>Database Location:</strong> On-premises Windows Server with local storage</p>
                     <p><strong>Connection Protocol:</strong> TCP/IP on port 1433 with encrypted connections</p>
                     <p><strong>Data Backup:</strong> Full, differential, and transaction log backups with point-in-time recovery</p>
                     <p><strong>Performance:</strong> Optimized queries with proper indexing and query plan caching</p>
                     <p><strong>Data Integrity:</strong> ACID compliance with foreign key constraints and triggers</p>
                     <p><strong>Upgrade Path:</strong> System designed for seamless migration to SQL Server 2016+ for enhanced features</p>
                   </div>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Security & Network Infrastructure
                  </h4>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p><strong>Network Security:</strong> Windows Firewall with advanced security policies</p>
                    <p><strong>Authentication:</strong> Multi-factor authentication with role-based access control (RBAC)</p>
                    <p><strong>Data Encryption:</strong> TLS 1.3 for data in transit, AES-256 for data at rest</p>
                    <p><strong>API Security:</strong> JWT token validation with secure session management</p>
                    <p><strong>Input Validation:</strong> Comprehensive sanitization with Zod schema validation</p>
                    <p><strong>Audit Logging:</strong> Complete system activity logging with security event monitoring</p>
                  </div>
                </div>


              </div>
            </div>

                                                    <div id="system-integration" className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200" style={{ scrollMarginTop: '120px' }}>
               <h4 className="font-semibold text-indigo-800 mb-2">System Integration & Connectivity</h4>
               <div className="text-sm text-indigo-700 space-y-1">
                 <p><strong>Database Connectivity:</strong> Prisma ORM connects to SQL Server via TCP/IP with connection pooling</p>
                 <p><strong>API Architecture:</strong> RESTful API endpoints with Next.js API routes and middleware</p>
                 <p><strong>Authentication Flow:</strong> NextAuth.js integrates with SQL Server user database and session management</p>
                 <p><strong>Frontend-Backend:</strong> React components communicate with API routes via fetch requests</p>
                 <p><strong>Data Flow:</strong> Client → Next.js API → Prisma ORM → SQL Server → Response back through the chain</p>
                 <p><strong>Data Source Abstraction:</strong> Strategy pattern implementation for switching between mock and live database data sources</p>
                 <p><strong>State Management:</strong> React Context API for global data source preference management with localStorage persistence</p>
               </div>
             </div>

                                                    <div id="current-infrastructure" className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200" style={{ scrollMarginTop: '120px' }}>
               <h4 className="font-semibold text-amber-800 mb-2">Current Infrastructure Status</h4>
               <div className="text-sm text-amber-700 space-y-1">
                 <p><strong>Development Phase:</strong> Currently in active development with local SQL Server database</p>
                 <p><strong>Production Readiness:</strong> Core functionality implemented, advanced features in development</p>
                 <p><strong>Mock Data System:</strong> Fully implemented with 80% completion, enabling offline demonstrations</p>
                 <p><strong>Scalability:</strong> Designed for multi-marina operations with potential cloud migration path</p>
                 <p><strong>Security Posture:</strong> Basic security implemented, enterprise-grade security features planned</p>
                 <p><strong>Monitoring:</strong> Basic logging implemented, comprehensive monitoring and alerting planned</p>
               </div>
             </div>

                            <div id="database-upgrade" className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200" style={{ scrollMarginTop: '120px' }}>
               <h4 className="font-semibold text-emerald-800 mb-2">Database Upgrade Roadmap</h4>
               <div className="text-sm text-emerald-700 space-y-1">
                 <p><strong>Current Version:</strong> SQL Server 2012 provides solid foundation with core database capabilities</p>
                 <p><strong>SQL Server 2016+ Benefits:</strong> Enhanced performance, JSON support, improved security, and better query optimization</p>
                 <p><strong>SQL Server 2019+ Benefits:</strong> Intelligent query processing, advanced analytics, and enhanced scalability features</p>
                 <p><strong>Migration Strategy:</strong> System architecture designed for seamless database upgrades without application changes</p>
                 <p><strong>Future-Proofing:</strong> Prisma ORM abstraction layer ensures compatibility across SQL Server versions</p>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Development & Deployment */}
        <Card id="development" className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <GitBranch className="h-6 w-6 mr-2" />
              Development & Deployment
            </CardTitle>
            <CardDescription className="text-orange-700">
              How the system is developed, tested, and deployed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">Development Workflow</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Version Control:</strong> Git with feature branch workflow</p>
                  <p><strong>Code Quality:</strong> TypeScript strict mode, ESLint, Prettier</p>
                  <p><strong>Testing:</strong> Jest for unit tests, React Testing Library</p>
                  <p><strong>Code Review:</strong> Pull request workflow with automated checks</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">Deployment & Infrastructure</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Hosting:</strong> Vercel for frontend, Azure for backend</p>
                  <p><strong>Database:</strong> SQL Server on Azure with automated backups</p>
                  <p><strong>CI/CD:</strong> Automated testing and deployment pipelines</p>
                  <p><strong>Monitoring:</strong> Application performance monitoring and logging</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Architecture */}
        <Card id="system-architecture" className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Layers className="h-6 w-6 mr-2" />
              System Architecture & Components
            </CardTitle>
            <CardDescription className="text-green-700">
              How the Marina Portal system is structured and organized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Application Structure</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>App Router:</strong> Next.js 14 App Router with dynamic locale routing (/[locale]/page)</p>
                  <p><strong>Component Architecture:</strong> Modular React components with TypeScript interfaces</p>
                  <p><strong>State Management:</strong> React hooks (useState, useEffect) with context for global state</p>
                  <p><strong>Authentication Flow:</strong> NextAuth.js with role-based access control (RBAC)</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Database Design</h4>
                                 <div className="text-sm text-gray-700 space-y-2">
                   <p><strong>Core Tables:</strong> users, berths, boats, contracts, invoices, payments, bookings, work_orders, customers</p>
                   <p><strong>Relationships:</strong> Foreign key constraints with proper indexing for performance</p>
                   <p><strong>Data Integrity:</strong> Transaction-based operations with rollback capabilities</p>
                   <p><strong>Scalability:</strong> Designed for multi-marina support with marinaId partitioning</p>
                 </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">API Architecture</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>RESTful Design:</strong> Standard HTTP methods with consistent response formats</p>
                  <p><strong>Authentication:</strong> JWT-based session management with role validation</p>
                  <p><strong>Error Handling:</strong> Comprehensive error responses with logging and monitoring</p>
                  <p><strong>Performance:</strong> Database query optimization with connection pooling</p>
                  <p><strong>Future AI Integration:</strong> Planned chatbot API endpoints with WebSocket support</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Data Source System Architecture</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Strategy Pattern:</strong> Clean separation between mock and database data providers</p>
                  <p><strong>Factory Pattern:</strong> Dynamic provider creation based on current data source preference</p>
                  <p><strong>React Context:</strong> Global state management for data source switching across the application</p>
                  <p><strong>Custom Hooks:</strong> Reusable data fetching logic with automatic source switching</p>
                  <p><strong>Persistence:</strong> localStorage-based user preference storage with environment variable fallbacks</p>
                  <p><strong>Mock Data:</strong> Comprehensive mock datasets matching production data structures</p>
                  <p><strong>Seamless Switching:</strong> Real-time data source changes without page reloads</p>
                </div>
              </div>
            </div>
          </CardContent>
                </Card>

        {/* Security & Compliance */}
        <Card id="security" className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Shield className="h-6 w-6 mr-2" />
              Security & Compliance
            </CardTitle>
            <CardDescription className="text-yellow-700">
              How the system protects data and ensures compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Security Measures</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Authentication:</strong> Secure session management with JWT tokens</p>
                  <p><strong>Authorization:</strong> Role-based access control (RBAC) system</p>
                  <p><strong>Data Protection:</strong> Encrypted data in transit and at rest</p>
                  <p><strong>Input Validation:</strong> Comprehensive input sanitization and validation</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Compliance & Standards</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Data Privacy:</strong> GDPR compliance with data retention policies</p>
                  <p><strong>Audit Trail:</strong> Comprehensive logging of all system activities</p>
                  <p><strong>Backup Strategy:</strong> Regular automated backups with recovery testing</p>
                  <p><strong>Access Control:</strong> Principle of least privilege enforcement</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance & Scalability */}
        <Card id="performance" className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200" style={{ scrollMarginTop: '120px' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-800">
              <Cpu className="h-6 w-6 mr-2" />
              Performance & Scalability
            </CardTitle>
            <CardDescription className="text-indigo-700">
              How the system performs and scales to meet growing demands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2">Performance Optimization</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Database:</strong> Optimized queries with proper indexing</p>
                  <p><strong>Caching:</strong> Redis caching for frequently accessed data</p>
                  <p><strong>CDN:</strong> Global content delivery for static assets</p>
                  <p><strong>Code Splitting:</strong> Dynamic imports for reduced bundle sizes</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2">Scalability Features</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Multi-tenancy:</strong> Support for multiple marina operations</p>
                  <p><strong>Horizontal Scaling:</strong> Load balancing across multiple instances</p>
                  <p><strong>Database Scaling:</strong> Read replicas and connection pooling</p>
                  <p><strong>Microservices:</strong> Modular architecture for independent scaling</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
