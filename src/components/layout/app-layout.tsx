'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Receipt, 
  Calendar, 
  CreditCard, 
  Users, 
  Anchor, 
  Wrench, 
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Activity,
  Ship,
  MapPin,
  Code
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoleGuard, CustomerOnly, StaffOnly, AdminOnly } from '@/components/auth/role-guard'
import { CompactLocaleSwitcher } from '@/components/locale-switcher'
import { logger } from '@/lib/logger'
import { Modal } from '@/components/ui/modal'
import { MapToggleButton, MapContainer } from '@/components/marina-map'
import { DataSourceToggleBanner } from '@/components/ui/data-source-toggle-banner'


interface AppLayoutProps {
  children: React.ReactNode
  user?: any
}

const navigation = [
      { name: 'Site Architecture - CLICKME', href: '/site-architecture', icon: Code, roles: ['ADMIN'], isSpecial: true },
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['CUSTOMER', 'STAFF_FRONT_DESK', 'STAFF_FINANCE', 'STAFF_MAINTENANCE', 'ADMIN'] },
  { name: 'Contracts', href: '/contracts', icon: FileText, roles: ['CUSTOMER', 'STAFF_FRONT_DESK', 'ADMIN'] },
  { name: 'Invoices', href: '/invoices', icon: Receipt, roles: ['CUSTOMER', 'STAFF_FRONT_DESK', 'ADMIN'] },
  { name: 'Bookings', href: '/bookings', icon: Calendar, roles: ['CUSTOMER', 'STAFF_FRONT_DESK', 'ADMIN'] },
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['CUSTOMER', 'STAFF_FRONT_DESK', 'ADMIN'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['STAFF_FRONT_DESK', 'ADMIN'] },
  { name: 'Boats', href: '/boats', icon: Ship, roles: ['STAFF_FRONT_DESK', 'ADMIN'] },
  { name: 'Berths', href: '/berths', icon: Anchor, roles: ['STAFF_FRONT_DESK', 'ADMIN'] },
  { name: 'Work Orders', href: '/work-orders', icon: Wrench, roles: ['STAFF_MAINTENANCE', 'ADMIN'] },
  { name: 'Dockwalk', href: '/marina-walk', icon: MapPin, roles: ['STAFF_FRONT_DESK', 'STAFF_MAINTENANCE', 'ADMIN'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['STAFF_FRONT_DESK', 'STAFF_FINANCE', 'ADMIN'] },
]

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Marinas', href: '/admin/marinas', icon: Anchor },
  { name: 'Pending Operations', href: '/admin/pending-operations', icon: Bell },
  { name: 'Sync Status', href: '/admin/sync-status', icon: Activity },
]

const testingNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'WebAPI', href: '/webapi', icon: Code },
]

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showSidebarConfirm, setShowSidebarConfirm] = useState(false)


  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'en-GB'
  
  // Check if we're on the Dock Walk page
  const isDockWalkPage = pathname.includes('/marina-walk')
  
  // Use user prop as primary source, fallback to session
  const effectiveUser = user || session?.user
  
  // Get roles from effectiveUser, with fallback to default roles
  let userRoles: string[] = []
  if (effectiveUser?.roles?.length > 0) {
    // Handle both formats: ['ADMIN'] and [{ role: 'ADMIN' }]
    userRoles = effectiveUser.roles.map((r: any) => {
      if (typeof r === 'string') {
        return r // Direct string: ['ADMIN']
      } else if (r && typeof r === 'object' && r.role) {
        return r.role // Object with role property: [{ role: 'ADMIN' }]
      }
      return undefined
    }).filter(Boolean) // Remove any undefined values
  }
  
  // Fallback: assume ADMIN role if no roles found
  if (userRoles.length === 0) {
    userRoles = ['ADMIN', 'STAFF_FRONT_DESK']
  }
  
  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  )

  // DEBUG LOGGING
  logger.debug('AppLayout Debug Info', {
    pathname,
    locale,
    user: effectiveUser,
    userRoles,
    sessionStatus: status,
    sessionData: session,
    navigationCount: navigation.length,
    filteredNavigationCount: filteredNavigation.length,
    navigation: navigation.map(item => ({ name: item.name, roles: item.roles })),
    filteredNavigation: filteredNavigation.map(item => ({ name: item.name, roles: item.roles })),
    roleCheck: navigation.map(item => ({
      name: item.name,
      roles: item.roles,
      hasMatchingRole: item.roles.some(role => userRoles.includes(role))
    }))
  })

  const isActive = (href: string) => pathname === `/${locale}${href}`

  // Handle sidebar toggle with confirmation for Dock Walk page
  const handleSidebarToggle = () => {
    if (isDockWalkPage) {
      setShowSidebarConfirm(true)
    } else {
      setSidebarOpen(true)
    }
  }

  const confirmSidebarOpen = () => {
    setSidebarOpen(true)
    setShowSidebarConfirm(false)
  }

  const cancelSidebarOpen = () => {
    setShowSidebarConfirm(false)
  }

  // Handle sign out with proper cleanup
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ 
        callbackUrl: `/${locale}/auth/signin`,
        redirect: true 
      })
    } catch (error) {
      logger.error('Sign out failed', { error })
      setIsSigningOut(false)
      // Fallback redirect
      window.location.href = `/${locale}/auth/signin`
    }
  }

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if no user is authenticated
  if (status === 'unauthenticated' || !effectiveUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Marina Portal</h1>
          <p className="text-gray-600 mb-6">Please sign in to continue</p>
          <Link 
            href={`/${locale}/auth/signin`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }




  return (
    <>
      {/* Confirmation Dialog for Sidebar on Dock Walk Page */}
      <Modal
        isOpen={showSidebarConfirm}
        onClose={cancelSidebarOpen}
        title="Leave Dock Walk Interface?"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You're currently conducting a dock walk inspection. Are you sure you want to open the navigation menu? 
            This could interrupt your marina inspection workflow.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={cancelSidebarOpen}
              className="bg-gray-100 hover:bg-gray-200"
            >
              Continue Dock Walk
            </Button>
            <Button
              onClick={confirmSidebarOpen}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Open Navigation
            </Button>
          </div>
        </div>
      </Modal>

      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4">
              <h1 className="text-lg font-semibold text-gray-900">Marina Portal</h1>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 space-y-0.5 px-2 py-4">
              {filteredNavigation.map((item, index) => {
                const Icon = item.icon
                const isSpecial = item.isSpecial
                return (
                  <Link
                    key={item.name}
                    href={`/${locale}${item.href}`}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isSpecial
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : isActive(item.href)
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isSpecial ? 'text-blue-600' : ''}`} />
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Admin section for mobile */}
              {userRoles.includes('ADMIN') && (
                <>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Administration
                    </h3>
                  </div>
                  {adminNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={`/${locale}${item.href}`}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(item.href)
                            ? 'bg-blue-100 text-blue-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}

              {/* Testing section for mobile */}
              {userRoles.includes('ADMIN') && (
                <>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <h3 className="px-2 text-xs font-semibold text-orange-500 uppercase tracking-wider">
                      For Testing
                    </h3>
                  </div>
                  {testingNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={`/${locale}${item.href}`}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(item.href)
                            ? 'bg-orange-100 text-orange-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}
            </nav>
            
            {/* Mobile user section */}
            {effectiveUser && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {effectiveUser?.firstName?.[0]}{effectiveUser?.lastName?.[0]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {effectiveUser?.firstName} {effectiveUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{effectiveUser?.email}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href={`/${locale}/profile`}
                    className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setSidebarOpen(false)
                    }}
                    disabled={isSigningOut}
                    className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar - Full height */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-20">
          <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
            <div className="flex h-16 items-center px-4">
              <h1 className="text-lg font-semibold text-gray-900">Marina Portal</h1>
            </div>
            <nav className="flex-1 space-y-0.5 px-2 py-4 overflow-y-auto min-h-0">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isSpecial = item.isSpecial
                return (
                  <Link
                    key={item.name}
                    href={`/${locale}${item.href}`}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isSpecial
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : isActive(item.href)
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}

                  >
                    <Icon className={`mr-3 h-5 w-5 ${isSpecial ? 'text-blue-600' : ''}`} />
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Admin section */}
              {userRoles.includes('ADMIN') && (
                <>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Administration
                    </h3>
                  </div>
                  {adminNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={`/${locale}${item.href}`}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(item.href)
                            ? 'bg-blue-100 text-blue-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}

              {/* Testing section */}
              {userRoles.includes('ADMIN') && (
                <>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <h3 className="px-2 text-xs font-semibold text-orange-500 uppercase tracking-wider">
                      For Testing
                    </h3>
                  </div>
                  {testingNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={`/${locale}${item.href}`}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(item.href)
                            ? 'bg-orange-100 text-orange-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}
            </nav>
            
            {/* User section */}
            {effectiveUser && (
              <div className="border-t border-gray-200 p-4 mt-auto">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {effectiveUser?.firstName?.[0]}{effectiveUser?.lastName?.[0]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {effectiveUser?.firstName} {effectiveUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{effectiveUser?.email}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href={`/${locale}/profile`}
                    className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={handleSidebarToggle}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1"></div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Locale Switcher */}
                <CompactLocaleSwitcher />
                
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-400"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
                <main className="py-6">
        {/* Data Source Toggle Banner */}
        <DataSourceToggleBanner />
        
        {children}
      </main>
        </div>
      </div>

      {/* Marina Map System */}
      <MapToggleButton />
      <MapContainer />


    </>
  )
}

export default AppLayout