'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from '../../../components/AdminSidebar'
import ClientOnly from '@/components/ClientOnly'
import { RefreshCw } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    const today = new Date()
    setCurrentDate(today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
  }, [])

  const getPageTitle = () => {
    const pathSegments = pathname.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    switch (lastSegment) {
      case 'admin':
        return 'Overview'
      case 'vendors':
        return 'Vendor Management'
      case 'users':
        return 'User Management'
      case 'bookings':
        return 'Booking Overview'
      case 'enquiries':
        return 'Enquiry Overview'
      case 'analytics':
        return 'Analytics'
      case 'settings':
        return 'Settings'
      default:
        return 'Admin Dashboard'
    }
  }

  return (
    <ClientOnly>
      <div className="min-h-screen" style={{ backgroundColor: '#fdf9f5' }}>
        {/* Mobile sidebar */}
        <AdminSidebar 
          isOpen={false} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Desktop sidebar */}
        <AdminSidebar isOpen={true} />

        {/* Main content */}
        <div className="lg:pl-[220px]">
          {/* Topbar */}
          <div className="sticky top-0 z-10" style={{ backgroundColor: '#ffffff', borderBottom: '0.5px solid rgba(180,140,90,0.2)' }}>
            <div className="flex items-center justify-between h-16 px-6">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md"
                style={{ color: '#7a5c30' }}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Page title */}
              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>
                  {getPageTitle()}
                </h1>
              </div>

              {/* Date and refresh */}
              <div className="flex items-center space-x-4">
                <span className="text-sm" style={{ color: '#9a7850' }}>{currentDate}</span>
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 rounded transition-colors"
                  style={{ color: '#7a5c30' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ClientOnly>
  )
}
