'use client'

import { useState } from 'react'
import AdminSidebar from '../../../components/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      {/* Mobile sidebar */}
      <AdminSidebar 
        isOpen={false} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Desktop sidebar */}
      <AdminSidebar isOpen={true} />

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
