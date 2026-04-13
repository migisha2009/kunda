'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Calendar, 
  MessageSquare,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { signOutUser } from '../lib/auth'
import { colors, typography } from '../lib/styles'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { userProfile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    {
      name: 'LayoutDashboard',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      current: pathname === '/dashboard/admin'
    },
    {
      name: 'Store',
      href: '/dashboard/admin/vendors',
      icon: Store,
      current: pathname === '/dashboard/admin/vendors'
    },
    {
      name: 'Users',
      href: '/dashboard/admin/users',
      icon: Users,
      current: pathname === '/dashboard/admin/users'
    },
    {
      name: 'Calendar',
      href: '/dashboard/admin/bookings',
      icon: Calendar,
      current: pathname === '/dashboard/admin/bookings'
    },
    {
      name: 'MessageSquare',
      href: '/dashboard/admin/enquiries',
      icon: MessageSquare,
      current: pathname === '/dashboard/admin/enquiries'
    },
    {
      name: 'BarChart',
      href: '/dashboard/admin/analytics',
      icon: BarChart,
      current: pathname === '/dashboard/admin/analytics'
    },
    {
      name: 'Settings',
      href: '/dashboard/admin/settings',
      icon: Settings,
      current: pathname === '/dashboard/admin/settings'
    }
  ]

  const handleSignOut = async () => {
    try {
      await signOutUser()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.primaryDark }}>
      {/* Logo */}
      <div className="flex items-center px-6 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1a56db' }} />
        <span className="ml-2 text-2xl font-light" style={{ fontFamily: 'Urbanist', color: '#bfdbfe' }}>
          Kunda
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = item.current
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white border-l-2'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={{
                borderLeftColor: isActive ? '#1a56db' : 'transparent',
                backgroundColor: isActive ? 'rgba(26,86,219,0.1)' : 'transparent'
              }}
              onClick={() => {
                if (onClose) onClose()
                setMobileMenuOpen(false)
              }}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                }`}
                style={{ color: isActive ? '#1a56db' : 'inherit' }}
              />
              <span style={{ color: isActive ? '#1a56db' : 'inherit' }}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div style={{ borderTop: '1px solid #e5edff' }} className="p-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ border: '2px solid #1a56db', backgroundColor: 'rgba(26,86,219,0.1)' }}
            >
              <span className="text-sm font-medium" style={{ color: '#bfdbfe' }}>
                {userProfile?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium" style={{ color: '#bfdbfe' }}>{userProfile?.name}</p>
            <p className="text-xs" style={{ color: '#1a56db' }}>Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors"
          style={{ color: '#1a56db' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26,86,219,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
        <Link
          href="/"
          className="w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors mt-2"
          style={{ color: '#1a56db' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26,86,219,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Back to site
        </Link>
      </div>
    </div>
  )

  // Mobile version
  if (!isOpen) {
    return (
      <>
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg shadow-md"
            style={{ backgroundColor: '#fdf9f5', border: '0.5px solid ${colors.border}' }}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" style={{ color: '#7a5c30' }} />
            ) : (
              <Menu className="w-6 h-6" style={{ color: '#7a5c30' }} />
            )}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full">
              <SidebarContent />
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop version
  return (
    <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0" style={{ width: '220px' }}>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <SidebarContent />
      </div>
    </div>
  )
}
